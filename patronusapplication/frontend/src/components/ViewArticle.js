import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
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
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "../stylecss/ViewArticle.css";
import DOMPurify from "dompurify";
import Footer from "../actualComp/Footer.jsx";
import { LockClosedIcon } from "@heroicons/react/24/solid";

function ViewArticle() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [articleJournalistId, setArticleJournalistId] = useState("");
  const [isOwner, setIsArticleOwner] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [hasValidTier, setHasValidTier] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [journalistUsername, setJournalistUsername] = useState({});

  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const createMarkup = (htmlContent) => {
    return { __html: DOMPurify.sanitize(htmlContent) };
  };



  useEffect(() => {

    //Function to correctly fetch the article from the Articles collection using the articleID in the URL
    //Sets all of the article information accordingly 
    const fetchArticle = async () => {
      setLoading(true);
      const articleDocRef = doc(firestore, "Articles", id);
      const articleDocSnapshot = await getDoc(articleDocRef);

      if (articleDocSnapshot.exists()) {
        const articleData = articleDocSnapshot.data();
        setArticle(articleData);
        setEditedTitle(articleData.title);
        setEditedContent(articleData.content);
        setArticleJournalistId(articleData.userId);
        setJournalistUsername(articleData.username);

        if (location.state?.isEditing) {
          setIsEditing(true);
        }
      } else {
        console.log("No such document!");
      }

      setLoading(false);
    };

    fetchArticle();
  }, [id, location.state]);

  useEffect(() => {
    //Function to fetch the userrole and to check whether the user is the owner of the article
    const fetchUserRoleAndOwnership = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser || !article) {
        console.log(
          "Either no user is logged in or the article data is not available yet."
        );
        return;
      }

      try {
        const userId = currentUser.uid;
        const userDocRef = doc(firestore, "Users", userId);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          console.log("User document does not exist.");
          return;
        }

        const userData = userDocSnap.data();
        setUserRole(userData.role);

        if (article) {
          const isOwner = userId === article.userId;
          setIsArticleOwner(isOwner);
          console.log("Is the user the article owner?", isOwner);
        }
      } catch (error) {
        console.error("Error fetching user role or ownership status:", error);
      }
    };

    fetchUserRoleAndOwnership();
  }, [article]);

  //Function to check whether a member has access to the article by checking if the member is subscribed to the Journalist, and by checking if the member is subscribed to the correct tier
  const checkUserTierAndSubscription = (userSubscriptions, article) => {
    const tierLevels = {
      TierZero: 0,
      TierOne: 1,
      TierTwo: 2,
      TierThree: 3,
    };

    const hasAccess = userSubscriptions.some((subscription) => {
      const subscriptionTierLevel = tierLevels[subscription.tierTag];
      const articleTierLevel = tierLevels[article.tierTag];
      const matchesJournalistOrCategory =
        subscription.journalistId === article.userId;
      return (
        matchesJournalistOrCategory && subscriptionTierLevel >= articleTierLevel
      );
    });

    return hasAccess;
  };

  useEffect(() => {
    //Function to check whether a user has access to the article
    //If the user is the owner of the article then they are able to view the article as normal
    //If the user is not subscribed to the journalist then they are met with an error message
    //If the user is subscribed to the journalist but not subscribed to the correct tier then they are met with an error message
    //If the user is subscribed to the journalist with the correct tier then they are able to view the article as normal
    //While the access is being checked, the article is in a "Loading" state so that no incorrect information is displayed before all the checks are made
    const fetchUserRoleAndCheckSubscription = async () => {
      setLoading(true);
      try {
        if (!article) {
          console.error("Article data not available");
          setLoading(false);
          return;
        }

        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.error("No user is currently logged in");
          setLoading(false);
          return;
        }

        const userId = currentUser.uid;
        const userDocRef = doc(firestore, "Users", userId);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          console.error("User document does not exist");
          setLoading(false);
          return;
        }

        const userData = userDocSnap.data();
        console.log("User role is", userData.role);

        let userSubscriptions = [];
        for (const subscriptionId of userData.subscriptionIds ?? []) {
          const subscriptionDocRef = doc(
            firestore,
            "Subscriptions",
            subscriptionId
          );
          const subscriptionDocSnap = await getDoc(subscriptionDocRef);

          if (subscriptionDocSnap.exists()) {
            userSubscriptions.push(subscriptionDocSnap.data());
          } else {
            console.error(
              `Subscription document not found for ID: ${subscriptionId}`
            );
          }
        }

        const isTierValid = checkUserTierAndSubscription(
          userSubscriptions,
          article
        );
        const isSubscribedToJournalist = userSubscriptions.some(
          (subscription) => subscription.journalistId === article.userId
        );

        setIsSubscribed(isSubscribedToJournalist);
        setHasValidTier(isTierValid);
      } catch (error) {
        console.error(
          "Error fetching user role and checking subscription:",
          error
        );
      } finally {
        setAccessChecked(true);
        setLoading(false);
      }
    };

    if (article) {
      fetchUserRoleAndCheckSubscription();
    } else {
      setAccessChecked(false);
      setLoading(false);
    }
  }, [article]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handlePrint = () => {
    window.print();
  };
  
