from firebase_admin import auth

class FirebaseAuthenticationBackend:
    def authenticate(self, request, email=None, password=None):
        try:
            # Firebase Admin SDK to authenticate the user
            user = auth.get_user_by_email(email)
            return user
        except auth.AuthError:
            return None
