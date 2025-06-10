import React, { useState, useEffect } from "react";
import "../stylecss/Audience.css";
import { auth } from "../firebase";
import {
  getDocs,
  collection,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { firestore } from "../firebase";

const Audience = () => {
  const [members, setMembers] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredMembers = searchTerm
    ? members.filter(
        (member) =>
          member.memberUsername
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          member.memberEmail.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : members;

  const [activeTab, setActiveTab] = useState("relationshipManager");

  // Handlers for tab switching
  const showRelationshipManager = () => setActiveTab("relationshipManager");
  const showBlockedUsers = () => setActiveTab("blockedUsers");
  const [userId, setUserId] = useState(null);

useEffect(() => {
  // Function to fetch the document ID associated with a user ID
  const fetchUserDocumentId = async (userId) => {
    try {
      //Reference the Users collection in Firestore
      const usersCollectionRef = collection(firestore, "Users");

      // Query to find documents where the userId is equal to the currently logged in userID
      const q = query(usersCollectionRef, where("userId", "==", userId));
      
      // Fetch the query 
      const querySnapshot = await getDocs(q);
      
      // Check if the query snapshot is not empty
      if (!querySnapshot.empty) {
        
        // Get the first document from the snapshot
        const doc = querySnapshot.docs[0];
        
        // Return the document ID
        return doc.id;
      
      } else {
        
        // Log an error message if the user document is not found
        console.log("User document not found");
        return null;
      }
    } catch (error) {
      
      // Log an error message if there is an error fetching the user document
      console.error("Error fetching user document:", error);
      return null;
    }
  };

  // Function to fetch user data
  const fetchUserData = async () => {
    try {
      
      // Get the current authenticated user
      const currentUser = auth.currentUser;
      if (currentUser) {
      
        // Fetch the document ID associated with the current user
        const docId = await fetchUserDocumentId(currentUser.uid);
        if (docId) {
      
          // Set the document ID 
          setUserId(docId);
      
          // Fetch member data using the document ID
          const userData = await fetchMemberData(docId);
      
          // Set the member data 
          setMembers(userData);
        }
      }
    } catch (error) {
      // Log an error message if there is an error fetching user data
      console.error("Error fetching user data:", error);
    }
  };

  fetchUserData();
}, []);

// Function to fetch member data based on the document ID
const fetchMemberData = async (docId) => {
  try {

    // Reference to the user document using the provided docId
    const userDocRef = doc(firestore, "Users", docId);
    
    // Fetch the user document 
    const userDocSnap = await getDoc(userDocRef);
    
    // Get the array of subscribed member IDs from the user document
    const subscribedMemberIds = userDocSnap.data().subscribedMemberIds;
    
    // Initialize an empty array to store member data
    const memberDataArray = [];
    
    // Iterate through each subscribed member ID
    for (const memberId of subscribedMemberIds) {
      
      // Reference to the member document using the memberId
      const memberDocRef = doc(firestore, "SubscribedMembers", memberId);
      
      // Fetch the member document 
      const memberDocSnap = await getDoc(memberDocRef);
      
      // Check if the member document exists
      if (memberDocSnap.exists()) {
        
        // Pull relevant member data from the document
        const memberData = memberDocSnap.data();
        const tierName = memberData.tierName;
        const memberUsername = memberData.memberUsername;
        const dateSubscribed = memberData.dateSubscribed;
        const memberEmail = memberData.memberEmail;
        const tierPrice = memberData.tierPrice;

        // Create a simplified member object using pulled data
        const simplifiedMember = {
          tierName,
          memberUsername,
          dateSubscribed,
          memberEmail,
          tierPrice,
        };

        // Push the simplified member object to the memberDataArray
        memberDataArray.push(simplifiedMember);
        
      } else {
        // Log an error message if the member document does not exist
        console.log("Member document does not exist:", memberId);
      }
    }

    // Return the array of simplified member data
    return memberDataArray;
  } catch (error) {

    // Log an error message if there is an error fetching member data
    console.error("Error fetching member data:", error);
    return [];
  }
};


  // Calculate total subscribers and amount of money
  const totalSubscribers = members.length;
  const totalAmount = members.reduce(
    (acc, member) => acc + parseFloat(member.tierPrice),
    0
  );

  //Function for checking whether the member subscribed during the current month
  const isSameMonthAndYear = (date1, date2) => {
    return (
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };


  //Function to get the subscribers of the current month
  const getNewSubscribersThisMonth = () => {
    const now = new Date();
    return members.filter((member) => {
      const subscriptionDate = member.dateSubscribed.toDate(); 
      return isSameMonthAndYear(subscriptionDate, now);
    });
  };

  //Setting information for the "New subscribers this month" and "Amount made this month"
  const newSubscribersThisMonth = getNewSubscribersThisMonth();
  const newSubscribersCount = newSubscribersThisMonth.length;
  const amountMadeThisMonth = newSubscribersThisMonth.reduce(
    (acc, member) => acc + parseFloat(member.tierPrice),
    0
  );

  return (
    <div className="audience-container">
      <div className="audience-header">
        <h1>Audience</h1>
        <div className="tab-container">
          <div
            className={
              activeTab === "relationshipManager" ? "tab active" : "tab"
            }
            onClick={showRelationshipManager}
          >
            Relationship manager
          </div>
          <div
            className={activeTab === "blockedUsers" ? "tab active" : "tab"}
            onClick={showBlockedUsers}
          >
            Blocked users
          </div>
        </div>
      </div>

      {activeTab === "relationshipManager" && (
        <div>
          <div className="search-and-actions">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search by name or email"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <div className="actions">
            </div>
          </div>
          <div className="audience-content">
            {members.length === 0 ? (
              <div className="empty-state">
                <p>You don't have any members yet. </p>
                <p>
                  Once people start joining, you'll be able to see details about
                  your free and paid members here.
                </p>
              </div>
            ) : (
              <>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Current Tier</th>
                      <th>Pledge</th>
                      <th>Date Subscribed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.length > 0 ? (
                      filteredMembers.map((member, index) => (
                        <tr key={index}>
                          <td>{member.memberUsername}</td>
                          <td>{member.memberEmail}</td>
                          <td>{member.tierName}</td>
                          <td>${member.tierPrice}</td>
                          <td>
                            {new Date(
                              member.dateSubscribed.seconds * 1000
                            ).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="no-users-found">
                          No user found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="summary">
                  <div className="monthly-summary">
                    <p>New Subscribers This Month: {newSubscribersCount}</p>
                    <p>
                      Amount Made This Month: ${amountMadeThisMonth.toFixed(2)}
                    </p>
                  </div>
                  <div className="total-summary">
                    <p>Total Subscribers: {totalSubscribers}</p>
                    <p>Total Amount: ${totalAmount.toFixed(2)}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === "blockedUsers" && (
        <div className="blocked-users-content">
          <h2>Blocked Users</h2>
          {blockedUsers.length === 0 ? (
            <div className="empty-state">
              <p>You haven't blocked any users.</p>
            </div>
          ) : (
            // Placeholder for blocked users list
            <p>Blocked users list goes here.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Audience;
