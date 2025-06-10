import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import LockIcon from '@mui/icons-material/Lock';
import '../stylecss/CheckoutForm.css';
import { useParams, useNavigate } from 'react-router-dom'; 
import { auth, firestore } from "../firebase";
import { getFirestore, collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc } from 'firebase/firestore'; // Import Firestore functions

function CheckoutForm() {
  const { 0: encodedTierName } = window.location.pathname.split('/').slice(-1);
  const tierName = decodeURIComponent(encodedTierName);
  const [paymentIntent, setPaymentIntent] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  });
  const [monthlyPrice, setMonthlyPrice] = useState(20); 
  const [journalistName, setJournalistName] = useState('');
  const [journalistId, setJournalistId] = useState('');
  const [tierDescription, setTierDescription] = useState('');
  const [memberId, setMemberId] = useState('');
  const [memberUsername, setMemberUsername] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  useEffect(() => {
    //Function to pass the information from the Tier to the Stripe AI for payment
    const createPaymentIntent = async () => {
      try {
        // Ensure monthlyPrice is a valid number
        if (isNaN(monthlyPrice) || monthlyPrice <= 0) {
          throw new Error('Invalid monthly price');
        }
    
        // Convert monthlyPrice to cents
        const amountInCents = Math.round(monthlyPrice * 100);
    
        const response = await axios.post('/api/create_payment_intent', { amount: amountInCents });
    
        setPaymentIntent(response.data.client_secret);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        setErrorMessage('Error creating payment intent. Please try again.');
      }
    };

    createPaymentIntent();
  }, [monthlyPrice]);

// Function to fetch the document ID associated with a user ID
const fetchUserDocumentId = async (userId) => {
  try {
    
    // Reference to the "Users" collection in Firestore
    const usersCollectionRef = collection(firestore, "Users");
    
    // Query to find documents where the userId matches the provided userId
    const q = query(usersCollectionRef, where("userId", "==", userId));
    
    // Fetch the query snapshot
    const querySnapshot = await getDocs(q);

    // Check if the query snapshot is not empty
    if (!querySnapshot.empty) {
      // Get the first document 
      const doc = querySnapshot.docs[0];
      // Return the document ID
      return doc.id;
    } else {
      // Log an error message if the user document is not found
      console.log("User document not found");
      // Return null if the user document is not found
      return null;
    }
  } catch (error) {
    // Log an error message if there is an error fetching the user document
    console.error("Error fetching user document:", error);
    
    return null;
  }
};


useEffect(() => {

  // Function to fetch user role
  const fetchUserRole = async () => {
    try {
      // Get the current authenticated user
      const currentUser = auth.currentUser;

      // Check if there is a current user
      if (currentUser) {
      
        // Get the user ID of the current user
        const userId = currentUser.uid;

        // Fetch the document ID associated with the user ID
        const docId = await fetchUserDocumentId(userId);
        
        // Check if the document ID is found
        if (docId) {
          
          // Fetch the user document using the document ID
          const userDoc = await getDoc(doc(firestore, "Users", docId));
          
          // Check if the user document exists
          if (userDoc.exists()) {
            
            // Get the user data from the user document
            const userData = userDoc.data();
            
            // Set the user data 
            setMemberId(userData.userId);
            setMemberUsername(userData.username);
            setMemberEmail(userData.email);
          } else {
          
            // Log an error message if the user document does not exist
            console.log("User document does not exist");
          }
        } else {
          
          // Log an error message if the user document ID is not found
          console.log("User document ID not found");
        }
      } else {
      
        // Log a message if no user is currently logged in
        console.log("No user is currently logged in");
      }
    } catch (error) {
      
      // Log an error message if there is an error fetching the user role
      console.error("Error fetching user role:", error);
    }
  };

  fetchUserRole();
}, []);


