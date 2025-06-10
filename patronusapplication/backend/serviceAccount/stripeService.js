const stripe = require('stripe')('sk_test_51OnDaQLJVlVLUcAgD4JeVuZxJGOxOiOGwJjXRMj7LPReqhdfRMQv1rMhjSZhJP6UgJJEGtjHHMIBerBwptdPn7b200EoNOyNIL'); // Replace 'your_secret_key' with your actual secret key from Stripe

async function createPaymentIntent(amount) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd', 
    });
    return paymentIntent.client_secret;
  } catch (error) {
    throw error;
  }
}

module.exports = { createPaymentIntent };
