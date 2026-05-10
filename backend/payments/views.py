import logging
from decimal import Decimal

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings

from .models import Payment, Invoice
from .serializers import PaymentSerializer, CreatePaymentSerializer, InvoiceSerializer
from .services import (
    create_yookassa_payment,
    process_successful_payment,
    process_failed_payment,
    get_user_balance,
    top_up_balance,
    process_balance_payment,
)
from bookings.models import Booking

logger = logging.getLogger(__name__)


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Payment.objects.none()
        return Payment.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['post'])
    def create_payment(self, request):
        serializer = CreatePaymentSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        booking_id = serializer.validated_data['booking_id']
        payment_method = serializer.validated_data['payment_method']

        try:
            booking = Booking.objects.get(id=booking_id, user=request.user)
        except Booking.DoesNotExist:
            return Response({'error': 'Бронирование не найдено'}, status=status.HTTP_404_NOT_FOUND)

        # Создаем запись о платеже
        payment = Payment.objects.create(
            user=request.user,
            booking=booking,
            amount=booking.total_cost,
            payment_method=payment_method,
            status='pending'
        )

        if payment_method == 'card':
            try:
                yoo_payment = create_yookassa_payment(
                    amount=booking.total_cost,
                    description=f"Оплата бронирования #{booking.id}",
                    return_url=f"{settings.FRONTEND_URL}/payments/success",
                    metadata={'booking_id': booking.id, 'payment_id': payment.id}
                )
                payment.transaction_id = yoo_payment.id
                payment.payment_url = yoo_payment.confirmation.confirmation_url
                payment.save()
                return Response({
                    'payment_id': payment.id,
                    'confirmation_url': yoo_payment.confirmation.confirmation_url,
                    'payment_status': yoo_payment.status
                })
            except Exception as e:
                logger.error(f"Payment creation failed: {e}")
                payment.status = 'failed'
                payment.save()
                return Response({'error': 'Ошибка при создании платежа'},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'error': 'Метод оплаты не поддерживается'},
                        status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def webhook(self, request):
        event = request.data.get('event')
        payment_id = request.data.get('object', {}).get('id')
        if not payment_id:
            return Response({'error': 'Invalid webhook data'}, status=status.HTTP_400_BAD_REQUEST)
        if event == 'payment.succeeded':
            process_successful_payment(payment_id)
        elif event == 'payment.canceled':
            process_failed_payment(payment_id)
        return Response({'status': 'ok'})

    @action(detail=False, methods=['get'])
    def balance(self, request):
        balance = get_user_balance(request.user.id)
        return Response({'balance': float(balance)})

    @action(detail=False, methods=['post'])
    def top_up(self, request):
        amount = request.data.get('amount')
        if not amount or float(amount) <= 0:
            return Response({'error': 'Неверная сумма'}, status=status.HTTP_400_BAD_REQUEST)
        new_balance = top_up_balance(request.user.id, Decimal(str(amount)))
        return Response({
            'message': 'Баланс пополнен',
            'balance': float(new_balance)
        })

    @action(detail=False, methods=['post'])
    def pay_from_balance(self, request):
        booking_id = request.data.get('booking_id')
        try:
            booking = Booking.objects.get(id=booking_id, user=request.user)
        except Booking.DoesNotExist:
            return Response({'error': 'Бронирование не найдено'}, status=status.HTTP_404_NOT_FOUND)
        if booking.status != 'pending':
            return Response({'error': 'Бронирование уже оплачено или отменено'},
                            status=status.HTTP_400_BAD_REQUEST)
        payment = Payment.objects.create(
            user=request.user,
            booking=booking,
            amount=booking.total_cost,
            payment_method='balance',
            status='pending'
        )
        success = process_balance_payment(payment.id)
        if success:
            return Response({
                'success': True,
                'message': 'Оплата прошла успешно',
                'booking_id': booking.id,
                'payment_id': payment.id
            })
        else:
            return Response({
                'success': False,
                'error': 'Недостаточно средств на балансе',
                'balance': float(request.user.balance)
            }, status=status.HTTP_400_BAD_REQUEST)


class InvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Invoice.objects.none()
        if self.request.user.role == 'admin':
            return Invoice.objects.all()
        return Invoice.objects.filter(user=self.request.user)