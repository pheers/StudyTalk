from django import forms
from django.contrib.auth.forms import AuthenticationForm

from .models import User


class UserRegistrationForm(forms.ModelForm):
    password = forms.CharField(label='Пароль',
                               widget=forms.PasswordInput(attrs={"class": "short-input", "placeholder": "Пароль"}))
    password2 = forms.CharField(label='Повторите пароль', widget=forms.PasswordInput(
        attrs={"class": "short-input", "placeholder": "Повторите пароль"}))
    nick_name = forms.CharField(label='Никнейм', widget=forms.TextInput(attrs={"placeholder": "Никнейм"}))
    email = forms.CharField(label='Емэйл', widget=forms.EmailInput(attrs={"placeholder": "Емейл"}))

    class Meta:
        model = User
        fields = ('nick_name', 'email')

    def clean_password2(self):
        cd = self.cleaned_data
        if cd['password'] != cd['password2']:
            raise forms.ValidationError('Пароли не совпадают')
        return cd['password2']


class SigninForm(forms.Form):
    def addNullOrWrong(self):
        raise self.ValidationError('Неверная почта или пароль')
        return self.cleaned_date
    email = forms.CharField(label='Почта', max_length=50, required=False,
                            widget=forms.TextInput(attrs={'placeholder': 'Почта'}))
    password = forms.CharField(label='Пароль', max_length=25,
                               widget=forms.PasswordInput(attrs={'placeholder': 'Пароль'}))

