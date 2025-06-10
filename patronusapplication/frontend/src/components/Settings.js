import React, { useState, useEffect } from "react";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import {
  getFirestore,
  doc,
  updateDoc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  arrayRemove, 
  onSnapshot
} from "firebase/firestore";
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  getAuth,
  updatePassword,
} from "firebase/auth";
import { Switch } from "@material-tailwind/react";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Tabs,
  ToggleButton,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
  Button,
} from "@material-tailwind/react";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import FormControl from "@mui/material/FormControl";
import Input from "@mui/material/Input";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import { toast } from "react-toastify";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import "../stylecss/Settings.css";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Subscriptions from './Subscriptions.js';


function Settings() {
  const [tempUser, setTempUser] = useState(null);
  const [isChecked, setIsChecked] = useState(false);
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("basics");
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [fullName, setFullName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [IDPhoto, setIDphoto] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [members, setMembers] = useState([]);
  const [userId, setUserId] = useState(null);
  const auth = getAuth();
  const firestore = getFirestore();
  const [refreshKey, setRefreshKey] = useState(0);
  const [subscriptions, setSubscriptions] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  const handleDialogOpen = (subscription) => {
    setSelectedSubscription(subscription);
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const confirmCancelSubscription = async () => {
    if (selectedSubscription) {
      try {
        const subscriptionId = selectedSubscription.id;
  
        // Fetch the document from the "Subscriptions" collection
        const subscriptionDocRef = doc(firestore, "Subscriptions", subscriptionId);
        const subscriptionDocSnap = await getDoc(subscriptionDocRef);
        if (!subscriptionDocSnap.exists()) {
          console.log(`Subscription document with ID ${subscriptionId} not found.`);
          return;
        }
  
        // Get the journalist ID and the member ID
        const journalistId = subscriptionDocSnap.data().journalistId;
        const memberId = subscriptionDocSnap.data().userId;
  
        // Find the corresponding SubscribedMembers document
        const subscribedMembersQuery = query(
          collection(firestore, "SubscribedMembers"),
          where("journalistUserId", "==", journalistId),
          where("memberUserId", "==", memberId)
        );
        const subscribedMembersQuerySnapshot = await getDocs(subscribedMembersQuery);
        if (subscribedMembersQuerySnapshot.empty) {
          console.log("SubscribedMembers document not found.");
          return;
        }
        const subscribedMemberDocRef = subscribedMembersQuerySnapshot.docs[0].ref;
        const subscribedMemberDocId = subscribedMembersQuerySnapshot.docs[0].id;
  
        // Delete the subscription document from the "Subscriptions" collection
        await deleteDoc(subscriptionDocRef);
        console.log("Subscription document deleted successfully.");
  
        // Remove reference from "subscriptionIds" array inside Member's User document
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(firestore, "Users", user.uid);
          await updateDoc(userDocRef, {
            subscriptionIds: arrayRemove(subscriptionId)
          });
          console.log("Subscription reference removed from user document successfully.");
        }
  
        // Delete the subscribed member document from the "SubscribedMembers" collection
        await deleteDoc(subscribedMemberDocRef);
        console.log("Subscribed member document deleted successfully.");
  
        // Remove reference from "subscribedMemberIds" array inside Journalist's User document
        const journalistDocRef = doc(firestore, "Users", journalistId);
        await updateDoc(journalistDocRef, {
          subscribedMemberIds: arrayRemove(subscribedMemberDocId)
        });
        console.log("Subscription reference removed from journalist document successfully.");
  
        setOpenDialog(false);
      } catch (error) {
        console.error("Error cancelling subscription:", error);
      }
    }
  };
  
  const handleClickShowCurrentPassword = () =>
    setShowCurrentPassword(!showCurrentPassword);

  useEffect(() => {
    const fetchUserProfileAndRole = async () => {
      const auth = getAuth();
      const firestore = getFirestore();
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(firestore, "Users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setProfilePhoto(userData.photo || ""); 
          setUserRole(userData.role || ""); 
        } else {
          console.log("User document does not exist.");
        }
      }
    };

    fetchUserProfileAndRole();

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

    const fetchUserData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const docId = await fetchUserDocumentId(currentUser.uid);
          if (docId) {
            setUserId(docId);
            const userData = await fetchMemberData(docId);
            setMembers(userData);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const fetchSubscriptionsData = async () => {
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(firestore, "Users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const subscriptionsIds = userData.subscriptionIds || [];
  
        // Fetch subscription data for each subscription ID
        const subs = await Promise.all(
          subscriptionsIds.map(async (subscriptionId) => {
            const subsDocRef = doc(firestore, "Subscriptions", subscriptionId);
            const subsDocSnap = await getDoc(subsDocRef);
            if (subsDocSnap.exists()) {
              const subscriptionData = subsDocSnap.data();
              const journalistId = subscriptionData.journalistId;
              
              // Fetch journalist data
              const journalistDocRef = doc(firestore, "Users", journalistId);
              const journalistDocSnap = await getDoc(journalistDocRef);
              if (journalistDocSnap.exists()) {
                const journalistData = journalistDocSnap.data();
                const subscription = {
                  id: subscriptionId,
                  journalistUsername: subscriptionData.journalistUsername || "",
                  profilePic: journalistData.photo || "https://via.placeholder.com/150",
                };
                return subscription;
              } else {
                console.log(`Journalist document with ID ${journalistId} not found.`);
                return null;
              }
            } else {
              console.log(`Subscription document with ID ${subscriptionId} not found.`);
              return null;
            }
          })
        );
  
        const validSubs = subs.filter(sub => sub !== null); // Filter out null entries
        setSubscriptions(validSubs); // Set subscriptions with fetched data
      } else {
        console.log("User document does not exist.");
      }
    }
  };
  
  

  useEffect(() => {
    fetchSubscriptionsData();
  
    // Set up real-time listener for changes in subscriptionIds array
    const unsubscribe = onSnapshot(doc(firestore, "Users", auth.currentUser.uid), (doc) => {
      const userData = doc.data();
      const subscriptionsIds = userData.subscriptionIds || [];
      fetchSubscriptionsData(subscriptionsIds);
    });
  
    return () => unsubscribe();
  }, []);

  const fetchMemberData = async (docId) => {
    try {
      const userDocRef = doc(firestore, "Users", docId);
      const userDocSnap = await getDoc(userDocRef);
      const billingIds = userDocSnap.data().billingIds;
      const memberDataArray = [];
      for (const memberId of billingIds) {
        const memberDocRef = doc(firestore, "Billing", memberId);
        const memberDocSnap = await getDoc(memberDocRef);
        if (memberDocSnap.exists()) {
          const memberData = memberDocSnap.data();
          const tierName = memberData.tierName;
          const journalistUsername = memberData.journalistUsername;
          const dateSubscribed = memberData.dateBilled;
          const tierPrice = memberData.tierPrice;

          const simplifiedMember = {
            tierName,
            journalistUsername,
            dateSubscribed,
            tierPrice,
          };
          memberDataArray.push(simplifiedMember);
          console.log("Fetched member data:", simplifiedMember);
        } else {
          console.log("Member document does not exist:", memberId);
        }
      }
      return memberDataArray;
    } catch (error) {
      console.error("Error fetching member data:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchVerificationRequests = async () => {
      const db = getFirestore();
      const usersRef = collection(db, "Users");
      const data = await getDocs(usersRef);
      const requests = [];

      data.forEach((doc) => {
        const userData = doc.data();
        const tempUser = userData.userId;

        if (userData.IDurl) {
          requests.push(userData.IDurl);
          setTempUser(userData.userId);
        }
      });

      setVerificationRequests(requests);
    };

    fetchVerificationRequests();
  }, []);
//fetches verification requests from firebase
  const fetchVerificationRequests = async () => {
    const db = getFirestore();
    const usersRef = collection(db, "Users");
    const data = await getDocs(usersRef);
    const requests = [];
//for each request
    data.forEach((doc) => {
      const userData = doc.data();
      const tempUser = userData.userId;
//if there is a image url
      if (userData.IDurl) {
        requests.push({
          IDurl: userData.IDurl,
          userId: userData.userId, // Add any additional data needed
        });
      }
    });
//run the set verification function
    setVerificationRequests(requests);
  };
//fucntion runs when accepting request with accwept buttn
  const handleVerify = async () => {
    const db = getFirestore();
    const temp = tempUser; // Assuming tempUser holds the ID of the user whose verification is being handled
//always updates the document in firebase
    try {
      await updateDoc(doc(db, "Users", temp), {
        verified: true, // Always set verified to true
      });
      toast.success("Verification status updated successfully!");
    } catch (error) {
      toast.error("Error updating verification status:", error);
    }
  };
//refreshes page in case of crashing, currently not using
  const handleRefresh = () => {
    fetchVerificationRequests();
    setRefreshKey((prevKey) => prevKey + 1); // Update key to force re-render
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (!Object.values(passwordValidity).every(Boolean)) {
      return;
    }

    const auth = getAuth();
    const user = auth.currentUser;

    if (user && user.uid) {
      try {
        const credential = EmailAuthProvider.credential(
          user.email,
          currentPassword
        );
        await reauthenticateWithCredential(user, credential);

        await updatePassword(user, password);

        await setDoc(doc(firestore, "Users", user.uid), {
          username: userName,
          userId: user.uid,
          email: user.email,
        });

        toast.success("Account Updated Successfully");
      } catch (error) {
        console.error("Error updating user info", error);
        toast.error(`Error updating user info: ${error.message}`);
      }
    } else {
      toast.error("No authenticated user found.");
    }
    toast.success("Account Updated Successfully");
  };
//render the green checkmark for verified users
  const renderCheckmark = (isValid) =>
    isValid ? (
      <CheckIcon style={{ color: "green" }} />
    ) : (
      <CloseIcon style={{ color: "red" }} />
    );

  const passwordValidity = {
    minChar: password.length >= 8,
    number: /\d/.test(password),
    upperCase: /[A-Z]/.test(password),
    specialChar: /[!@#$%^&*]/.test(password),
    match: password === confirmPassword && password !== "",
  };

  const checkPasswordStrength = () => {
    let strength = 0;
    Object.values(passwordValidity).forEach((valid) => {
      if (valid) strength += 1;
    });
    setPasswordStrength(strength);
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSave = async () => {
    const auth = getAuth();
    const db = getFirestore();
    const userRef = doc(db, "Users", auth.currentUser.uid);

    try {
      const updatePayload = {
        ...(userName.trim() && { username: userName.trim() }),
        photo: profilePhoto,
      };

      await updateDoc(userRef, updatePayload);

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile. Please try again.");
    }
  };

  const handleSubmit = async () => {
    const auth = getAuth();
    const db = getFirestore();
    const userRef = doc(db, "Users", auth.currentUser.uid);

    try {
      const updatePayload = {
        // Only include the username in the update payload if it's not empty.
        ...(fullName.trim() && { fullname: fullName.trim() }),
        IDurl: IDPhoto,
      };

      await updateDoc(userRef, updatePayload);

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile. Please try again.");
    }
  };

  const handleUpdateEmailSettings = () => {
    toast.success("Notification settings updated successfully");
    console.log("Update notification settings clicked");
  };

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      console.log("No file selected.");
      return;
    }

    const storage = getStorage();
    const storageRef = ref(storage, "profilePhotos/" + file.name);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log("Upload is " + progress + "% done");
      },
      (error) => {
        console.error("Upload error:", error);
      },
      async () => {
        getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
          console.log("File available at", downloadURL);
          setProfilePhoto(downloadURL);

          const auth = getAuth();
          const db = getFirestore();
          const userRef = doc(db, "Users", auth.currentUser.uid);
          await updateDoc(userRef, {
            username: userName,
            photo: downloadURL,
          });
        });
      }
    );
  };
