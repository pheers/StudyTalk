from datetime import datetime, timedelta
from django.db import models
import jwt
from studyTalk import settings


class Photo(models.Model):
    photo = models.ImageField(upload_to='static/photos', null=False)
    date_upload = models.DateTimeField(auto_now_add=True)
    author = models.ForeignKey('User', on_delete=models.deletion.SET_NULL, null=True)



class User(models.Model):
    nick_name = models.CharField(max_length=30, blank=False, null=False, unique=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    profile_picture = models.ForeignKey(Photo, on_delete=models.deletion.SET_NULL, null=True)
    password = models.CharField(max_length=256, blank=False, null=False)
    email = models.CharField(max_length=256, blank=False, null=False)
    date_birthday = models.DateField(null=True)
    is_email_confirm = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    email_confirm_code = models.CharField(max_length=6)
    date_create = models.DateTimeField(auto_now_add=True)
    date_update = models.DateTimeField(auto_now=True, null=True)

    def avatar_url(self):
        if self.profile_picture:
            return self.profile_picture.photo.url
        else:
            return '/static/images/user_avatar.png'

    def token(self):
        """
        Позволяет получить токен пользователя путем вызова user.token, вместо
        user._generate_jwt_token(). Декоратор @property выше делает это
        возможным. token называется "динамическим свойством".
        """
        return self._generate_jwt_token()

    def _generate_jwt_token(self):
        """
        Генерирует веб-токен JSON, в котором хранится идентификатор этого
        пользователя, срок действия токена составляет 1 день от создания
        """
        dt = datetime.now() + timedelta(minutes=15)

        token = jwt.encode({
            'id': self.pk,
            'exp': dt.utcfromtimestamp(dt.timestamp())
        }, settings.SECRET_KEY, algorithm='HS256')

        return token
