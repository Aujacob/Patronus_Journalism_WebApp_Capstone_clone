const express = require('express');
const firebaseAdmin = require('firebase-admin');
const stripe = require('stripe')('sk_test_51OnDaQLJVlVLUcAgD4JeVuZxJGOxOiOGwJjXRMj7LPReqhdfRMQv1rMhjSZhJP6UgJJEGtjHHMIBerBwptdPn7b200EoNOyNIL');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccount/patronusjournalism-firebase-adminsdk-7dolg-c89f9d9bc3.json');

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
});

const app = express();

// Middleware
app.use(express.json());

// Define routes
app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

// Routes
const subscriptionsRouter = require('./routes/subscriptions');
app.use('/api/subscriptions', subscriptionsRouter);

// Start the server
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
