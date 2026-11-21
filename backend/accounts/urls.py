from django.urls import path
from .views import (
    csrf_cookie,
    register_user,
    login_user,
    logout_user,
    current_user,
)


urlpatterns = [
    path('csrf/', csrf_cookie),
    path('register/', register_user),
    path('login/', login_user),
    path('logout/', logout_user),
    path('me/', current_user),
]