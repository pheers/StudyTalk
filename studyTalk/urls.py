from django.urls import path, include
from .views import *

urlpatterns = [
   path('', HomeView.as_view(), name="Home"),
   path('users/', include('users.urls')),
   path('im/', include('messenger.urls')),
]