//function for uploading id images
  const handleIDUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      console.log("No file selected.");
      return;
    }

    const storage = getStorage();
    const storageRef = ref(storage, "verifPhoto/" + file.name);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log("Upload is " + progress + "% done");
      },
      (error) => {
        console.error("Upload error:", error);
      },
      async () => {
        getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
          console.log("File available at", downloadURL);
          setIDphoto(downloadURL);

          const auth = getAuth();
          const db = getFirestore();
          const userRef = doc(db, "Users", auth.currentUser.uid);
          //updates doc with new info
          await updateDoc(userRef, {
            // legal name upload
            fullname: fullName,
            // instead of photo it is IDurl, a string that contains the url for the id which is submitted to the database
            IDurl: downloadURL,
          });
        });
      }
    );
  };

  const data = [
    {
      label: "Basics",
      value: "basics",
      roles: ["Journalist"],
      style: { color: "white" },
      content: (
        <div className="membership-box">
          <h2 className="big-heading">Profile Information</h2>
          <div className="profile-info">
            <div className="profile-photo center-photo">
              <div className="profile-photo-container">
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt="Profile"
                    style= {{
                      width: "100px",
                      height: "100px",
                      backgroundColor: "#ccc",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "absolute",
                      left: "250px", 
                  }}
                  />
                ) : (
                  <div
                    style={{
                      padding: "10px 0 0",
                      width: "100px",
                      height: "100px",
                      backgroundColor: "#ccc",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "absolute",
                      left: "250px",
                    }}
                  >
                    No Photo
                  </div>
                )}
                <span className="camera-icon material-icons" style={{left: "75px"}}>photo_camera</span>
                <input
                  type="file"
                  className="full-width-file-input"
                  onChange={handleUpload}
                />
              </div>
            </div>
            <div className="form-group">
              
              <label htmlFor="username" style={{marginTop: "50px" }}>Username:</label>
              <input
                type="text"
                id="username"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>
            <Button
              color="blue"
              variant="filled"
              className="rounded-full button-normal-case"
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
        </div>
      ),
    },
    {
      label: "Account",
      value: "account",
      roles: ["Member"],
      style: { color: "white" },
      content: (
        <form onSubmit={handleUpdate}>
          <div className="membership-box">
            <h2 className="big-heading">Change Password</h2>
            <FormControl fullWidth margin="normal" variant="standard">
              <label htmlFor="current-password">Current Password</label>
              <Input
                id="current-password"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleClickShowCurrentPassword}
                      edge="end"
                    >
                      {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
                required
              />
            </FormControl>
            <FormControl fullWidth margin="normal" variant="standard">
              <label htmlFor="password">New Password</label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  checkPasswordStrength();
                }}
                style={{ marginBottom: "10px" }}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton onClick={handleClickShowPassword} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
                required
              />
            </FormControl>
            <div className="password-strength">
              Password Strength:{" "}
              {passwordStrength > 0 ? (
                <>
                  {passwordStrength <= 2 ? (
                    <span style={{ color: "red" }}>Weak</span>
                  ) : passwordStrength <= 3 ? (
                    <span style={{ color: "orange" }}>Moderate</span>
                  ) : (
                    <span style={{ color: "green" }}>Strong</span>
                  )}
                </>
              ) : (
                "None"
              )}
            </div>
            <FormControl fullWidth margin="normal" variant="standard">
              <label htmlFor="password">Confirm Password</label>
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleClickShowConfirmPassword}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
                required
              />
            </FormControl>
            <div className="password-requirements">
              {renderCheckmark(passwordValidity.minChar)} 8 characters minimum
              <br />
              {renderCheckmark(passwordValidity.number)} One number
              <br />
              {renderCheckmark(passwordValidity.upperCase)} One uppercase letter
              <br />
              {renderCheckmark(passwordValidity.specialChar)} One special
              character
              <br />
              {renderCheckmark(passwordValidity.match)} Passwords match
            </div>
            <Button
              color="blue"
              type="submit"
              variant="filled"
              className="rounded-full button-normal-case"
              style={{ marginTop: "20px" }}
            >
              Set password
            </Button>
          </div>
        </form>
      ),
    },
    {
      label: "Billing History",
      value: "members",
      roles: ["Member"],
      style: { color: "white" },
      content: (
        <div className="membership-box">
          <h2 className="big-heading">Billing History</h2>
          {members && members.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Journalist Name</th>
                  <th>Tier</th>
                  <th>Amount Paid</th>
                  <th>Date Billed</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member, index) => (
                  <tr key={index}>
                    <td>{member.journalistUsername}</td>
                    <td>{member.tierName}</td>
                    <td>${member.tierPrice}</td>
                    <td>
                      {member.dateSubscribed.toDate().toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>There is currently no payment history to display.</p>
          )}
        </div>
      ),
    },
    {
      label: "Subscriptions",
      value: "subscriptions",
      roles: ["Member"], 
      content: <Subscriptions testSubscriptions={subscriptions} handleDialogOpen={handleDialogOpen} />,
    },
    {
      //only appears ion journalist accoutns 
      label: "Verify Account",
      value: "verify",
      roles: ["Journalist"],
      style: { color: "white" },
      content: (
        <div className="membership-box">
          <h2 className="big-heading">Verify Your Profile</h2>
          <br />
          <br />
          <div className="profile-info">
            <div className="profile-photo center-photo">
              <div className="profile-photo-container">
                {profilePhoto ? (
                  <img
                  src={profilePhoto}
                  alt="Profile"
                  style= {{
                    width: "100px",
                    height: "100px",
                    backgroundColor: "#ccc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "absolute",
                    left: "250px", 
                }}
                />
                ) : (
                  <span
                    style={{
                      padding: "10px 0 0",
                      width: "100px",
                      height: "100px",
                      backgroundColor: "#ccc",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "absolute",
                      left: "250px",
                    }}
                  >
                    No Photo
                  </span>
                )}
                <span className="camera-icon material-icons" style={{left: "75px"}}>photo_camera</span>

                <input
                  type="file"
                  className="full-width-file-input"
                  onChange={handleIDUpload}
                />
              </div>
            </div>

            <br />
            <br />

            <label htmlFor="username">Legal Name</label>
            <input
              type="text"
              id="username"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <br></br>
            <br></br>
            <Button
              color="blue"
              variant="filled"
              className="rounded-full button-normal-case"
              onClick={handleSubmit}
            >
              Submit
            </Button>
          </div>
        </div>
      ),
    },

    {
      //only appears on journalist accounts
      label: "Moderators",
      value: "moderator",
      roles: ["Journalist"],
      style: { color: "white" },
      content: (
        <div className="membership-box">
          <h2 className="big-heading">Verification Requests</h2>
          {/* When the handleRefresh function is made I will use the that function instead */}

          {verificationRequests.length > 0 ? (
            verificationRequests.map((url, index) => (
              <div key={index}>
                <img
                  src={url}
                  alt={`Verification Request ${index}`}
                  style={{ width: "500px", height: "300px" }}
                />
                <input type="file" className="full-width-file-input" />
                <h1>
                  <br></br>
                </h1>
              </div>
            ))
          ) : (
            <p>No verification requests found.</p>
          )}
          <div class="flex w-max gap-4">
            <br />
            <label
              for="accept-switch"
              class="flex items-center cursor-pointer"
            ></label>
            <br />
          </div>

          <br></br>
          <span className="flex gap-4">
            <Button
              color="blue"
              variant="filled"
              className="rounded-full button-normal-case"
              onClick={handleVerify}
            >
              Verify
            </Button>

            <Button
              color="blue"
              variant="filled"
              className="rounded-full button-normal-case"
              onClick={handleRefresh}
            >
              Decline
            </Button>
          </span>
        </div>
      ),
    },
  ];
//filter data from database
  const filteredData = data.filter((tab) => {
    if (!tab.roles) {
      console.log("Object with missing roles:", tab);
    }
    return tab.roles && tab.roles.includes(userRole);
  });

  return (
    <div className="settings-container">
      <Tabs value={activeTab} onChange={(value) => setActiveTab(value)}>
        <TabsHeader>
          {filteredData.map(({ label, value }) => (
            <Tab key={value} value={value}>
              {label}
            </Tab>
          ))}
        </TabsHeader>
        <TabsBody>
          {filteredData.map(({ value, content }) => (
            <TabPanel key={value} value={value}>
              {content}
            </TabPanel>
          ))}
        </TabsBody>
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Cancel Subscription"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to cancel your subscription to{" "} 
            {selectedSubscription?.journalistUsername}? No refunds will be provided.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleDialogClose}
            color="primary"
            style={{ textTransform: "none" }}
          >
            No
          </Button>
          <Button
            onClick={confirmCancelSubscription}
            color="primary"
            autoFocus
            style={{ textTransform: "none" }}
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default Settings;
