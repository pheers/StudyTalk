import time
import pytz
from PIL import Image
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import render, redirect
from messenger.models import *
import json

from users.models import Photo

json.JSONEncoder.default = lambda self, obj: (obj.isoformat() if isinstance(obj, type(datetime)) else None)
import datetime
from django.views import View


class MainMessengerView(View):
    def get(self, request):
        response = redirect('/users/signin')
        if _is_auth(request, response):
            try:
                contacts = Contacts.objects.filter(owner=request.user).exclude(user__is_deleted=True)
            except:
                contacts = None
            chats = list(map(lambda x: {'id': f'chat{x.chat.id}' if x.chat else f'user{x.user.id}',
                                        'unread': x.number_unread,
                                        'name': x.chat.name if x.chat else 'Избранное' if x.user == request.user else f'{x.user.first_name} {x.user.last_name}',
                                        'ava_url': x.chat.avatar_url() if x.chat else "/static/images/favourites.png" if x.user == request.user else x.user.avatar_url()},
                             contacts))
            for chat in chats:
                is_user = chat['id'].startswith('user')
                id = chat['id'][4:]
                last_message = Message.objects.raw(
                    f'SELECT * FROM messenger_message WHERE {f"to_user_id = {id} AND from_user_id = {request.user.id} OR to_user_id = {request.user.id} AND from_user_id" if is_user else "to_chat_id"} = {id}  ORDER BY date_create DESC LIMIT 1')
                chat['sortkey'] = Contacts.objects.get(owner=request.user,
                                                       user_id=id).date_create if is_user else Contacts.objects.get(
                    owner=request.user, chat_id=id).date_create
                if not chat['sortkey']:
                    chat['sortkey'] = pytz.timezone("Europe/London").localize(datetime.datetime(1975, 1, 1))
                for i in last_message:
                    chat['last_message'] = {'time': i.date_create, 'author': {'id': i.from_user.id,
                                                                              'name': 'Вы' if i.from_user == request.user else f"{i.from_user.first_name}" if not is_user else ""}}
                    chat['last_message']['text'] = i.text
                    chat['sortkey'] = i.date_create
            print(chats)
            chats.sort(key=lambda x: x['sortkey'], reverse=True)

            response = render(request, 'main.html',
                              context={'user': {"id": request.user.id,
                                                'email': request.user.email,
                                                'first_name': request.user.first_name,
                                                'last_name': request.user.last_name,
                                                'login': request.user.nick_name,
                                                'avatar_url': request.user.avatar_url()},
                                       'chats': chats
                                       })
        return response


