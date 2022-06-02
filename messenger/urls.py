from django.contrib import admin
from django.urls import path, include
from .views import *

urlpatterns = [
    path('', MainMessengerView.as_view(), name="main"),
    path(r'get_messages/<str:id>', GetMessage, name="get_messages"),
    path(r'add_member_to_chat/<str:chat_id>/<str:user_id>', AddMemberToChat, name="add_member_to_chat"),
    path('get_contacts', GetContats, name="get_contacts"),
    path('create_chat', CreateChat, name="create_chat"),
    path('add_contact', AddContact, name="add_contact"),
    path('read', ReadMessage, name="read")
]
