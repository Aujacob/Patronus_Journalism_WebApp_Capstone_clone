import React, { useState, useEffect } from "react";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import "../stylecss/MyPage.css";
import { PencilIcon, PencilSquareIcon } from "@heroicons/react/24/solid";
import {
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
  Button,
} from "@material-tailwind/react";
import {
  collection,
  addDoc,
  getDoc,
  doc,
  query,
  where,
  getDocs,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { firestore, auth } from "../firebase";
import { useNavigate, useParams, Link } from "react-router-dom";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import HomeContent from "./HomeContent";
import greencheck from '../images/greencheck.png'

function UnderlineTabs({
  bio,
  setBio,
  isCurrentUser,
  isEditingBio,
  handleEditClick,
  handleSaveBioClick,
  username,
  verif,
}) {
  const [activeTab, setActiveTab] = useState("home");

  const data = [
    {
      label: "Home",
      value: "home",
      content: <HomeContent />,
    },
    {
      label: "Membership",
      value: "membership",
      content: (
        //check whether the user is the owner of the page
        <MembershipContent isCurrentUser={isCurrentUser} username={username} />
      ),
    },
    {
      label: "About",
      value: "about",
      content: (
        <div className="about-section bio-section">
          <h2 className="about-title">About Me</h2>
          <div className="bio-wrapper">
            {isEditingBio ? (
              <textarea
                id="bio"
                placeholder="Tell us about yourself"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="bio-textarea"
              />
            ) : (
              //Only display the save bio button if the user is the owner of the page
              <p className="bio-text">{bio}</p>
            )}
            {isEditingBio && isCurrentUser ? (
              <button className="save-bio-button" onClick={handleSaveBioClick}>
                Save
              </button>
            ) : (
              //Only display the save bio button if the user is the owner of the page
              isCurrentUser && (
                <button className="edit-bio-button" onClick={handleEditClick}>
                  <PencilIcon className="edit-icon" />
                  Edit
                </button>
              )
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <Tabs value={activeTab}>
      <TabsHeader
        className="rounded-none border-b border-blue-gray-50 bg-transparent p-0"
        indicatorProps={{
          className:
            "bg-transparent border-b-2 border-white shadow-none rounded-none",
        }}
      >
        {data.map(({ label, value }) => (
          <Tab
            key={value}
            value={value}
            onClick={() => setActiveTab(value)}
            className={activeTab === value ? "text-white" : "text-gray-500"}
          >
            {label}
          </Tab>
        ))}
      </TabsHeader>
      <TabsBody>
        {data.map(({ value, content }) => (
          <TabPanel key={value} value={value}>
            {content}
          </TabPanel>
        ))}
      </TabsBody>
    </Tabs>
  );
}

function MembershipContent({ isCurrentUser, username, setProfilePhoto }) {
  const [tiers, setTiers] = useState([]);

  //Function to fetch the tier data associated with the Journalist whose page the user is on
  useEffect(() => {
    const fetchTierData = async () => {
      try {
        if (!username) {
          console.log("Username is undefined");
          return;
        }
        const userQuery = query(
          collection(firestore, "Users"),
          where("username", "==", username)
        );
        const userQuerySnapshot = await getDocs(userQuery);

        if (!userQuerySnapshot.empty) {
          const userDoc = userQuerySnapshot.docs[0];
          const userData = userDoc.data();

          const tiersQuery = query(
            collection(firestore, "SubscriptionTiers"),
            where("userId", "==", userData.userId)
          );
          const tiersQuerySnapshot = await getDocs(tiersQuery);

          const tiersData = [];
          tiersQuerySnapshot.forEach((doc) => {
            tiersData.push({ id: doc.id, ...doc.data() });
          });


          setTiers(tiersData);
        } else {
          console.log("User not found");
        }
      } catch (error) {
        console.error("Error fetching tiers:", error);
      }
    };

    fetchTierData();
  }, [username]);

  if (!username) {
    return null;
  }

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      console.log("No file selected.");
      return;
    }
  
    const storage = getStorage();
    const storageRef = ref(storage, `profilePhotos/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
  
    uploadTask.on('state_changed', 
      (snapshot) => {
      }, 
      (error) => {
        console.error("Upload error:", error);
      }, 
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          console.log("File available at", downloadURL);
          setProfilePhoto(downloadURL);
        });
      }
    );
  };
  

  const renderTierInputs = () => {
    return tiers.map((tier, index) => (
      <div key={index} className="membership-box dark-mode">
        <div className="membership-field">
          <label htmlFor={`tier-name-${index}`}>Tier name</label>
          <input
            id={`tier-name-${index}`}
            type="text"
            value={tier.tierName}
            onChange={(e) =>
              handleTierChange(index, "tierName", e.target.value)
            }
            disabled={!tier.isEditing}
          />
        </div>
        <div className="membership-field">
          <label htmlFor={`monthly-price-${index}`}>Monthly price</label>
          <div className="input-with-symbol">
            <AttachMoneyIcon className="currency-symbol" />
            <input
              id={`monthly-price-${index}`}
              type="text"
              value={tier.monthlyPrice}
              onChange={(e) =>
                handleTierChange(index, "monthlyPrice", e.target.value)
              }
              disabled={!tier.isEditing}
            />
          </div>
        </div>
        <div className="membership-field">
          <label htmlFor={`tier-description-${index}`}>Tier description</label>
          <textarea
            id={`tier-description-${index}`}
            value={tier.tierDescription}
            onChange={(e) =>
              handleTierChange(index, "tierDescription", e.target.value)
            }
            disabled={!tier.isEditing}
          />
        </div>
        <div className="membership-action-buttons">
          {isCurrentUser && (
            <button
              className="action-button edit-button"
              onClick={() => handleTierSave(index)}
            >
              {tier.isEditing ? "Save" : "Edit"}
            </button>
          )}
        </div>
      </div>
    ));
  };

  //Function to handle a new tier being added
  const handleTierChange = (index, field, value) => {
    const newTiers = [...tiers];
    newTiers[index][field] = value;
    setTiers(newTiers);
  };

  //Function to save the tier to the database when the save button is pressed on a tier
  const handleTierSave = async (index) => {
    const updatedTiers = [...tiers];
    updatedTiers[index].isEditing = !updatedTiers[index].isEditing;
    setTiers(updatedTiers);

    await saveTierToFirestore(updatedTiers[index]);
  };

  //Function to generate a new document in the "SubscriptionTiers" collection when the tier is saved, or to update an existing tier document if the tier is edited and saved
  const saveTierToFirestore = async (tier) => {
    try {
      const tiersRef = collection(firestore, "SubscriptionTiers");
      const tierQuery = query(
        tiersRef,
        where("userId", "==", auth.currentUser.uid),
        where("monthlyPrice", "==", tier.monthlyPrice)
      );
      const tierQuerySnapshot = await getDocs(tierQuery);

      if (!tierQuerySnapshot.empty) {
        const tierDoc = tierQuerySnapshot.docs[0];
        await updateDoc(tierDoc.ref, tier);
      } else {
        const tiersDocRef = await addDoc(collection(firestore, 'SubscriptionTiers'), {
          userId: auth.currentUser.uid,
          tierTag: tier.tierTag, 
          ...tier
        });
  
        await saveTiersReferenceToUser(tiersDocRef.id);
      }
    } catch (error) {
      console.error("Error saving tier to Firestore:", error);
    }
  };

  //Function to save a reference to the newly generated tier document ID to the Journalists user document under the array "tierDocIds" 
  const saveTiersReferenceToUser = async (tiersDocId) => {
    try {
      const userQuery = query(
        collection(firestore, "Users"),
        where("userId", "==", auth.currentUser.uid)
      );
      const userQuerySnapshot = await getDocs(userQuery);

      if (!userQuerySnapshot.empty) {
        const userDoc = userQuerySnapshot.docs[0];
        const userData = userDoc.data();

        const updatedTiersDocIds = userData.tiersDocIds
          ? [...userData.tiersDocIds, tiersDocId]
          : [tiersDocId];
        await updateDoc(userDoc.ref, { tiersDocIds: updatedTiersDocIds });
        console.log(
          "Tiers references saved to user document:",
          updatedTiersDocIds
        );
      } else {
        console.log("User document not found");
      }
    } catch (error) {
      console.error("Error saving tiers references to user document:", error);
    }
  };

  //Function for adding a new Tier
  //When a tier is added, the first one is assigned an tierTag of TierOne, the second is assigned tierTwo and so on 
  const addNewTier = () => {
    if (tiers.length < 3) {
      let tierTag = '';
      switch (tiers.length) {
        case 0:
          tierTag = 'TierOne';
          break;
        case 1:
          tierTag = 'TierTwo';
          break;
        case 2:
          tierTag = 'TierThree';
          break;
        default:
          tierTag = '';
      }
      setTiers([...tiers, { tierTag, tierName: '', monthlyPrice: '', tierDescription: '', isEditing: true }]);
    }
  };

  return (
    <div className="membership-tier-display">
      <div className="tier-header">Paid membership tiers</div>
      {renderTierInputs()}
      {isCurrentUser && tiers.length < 3 && (
        <button
        className="action-button edit-button"
          onClick={addNewTier}
        >
          + Add a tier
          </button>
      )}
    </div>
  );
}

function MyPage() {
  const [verif, setVerif] = useState(false);

  const [bio, setBio] = useState("");
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const { username } = useParams();

  useEffect(() => {
    // Fetch user data and profile photo URL
    const fetchUserData = async () => {
      

      try {
        const userQuery = query(collection(firestore, 'Users'), where('username', '==', username));
        const userQuerySnapshot = await getDocs(userQuery);

        if (!userQuerySnapshot.empty) {
          const userDoc = userQuerySnapshot.docs[0];
          const userData = userDoc.data();

          setIsCurrentUser(auth.currentUser && auth.currentUser.uid === userData.userId);
          setVerif(userData.verified);

          

          if (userData.photo) {
            // Use the profilePhotoPath to fetch the actual photo URL from Firebase Storage
            const photoRef = ref(getStorage(), userData.photo);
            getDownloadURL(photoRef)
              .then((url) => {
                setProfilePhoto(url); // Update the profilePhoto state with the fetched URL
              })
              .catch((error) => {
                console.error('Error fetching profile photo:', error);
              });
          }

          if (userData.aboutId) {
            const aboutDocRef = doc(firestore, 'About', userData.aboutId);
            getDoc(aboutDocRef)
              .then((aboutDocSnapshot) => {
                if (aboutDocSnapshot.exists()) {
                  const aboutData = aboutDocSnapshot.data();
                  setBio(aboutData.bio);
                } else {
                  console.log('About documlent not found');
                }
              })
              .catch((error) => {
                console.error('Error fetching about document:', error);
              });
          }
        } else {
          console.log('User not found');
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [username]);

  const handleEditClick = () => {
    setIsEditingBio(true);
  };

  //Function to save the bio
  //Generates a new document in the "About" collection and saves a reference to the newly generated documentID in the Journalists User document
  //If the user is saving an existing Bio, then the document is updated rather than generating a new one
  const handleSaveBioClick = async () => {
    setIsEditingBio(false);
    try {
      const userQuery = query(
        collection(firestore, "Users"),
        where("userId", "==", auth.currentUser.uid)
      );
      const userQuerySnapshot = await getDocs(userQuery);

      if (!userQuerySnapshot.empty) {
        const userDoc = userQuerySnapshot.docs[0];

        const aboutQuery = query(
          collection(firestore, "About"),
          where("userId", "==", auth.currentUser.uid)
        );
        const aboutQuerySnapshot = await getDocs(aboutQuery);

        if (!aboutQuerySnapshot.empty) {
          const aboutDoc = aboutQuerySnapshot.docs[0];
          await updateDoc(aboutDoc.ref, { bio: bio });
        } else {
          const aboutDocRef = await addDoc(collection(firestore, "About"), {
            userId: auth.currentUser.uid,
            bio: bio,
          });
          await updateDoc(userDoc.ref, { aboutId: aboutDocRef.id });
        }

        toast.success("Bio saved successfully!");
      } else {
        console.log("User document not found");
      }
    } catch (error) {
      console.error("Error saving bio:", error);
    }
  };

  return (
    <div className="mypage-container-">
      <div className="page-header">
        <div className="profile-section">
          <div className="profile-icon-wrapper">
          <div className="profile-icon">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" style={{ width: "100px", height: "85px", borderRadius: "50%" }} />
              ) : (
                <div style={{ width: "100px", height: "100px", backgroundColor: "#ccc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  No Photo
                </div>
              )}
            </div>
          </div>
          <div>
            <span style={{ display: "flex", alignItems: "center" }}>
              <h2 className="profile-name">{username}</h2>
              {verif && <img src={greencheck} alt="Green Check" style={{ width: "20px", height: "20px" }} />}
            </span>

            <p className="profile-headline">Journalist headline</p>
            
          </div>


  
        </div>
        {isCurrentUser && (
        <Link to="/createarticle">
        <button className="create-button">
        <PencilSquareIcon className="icon" />
        <span style={{ fontWeight: "bold", fontSize: "1.1em" }}>
          Create
         </span>
        </button>
      </Link>
        )}
    </div>
      <div className="main">
        <UnderlineTabs
          bio={bio}
          setBio={setBio}
          isCurrentUser={isCurrentUser}
          isEditingBio={isEditingBio}
          handleEditClick={handleEditClick}
          handleSaveBioClick={handleSaveBioClick}
          username={username}
          verif={verif}
        />
      </div>
    </div>
  );
}

export default MyPage;
