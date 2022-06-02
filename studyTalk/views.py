from django.contrib.auth.hashers import make_password
from django.shortcuts import render, redirect
from django.views import View
from users.views import is_auth


class HomeView(View):
    def get(self, request):
        response = render(request, 'home.html')
        if is_auth(request, response):
            response = redirect('/im')
        return response
