const express = require('express');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount/patronusjournalism-firebase-adminsdk-7dolg-c89f9d9bc3.json');
const stripe = require('stripe')('sk_test_51OnDaQLJVlVLUcAgD4JeVuZxJGOxOiOGwJjXRMj7LPReqhdfRMQv1rMhjSZhJP6UgJJEGtjHHMIBerBwptdPn7b200EoNOyNIL');

require('dotenv').config();
console.log(process.env.STRIPE_SECRET_KEY);


// Initialize Express app
const app = express();
const port = process.env.PORT || 5000;

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Middleware to parse JSON bodies
app.use(express.json());

// Testing
app.get('/', (req, res) => {
  res.send('Hello from Patronus backend!');
});

// Endpoint to create a payment intent
app.post('/api/create_payment_intent', async (req, res) => {
  try {
    const { amount } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
    });
    res.json({ client_secret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Endpoint to handle payments
app.post('/api/payments', async (req, res) => {
  try {
    // Get payment details from request body
    const { amount, paymentMethodId } = req.body;

    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
    });

    // Payment was successful
    res.json({ success: true, paymentIntent });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});