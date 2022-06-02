# -*- coding: utf-8 -*-
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from random import randint
import smtplib
from django.contrib.auth.hashers import make_password, check_password
from django.db.models import Q
from django.forms.utils import ErrorList
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.views import View
from .forms import *
from messenger.models import *
from PIL import Image


class RegisterView(View):
    def post(self, request):
        user_form = UserRegistrationForm(request.POST)
        if user_form.is_valid():

            try:
                user = User.objects.get(email=user_form.cleaned_data['email'])
                if user.is_email_confirm:
                    if user.is_deleted:
                        user.delete()
                    else:
                        user_form._errors['email'] = ErrorList(['Такой емэйл уже используется'])
                        return render(request, 'users/registration.html', {'user_form': user_form})
                else:
                    user.delete()
            except:
                pass
            pw = user_form.clean_password2()
            new_user = user_form.save(commit=False)
            new_user.password = make_password(pw)
            new_user.save()
            return redirect(f"/users/confirmation/{new_user.email}")
        else:
            return render(request, 'users/registration.html', {'user_form': user_form})

    def get(self, request):
        user_form = UserRegistrationForm()
        return render(request, 'users/registration.html', {'user_form': user_form})


class SigninView(View):
    def post(self, request):
        form = SigninForm(request.POST)
        if form.is_valid():
            try:
                user = User.objects.get(email=form.cleaned_data['email'])
            except:
                try:
                    user = User.objects.get(nick_name=form.cleaned_data['email'])
                except:
                    form._errors['password'] = ErrorList(['Неправильный логин или пароль'])
                    return render(request, 'users/sign_in.html', {'form': form})
            if user.is_deleted:
                form._errors['password'] = ErrorList(['Неправильный логин или пароль'])
                return render(request, 'users/sign_in.html', {'form': form})
            if not user.is_email_confirm:
                return redirect(f"/users/confirmation/{user.email}")
            if check_password(form.cleaned_data['password'], user.password):
                response = redirect('/im')
                response.set_cookie('session', user.token())

                return response
            form._errors['password'] = ErrorList(['Неправильный логин или пароль'])
        return render(request, 'users/sign_in.html', {'form': form})

    def get(self, request):
        form = SigninForm()
        return render(request, 'users/sign_in.html', context={'form': form})


class ConfirmView(View):
    def get(self, request, email):
        try:
            user = User.objects.get(email=email)
            if not user.is_email_confirm:
                code = str(randint(100000, 999999))
                user.email_confirm_code = code
                user.save()
                smtpObj = smtplib.SMTP('smtp.gmail.com', 587)
                smtpObj.starttls()
                smtpObj.login(settings.POST_EMAIL, settings.POST_PASSWORD)
                message = MIMEMultipart("alternative")
                message["Subject"] = "StudyTalk"
                js = '''area = document.getElementById("code-input");
                        area.select();
                        document.execCommand("copy");'''
                message.attach(MIMEText(f"""\
                <html>
                    <head>
                    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&amp;display=swap" rel="stylesheet">
                    </head>
                  <body>
                  <div class ="study-talk-form ">
                    <a href="127.0.0.1:8000/">
                        <img class="header__logo" src="https://downloader.disk.yandex.ru/preview/ee1feb80f44f9a486096184009efe46e7077a390befe86eda9973550e3db2d45/628eb1a4/NFZkVImUuSfpIxbABDoufl5EpJoxyxfykw_WBlkmoS0Degbqpwfo5r3GrZ53tjCEPqhogvtBXhBikZDry_l3rA%3D%3D?uid=0&filename=ЛогоSVG.svg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=0&tknv=v2&size=1920x927" alt="Лого">
                    </a>
                    <h1>Добро пожаловать на StudyTalk!</h1>
                    <p>
                        {user.nick_name}, вот Ваш код для завершения регистрации на StudyTalk: <input id:"code-input" style:"width: auto" type="text" disabled value={code}>
                    </p>
                    <button onclick="{js}">Скопировать</button>
                    </div>
                  </body>
                </html>
                """, 'html'))
                message["To"] = email
                smtpObj.sendmail(settings.POST_EMAIL, email, message.as_string())
                return render(request, 'users/email_confirm.html', context={'email': email})
        except Exception as e:
            print(e)
        return redirect('/')

    def post(self, request, email):
        code = request.POST.get('code_confirm')
        try:
            user = User.objects.get(email=email)
            if user.email_confirm_code == code:
                user.is_email_confirm = True
                user.save()
                response = redirect('/im')
                response.set_cookie('session', user.token())
                Contacts.objects.create(owner=user, user=user)

                return response
            else:
                return render(request, 'users/email_confirm.html', context={'email': email})
        except:
            return render(request, 'users/email_confirm.html', context={'email': email})


class SettingsView(View):
    def post(self, request):
        response = redirect('/users/signin')
        if is_auth(request, response):
            nick_name = request.POST.get('nick_name')
            first_name = request.POST.get('first_name')
            second_name = request.POST.get('second_name')
            email = request.POST.get('email')
            profile_picture = request.FILES.get('profile_picture')
            if nick_name:
                request.user.nick_name = nick_name
            if first_name:
                request.user.first_name = first_name
            if second_name:
                request.user.last_name = second_name
            if email:
                request.user.email = email
            if profile_picture:
                photo = Photo.objects.create(photo=profile_picture, author=request.user)
                im = Image.open(photo.photo.path)
                img_width, img_height = im.size

                if img_width != img_height:
                    crop_width = crop_height = min(img_height, img_width)
                    im_crop = im.crop(((img_width - crop_width) // 2,
                                       (img_height - crop_height) // 2,
                                       (img_width + crop_width) // 2,
                                       (img_height + crop_height) // 2))
                    im_crop.save(quality=95, fp=photo.photo.path)
                request.user.profile_picture = photo
            request.user.save()
            response = redirect('/im')
            return response
        return response


class Logout(View):
    def get(self, request):
        print(make_password('Rewqasd1234.'))
        session = request.COOKIES.get('session')
        response = redirect('/users/signin')
        if session:
            response.delete_cookie('session')
        return response


def Delete(request):
    response = redirect('/users/signin')
    if is_auth(request, response):
        request.user.is_deleted = True
        request.user.save()
        response = redirect('/')
        response.delete_cookie('session')
    return response


def GetUsers(request):
    response = redirect("/users/signin")
    if is_auth(request, response):
        search_string = request.GET.get('search_string')
        if search_string:
            search_string = search_string.split(" ")
            users = User.objects.all()
            contacts = list(map(lambda x: x['user_id'], request.user.owner.exclude(user_id=None).values("user_id")))
            print(contacts)
            for word in search_string:
                print(word)
                users = User.objects.filter(Q(first_name__icontains=word) | Q(last_name__icontains=word) | Q(
                    nick_name__icontains=word)).exclude(id__in=contacts)

            response1 = []
            for user in users:
                response1.append(
                    {"id": user.id, "name": f"{user.first_name} {user.last_name}", "nickname": user.nick_name,
                     "email": user.email, "avatar_url": user.avatar_url()})
        return JsonResponse({"users": response1}, status=200)
    return JsonResponse({"error": "Not auth"}, status=400)


def is_auth(request, response):

    session = request.COOKIES.get('session')
    if session:
        try:
            user_id = jwt.decode(session, settings.SECRET_KEY, algorithms='HS256')['id']
        except:
            response.delete_cookie('session')
            return False
        try:
            user = User.objects.get(id=user_id)
            if user.is_deleted:
                response.delete_cookie('session')
                return False
            request.user = user
            return True
        except:
            return False
    return False
