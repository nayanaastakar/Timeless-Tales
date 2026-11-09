from django import forms
from django.contrib.auth.forms import ReadOnlyPasswordHashField

from .models import Reader


class ReaderCreationForm(forms.ModelForm):
    password1 = forms.CharField(label="Password", widget=forms.PasswordInput)
    password2 = forms.CharField(label="Confirm password", widget=forms.PasswordInput)

    class Meta:
        model = Reader
        fields = ("email", "name", "role")

    def clean_password2(self):
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("The passwords do not match.")
        return password2

    def save(self, commit=True):
        reader = super().save(commit=False)
        reader.set_password(self.cleaned_data["password1"])
        if commit:
            reader.save()
        return reader


class ReaderChangeForm(forms.ModelForm):
    password = ReadOnlyPasswordHashField()

    class Meta:
        model = Reader
        fields = "__all__"
