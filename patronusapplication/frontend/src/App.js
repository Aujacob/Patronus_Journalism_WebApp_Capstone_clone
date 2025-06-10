import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import MyPage from './components/MyPage'; 
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import FindCreators from './components/FindCreators';
import GoogleSignup from './components/GoogleSignup';
import Audience from './components/Audience';
import MemberNotifications from './components/MemberNotifications';
import { ToastContainer } from 'react-toastify';
import CreateArticle from './components/CreateArticle';
import ViewArticle from './components/ViewArticle';
import PaymentForm from './components/Checkout';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from './components/Checkout';
import { Sidebar } from './components/Sidebar';
import { auth } from './firebase'; // Ensure this path is correct
import './stylecss/Tailwind.css';
import Recents from './components/Recents';

// Define custom Material-UI theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#007AFF',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
  },
});


const stripePromise = loadStripe('pk_test_51OnDaQLJVlVLUcAglj0Lx7JJVtjT5U6fB0IPxyXO3mMrYehKJeWPMrI8bjEgRJmjvCyNNVrLNFd8H0LKtU9mZNYQ005hJNYTyR');

const ProtectedRoute = ({ user, children, onLogout }) => {
  if (!user) {
    return <Navigate to="/login" />;
  }
  return (
    <div className="flex">
      <Sidebar onLogout={onLogout} />
      <div className="flex-grow">
        {children}
      </div>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        // User is logged in
        setUser(authUser);
      } else {
        // User is logged out
        setUser(null);
      }
    });

    return () => {
      unsubscribe(); 
    };
  }, []);

  const handleLogout = () => {
    auth.signOut().then(() => {
      setUser(null); // Update user state to null upon logout
    }).catch((error) => {
      console.error('Error signing out:', error.message);
    });
  };


  return (
    <ThemeProvider theme={theme}>
      <Router>
      <div className="App" style={{ backgroundColor: '#121212' }}>
          <ToastContainer />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/googlesignup" element={<GoogleSignup />} />
            <Route path="/" element={user ? <Navigate replace to="/dashboard" /> : <LandingPage />} />
            {/* Protected routes */}
            {user && (
              <>
                <Route path="/createarticle" element={<ProtectedRoute user={user} onLogout={handleLogout}><CreateArticle /></ProtectedRoute>} />
                <Route path="/dashboard/*" element={<ProtectedRoute user={user} onLogout={handleLogout}><Dashboard /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute user={user} onLogout={handleLogout}><Settings /></ProtectedRoute>} />
                <Route path="/find-creators" element={<ProtectedRoute user={user} onLogout={handleLogout}><FindCreators /></ProtectedRoute>} />
                <Route path="/audience" element={<ProtectedRoute user={user} onLogout={handleLogout}><Audience /></ProtectedRoute>} />
                <Route path="/recents" element={<ProtectedRoute user={user} onLogout={handleLogout}><Recents /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute user={user} onLogout={handleLogout}><MemberNotifications /></ProtectedRoute>} />
                <Route path="/:username" element={<ProtectedRoute user={user}><MyPage /></ProtectedRoute>} />
                <Route path="/viewarticle/:id" element={<ProtectedRoute user={user} onLogout={handleLogout}><ViewArticle /></ProtectedRoute>} />
                <Route path="/checkout/:tier" element={<ProtectedRoute user={user} onLogout={handleLogout}>
                  <Elements stripe={stripePromise}>
                    <CheckoutForm />
                  </Elements>
                </ProtectedRoute>} />
              </>
            )}
            {/* If user is not authenticated, redirect /dashboard to landing page */}
            {!user && <Route path="/dashboard/*" element={<Navigate replace to="/" />} />}
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;