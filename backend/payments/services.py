import uuid
import logging
from decimal import Decimal
from yookassa import Configuration, Payment as YooPayment
from yookassa.domain.response.payment_response import PaymentResponse
from django.conf import settings
from django.utils import timezone
from bookings.models import Booking

logger = logging.getLogger(__name__)

# Настройка YooKassa
Configuration.account_id = settings.YOOKASSA_SHOP_ID
Configuration.secret_key = settings.YOOKASSA_SECRET_KEY


def create_yookassa_payment(amount, description, return_url, metadata=None):
    """
    Создает платеж в YooKassa
    """
    try:
        payment = YooPayment.create({
            "amount": {
                "value": str(amount),
                "currency": "RUB"
            },
            "confirmation": {
                "type": "redirect",
                "return_url": return_url
            },
            "capture": True,
            "description": description,
            "metadata": metadata or {}
        }, uuid.uuid4())

        logger.info(f"YooKassa payment created: {payment.id}")
        return payment
    except Exception as e:
        logger.error(f"YooKassa payment creation failed: {e}")
        raise


def process_successful_payment(payment_id):
    """
    Обрабатывает успешный платеж
    """
    from .models import Payment, Invoice

    try:
        payment = Payment.objects.get(transaction_id=payment_id)
        payment.status = 'success'
        payment.save()

        if payment.booking:
            booking = payment.booking
            booking.status = 'confirmed'
            booking.save()

            # Создаем счет
            invoice = Invoice.objects.create(
                user=payment.user,
                booking=booking,
                payment=payment,
                amount=payment.amount,
                paid_at=timezone.now()
            )

            # Отправляем уведомление
            from notifications.tasks import send_email_notification, create_notification
            create_notification.delay(
                user_id=payment.user.id,
                type='email',
                subject='Оплата прошла успешно',
                content=f'Ваш платеж на сумму {payment.amount} ₽ успешно проведен. Бронирование #{booking.id} подтверждено.'
            )

            logger.info(f"Payment {payment_id} processed successfully")
            return True

    except Payment.DoesNotExist:
        logger.warning(f"Payment {payment_id} not found in database")
    except Exception as e:
        logger.error(f"Error processing payment {payment_id}: {e}")

    return False


def process_failed_payment(payment_id):
    """
    Обрабатывает неуспешный платеж
    """
    from .models import Payment

    try:
        payment = Payment.objects.get(transaction_id=payment_id)
        payment.status = 'failed'
        payment.save()

        if payment.booking:
            payment.booking.status = 'cancelled'
            payment.booking.save()

        logger.info(f"Payment {payment_id} marked as failed")
        return True
    except Payment.DoesNotExist:
        logger.warning(f"Payment {payment_id} not found")
        return False


def process_balance_payment(payment_id):
    """
    Обработка оплаты с баланса пользователя
    """
    from .models import Payment
    from users.models import User

    try:
        payment = Payment.objects.get(id=payment_id)
        user = payment.user

        if user.balance >= payment.amount:
            user.balance -= payment.amount
            user.save()

            payment.status = 'success'
            payment.save()

            if payment.booking:
                payment.booking.status = 'confirmed'
                payment.booking.save()

                # Создаем счет
                from .models import Invoice
                Invoice.objects.create(
                    user=payment.user,
                    booking=payment.booking,
                    payment=payment,
                    amount=payment.amount,
                    paid_at=timezone.now()
                )

            # Отправляем уведомление
            from notifications.tasks import create_notification
            create_notification.delay(
                user_id=user.id,
                type='email',
                subject='Оплата с баланса',
                content=f'С вашего баланса списано {payment.amount} ₽. Остаток: {user.balance} ₽.'
            )

            return True
        else:
            payment.status = 'failed'
            payment.save()
            return False

    except Payment.DoesNotExist:
        return False


def get_user_balance(user_id):
    """
    Получить баланс пользователя
    """
    from users.models import User
    try:
        user = User.objects.get(id=user_id)
        return user.balance
    except User.DoesNotExist:
        return 0


def top_up_balance(user_id, amount):
    """
    Пополнение баланса
    """
    from users.models import User
    try:
        user = User.objects.get(id=user_id)
        user.balance += amount
        user.save()

        # Создаем уведомление
        from notifications.tasks import create_notification
        create_notification.delay(
            user_id=user.id,
            type='email',
            subject='Пополнение баланса',
            content=f'Ваш баланс пополнен на {amount} ₽. Текущий баланс: {user.balance} ₽.'
        )

        return user.balance
    except User.DoesNotExist:
        return None


def refund_booking_payment(booking):
    """Возврат средств за отмененное бронирование"""
    from .models import Payment

    try:
        payment = Payment.objects.filter(
            booking=booking,
            status='success'
        ).first()

        if not payment:
            logger.info(f"No successful payment found for booking {booking.id}")
            return False

        # Если оплата была с баланса, возвращаем средства на баланс
        if payment.payment_method == 'balance':
            user = booking.user
            user.balance += payment.amount
            user.save()

            # Создаем уведомление
            from notifications.tasks import create_notification
            create_notification.delay(
                user_id=user.id,
                type='email',
                subject='Возврат средств',
                content=f'За отмененное бронирование #{booking.id} на ваш баланс возвращено {payment.amount} ₽.'
            )

            logger.info(f"Refunded {payment.amount} to balance for booking {booking.id}")
            return True

        # Для оплаты картой - нужно создать возврат через YooKassa
        elif payment.payment_method == 'card' and payment.transaction_id:
            try:
                from yookassa import Payment as YooPayment
                refund = YooPayment.refund({
                    "payment_id": payment.transaction_id,
                    "amount": {
                        "value": str(payment.amount),
                        "currency": "RUB"
                    }
                })

                payment.status = 'refunded'
                payment.save()

                # Создаем уведомление
                from notifications.tasks import create_notification
                create_notification.delay(
                    user_id=user.id,
                    type='email',
                    subject='Возврат средств',
                    content=f'За отмененное бронирование #{booking.id} средства возвращены на вашу карту.'
                )

                logger.info(f"Refunded payment {payment.transaction_id} for booking {booking.id}")
                return True

            except Exception as e:
                logger.error(f"Failed to refund payment {payment.transaction_id}: {e}")
                return False

        return False

    except Exception as e:
        logger.error(f"Error processing refund for booking {booking.id}: {e}")
        return False
