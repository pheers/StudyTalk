import json
import datetime

import jwt
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from django.shortcuts import redirect

from messenger.models import *
from studyTalk import settings
from users.models import User


def _is_auth(request):
    cookies_list = dict(request.scope['headers'])[b'cookie'].decode('utf-8').split(' ')
    cookies = {}
    for cookie in cookies_list:
       cookies[cookie.split('=')[0]] = cookie.split('=')[1]
    session = cookies['session']

    print(session)
    if session:
        try:
            user_id = jwt.decode(session, settings.SECRET_KEY, algorithms='HS256')['id']
        except:
            print(1)
            return False
        try:
            user = User.objects.get(id=user_id)
            request.scope['user'] = user
            return True
        except Exception as e:
            print(e)
            return False
    return False


class ChatConsumer(WebsocketConsumer):
    def connect(self):
        if _is_auth(self):
            self.group_name = 'user_%s' % self.scope['user'].id
        # Join room group
            async_to_sync(self.channel_layer.group_add)(
                self.group_name,
                self.channel_name
            )

            self.accept()
        else: self.close()

    def disconnect(self, close_code):

        async_to_sync(self.channel_layer.group_discard)(
            self.group_name,
            self.channel_name
        )

    def receive(self, text_data):
        if _is_auth(self):
            text_data_json = json.loads(text_data)
            if text_data_json['type']=="send_message":
                message_text = text_data_json['message']
                id = text_data_json['chat']
                is_user = id.startswith('user')
                id = int(id[4:])
                if is_user:
                    message = Message.objects.create(text=message_text, from_user=self.scope['user'], to_user_id=id)
                    try:
                        contact = Contacts.objects.get(owner_id=id, user = self.scope['user'])
                    except:
                        contact = Contacts.objects.create(owner_id=id, user = self.scope['user'])
                        async_to_sync(self.channel_layer.group_send)(
                            'user_%s' % id,
                            {
                                'type': 'add_chat',
                                'chat': {'ava_url': message.from_user.avatar_url(),
                                            'name': f"{message.from_user.first_name} {message.from_user.last_name}",
                                            'id': f'user{self.scope["user"].id}'}
                            }
                        )
                    if id != self.scope['user'].id:
                        contact.number_unread += 1
                        contact.save()
                    async_to_sync(self.channel_layer.group_send)(
                        'user_%s' % id,
                        {
                            'type': 'chat_message',
                            'message': {'text': message.text,
                                        'time': message.date_create.isoformat()},
                            'chat': f'user{self.scope["user"].id}',
                            'author': {'name': None, 'last_name': None,
                                       'ava_url': message.from_user.avatar_url(), 'id': message.from_user.id}
                        })
                    if self.scope['user'].id !=id:
                        async_to_sync(self.channel_layer.group_send)(
                            'user_%s' % self.scope['user'].id,
                            {
                                'type': 'chat_message',
                                'message': {'text': message.text,
                                            'time': message.date_create.isoformat()},
                                'chat': f'user{id}',
                                'author': {'name': f"Вы", 'last_name': None,
                                           'ava_url': message.from_user.avatar_url(), 'id': message.from_user.id}
                            }
                        )
                else:
                    message = Message.objects.create(text=message_text, from_user=self.scope['user'], to_chat_id=id)
                    for member in message.to_chat.contacts_set.all():
                        if self.scope['user'].id!=member.owner.id:
                            contact = Contacts.objects.get(owner_id=member.owner.id, chat_id=id)
                            contact.number_unread += 1
                            contact.save()
                        async_to_sync(self.channel_layer.group_send)(
                            'user_%s' % member.owner.id,
                            {
                                'type': 'chat_message',
                                'message':{'id': message.id, 'text': message.text,
                                'time': message.date_create.isoformat()},
                                'chat': f'chat{id}',
                                'author':{'name': 'Вы' if self.scope['user'].id==member.owner.id else f"{message.from_user.first_name}",'last_name': None if self.scope['user'].id==member.owner.id else message.from_user.last_name, 'ava_url':message.from_user.avatar_url(), 'id':message.from_user.id}
                            }
                        )
            elif text_data_json['type']=="add_chat":
                if "chat_id" in text_data_json.keys():
                    chat = GroupChat.objects.get(id = text_data_json['chat_id'])
                    members = chat.contacts_set.all()
                    for member in members:
                        async_to_sync(self.channel_layer.group_send)(
                            'user_%s' % member.owner.id,
                            {
                                'type': 'add_chat',
                                'chat': {'ava_url': chat.avatar_url(),
                                         'name': f"{chat.name}",
                                         'id': f'chat{chat.id}'}
                            }
                        )
                elif "user_id" in text_data_json.keys():
                    user = User.objects.get(id = text_data_json['user_id'])
                    async_to_sync(self.channel_layer.group_send)(
                        'user_%s' % self.scope['user'].id,
                        {
                            'type': 'add_chat',
                            'chat': {'ava_url': user.avatar_url(),
                                     'name': f"{user.first_name} {user.last_name}",
                                     'id': f'user{user.id}'}
                        }
                    )

        else:
            self.close()


    def chat_message(self, event):
        message = event['message']
        author = event['author']
        chat_id = event['chat']
        # Send message to WebSocket
        print(author)
        self.send(text_data=json.dumps({
            'type': 'message',
            'message': message,
            'chat_id': chat_id,
            'author': {'name': author['name'], 'last_name': author['last_name'] if author['last_name'] else None, 'ava_url':author['ava_url'], 'id':'me' if author['id']==self.scope['user'].id else author['id']}
        }))

    def add_chat(self, event):
        chat = event['chat']
        # Send message to WebSocket
        self.send(text_data=json.dumps({
            'type': 'add_chat',
            'chat': chat
        }))