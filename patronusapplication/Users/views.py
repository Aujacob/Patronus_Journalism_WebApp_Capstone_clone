from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.viewsets import ModelViewSet
from rest_framework import viewsets
from .models import MyUser
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.sites.shortcuts import get_current_site
from django.core.mail import send_mail
from django.conf import settings
@method_decorator(csrf_exempt, name='dispatch')

class LoginView(APIView):
    permission_classes = []  
    authentication_classes = []

    def post(self, request, format=None):
        email = request.data.get('email')
        password = request.data.get('password')
        print ("email = ", email)
        print ("password = ", password)
        try:
            user = authenticate(email=email, password=password)
            if user is not None:
                token, _ = Token.objects.get_or_create(user=user)
                return Response({'token': token.key}, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Invalid Credentials'}, status=status.HTTP_400_BAD_REQUEST)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

def activate_account(request, uidb64, token):
    try:
        # Decode the user id
        uid = force_str(urlsafe_base64_decode(uidb64))

        # Get the user
        user = MyUser.objects.get(pk=uid)

        # Check the token and activate the user
        if default_token_generator.check_token(user, token):
            user.is_active = True
            user.save()
            return HttpResponse('Thank you for your email confirmation. Now you can login into your account.')
        else:
            return HttpResponse('Activation link is invalid!')
    except(TypeError, ValueError, OverflowError, MyUser.DoesNotExist):
        return HttpResponse('Activation link is invalid!')



@csrf_exempt
def signup_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')

            
            user = MyUser(email=email)
            # Hash the password and save it
            user.set_password(password)
            user.is_active = False # User is not active until they confirm their email
            user.save()

            # Generate a one-time use token and an email message body
            token = default_token_generator.make_token(user)
            email_body = render_to_string('activation_email.html',{
                'user': user,
                'token': token,
                'uid': urlsafe_base64_encode(force_bytes(user.pk)),
                'domain': get_current_site(request),
            })

            send_mail(
                'Activate your account',
                email_body,
                settings.EMAIL_HOST_USER,
                [email],
                fail_silently=False,
                html_message=email_body,
            )

            # Return a success response
            return JsonResponse({'message': 'Registration successful'})
        except Exception as e:
            # Handle validation errors or registration failures
            return JsonResponse({'error': 'Registration failed', 'message': str(e)}, status=400)