useEffect(() => {

  // Function to fetch tier data
  const fetchTierData = async () => {
    try {

      // Check if tierName is undefined
      if (!tierName) {

        // Log a message if tierName is undefined
        console.log('Tier name is undefined');
        
        return;
      }

      // Get Firestore instance
      const db = getFirestore();
      
      // Reference to the 'SubscriptionTiers' collection
      const tiersCollection = collection(db, 'SubscriptionTiers');
      
      // Query to find documents where tierName matches the provided tierName
      const tierQuery = query(tiersCollection, where('tierName', '==', tierName));
      
      // Fetch the query document
      const tierSnapshot = await getDocs(tierQuery);

      // Check if the query snapshot is not empty
      if (!tierSnapshot.empty) {
        
        // Iterate through each document 
        tierSnapshot.forEach((doc) => {
          
          // Get the data from the document
          const tierData = doc.data();
        
          // Set the monthly price 
          setMonthlyPrice(parseFloat(tierData.monthlyPrice));
          
          // Set the tier description 
          setTierDescription(tierData.tierDescription);
          
          // Fetch journalist data using the userId found in the tier 
          fetchJournalistData(tierData.userId);
        });
      } else {
        //log error if the tier isnt found
        console.log('Tier not found');
      }
    } catch (error) {

      // Log an error message if there is an error fetching tier data
      console.error('Error fetching tier data:', error);
    }
  };

  fetchTierData();
}, [tierName]);  

// Function to fetch journalist data based on a user ID
const fetchJournalistData = async (userId) => {
  try {
    // Get Firestore instance
    const db = getFirestore();

    // Reference to the 'Users' collection
    const usersCollection = collection(db, 'Users');
    
    // Query to fetch all documents from the 'Users' collection
    const usersQuery = query(usersCollection);
    
    // Fetch the document
    const userSnapshot = await getDocs(usersQuery);

    // Iterate through each document 
    userSnapshot.forEach((doc) => {

      // Get the data from the document
      const userData = doc.data();
      
      // Check if the userId from the document matches the provided userId
      if (userData.userId === userId) {
        
        // Set the journalist name 
        setJournalistName(userData.username); 
        
        // Set the journalist ID 
        setJournalistId(userId);
      }
    });

    // Log a message if journalist user is not found for the provided userId
    console.log('Journalist User not found for ID', userId); 
  
  } catch (error) {
  
    // Log an error message if there is an error fetching journalist data
    console.error('Error fetching Journalist data:', error);
  }
};


  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setBillingDetails({ ...billingDetails, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
  
    if (!stripe || !elements || !paymentIntent) {
      setErrorMessage('Stripe.js has not yet loaded or client secret is missing.');
      return;
    }
  
    try {
      const result = await stripe.confirmCardPayment(paymentIntent, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: billingDetails.name,
            address: {
              line1: billingDetails.address,
              city: billingDetails.city,
              state: billingDetails.state,
              postal_code: billingDetails.zip,
            },
          },
        },
      });
  
      if (result.error) {
        setErrorMessage(result.error.message);
      } else {
        //If payment is successful:
        if (result.paymentIntent.status === 'succeeded') {
          //log successful payment
          console.log('Payment successful!');
          
          //add notification document to firestore 
          const notificationId = await addNotificationToFirestore(memberUsername, tierName, new Date());
          
          //check if notificationId array is avaiable in the Users documennt
          if (notificationId) {
            
            //Add notification reference to the Journalists User document
            await addNotificationReferenceToJournalist(journalistId, notificationId);
          }
          //Add Member subscription details to firestore
          addSubscriptionToFirestore();

          //Add subscribed member details to firestore
          addSubscribedMemberToFirestore();
          
          //Add bill details to firestore
          addBillToFirestore();

          //nagvigate to the Journalists homepage
          navigate(`/${journalistName}`);
        }
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setErrorMessage('Error processing payment. Please try again.');
    }
  };

