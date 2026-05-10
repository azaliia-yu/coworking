from rest_framework import serializers

class OccupancyStatsSerializer(serializers.Serializer):
    space_id = serializers.IntegerField()
    space_name = serializers.CharField()
    total_places = serializers.IntegerField()
    occupied_places = serializers.IntegerField()
    occupancy_percent = serializers.FloatField()
    today_bookings = serializers.IntegerField()

class RevenueStatsSerializer(serializers.Serializer):
    today_revenue = serializers.FloatField()
    week_revenue = serializers.FloatField()
    month_revenue = serializers.FloatField()
    avg_check = serializers.FloatField()

class DashboardStatsSerializer(serializers.Serializer):
    total_spaces = serializers.IntegerField()
    total_places = serializers.IntegerField()
    total_bookings_today = serializers.IntegerField()
    total_revenue_today = serializers.FloatField()
    occupancy_by_space = OccupancyStatsSerializer(many=True)
    recent_bookings = serializers.ListField()
