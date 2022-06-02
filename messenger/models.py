from django.core.exceptions import ValidationError
from users.models import *


class Message(models.Model):
    from_user = models.ForeignKey(User, on_delete=models.deletion.CASCADE, null=False, related_name="from_user")
    to_user = models.ForeignKey(User, on_delete=models.deletion.CASCADE, null=True, related_name="to_user")
    to_chat = models.ForeignKey('GroupChat', on_delete=models.deletion.SET_NULL, null=True)
    text = models.CharField(max_length=256)
    date_create = models.DateTimeField(auto_now_add=True)
    date_update = models.DateTimeField(auto_now=True, null=True)

    def clean(self):
        if self.to_user and self.to_chat:
            raise ValidationError("Only one recipient field can be set.")


class Contacts(models.Model):
    owner = models.ForeignKey(User, on_delete=models.deletion.CASCADE, null=False, related_name='owner')
    user = models.ForeignKey(User, on_delete=models.deletion.CASCADE, null=True, related_name='user')
    chat = models.ForeignKey('GroupChat', on_delete=models.deletion.CASCADE, null=True)
    is_admin = models.BooleanField(default=False)
    number_unread = models.IntegerField(default=0, null=False)
    date_create = models.DateTimeField(auto_now_add=True, null=True)
    date_update = models.DateTimeField(auto_now=True, null=True)

    def clean(self):
        if self.user and self.chat:
            raise ValidationError("Only one recipient field can be set.")


class GroupChat(models.Model):
    name = models.CharField(max_length=30)
    chat_picture = models.ForeignKey(Photo, on_delete=models.deletion.SET_NULL, null=True)
    date_create = models.DateTimeField(auto_now_add=True)
    date_update = models.DateTimeField(auto_now=True, null=True)

    def avatar_url(self):
        if self.chat_picture:
            return self.chat_picture.photo.url
        else:
            return '/static/images/user_avatar.png'
