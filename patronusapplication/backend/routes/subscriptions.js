const express = require('express');
const router = express.Router();
const stripe = require('stripe')('your_stripe_secret_key');

// Endpoint to create a subscription
router.post('/create_subscription', async (req, res) => {
  try {
    const { customerId, priceId } = req.body; 

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }], 
    });

    res.json({ subscription });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

module.exports = router;