// Function to add subscription details to Firestore
const addSubscriptionToFirestore = async () => {
  try {

    // Get Firestore instance
    const db = getFirestore();
    
    // Reference to the 'SubscriptionTiers' collection
    const tiersCollection = collection(db, 'SubscriptionTiers');
    
    // Query to find documents where 'tierName' matches the provided tierName
    const tierQuery = query(tiersCollection, where('tierName', '==', tierName));
    
    // Fetch the query details
    const tierSnapshot = await getDocs(tierQuery);
    
    // Initialize variable to store tierTag
    let tierTag = '';

    // Check if the tierSnapshot is not empty
    if (!tierSnapshot.empty) {

      // Iterate through each document in the snapshot
      tierSnapshot.forEach((doc) => {
      
        // Get the data from the document
      
        const tierData = doc.data();
      
        // Assign tierTag from the document data
        tierTag = tierData.tierTag; 
      });
    }
    
    // Reference to the 'Subscriptions' collection
    const subscriptionsCollection = collection(db, 'Subscriptions');
    
    // Get current date
    const currentDate = new Date();
    
    // Add subscription details to 'Subscriptions' collection in Firestore
    const subscriptionDocRef = await addDoc(subscriptionsCollection, {
      dateSubscribed: currentDate,
      journalistId: journalistId,
      journalistUsername: journalistName,
      tierDescription: tierDescription,
      tierName: tierName,
      tierPrice: monthlyPrice,
      userId: memberId,
      tierTag: tierTag, 
    });

    // Call function that will save the subscription documentID to the Member user document array "subscriptionIds"
    await saveSubscriptionReferenceToUser(subscriptionDocRef.id);

  } catch (error) {

    // Log an error message if there is an error adding subscription to Firestore
    console.error('Error adding subscription to Firestore:', error);
  }
};

// Function to save subscription reference to user in Firestore
const saveSubscriptionReferenceToUser = async (subscriptionId) => {
  try {

    // Query to find user document where 'userId' matches the current authenticated user's ID
    const userQuery = query(collection(firestore, 'Users'), where('userId', '==', auth.currentUser.uid));
    
    // Fetch the query snapshot
    const userQuerySnapshot = await getDocs(userQuery);

    // Check if the query snapshot is not empty
    if (!userQuerySnapshot.empty) {
    
      // Get the first document from the snapshot
      const userDoc = userQuerySnapshot.docs[0];
    
      // Get the data from the user document
      const userData = userDoc.data();
      
      // Update subscriptionIds array with the new subscriptionId
      const updatedSubscriptionIds = userData.subscriptionIds ? [...userData.subscriptionIds, subscriptionId] : [subscriptionId];
      
      // Update the user document with the updated subscriptionIds
      await updateDoc(userDoc.ref, { subscriptionIds: updatedSubscriptionIds });
      
    } else {
      
      // Log a message if the user document is not found
      console.log('User document not found');
    }
  } catch (error) {
    
    // Log an error message if there is an error saving the subscription reference to the user document
    console.error('Error saving subscription reference to user document:', error);
  }
};

// Function to add billing history to Firestore
const addBillToFirestore = async () => {
  try {
    // Get Firestore instance
    const db = getFirestore();
    
    // Reference to the 'SubscriptionTiers' collection
    const tiersCollection = collection(db, 'SubscriptionTiers');
    
    // Query to find documents where 'tierName' matches the provided tierName
    const tierQuery = query(tiersCollection, where('tierName', '==', tierName));
    
    // Fetch the query snapshot
    const tierSnapshot = await getDocs(tierQuery);
    
    // Initialize variable to store tierTag
    let tierTag = '';

    // Check if the tierSnapshot is not empty
    if (!tierSnapshot.empty) {
      
      // Iterate through each document in the snapshot
      tierSnapshot.forEach((doc) => {
        
        // Get the data from the document
        const tierData = doc.data();
        
        // Assign tierTag from the document data
        tierTag = tierData.tierTag;
      });
    }
    
    // Reference to the 'Billing' collection
    const billingCollection = collection(db, 'Billing');
    
    // Get current date
    const currentDate = new Date();
    
    // Add billing details to 'Billing' collection in Firestore
    const billingDocRef = await addDoc(billingCollection, {
      dateBilled: currentDate,
      journalistId: journalistId,
      journalistUsername: journalistName,
      tierDescription: tierDescription,
      tierName: tierName,
      tierPrice: monthlyPrice,
      userId: memberId,
      tierTag: tierTag, 
    });

    // Save billing reference to user
    await saveBillingReferenceToUser(billingDocRef.id);

  } catch (error) {
    // Log an error message if there is an error adding billing history to Firestore
    console.error('Error adding billing history to Firestore:', error);
  }
};

