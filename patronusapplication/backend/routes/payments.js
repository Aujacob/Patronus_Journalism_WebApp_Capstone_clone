const express = require('express');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount/patronusjournalism-firebase-adminsdk-7dolg-c89f9d9bc3.json');
const stripe = require('stripe')('sk_test_51OnDaQLJVlVLUcAgD4JeVuZxJGOxOiOGwJjXRMj7LPReqhdfRMQv1rMhjSZhJP6UgJJEGtjHHMIBerBwptdPn7b200EoNOyNIL');
const paymentsRouter = require('./routes/payments');

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

// Testing to make sure I set up node.js correctly
app.get('/', (req, res) => {
  res.send('Hello from Patronus backend!');
});

// Mount payments router
app.use('/api', paymentsRouter);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
