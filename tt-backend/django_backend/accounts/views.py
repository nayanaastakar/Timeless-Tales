from django.contrib.auth import authenticate
from django.db import IntegrityError, transaction
from rest_framework.generics import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import AccessToken

from .models import Address, Reader
from .serializers import AddressSerializer, ReaderSerializer, RegisterSerializer


def auth_response(user):
    return {"token": str(AccessToken.for_user(user)), "user": ReaderSerializer(user).data}


class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            with transaction.atomic():
                user = serializer.save()
        except IntegrityError:
            return Response(
                {"detail": "An account with this email already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(auth_response(user), status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        email = str(request.data.get("email", "")).strip().lower()
        password = request.data.get("password", "")
        if not email or not isinstance(password, str) or not password:
            return Response({"detail": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)
        user = authenticate(request, email=email, password=password)
        if not user:
            return Response({"detail": "Email or password is incorrect."}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(auth_response(user))


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(ReaderSerializer(request.user).data)

    def put(self, request):
        user = request.user
        if "name" in request.data:
            user.name = request.data["name"].strip()
        if "phone" in request.data:
            user.phone = request.data["phone"].strip()
        if "password" in request.data and request.data["password"]:
            user.set_password(request.data["password"])
        user.save()
        return Response(ReaderSerializer(user).data)


class AddressListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        addresses = Address.objects.filter(user=request.user)
        return Response(AddressSerializer(addresses, many=True).data)

    def post(self, request):
        serializer = AddressSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # If first address, make it default
        is_first = not Address.objects.filter(user=request.user).exists()
        is_def = serializer.validated_data.get("is_default", False) or is_first

        address = Address.objects.create(
            user=request.user,
            full_name=serializer.validated_data["full_name"],
            phone=serializer.validated_data["phone"],
            street_address=serializer.validated_data["street_address"],
            landmark=serializer.validated_data.get("landmark", ""),
            city=serializer.validated_data["city"],
            state=serializer.validated_data["state"],
            postal_code=serializer.validated_data["postal_code"],
            country=serializer.validated_data.get("country", "India"),
            is_default=is_def,
        )
        return Response(AddressSerializer(address).data, status=status.HTTP_201_CREATED)


class AddressDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, address_id):
        address = get_object_or_404(Address, pk=address_id, user=request.user)
        serializer = AddressSerializer(address, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, address_id):
        address = get_object_or_404(Address, pk=address_id, user=request.user)
        address.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