//Function to handle the saving of the article after its being edited
//After the article is edited and saved, the exisitng Article document is updated with the information rather than created a new Article document in the "Articles" collection
  const handleSave = async () => {
    const articleDocRef = doc(firestore, "Articles", id);
    await updateDoc(articleDocRef, {
      title: editedTitle,
      content: editedContent,
    });

    setIsEditing(false);
    setArticle((prevArticle) => ({
      ...prevArticle,
      title: editedTitle,
      content: editedContent,
    }));
  };

  const handleTitleChange = (e) => {
    setEditedTitle(e.target.value);
  };

  const handleContentChange = (content) => {
    setEditedContent(content);
  };

  return (
    <div className="view-article">
      {loading || !accessChecked ? (
        <div className="loading-message">Loading...</div>
      ) : (
        <>
          {article ? (
            <>
              {auth.currentUser &&
              (auth.currentUser.uid === article?.userId ||
                (isSubscribed && hasValidTier)) ? (
                <>
                  {isEditing ? (
                    <div className="edit-article">
                      <label htmlFor="article-title">Title:</label>
                      <input
                        id="article-title"
                        className="article-title-input"
                        type="text"
                        value={editedTitle}
                        onChange={handleTitleChange}
                        placeholder="Add a title"
                      />
                      <label htmlFor="article-content">Content:</label>
                      <ReactQuill
                        id="article-content"
                        theme="snow"
                        value={editedContent}
                        onChange={handleContentChange}
                        placeholder="Write something amazing..."
                        modules={{
                          // Configure the Quill editor modules as needed
                          //  disable the enter key from creating new paragraphs
                          keyboard: {
                            bindings: {
                              enter: false,
                            },
                          },
                        }}
                      />
                      <button onClick={handleSave} className="article-button">
                        Save
                      </button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => window.print()} className="print-article-button">
                        Print
                      </button>
  
                      <div className="article-display">
                        <h3>{article.title}</h3>
                        <p>
                          <em>{article.createdAtDate}</em>
                        </p>
                        <div
                          className="text"
                          dangerouslySetInnerHTML={createMarkup(article.content)}
                        />
                        {auth.currentUser &&
                          auth.currentUser.uid === article?.userId && (
                            <button
                              onClick={handleEdit}
                              className="edit-article-button"
                            >
                              Edit
                            </button>
                          )}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="access-denied-container">
                  <h2>You don't have access to this article!</h2>
                  <div className="lock-icon-wrapper">
                    <LockClosedIcon
                      className="h-30 w-30 text-gray-500"
                      aria-hidden="true"
                    />
                  </div>
                  <p>Please purchase a higher tier subscription</p>
                  <button
                    onClick={() => navigate(`/checkout/${article.visibility}`)}
                    className="access-denied-button"
                  >
                    Subscribe to Journalist
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="article-not-found-message">
              <div className="access-denied-container">
                <h2>Article not found.</h2>
                <button
                  onClick={() => navigate(`/checkout/${article.visibility}`)}
                  className="access-denied-button"
                >
                  Subscribe to Journalist
                </button>
              </div>
            </div>
          )}
          {auth.currentUser &&
            (auth.currentUser.uid === article?.userId ||
              (isSubscribed && hasValidTier)) && <Footer />}
        </>
      )}
      


    </div>
  );
  
}

export default ViewArticle;
