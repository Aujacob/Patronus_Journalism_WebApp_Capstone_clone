from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from .views import signup_view, login_view, logout_view, create_payment_intent  # Import the authentication and payment views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('Users.urls')),
    path('api/signup/', signup_view, name='signup'),  # URL pattern for user signup
    path('api/login/', login_view, name='login'),  # URL pattern for user login
    path('api/logout/', logout_view, name='logout'),  # URL pattern for user logout
    path('api/create_payment_intent/', create_payment_intent, name='create_payment_intent'),  # URL pattern for creating payment intent
]

# Debug toolbar URL patterns if DEBUG mode is enabled
if settings.DEBUG:
    import debug_toolbar
    urlpatterns += [
        path('__debug__/', include(debug_toolbar.urls)),
    ]
