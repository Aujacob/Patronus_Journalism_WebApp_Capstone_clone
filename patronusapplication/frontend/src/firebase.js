import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAgjljHVGftDT08d_oZSqXB7skrirCruFQ",
  authDomain: "patronusjournalism.firebaseapp.com",
  projectId: "patronusjournalism",
  storageBucket: "patronusjournalism.appspot.com",
  messagingSenderId: "1075669422486",
  appId: "1:1075669422486:web:c9b9af90edef99a1e64db7",
  measurementId: "G-1YPZH7NP65"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app); 
export const firestore = getFirestore(app); 

export default app;
