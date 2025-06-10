from django.urls import path, include
from rest_framework.routers import DefaultRouter
##from .views import ItemViewSet
from .views import LoginView
from . import views
from .views import activate_account

router = DefaultRouter()
##router.register(r'items', ItemViewSet)

urlpatterns = [
    path('activate/<uidb64>/<token>/', activate_account, name='activate_account'),
    path('login/', LoginView.as_view(), name='login'),
    path('', include(router.urls)),
    path('signup/', views.signup_view, name='signup'),
]

