import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { firestore, auth } from "../firebase";
import "../stylecss/HomeContent.css";
import BookIcon from "@mui/icons-material/Book";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

function HomeContent() {
  const [posts, setPosts] = useState([]);
  const [articleIds, setArticleIds] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [isPageOwner, setIsPageOwner] = useState(false);
  const { username } = useParams();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPosts, setFilteredPosts] = useState([]);

  const filterPosts = (posts, query) => {
    if (!query) {
      return posts;
    }
    return posts.filter((post) =>
      post.title.toLowerCase().includes(query.toLowerCase())
    );
  };

  useEffect(() => {
    const result = filterPosts(posts, searchQuery);
    setFilteredPosts(result);
  }, [posts, searchQuery]);


  //Function to fetch the documentID of the currently logged in user
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


  //Function to fetch the user role of the currently logged in user, using the document ID from the previous function
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userId = currentUser.uid;
          const docId = await fetchUserDocumentId(userId);
          if (docId) {
            const userDoc = await getDoc(doc(firestore, "Users", docId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUserRole(userData.role);

              if (userData.username === username) {
                setIsPageOwner(true);
              }
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
  }, [username]);

  const [anchorEl, setAnchorEl] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  const handleMenuClick = (event, postId) => {
    setAnchorEl(event.currentTarget);
    setSelectedPostId(postId);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleOpenModal = () => {
    setOpenModal(true);
    handleCloseMenu();
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  //Function to delete the article from the "Articles" collection, as well as to delete the reference to the article from the Journalists document
  const handleConfirmDelete = async () => {
    try {
      const articleDocRef = doc(firestore, "Articles", selectedPostId);
      await deleteDoc(articleDocRef);

      const updatedPosts = posts.filter((post) => post.id !== selectedPostId);
      setPosts(updatedPosts);

      const usersCollectionRef = collection(firestore, "Users");
      const q = query(
        usersCollectionRef,
        where("articleIds", "array-contains", selectedPostId)
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (_) => {
        const userDocRef = doc(firestore, "Users", _.id);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const updatedArticleIds = userData.articleIds.filter(
            (id) => id !== selectedPostId
          );
          await updateDoc(userDocRef, { articleIds: updatedArticleIds });
        }
      });

    } catch (error) {
      console.error("Error deleting article:", error);
    } finally {
      handleCloseModal();
    }
  };

  const handleEditPost = () => {
    navigate(`/viewarticle/${selectedPostId}`, { state: { isEditing: true } });
    handleCloseMenu();
  };


  //Function to fetch the article data using the "articleIds" reference in the Journalists User document
  useEffect(() => {
    const fetchArticlesData = async () => {
      try {
        const userQuery = query(
          collection(firestore, "Users"),
          where("username", "==", username)
        );
        const userQuerySnapshot = await getDocs(userQuery);

        if (!userQuerySnapshot.empty) {
          const userDoc = userQuerySnapshot.docs[0];
          const userData = userDoc.data();
          const fetchedArticleIds = userData.articleIds || [];
          const generatedPosts = await generatePosts(fetchedArticleIds);
          setPosts(generatedPosts);
          setArticleIds(fetchedArticleIds);
          setArticleIds(fetchedArticleIds);
        } else {
          console.log("User not found");
        }
      } catch (error) {
        console.error("Error fetching articles:", error);
      }
    };

    fetchArticlesData();
  }, [username]);


  //Function to fetch the Tier data from the Journalist User document
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


  //Function to generate the article "posts" on the Journalist Homepage using the article data fetched from the previous function
  const generatePosts = async (articleIds) => {
    const posts = [];

    for (const articleId of articleIds) {
      const articleDocRef = doc(firestore, "Articles", articleId);
      const articleDocSnapshot = await getDoc(articleDocRef);

      if (articleDocSnapshot.exists()) {
        const articleData = articleDocSnapshot.data();
        const post = {
          id: articleId,
          title: articleData.title || "Untitled",
          date: articleData.createdAtDate || "Unknown Date",
          content: articleData.content || "No content available",
          tier: articleData.visibility || "Free",
          tierTag: articleData.tierTag || "Unknown",
          journalistId: articleData.userId || "Unknown",
          paid: articleData.paid || false,
        };

        posts.push(post);
      } else {
        console.log(`Article document with ID ${articleId} not found`);
      }
    }

    return posts;
  };

  if (!Array.isArray(posts)) {
    return <div>Loading...</div>;
  }

//Function to check whether a Member is subscribed to the correct tier before allowing them to view the article
//If they are not subscribed to the journalist, or not subscribed to the correct tier then they will be redirected to the checkout page where they can purchase a subscribtion 
  const checkUserSubscription = async (userRole, post) => {
    try {
      if (!userRole) {
        console.error("User role not set");
        return false;
      }

      if (!post || !post.journalistId) {
        console.error("Post or post journalist ID is undefined");
        return false;
      }

      if (userRole === "Member") {
        const docId = await fetchUserDocumentId(auth.currentUser.uid);
        if (!docId) {
          console.error("User document ID not found");
          return false;
        }

        const userDocRef = doc(firestore, "Users", docId);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          console.error("User document not found");
          return false;
        }

        const userData = userDocSnap.data();

        const userSubscriptions = userData.subscriptionIds || [];
        if (userSubscriptions.length === 0) {
          console.error("User has no subscriptions");
          return false;
        }

        const subscribedJournalistIds = [];
        for (const subscription of userSubscriptions) {
          const subscriptionDocSnapshot = await getDoc(
            doc(firestore, "Subscriptions", subscription)
          );
          if (subscriptionDocSnapshot.exists()) {
            const subscriptionData = subscriptionDocSnapshot.data();
            subscribedJournalistIds.push(subscriptionData.journalistId);
          } else {
            console.error("Subscription document not found:", subscription);
          }
        }

        const postJournalistId = post.journalistId;
        console.log("Post journalist ID:", postJournalistId);

        if (!subscribedJournalistIds.includes(postJournalistId)) {
          console.error("User is not subscribed to the journalist");
          return false;
        }

        console.log("User is subscribed to the journalist");
        return true;
      } else {
        console.error("User is not a member");
        return false;
      }
    } catch (error) {
      console.error("Error checking user subscription:", error);
      alert(
        "An error occurred while checking user subscription: " + error.message
      );
      return false;
    }
  };


  //Function to check if the Member is subscribed to the correct Tier before allowing them to view the article
  const checkUserTier = (userTierTags, post) => {
    try {

      if (!Array.isArray(userTierTags) || userTierTags.length === 0) {
        console.error("userTierTags is invalid or empty");
        return false;
      }

      userTierTags.sort();
      const userHighestTier = userTierTags[userTierTags.length - 1];

      switch (userHighestTier) {
        case "TierOne":
          return post.tierTag === "TierOne";
        case "TierTwo":
          return post.tierTag === "TierOne" || post.tierTag === "TierTwo";
        case "TierThree":
          return true;
        default:
          console.error("Invalid user tier");
          return false;
      }
    } catch (error) {
      console.error("Error checking user tier:", error);
      alert("An error occurred while checking user tier: " + error.message);
      return false;
    }
  };


 //This function is called when the "View Article" button is pressed on a post
 //If the user is the page owner, then they are redirected to the view article page without checking anything else 
 //If the user is a member then their subscription is checked, if the member isnt subscribed to the journalist or isn't subscribed to the correct tier then they are redirected to a page where they can purchase a correct subscription
 //If the user is subscribed to the correct tier then they are redircted to the view article page
  const handleViewArticle = async (post) => {
    try {

      if (isPageOwner === true) {
        navigate(`/viewarticle/${post.id}`);
        return;
      }

      if (!userRole) {
        console.error("User role not set");
        return;
      }

      if (userRole === "Member") {
        if (post.tierTag === "TierZero") {
          navigate(`/viewarticle/${post.id}`);
          return;
        }

        const isSubscribed = await checkUserSubscription(userRole, post);
        if (!isSubscribed) {
          navigate(`/checkout/${post.tier}`);
          return;
        }

        const docId = await fetchUserDocumentId(auth.currentUser.uid);
        if (!docId) {
          console.error("User document ID not found");
          return;
        }

        const userDocRef = doc(firestore, "Users", docId);
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
          console.error("User document not found");
          return;
        }

        const userData = userDocSnap.data();
        const userSubscriptions = userData.subscriptionIds || [];
        if (userSubscriptions.length === 0) {
          console.error("User has no subscriptions");
          navigate(`/checkout/${post.tier}`);
          return;
        }

        const subscriptionDocsSnapshots = await Promise.all(
          userSubscriptions.map((subscriptionId) =>
            getDoc(doc(firestore, "Subscriptions", subscriptionId))
          )
        );

        const userTierTags = subscriptionDocsSnapshots
          .filter((subscriptionDoc) => subscriptionDoc.exists())
          .map((subscriptionDoc) => {
            const data = subscriptionDoc.data();
            return data ? data.tierTag : null;
          })
          .filter((tierTag) => tierTag != null);

        const isTierValid = checkUserTier(userTierTags, post);
        if (!isTierValid) {
          navigate(`/checkout/${post.tier}`);
          return;
        }

        navigate(`/viewarticle/${post.id}`);
      } else {
        console.error("User is not a member or does not meet access criteria.");
        navigate(`/checkout/${post.tier}`);
      }
    } catch (error) {
      console.error("Error handling view article:", error);
      alert("An error occurred while handling view article: " + error.message);
    }
  };


  //Function to sort the article "Posts" by date
  const sortPostsByDate = (order) => {
    if (order === "newest") {
      const sortedPosts = [...posts].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      setPosts(sortedPosts);
    } else if (order === "oldest") {
      const sortedPosts = [...posts].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
      setPosts(sortedPosts);
    }
  };

  //Function to sort the article "Posts" by tier
  const sortPostsByTier = (tier) => {
    const filteredPosts = posts.filter((post) => post.tier === tier);
    const remainingPosts = posts.filter((post) => post.tier !== tier);
    const sortedPosts = filteredPosts.concat(remainingPosts);
    setPosts(sortedPosts);
  };

  //Function to display the text on each post with less than 100 characters to act as a preview of the article
  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substr(0, maxLength) + "...";
  };

  if (!Array.isArray(posts)) {
    return <div>Loading...</div>;
  }

  return (
    <div className="home-content">
      <div className="sorting-buttons">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search articles..."
          className="search-articles"
        />

        <select
          className="sort-button"
          onChange={(e) => sortPostsByDate(e.target.value)}
        >
          <option value="newest">Sort by Newest</option>
          <option value="oldest">Sort by Oldest</option>
        </select>
        <select
          className="sort-button"
          onChange={(e) => sortPostsByTier(e.target.value)}
        >
          <option value="">Sort by Tier</option>
          {tiers.map((tier) => (
            <option key={tier.tierName} value={tier.tierName}>
              {tier.tierName}
            </option>
          ))}
        </select>
      </div>
      <div className="posts-container">
        {filteredPosts.map((post) => (
          <div key={post.id} className="post-card">
            <div className="post-header">
              <h2>{post.title}</h2>
              <span>{post.date}</span>
            </div>
            <div
              className="post-content"
              dangerouslySetInnerHTML={{ __html: truncateText(post.content) }}
            ></div>
            <div className="post-interactions">
              {articleIds.includes(post.id) ? (
                <button
                  className="view-article-button"
                  onClick={() => handleViewArticle(post)}
                >
                  <div className="action-button">
                    <BookIcon className="icon" /> View Article
                  </div>
                </button>
              ) : (
                <button className="action-button">Locked</button>
              )}
              {isPageOwner && (
                <IconButton
                  aria-label="more"
                  aria-haspopup="true"
                  onClick={(e) => handleMenuClick(e, post.id)}
                >
                  <MoreVertIcon />
                </IconButton>
              )}

              {isPageOwner && (
                <Menu
                  id="simple-menu"
                  anchorEl={anchorEl}
                  keepMounted
                  open={Boolean(anchorEl)}
                  onClose={handleCloseMenu}
                  PaperProps={{
                    style: {
                      display: "flex",
                      flexDirection: "column",
                      backgroundColor: "#2E2E2E",
                      color: "white",
                      borderRadius: 6,
                      overflow: "hidden",
                      boxShadow: "none",
                    },
                  }}
                >
                  <MenuItem
                    onClick={handleEditPost}
                    style={{ padding: "10px 20px" }}
                  >
                    <EditIcon style={{ marginRight: "10px" }} />
                    Edit
                  </MenuItem>
                  <MenuItem
                    onClick={handleOpenModal}
                    style={{ padding: "10px 20px" }}
                  >
                    <DeleteIcon style={{ marginRight: "10px" }} />
                    Delete
                  </MenuItem>
                </Menu>
              )}
            </div>
            {openModal && (
              <div className="modal-overlay active">
                <div className="modal-content">
                  <span className="close" onClick={handleCloseModal}>
                    &times;
                  </span>
                  <h2 className="modal-title">Delete Post?</h2>
                  <p className="modal-text">
                    Are you sure you want to delete this post? You cannot undo
                    this action.
                  </p>
                  <div className="modal-actions">
                    <button
                      onClick={handleCloseModal}
                      className="modal-button cancel-button"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmDelete}
                      className="modal-button delete-button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="tier-title">{post.tier}</div> {/* Tier title */}
          </div>
        ))}
      </div>
    </div>
  );
}

export default HomeContent;