// Function to save billing reference to user in Firestore
const saveBillingReferenceToUser = async (billingId) => {
  try {

    // Query to find user document where 'userId' matches the current authenticated user's ID
    const userQuery = query(collection(firestore, 'Users'), where('userId', '==', auth.currentUser.uid));
    
    // Fetch the query snapshot
    const userQuerySnapshot = await getDocs(userQuery);

    // Check if the query snapshot is not empty
    if (!userQuerySnapshot.empty) {

      // Get the first document from the snapshot
      const userDoc = userQuerySnapshot.docs[0];
      
      // Get the data from the user document
      const userData = userDoc.data();
      
      // Update billingIds array with the new billingId
      const updatedBillingIds = userData.billingIds ? [...userData.billingIds, billingId] : [billingId];
      
      // Update the user document with the updated billingIds
      await updateDoc(userDoc.ref, { billingIds: updatedBillingIds });
      
    } else {

      // Log a message if the user document is not found
      console.log('User document not found');
    }
  } catch (error) {

    // Log an error message if there is an error saving the billing reference to the user document
    console.error('Error saving billing reference to user document:', error);
  }
};

// Function to add subscribed member details to Firestore
const addSubscribedMemberToFirestore = async () => {
  try {
    // Get Firestore instance
    const db = getFirestore();
    
    // Reference to the 'SubscriptionTiers' collection
    const tiersCollection = collection(db, 'SubscriptionTiers');
    
    // Query to find documents where 'tierName' matches the provided tierName
    const tierQuery = query(tiersCollection, where('tierName', '==', tierName));
    
    // Fetch the query snapshot
    const tierSnapshot = await getDocs(tierQuery);
    
    // Initialize variables to store tierTag and tierPrice
    let tierTag = '';
    let tierPrice = 0; 

    // Check if the tierSnapshot is not empty
    if (!tierSnapshot.empty) {

      // Iterate through each document in the snapshot
      tierSnapshot.forEach((doc) => {
      
        // Get the data from the document
        const tierData = doc.data();
        
        // Assign tierTag and tierPrice from the document data
        tierTag = tierData.tierTag;
        tierPrice = tierData.monthlyPrice;
      });
    }
    
    // Reference to the 'SubscribedMembers' collection
    const subscribedMembersCollection = collection(db, 'SubscribedMembers');
    
    // Get current date
    const currentDate = new Date();
    
    // Add subscribed member details to 'SubscribedMembers' collection in Firestore
    const subscriptionDocRef = await addDoc(subscribedMembersCollection, {
      dateSubscribed: currentDate,
      journalistUserId: journalistId,
      memberUserId: memberId,
      memberUsername: memberUsername, 
      tierName: tierName,
      memberEmail: memberEmail,
      tierPrice: tierPrice,
      tierTag: tierTag, 
    });

    // Save subscribed member reference to user
    await saveSubscribedMemberReferenceToUser(subscriptionDocRef.id); 

  } catch (error) {
    // Log an error message if there is an error adding subscribed member to Firestore
    console.error('Error adding subscribed member to Firestore:', error);
  }
};

