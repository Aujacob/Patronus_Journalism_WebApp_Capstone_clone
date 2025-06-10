import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getFirestore, doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { firestore } from "../firebase";
import no_bkg from '../images/no_bkg.png';
import MembershipIcon from '@mui/icons-material/Group';
import "../stylecss/Sidebar.css";


import {
  Card,
  Typography,
  List,
  ListItem,
  ListItemPrefix,
  ListItemSuffix,
  Chip,
} from "@material-tailwind/react";
import {
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  BellAlertIcon,
  PowerIcon,
  HomeIcon,
} from "@heroicons/react/24/solid";
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

// Function to get doc ID for users
const fetchUserDocumentId = async (userId) => {
  try {
    const usersCollectionRef = collection(firestore, "Users");
    const q = query(usersCollectionRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return doc.id;
    } else {
      console.log("User document not found"); //Debug log
      return null;
    }
  } catch (error) {
    console.error("Error fetching user document:", error); //Debug log
    return null;
  }
};

export function Sidebar({ onLogout }) {
  const [userRole, setUserRole] = useState("");
  const [username, setUsername] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);
  const [memberships, setMemberships] = useState([])
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    //Function to fetch the user data of the currently logged in member using the document ID previously fetched
    //Also checks the notifications
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userId = currentUser.uid;
        const userDocRef = doc(getFirestore(), "Users", userId);
        const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const userData = docSnapshot.data();
            setUserRole(userData.role);
            setUsername(userData.username);
            setNotificationCount(userData.notificationIds?.length || 0);
          }
        });
        return () => unsubscribe();
      }
    };
    fetchUserData();
  }, []);

  const isActive = (path) => location.pathname === path;


  useEffect(() => {
    //Function to check the user role and other user data from the Users document
    //This function also gets a live update from the database anytime the "notificationsIds" array is updated, so that anytime a notification is added or deleted its reflected automatically on the sidebar without having to refresh the page
    const fetchUserRole = async () => {
      try {
        const currentUser = auth.currentUser;
        console.log("Current User:", currentUser);
        if (currentUser) {
          const userId = currentUser.uid;
          const docId = await fetchUserDocumentId(userId);
          if (docId) {
            const userDoc = await getDoc(doc(firestore, "Users", docId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              console.log("User Data:", userData);
              setUserRole(userData.role);
              setUsername(userData.username);
              if (userData.notificationIds) {
                setNotificationCount(userData.notificationIds.length);
              }

              const unsubscribe = onSnapshot(
                doc(firestore, "Users", docId),
                (docSnapshot) => {
                  const userData = docSnapshot.data();
                  if (userData && userData.notificationIds) {
                    setNotificationCount(userData.notificationIds.length);
                  }
                }
              );

              return () => unsubscribe();
            } else {
              console.log("User document does not exist");
            }
          } else {
            console.log("User document ID not found");
          }
        } else {
          console.log("No user is currently logged in");
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };

    fetchUserRole();
  }, []);


  useEffect(() => {
    //Function to fetch the membership data and display it on the sidebar
    //Also recieves a live update from the database anytime a user subscribes or deletes a subscription so that the sidebar is correctly updated without having to refresh the page
    const fetchMemberships = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userId = currentUser.uid;
          const docId = await fetchUserDocumentId(userId);
          if (docId) {
            const subscriptionsData = await getSubscriptionsForUser(userId);
            setMemberships(subscriptionsData);
          } else {
            console.log("User document ID not found");
          }
  
          const docRef = doc(firestore, "Users", docId);
          const unsubscribe = onSnapshot(docRef, (doc) => {
            const userData = doc.data();
            if (userData && userData.subscriptionIds) {
              const updateMemberships = async () => {
                const subscriptionsData = await getSubscriptionsForUser(userId);
                setMemberships(subscriptionsData);
              };
              updateMemberships();
            }
          });
  
          return () => unsubscribe(); 
        } else {
          console.log("No user is currently logged in");
        }
      } catch (error) {
        console.error("Error fetching memberships:", error);
      }
    };
  
    fetchMemberships();
  }, []);
  
  //Function to get and set the subscription data from the Members User document
  //Also pulls the subscribed Journalist User document to get the Journalists profile picture
  const getSubscriptionsForUser = async (userId) => {
    try {
      const userDoc = await getDoc(doc(firestore, "Users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.subscriptionIds && userData.subscriptionIds.length > 0) {
          const subscriptionsData = await Promise.all(userData.subscriptionIds.map(async (subscriptionId) => {
            const subscriptionDoc = await getDoc(doc(firestore, "Subscriptions", subscriptionId));
            if (subscriptionDoc.exists()) {
              const subscriptionData = subscriptionDoc.data();
              const journalistId = subscriptionData.journalistId;
              const journalistDoc = await getDoc(doc(firestore, "Users", journalistId));
              if (journalistDoc.exists()) {
                const journalistData = journalistDoc.data();
                return {
                  name: subscriptionData.journalistUsername,
                  icon: journalistData.photo 
                };
              } else {
                console.log(`Journalist document with ID ${journalistId} does not exist`);
                return null;
              }
            } else {
              console.log(`Subscription document with ID ${subscriptionId} does not exist`);
              return null;
            }
          }));
          return subscriptionsData.filter(subscription => subscription !== null).slice(0, 6);
        } else {
          console.log("No subscription IDs found for the user");
          return [];
        }
      } else {
        console.log("User document does not exist");
        return [];
      }
    } catch (error) {
      console.error("Error fetching subscriptions for user:", error);
      return [];
    }
  };
  
  //function to log the user out
  const handleLogoutClick = () => {
    auth.signOut().then(() => {
      console.log('User logged out successfully');
      navigate("/"); 
    }).catch((error) => {
      console.error('Error signing out:', error);
    });
  };
  
  return (
    //For each one of the tabs, the user role is checked to see whether the user has access to the specific page. 
    //This is where the role based access is given
    <Card className="Sidebar h-[calc(100vh)] w-full max-w-[20rem] p-4 bg-black bg-opacity-85 text-white">
      <div className="mb-2 p-4 flex items-center justify-center">
        <img src={no_bkg} alt="Patronus Journalism Logo" className="h-35" />
      </div>
      <List>
        {userRole === 'Journalist' && (
        <><ListItem
            className={`list-item ${isActive(`/${username}`) ? 'active-tab' : ''}`}
            onClick={() => navigate(`/${username}`)}
          >
            <div className="flex items-center">
              <HomeIcon className="h-6 w-6 text-gray-400" />
              <span className="ml-2 text-lg">My Page</span>
            </div>
          </ListItem><ListItem
            className={`list-item ${isActive('/audience') ? 'active-tab' : ''}`}
            onClick={() => navigate("/audience")}
          >
              <div className="flex items-center">
                <PeopleAltIcon className="h-6 w-6 text-gray-400" />
                <span className="ml-2 text-lg">Audience</span>
              </div>
            </ListItem></>
        )}
        {userRole === 'Member' && (
          <><ListItem
            className={`list-item ${isActive('/recents') ? 'active-tab' : ''}`}
            onClick={() => navigate("/recents")}
          >
            <div className="flex items-center">
              <AutoAwesomeIcon className="h-6 w-6 text-gray-400" />
              <span className="ml-2 text-lg">Recent</span>
            </div>
          </ListItem><ListItem
            className={`list-item ${isActive('/find-creators') ? 'active-tab' : ''}`}
            onClick={() => navigate("/find-creators")}
          >
              <div className="flex items-center">
                <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
                <span className="ml-2 text-lg">Find Journalists</span>
              </div>
            </ListItem></>
        )}
    
    <ListItem
  className={`list-item ${isActive('/notifications') ? 'active-tab' : ''}`}
  onClick={() => navigate("/notifications")}
>
  <div className="flex items-center justify-between w-full">
    <div className="flex items-center">
      <BellAlertIcon className="h-6 w-6 text-gray-400" />
      <span className="ml-2 text-lg">Notifications</span>
    </div>
    {notificationCount > 0 && (
      <span className="bg-blue-800 text-white text-xs font-bold px-2 py-1 rounded-full">
        {notificationCount}
      </span>
    )}
  </div>
</ListItem>

    
        <ListItem
          className={`list-item ${isActive('/settings') ? 'active-tab' : ''}`}
          onClick={() => navigate("/settings")}
        >
          <div className="flex items-center">
            <Cog6ToothIcon className="h-6 w-6 text-gray-400" />
            <span className="ml-2 text-lg">Settings</span>
          </div>
        </ListItem>
    
        <ListItem
          className={`list-item ${isActive('/') ? 'active-tab' : ''}`}
          onClick={handleLogoutClick}
        >
          <div className="flex items-center">
            <PowerIcon className="h-6 w-6 text-gray-400" />
            <span className="ml-2 text-lg">Log Out</span>
          </div>
        </ListItem>
      </List>
    
      {userRole === 'Member' && (
        
          <><Typography variant="h6" className="px-4 py-2 text-gray-300">Memberships</Typography><List className="px-4">
          {memberships.map((membership, index) => (
            <ListItem
              key={index}
              className={`list-item ${isActive(`/${membership.name}`) ? 'active-tab' : ''}`}
              onClick={() => navigate(`/${membership.name}`)}
            >
              <div className="flex items-center">
                <img src={membership.icon} alt={membership.name} className="h-6 w-6" />
                <Typography className="ml-2 text-lg">{membership.name}</Typography>
              </div>
            </ListItem>
          ))}
        </List>
        </>
      )}
    </Card>
  );
  

  
}

export default Sidebar;
