from rest_framework import serializers
from .models import Payment, Invoice
from bookings.serializers import BookingSerializer


class PaymentSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    booking_info = BookingSerializer(source='booking', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    method_display = serializers.CharField(source='get_payment_method_display', read_only=True)

    class Meta:
        model = Payment
        fields = ('id', 'user', 'user_email', 'booking', 'booking_info', 'amount',
                  'status', 'status_display', 'payment_method', 'method_display',
                  'transaction_id', 'payment_url', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user', 'status', 'transaction_id', 'payment_url',
                            'created_at', 'updated_at')


class CreatePaymentSerializer(serializers.Serializer):
    booking_id = serializers.IntegerField(required=True)
    payment_method = serializers.ChoiceField(choices=Payment.METHOD_CHOICES, default='card')

    def validate_booking_id(self, value):
        from bookings.models import Booking
        try:
            booking = Booking.objects.get(id=value, user=self.context['request'].user)
            if booking.status != 'pending':
                raise serializers.ValidationError('Бронирование уже оплачено или отменено')
            return value
        except Booking.DoesNotExist:
            raise serializers.ValidationError('Бронирование не найдено')


class InvoiceSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    payment_info = PaymentSerializer(source='payment', read_only=True)

    class Meta:
        model = Invoice
        fields = ('id', 'user', 'user_email', 'booking', 'payment', 'payment_info',
                  'amount', 'issued_at', 'paid_at', 'invoice_number')
        read_only_fields = ('id', 'user', 'issued_at', 'invoice_number')