// Function to save subscribed member reference to journalist user in Firestore
const saveSubscribedMemberReferenceToUser = async (subscribedMemberId) => {
  try {
    // Query to find journalist user document where 'userId' matches the provided journalistId
    const userQuery = query(collection(firestore, 'Users'), where('userId', '==', journalistId));
    
    // Fetch the query snapshot
    const userQuerySnapshot = await getDocs(userQuery);

    // Check if the query snapshot is not empty
    if (!userQuerySnapshot.empty) {

      // Get the first document from the snapshot
      const userDoc = userQuerySnapshot.docs[0];
      
      // Get the data from the user document
      const userData = userDoc.data();
      
      // Update subscribedMemberIds array with the new subscribedMemberId
      const updatedSubscribedMemberIds = userData.subscribedMemberIds ? [...userData.subscribedMemberIds, subscribedMemberId] : [subscribedMemberId];
      
      // Update the user document with the updated subscribedMemberIds
      await updateDoc(userDoc.ref, { subscribedMemberIds: updatedSubscribedMemberIds });
      
    } else {

      // Log a message if the journalist document is not found
      console.log('Journalist document not found');
    }
  } catch (error) {
    // Log an error message if there is an error saving the subscribed member reference to the journalist document
    console.error('Error saving subscribed member reference to journalist document:', error);
  }
};

// Function to add a notification to Firestore
const addNotificationToFirestore = async (memberUsername, tierSubscribed, dateSubscribed) => {
  try {

    // Get Firestore instance
    const db = getFirestore();
    
    // Reference to the 'Notifications' collection
    const notificationsCollection = collection(db, 'Notifications');
    
    // Get current date
    const currentDate = new Date();
    
    // Add notification details to 'Notifications' collection in Firestore
    const notificationDocRef = await addDoc(notificationsCollection, {
      memberUsername: memberUsername,
      tierSubscribed: tierSubscribed,
      dateSubscribed: dateSubscribed,
    });
    
    // Return the notification document ID
    return notificationDocRef.id;

  } catch (error) {
    
    // Log an error message if there is an error adding notification to Firestore
    console.error('Error adding notification to Firestore:', error);

    return null;
  }
};

// Function to save notification reference to journalist user in Firestore
const addNotificationReferenceToJournalist = async (journalistId, notificationId) => {
  try {

    // Reference to the journalist user document
    const userDocRef = doc(firestore, 'Users', journalistId);
    
    // Fetch the user document snapshot
    const userDocSnapshot = await getDoc(userDocRef);

    // Check if the user document exists
    if (userDocSnapshot.exists()) {

      // Get the data from the user document
      const userData = userDocSnapshot.data();
      
      // Update notificationIds array with the new notificationId
      const updatedNotificationIds = userData.notificationIds ? [...userData.notificationIds, notificationId] : [notificationId];
      
      // Update the user document with the updated notificationIds
      await updateDoc(userDocRef, { notificationIds: updatedNotificationIds });
      
    } else {

      // Log a message if the journalist document is not found
      console.log('Journalist document not found');
    }
  } catch (error) {

    // Log an error message if there is an error saving the notification reference to the journalist document
    console.error('Error saving notification reference to journalist document:', error);
  }
};


  return (
    <div className="checkout-container">
      <div className="checkout-form">
        <div className="payment-details">
          <h2 className="form-title">Payment Details</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={billingDetails.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-section">
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={billingDetails.address}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-section">
              <input
                type="text"
                name="city"
                placeholder="City"
                value={billingDetails.city}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-section">
              <input
                type="text"
                name="state"
                placeholder="State"
                value={billingDetails.state}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-section">
              <input
                type="text"
                name="zip"
                placeholder="Zip Code"
                value={billingDetails.zip}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-section card-details">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '20px',
                      color: '#fff',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#fa755a',
                      iconColor: '#fa755a',
                    },
                  },
                }}
              />
            </div>
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            <div className="form-section subscription-notice">
              You'll pay ${monthlyPrice.toFixed(2)} monthly on the 2nd.
            </div>
            <button type="submit" className="submit-button" disabled={!stripe}>
              <LockIcon className="lock-icon" /> Subscribe Now
            </button>
          </form>
        </div>
        <div className="order-summary">
          <h2 className="summary-title">Order Summary</h2>
          <div className="summary-item">
            <span>Subscription to <strong>{journalistName}</strong> under Tier <strong>{tierName}</strong></span>
            <span>{""}</span>
          </div>
          <div className="summary-total">
            <span>Total due today</span>
            <span>${monthlyPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutForm;
