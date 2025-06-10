import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { collection, addDoc, query, where, getDocs, updateDoc, setDoc, doc } from 'firebase/firestore';
import { firestore, auth } from '../firebase';
import { Timestamp } from 'firebase/firestore';
import { useSnackbar } from '@saas-ui/react'
import TagsInput from '../actualComp/TagsInput';
import { toast } from "react-toastify";

function CreateArticle() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [selection, setSelection] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [articleTags, setArticleTags] = useState([]);

  const snackbar = useSnackbar();


  //Function to fetch the Tier information as well as subscribed member information for notifications
  const fetchTierData = async () => {
    try {
      const userQuery = query(collection(firestore, 'Users'), where('userId', '==', auth.currentUser.uid));
      const userQuerySnapshot = await getDocs(userQuery);
  
      if (!userQuerySnapshot.empty) {
        const userDoc = userQuerySnapshot.docs[0];
        const userData = userDoc.data();
  
        const tiersQuery = query(collection(firestore, 'SubscriptionTiers'), where('userId', '==', userData.userId));
        const tiersQuerySnapshot = await getDocs(tiersQuery);
  
        const tiersData = [];
        tiersQuerySnapshot.forEach((doc) => {
          tiersData.push({ id: doc.id, ...doc.data() });
        });
  
        setTiers(tiersData);
        
        //Fetching subscribed member information
        const subscribedMembersQuery = query(collection(firestore, 'SubscribedMembers'), where('journalistUserId', '==', userData.userId));
        const subscribedMembersQuerySnapshot = await getDocs(subscribedMembersQuery);
  
        const subscribedMembersData = [];
        subscribedMembersQuerySnapshot.forEach((doc) => {
          subscribedMembersData.push({ id: doc.id, ...doc.data() });
        });
  
        subscribedMembersData.forEach(async (subscribedMember) => {
          const subscribedMemberData = await fetchSubscribedMemberData(subscribedMember.memberUserId);
        });
      } else {


        console.log('User not found');
      }
    } catch (error) {
      console.error('Error fetching tiers:', error);
    }
  };

  //Function to fetch subscribed member data 
  const fetchSubscribedMemberData = async (memberUserId) => {
    try {
      const userQuery = query(collection(firestore, 'Users'), where('userId', '==', memberUserId));
      const userQuerySnapshot = await getDocs(userQuery);
  
      if (!userQuerySnapshot.empty) {
        const userDoc = userQuerySnapshot.docs[0];
        const userData = userDoc.data();
  
        return userData;
      } else {
        console.log('Subscribed member not found');
        return null;
      }
    } catch (error) {
      console.error('Error fetching subscribed member:', error);
      return null;
    }
  };
  
  const handleAddTag = (tag) => {
    if (articleTags.length === 0) {
      setArticleTags([tag]);
    }
    if (articleTags.length > 0) {
      toast.error("Tags are limited to one per article");
    }
    
  };

  const handleRemoveTag = (tag) => {
    const updatedTags = articleTags.filter((t) => t !== tag);
    setArticleTags(updatedTags);
  };
  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleContentChange = (value) => {
    setContent(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleSelectionChange = (e) => {
    setSelection(e.target.value);
  };


  //Function to save the article contents to the "Articles collection", along with the correct tier the article was posted to 
  const saveArticleToFirestore = async () => {
    try {
      const articlesRef = collection(firestore, 'Articles');
      const currentDateTime = new Date(); 
      const currentDate = currentDateTime.toDateString(); 
      const currentTime = currentDateTime.toTimeString().split(' ')[0]; 
      const firestoreTimestamp = Timestamp.fromDate(currentDateTime); 
  
      let tierTag = null;
      if (selection === 'Everyone') {
        tierTag = 'TierZero';
      } else {
        const selectedTier = tiers.find(tier => tier.tierName === selection);
        tierTag = selectedTier ? selectedTier.tierTag : null;
      }
  
      const docRef = await addDoc(articlesRef, {
        title: title,
        content: content,
        userId: auth.currentUser.uid,
        visibility: selection,
        createdAtDate: currentDate, 
        createdAtTime: currentTime, 
        createdAtTimestamp: firestoreTimestamp,
        tierTag: tierTag, 
        tags: articleTags,
      });
  
      await updateUserDataWithTags(articleTags);
      return docRef;
    } catch (error) {
      console.error('Error saving article to Firestore:', error);
      throw error;
    }
  };
  
  const updateUserDataWithTags = async (tags) => {
    try {
      const userQuery = query(collection(firestore, 'Users'), where('userId', '==', auth.currentUser.uid));
      const userQuerySnapshot = await getDocs(userQuery);
  
      if (!userQuerySnapshot.empty) {
        const userDoc = userQuerySnapshot.docs[0];
        const userData = userDoc.data();
  
        const updatedTags = userData.articleTags ? [...userData.articleTags, ...tags] : [...tags];
  
        await updateDoc(userDoc.ref, { articleTags: updatedTags });
        console.log('Article tags saved to user document:', updatedTags);
      } else {
        console.log('User document not found');
      }
    } catch (error) {
      console.error('Error saving article tags to user document:', error);
    }
  };
  
  //Function to create a notification document for all members who are subscribed to the tier that the article is posted to
  //the function also updates the "notificationIds" array Member's user documents, if they receive a notification
  const notifySubscribedMembersWithAccess = async (articleId, articleTitle, journalistUsername, articleTierTag) => {
    try {
      const subscribedMembersQuery = query(collection(firestore, 'SubscribedMembers'), where('journalistUserId', '==', auth.currentUser.uid));
      const subscribedMembersQuerySnapshot = await getDocs(subscribedMembersQuery);
  
      let membersWithAccess = [];
      for (const doc of subscribedMembersQuerySnapshot.docs) {
        const memberData = doc.data();
        const memberTierTag = memberData.tierTag;

        if (checkTierAccess(memberTierTag, articleTierTag)) {
          membersWithAccess.push(memberData.memberUserId);
        }
      }
  
      if (membersWithAccess.length > 0) {
        const notificationRef = doc(collection(firestore, 'Notifications'));
        await setDoc(notificationRef, {
          articleId: articleId,
          articleTitle: articleTitle,
          journalistUsername: journalistUsername,
          datePosted: Timestamp.now()
        });
  
        for (const memberUserId of membersWithAccess) {
          const userQuery = query(collection(firestore, 'Users'), where('userId', '==', memberUserId));
          const userQuerySnapshot = await getDocs(userQuery);
  
          if (!userQuerySnapshot.empty) {
            const userDoc = userQuerySnapshot.docs[0];
            const userData = userDoc.data();
            const existingNotifications = userData.notificationIds || [];
            const updatedNotifications = [...existingNotifications, notificationRef.id];
  
            await updateDoc(userDoc.ref, { notificationIds: updatedNotifications });
            console.log('Notification reference added to user document for subscribed member:', memberUserId);
          }
        }
      } else {
        console.log('No eligible members found for notification.');
      }
    } catch (error) {
      console.error('Error in notifying subscribed members with access:', error);
      throw error;
    }
  };
  

  //Function to check if the member that is subscribed to the Journalist has access to the tier
  const checkTierAccess = (memberTierTag, articleTierTag) => {
    const tierOrder = ['TierZero','TierOne', 'TierTwo', 'TierThree']; 
    const memberTierIndex = tierOrder.indexOf(memberTierTag);
    const articleTierIndex = tierOrder.indexOf(articleTierTag);
  
    return memberTierIndex >= articleTierIndex;
  };
  
  //Function to publish the article to firestore after the user presses the "Publish" button
  const handlePublish = async () => {
    if (!title || !content || !selection) {
      console.error('Title, content, or selection is missing.');
      return;
    }
  
    try {
      const selectedTier = tiers.find(tier => tier.tierName === selection);
      const articleTierTag = selectedTier ? selectedTier.tierTag : null;
      const articleRef = await saveArticleToFirestore(); 
  
      snackbar({
        title: 'Article created.',
        description: "Your article has been successfully published.",
        status: 'success',
        duration: 9000,
        isClosable: true,
      });
  
      const userQuery = query(collection(firestore, 'Users'), where('userId', '==', auth.currentUser.uid));
      const userQuerySnapshot = await getDocs(userQuery);
      let journalistUsername = '';
      if (!userQuerySnapshot.empty) {
        const userDoc = userQuerySnapshot.docs[0];
        const userData = userDoc.data();
        journalistUsername = userData.username;
      }
      
      await Promise.all([
        notifySubscribedMembersWithAccess(articleRef.id, title, journalistUsername, articleTierTag), 
        saveTiersReferenceToUser(articleRef.id)
      ]);
  
      setSubmitted(false);
      setTitle('');
      setContent('');
      setSelection(null);
    } catch (error) {
      console.error('Error publishing article:', error);
    }
  };

  //Function to save the Article reference to the Journalist user document (the name of this function is incorrect)
  const saveTiersReferenceToUser = async (articleId) => {
    try {
      const userQuery = query(collection(firestore, 'Users'), where('userId', '==', auth.currentUser.uid));
      const userQuerySnapshot = await getDocs(userQuery);

      if (!userQuerySnapshot.empty) {
        const userDoc = userQuerySnapshot.docs[0];
        const userData = userDoc.data();

        const updatedArticleIds = userData.articleIds ? [...userData.articleIds, articleId] : [articleId];
        await updateDoc(userDoc.ref, { articleIds: updatedArticleIds });
        console.log('Article reference saved to user document:', updatedArticleIds);
      } else {
        console.log('User document not found');
      }
    } catch (error) {
      console.error('Error saving article reference to user document:', error);
    }
  };

  useEffect(() => {
    fetchTierData(); 
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      height: '100vh',
      paddingLeft: '20px',
    }}>
      <style>
        {`
            #title::placeholder {
                color: gray;
                font-size: 20px;
                font-style: italic;
            }
            .ql-editor.ql-blank::before {
                color: gray;
                font-size: 20px;
            }
        `}
      </style>
      <h1 style={{
        fontSize: '50px',
        color: '#FFFFFF',
        textShadow: '2px 2px 8px rgba(0, 0, 0, 0.2)',
        marginBottom: '20px'
      }}>Create Article</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '300px', gap: '10px' }}>
        <label htmlFor="title" style={{ fontSize: '28px' }}>Title:</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={handleTitleChange}
          placeholder="Add a title"
          style={{
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #ccc', 
            height: '50px',
            width: '300%', 
            background: 'transparent', 
            color: 'white', 
        }}
        />
        {/* Augustine here, I made this, this is the tags input component for making tags */}
        {/* check actualComp/TagsInput.jsx for more info */}
        <div>
          <TagsInput
            tags={articleTags}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
          />
        </div>
        
        <label htmlFor="content" style={{ fontSize: '28px' }}>Content:</label>
        <ReactQuill
          id="content"
          value={content}
          onChange={handleContentChange}
          placeholder="Write something amazing..."
          style={{ height: '600px', width: '300%', marginBottom: '40px' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '300%' }}>
          <button type="submit" style={{
            padding: '10px',
            borderRadius: '5px',
            border: 'none',
            backgroundColor: '#007BFF',
            color: 'white',
            cursor: 'pointer',
            marginTop: '10px',
            width: '30%'
          }}>Next</button>
        </div>
      </form>
      {submitted && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#f9f9f9',
          padding: '40px',
          borderRadius: '15px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          width: '30%',
          height: 'auto',
          maxHeight: '80%',
          overflow: 'auto',
          transition: 'all 0.3s ease',
        }}>
          <h2 style={{
            color: '#333',
            textAlign: 'center',
            marginBottom: '20px',
            fontSize: '35px',
          }}>Select who can see this article:</h2>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
          }}>
            <select
              style={{
                padding: '10px 20px',
                borderRadius: '5px',
                fontSize: '20px',
                cursor: 'pointer',
                color: 'black',
              }}
              onChange={handleSelectionChange}
              defaultValue=""
            >
              {!selection && <option value="" disabled>Select visibility</option>}
              <option value="Everyone">Everyone</option>
              {tiers.map((tier) => (
                <option key={tier.id} value={tier.tierName}>
                  {tier.tierName}
                </option>
              ))}
            </select>
            <button style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              padding: '10px 20px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              fontSize: '20px',
              marginTop: '20px',
            }} onClick={handlePublish} disabled={!selection}>Publish</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateArticle;
