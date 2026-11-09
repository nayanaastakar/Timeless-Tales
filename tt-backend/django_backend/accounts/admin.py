from django.contrib import admin
from .models import Address, Reader


@admin.register(Reader)
class ReaderAdmin(admin.ModelAdmin):
    list_display = ("email", "name", "role", "is_active", "is_staff", "created_at")
    list_filter = ("role", "is_active", "is_staff")
    search_fields = ("email", "name", "phone")


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ("user", "full_name", "city", "state", "postal_code", "is_default")
    list_filter = ("state", "is_default")
    search_fields = ("full_name", "phone", "street_address", "city", "postal_code")