def CreateChat(request):
    red = redirect('/users/signin')

    if _is_auth(request, red):

        name = request.POST.get('name')
        chat = GroupChat.objects.create(name=name)
        picture = request.FILES.get('picture')
        if picture:
            photo = Photo.objects.create(photo=picture, author=request.user)
            im = Image.open(photo.photo.path)
            img_width, img_height = im.size

            if img_width != img_height:
                crop_width = crop_height = min(img_height, img_width)
                im_crop = im.crop(((img_width - crop_width) // 2,
                                   (img_height - crop_height) // 2,
                                   (img_width + crop_width) // 2,
                                   (img_height + crop_height) // 2))
                im_crop.save(quality=95, fp=photo.photo.path)
            chat.chat_picture = photo
            chat.save()
        Contacts.objects.create(owner=request.user, chat=chat, is_admin=True)
        return JsonResponse({'chat_id': chat.id}, status=200)
    return JsonResponse({"error": 'Not auth'}, status=400)


def AddMemberToChat(request, chat_id, user_id):
    try:
        if _is_auth(request, redirect("/")):
            chat_id = int(chat_id[4:])
            user_id = int(user_id[4:])
            if Contacts.objects.get(owner=request.user, chat_id=chat_id).is_admin:
                Contacts.objects.create(owner_id=user_id, chat_id=chat_id)
                return JsonResponse({}, status=200)
            else:
                return JsonResponse({"error": 'Forbidden'}, status=403)
        else:
            return JsonResponse({"error": 'Not auth'}, status=403)
    except Exception as e:
        print(e)
        return JsonResponse({"error": 'Server error'}, status=500)


def GetMessage(request, id):
    try:
        is_user = id.startswith('user')
        id = int(id[4:])
        red = redirect('/users/signin')
        members = None
        if _is_auth(request, red):
            chat = User.objects.get(id=id) if is_user else GroupChat.objects.get(id=id)
            if is_user:
                info = chat.nick_name
            else:
                members = Contacts.objects.filter(chat=chat)
                member_count = members.count()
                print(member_count % 100 / 10)

                if (member_count % 100) // 10 == 1:
                    info = ' участников'
                elif member_count % 10 == 1:
                    info = ' участник'
                elif member_count % 10 > 1 and member_count % 10 < 5:
                    info = ' участника'
                else:
                    info = ' участников'
                info = str(member_count) + info
                members = list(map(lambda x: {"id": x.owner.id, "name": f"{x.owner.first_name} {x.owner.last_name}",
                                              "ava_url": x.owner.avatar_url(),
                                              "nick_name": x.owner.nick_name} if x.owner != request.user else None,
                                   members))

            response = {'chat': {"members": members,
                                 'id': ('user' if is_user else 'chat') + f'{chat.id}',
                                 'info': info,
                                 'name': chat.name if not is_user else 'Избранное' if id == request.user.id else f'{chat.first_name} {chat.last_name}',
                                 'ava_url': '/static/images/favourites.png' if request.user.id == id else chat.avatar_url()}}

            if chat:
                if is_user:
                    print(chat, request.user.id)
                    messages = Message.objects.filter(
                        Q(to_user=chat, from_user=request.user.id) | Q(to_user=request.user.id,
                                                                       from_user=chat)).order_by('-date_create')
                else:
                    messages = Message.objects.filter(to_chat=chat).order_by('-date_create')
                if messages:
                    messages = list(
                        map(lambda x: {'id': x.id, 'text': x.text, 'time': x.date_create if x.date_create else None,
                                       'author': {'id': x.from_user.id if request.user.id != x.from_user.id else 'me',
                                                  'name': f"{x.from_user.first_name} {x.from_user.last_name}",
                                                  'ava_url': x.from_user.avatar_url()}},
                            messages))
                    print(messages)
                    response['messages'] = messages
            return JsonResponse(response, status=200)
        else:
            return JsonResponse({"error": 'Not auth'}, status=400)
    except Exception as error:
        print(error)
        return JsonResponse({"error": error}, status=400)


def GetContats(request):
    try:
        red = redirect('/users/signin')
        if _is_auth(request, red):
            contacts = Contacts.objects.filter(owner=request.user, chat=None).exclude(
                Q(user=request.user) | Q(user__is_deleted=True))
            print(contacts)
            chats = list(map(lambda x: {'id': f'user{x.user.id}',
                                        'nick_name': x.user.nick_name,
                                        'name': f'{x.user.first_name} {x.user.last_name}',
                                        'ava_url': x.user.avatar_url()},
                             contacts
                             )
                         )
            print(chats)

            response = {'chats': chats}
            return JsonResponse(response);
        else:
            return JsonResponse({"error": 'Not auth'}, status=400)
    except Exception as error:
        print(error)
        return JsonResponse({"error": error}, status=400)


def AddContact(request):
    response = redirect('/users/signin')
    if _is_auth(request, response):
        id = request.GET.get('id')
        try:
            Contacts.objects.create(owner=request.user, user_id=id)
        except:
            pass
        return JsonResponse({"id": id}, status=200)
    else:
        return JsonResponse({"error": 'Not auth'}, status=400)


def ReadMessage(request):
    response = redirect('/users/signin')
    if _is_auth(request, response):
        id = request.GET.get('id')
        is_user = True if id.startswith('user') else False
        try:
            if is_user:
                contact = Contacts.objects.get(owner=request.user, user_id=id[4:])
            else:
                contact = Contacts.objects.get(owner=request.user, chat_id=id[4:])
            if contact.number_unread != 0:
                count = request.GET.get('count')
                if count == 'all':
                    count = contact.number_unread
                else:
                    try:
                        count = int(count)
                    except:
                        return JsonResponse({"error": "Count is not number or 'all'"}, status=400)
                contact.number_unread -= count
                contact.save()
        except:
            pass
        return JsonResponse({"id": id}, status=200)
    else:
        return JsonResponse({"error": 'Not auth'}, status=400)


def _is_auth(request, response):
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
