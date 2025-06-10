import React, { useState, useEffect } from 'react';
import "../stylecss/Recents.css";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { collection, doc, query, where, getDocs, getDoc } from 'firebase/firestore';
import { LoadingOverlay, LoadingSpinner } from '@saas-ui/react'
import { auth, firestore } from '../firebase';
import { Link } from 'react-router-dom';

const Recents = () => {
  const [articles, setArticles] = useState([]);
  const [journalist, setJournalist] = useState({});
  const [loading, setLoading] = useState(true);

  const tierHierarchy = { TierZero: 0, TierOne: 1, TierTwo: 2, TierThree: 3 };

  //Function to fetch the subscribed articles from the members User document
  useEffect(() => {
    const fetchUserSubscribedArticles = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userId = currentUser.uid;
          const userDocId = await fetchUserDocumentId(userId);
          if (userDocId) {
            const userDoc = await getDoc(doc(firestore, "Users", userDocId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
    
              if (userData.subscriptionIds && userData.subscriptionIds.length > 0) {
                const { subscriptions, journalistTierMap } = await fetchSubscriptionData(userData.subscriptionIds);
                const allArticleIds = subscriptions.flatMap(sub => sub.journalistUserData.articleIds).filter(id => !!id);
                const fetchedArticles = await generatePosts(allArticleIds, journalistTierMap);
    
                setArticles(fetchedArticles);
                setLoading(false); 
    
              } else {
                console.log("User has no subscriptions");
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    
    fetchUserSubscribedArticles();
  }, []);

  //Function to fetch the currently logged in users User documentID
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

  //Function to determine the highest Tier that a user is subscribed to 
  const determineHighestTier = (subscriptionData) => {
    return subscriptionData.reduce((max, sub) => {
      const tierLevel = tierHierarchy[sub.tierTag] || 0;
      return Math.max(max, tierLevel);
    }, 0);
  };

  //Function to fetch the subscription data of a Member
  const fetchSubscriptionData = async (subscriptionIds) => {
    const subscriptionData = [];
    const journalistTierMap = {}; 
    try {
      const subscriptionDocs = await Promise.all(subscriptionIds.map(async (subId) => {
        const subDoc = await getDoc(doc(firestore, "Subscriptions", subId));
        if (!subDoc.exists()) return null;
        const subData = subDoc.data();
        const journalistUserData = await fetchJournalistUserData(subData.journalistId);
        journalistTierMap[subData.journalistId] = subData.tierTag; 
        return { ...subData, journalistUserData };
      }));
      return { subscriptions: subscriptionDocs.filter(doc => doc !== null), journalistTierMap };
    } catch (error) {
      console.error("Error fetching subscription data:", error);
      return { subscriptions: subscriptionData, journalistTierMap };
    }
  };

  //Function to fetch the Journalist data from the the Members subscription document
  const fetchJournalistUserData = async (journalistId) => {
    try {
      const userQuery = query(
        collection(firestore, "Users"),
        where("userId", "==", journalistId)
      );
      const userQuerySnapshot = await getDocs(userQuery);
  
      if (!userQuerySnapshot.empty) {
        const userDoc = userQuerySnapshot.docs[0];
        const userData = userDoc.data();
        const journalistArticles = await fetchJournalistArticles(journalistId);
        setJournalist({  
          name: userData.username || "Journalist Name",
          profilePic: userData.photo || ""
        });
        return { ...userData, journalistArticles };
      } else {
        console.log("Journalist document not found for userID:", journalistId);
        return null;
      }
    } catch (error) {
      console.error("Error fetching journalist user data:", error);
      return null;
    }
  };

  //Function to fetch all of the articles that a journalist the user is subscribed to has posted
  const fetchJournalistArticles = async (journalistId) => {
    console.log(`Fetching articles for journalist ID: ${journalistId}`);
    const journalistArticles = [];

    try {
      const journalistDocRef = doc(firestore, "Users", journalistId);
      const journalistDocSnapshot = await getDoc(journalistDocRef);

      if (!journalistDocSnapshot.exists()) {
        console.log(`Journalist document not found for ID: ${journalistId}`);
        return journalistArticles;
      }

      const journalistData = journalistDocSnapshot.data();
      console.log("Journalist Data:", journalistData);

      if (!journalistData.articleIds || journalistData.articleIds.length === 0) {
        console.log(`Journalist ID ${journalistId} has no associated articles`);
        return journalistArticles;
      }

      for (const articleId of journalistData.articleIds) {
        try {
          const articleDocRef = doc(firestore, "Articles", articleId);
          const articleDocSnapshot = await getDoc(articleDocRef);

          if (!articleDocSnapshot.exists()) {
            console.log(`Article document with ID ${articleId} not found`);
            continue;
          }

          const articleData = articleDocSnapshot.data();

          const article = {
            id: articleId,
            title: articleData.title || "Untitled",
            date: articleData.createdAtDate || "Unknown Date",
            summary: articleData.content || "No summary available"
          };
          journalistArticles.push(article);
          console.log("Article pulled:", article);
        } catch (error) {
          console.error(`Error fetching article with ID ${articleId}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error fetching journalist articles for ID ${journalistId}:`, error);
    }
    return journalistArticles;
  };

  //Function to generate the articles pulled as "posts" 
 const generatePosts = async (articleIds, journalistTierMap) => {
  const journalistDataMap = {};
  for (const articleId of articleIds) {
    const articleDocRef = doc(firestore, "Articles", articleId);
    const articleDocSnapshot = await getDoc(articleDocRef);
    if (articleDocSnapshot.exists()) {
      const articleData = articleDocSnapshot.data();
      const journalistId = articleData.userId; 
      if (journalistId && !journalistDataMap[journalistId]) {
        journalistDataMap[journalistId] = await fetchJournalistUserData(journalistId);
      }
    }
  }
  
  const posts = [];
  for (const articleId of articleIds) {
    const articleDocRef = doc(firestore, "Articles", articleId);
    const articleDocSnapshot = await getDoc(articleDocRef);
    if (articleDocSnapshot.exists()) {
      const articleData = articleDocSnapshot.data();
      const journalistId = articleData.userId;
      const journalistTier = journalistTierMap[journalistId] || "TierZero"; 
      if (tierHierarchy[articleData.tierTag] <= tierHierarchy[journalistTier]) {
        const journalistData = journalistDataMap[journalistId];
        if (journalistData) {
          const post = {
            id: articleId,
            title: articleData.title || "Untitled",
            date: articleData.createdAtDate || "Unknown Date",
            summary: articleData.content || "No summary available",
            tier: articleData.visibility || "Tier Unavailable",
            journalistName: journalistData.username || "Unknown Journalist",
            journalistProfilePic: journalistData.photo || "",
          };
          posts.push(post);
        }
      }
    }
  }
  
  return posts;
};

return (
  <div className="recents-container">
    <h1 className="recents-title">Recent Posts From Your Subscribed Journalists</h1>
    <LoadingOverlay active={loading}>
      {loading && (
        <div className="fetching-message">Fetching Recent Articles...</div>
      )}
      {loading && <LoadingSpinner className="custom-spinner" />}
    </LoadingOverlay>
    {!loading && articles.map((article, index) => (
      <div key={index} className="article-card">
        <div className="article-header">
          <div>
            <h2 className="article-title">{article.title}</h2>
            <span className="article-date">{article.date}</span>
          </div>
          <div className="journalist-info">
            {article.journalistProfilePic ? (
              <img src={article.journalistProfilePic} alt="Journalist" className="journalist-pic" />
            ) : (
              <AccountCircleIcon className="journalist-pic-default" />
            )}
            <span className="journalist-username">{article.journalistName}</span>
          </div>
        </div>
        <p className="article-summary" dangerouslySetInnerHTML={{ __html: article.summary }}></p>
        <div className="article-footer">
          <Link to={`/viewarticle/${article.id}`} className="read-more">Read More</Link>
          <span className="journalist-tier">{article.tier}</span>
        </div>
      </div>
    ))}
  </div>
);



};

export default Recents;
