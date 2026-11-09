from rest_framework import serializers

from .models import Address, Reader


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            "id", "full_name", "phone", "street_address", "landmark",
            "city", "state", "postal_code", "country", "is_default", "created_at"
        ]
        read_only_fields = ["id", "created_at"]


class ReaderSerializer(serializers.ModelSerializer):
    addresses = AddressSerializer(many=True, read_only=True)

    class Meta:
        model = Reader
        fields = ["id", "name", "email", "phone", "role", "is_staff", "addresses"]


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(min_length=2, max_length=120, trim_whitespace=True)
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(min_length=8, max_length=72, write_only=True, trim_whitespace=False)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)

    def validate_email(self, value):
        normalized = value.strip().lower()
        if Reader.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return normalized

    def create(self, validated_data):
        return Reader.objects.create_user(**validated_data)
