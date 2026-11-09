from django.urls import path

from .views import AddressDetailView, AddressListCreateView, LoginView, MeView, RegisterView


urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("addresses/", AddressListCreateView.as_view(), name="addresses"),
    path("addresses/<uuid:address_id>/", AddressDetailView.as_view(), name="address-detail"),
]
