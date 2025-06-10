import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayRemove, deleteDoc } from "firebase/firestore";
import { auth } from "../firebase";
import { firestore } from "../firebase";
import { useNavigate } from "react-router-dom"; 
import '../stylecss/MemberNotifications.css'; 

//Function to fetch the user document ID of the currently logged in user
const fetchUserDocumentId = async (userId) => {
  try {
    const usersCollectionRef = collection(firestore, "Users");
    const q = query(usersCollectionRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return doc.id;
    } else {
      console.log("User document not found"); 
      return null;
    }
  } catch (error) {
    console.error("Error fetching user document:", error);
    return null;
  }
};

//Function to fetch the Notification document from the currently logged in Users document
//If the User is a Journalist and they have a notificaiton, then the notification says "You have a new Subscriber! Member (MemberUsername) subscribed to (TierName)"
//If the User is a Memember and they have a notification, then the notificaiton says "Journalist (JournalistUsername) posted a new article titled (ArticleTitle)"
//There is also a notification placeholder incase we want to add a different role in the future, for example it would be modified for Moderators to say "A new Journalist needs to be verified!" if they receive a verification request or something
const fetchNotificationsData = async (notificationIds, userRole) => {
  try {
    const notifications = await Promise.all(notificationIds.map(async (notificationId) => {
      const notificationDoc = await getDoc(doc(firestore, "Notifications", notificationId));
      if (notificationDoc.exists()) {
        const notificationData = notificationDoc.data();
        let timestamp = notificationData.dateSubscribed;
        let memberTimestamp = notificationData.datePosted;
        if (timestamp && timestamp.toDate) {
          timestamp = timestamp.toDate(); 
        }
        if (memberTimestamp && memberTimestamp.toDate) {
          memberTimestamp = memberTimestamp.toDate(); 
        }
        if (userRole === "Journalist") {
          return {
            id: notificationDoc.id, 
            title: `You have a new Subscriber! Member "${notificationData.memberUsername}" subscribed to ${notificationData.tierSubscribed}!`,
            timestamp: timestamp.toLocaleDateString()
          };
        } else if (userRole === "Member") {
          return {
            id: notificationDoc.id, 
            title: `Journalist ${notificationData.journalistUsername} posted a new article titled "${notificationData.articleTitle}"!`,
            timestamp: memberTimestamp.toLocaleDateString(),
            articleId: notificationData.articleId 
          };
        } else {
          return {
            id: notificationDoc.id, 
            title: `Notification Placeholder for ${notificationData.memberUsername} in tier ${notificationData.tierSubscribed}`, 
            timestamp: timestamp.toLocaleDateString() 
          };
        }
      } else {
        console.log(`Notification document with ID ${notificationId} does not exist`);
        return null;
      }
    }));
    return notifications.filter(notification => notification !== null);
  } catch (error) {
    console.error("Error fetching notifications data:", error);
    return [];
  }
};


const NotificationItem = ({ id, title, timestamp, userRole, articleId }) => {
  const navigate = useNavigate(); 


  //Function to delete the notification document from the Notifications collection, as well as delete the reference to the document from the "notificationIds" array in the users document
  const deleteNotificationAndRef = async (notificationId) => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const userId = currentUser.uid;
      const userDocId = await fetchUserDocumentId(userId);
      if (userDocId) {
        const userDocRef = doc(firestore, "Users", userDocId);
        await updateDoc(userDocRef, {
          notificationIds: arrayRemove(notificationId)
        });

        const notificationDocRef = doc(firestore, "Notifications", notificationId);
        await deleteDoc(notificationDocRef);
      }
    }
  };

  //Function to redirect the user to the correct page after the notification is clicked
  //If a Member clicks their notifcation then they're directed to the view article page of the article that was just posted
  //If a Journalist member clicks their notificaiton then they're directed to the Audience page to view more information on their new subscriber
  //After the notification is clicked the delete notification function is called
  const handleClick = () => {
    let path = ''; 
    if (userRole === "Member" && articleId) {
      path = `/viewarticle/${articleId}`;
    } else if (userRole === "Journalist") {
      path = "/audience";
    } else {
      alert(`Notification ${id} clicked`);
      return; 
    }
    navigate(path); 
    deleteNotificationAndRef(id); 
  };

  return (
    <div onClick={handleClick} className="member-notification-item">
      <p className="member-notification-title">{title}</p>
      <span className="member-notification-timestamp">{timestamp}</span>
    </div>
  );
};

const MemberNotificationsList = ({ notifications, userRole }) => (
  <div>
    <h2 className="member-notifications-header">Notifications</h2>
    <h3 className="member-notifications-section-title">Earlier</h3>
    <div className="member-notifications">
      <ul className="member-notifications-list">
        {notifications.map(notification => (
          <NotificationItem key={notification.id} {...notification} userRole={userRole} />
        ))}
      </ul>
    </div>
  </div>
);

const MemberNotifications = () => {
  const [userRole, setUserRole] = useState("");
  const [username, setUsername] = useState('');
  const [notificationsData, setNotificationsData] = useState([]);
  const [loading, setLoading] = useState(true);

  //Function to set the username and role of the currently logged in user to display notifications correctly
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userId = currentUser.uid;
          const userDocId = await fetchUserDocumentId(userId);
          if (userDocId) {
            const userDoc = await getDoc(doc(firestore, "Users", userDocId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUserRole(userData.role);
              setUsername(userData.username);

              if (userData.notificationIds && userData.notificationIds.length > 0) {
                const notifications = await fetchNotificationsData(userData.notificationIds, userData.role);
                setNotificationsData(notifications);
              } else {
                console.log("User has no notifications");
              }
              setLoading(false); 
            } else {
              console.log("User document does not exist");
              setLoading(false); 
            }
          } else {
            console.log("User document ID not found");
            setLoading(false); 
          }
        } else {
          console.log("No user is currently logged in");
          setLoading(false); 
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        setLoading(false); 
      }
    };

    fetchUserRole();
  }, []);

  useEffect(() => {
  }, [notificationsData]);

  return (
    <div className="member-notifications-container">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {notificationsData.length > 0 ? (
            <MemberNotificationsList notifications={notificationsData} userRole={userRole} />
          ) : (
            <div className="no-notifications-message">
              <p>You currently have no notifications</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MemberNotifications;
