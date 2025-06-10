from django.http import HttpResponse, JsonResponse
from django.conf import settings  # Import settings

# Third-party imports
import stripe

# Initialize Stripe with secret key
stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', None)

# View function to create a payment intent
def create_payment_intent(request):
    if request.method == 'POST':
        amount = request.POST['amount']
        try:
            # Create payment intent with the provided amount
            payment_intent = stripe.PaymentIntent.create(
                amount=amount,
                currency='usd',
                payment_method_types=['card'],
            )
            # Return the client secret of the payment intent
            return JsonResponse({'client_secret': payment_intent.client_secret})
        except Exception as e:
            # Return error message if there's any exception
            return JsonResponse({'error': str(e)}, status=500)
    else:
        # Return error for invalid request method
        return JsonResponse({'error': 'Invalid request method'}, status=400)


# Firebase authentication view for user signup
def signup_view(request):
    # User signup logic
    return HttpResponse("User signed up successfully!")

# Firebase authentication view for user login
def login_view(request):
    # User login logic 
    return HttpResponse("User logged in successfully!")

# Firebase authentication view for user logout
def logout_view(request):
    # User logout logic
    return HttpResponse("User logged out successfully!")
