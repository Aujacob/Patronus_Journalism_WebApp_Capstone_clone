from django.shortcuts import HttpResponse
import firebase_admin
from firebase_admin import credentials, auth

# Initializing Firebase Admin SDK
if not firebase_admin._apps:
    cred = credentials.Certificate('patronusapplication\patronusapplication\firebase\patronusjournalism-firebase-admin.json')
    default_app = firebase_admin.initialize_app(cred)


# Firebase authentication view for user signup
def signup_view(request):
    # User signup 
    return HttpResponse("User signed up successfully!")

# Firebase authentication view for user login
def login_view(request):
    # User login logic 
    return HttpResponse("User logged in successfully!")

# Firebase authentication view for user logout
def logout_view(request):
    # User logout logic
    return HttpResponse("User logged out successfully!")
