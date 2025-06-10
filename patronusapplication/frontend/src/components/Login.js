import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  Dialog,
  IconButton,
  Button,
  DialogContent,
  DialogTitle,
  DialogActions,
  TextField,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../firebase';


import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import '../stylecss/GradientBackground.css';
import "../stylecss/Login.css";
import WavingHandTwoToneIcon from "@mui/icons-material/WavingHandTwoTone";
import { PasswordInput, Form, FormLayout, Field } from "@saas-ui/react"; 
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";


const db = getFirestore();


const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const getUserRoleAndRedirect = async (userId, navigate) => {
    const docRef = doc(db, "Users", userId);
    const docSnap = await getDoc(docRef);
  
    if (docSnap.exists()) {
      const userRole = docSnap.data().role;
      if (userRole === "Journalist") {
        const username = docSnap.data().username;
        navigate(`/${username}`);
      } else if (userRole === "Member") {
        navigate('/find-creators');
      }
    } else {
      console.log("No such document!");
    }
  };

  const handleGoogleSignIn = () => {
    const provider = new GoogleAuthProvider();
    const auth = getAuth();
    signInWithPopup(auth, provider)
      .then(async (result) => {
        const user = result.user;
        await getUserRoleAndRedirect(user.uid, navigate); 
      }).catch((error) => {
        toast.error(`Login failed: ${error.message}`);
      });
  };
  

  const handleSnackbarOpen = () => {
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  function openForgotPasswordDialog() {
    console.log("Trying to open the forgot password dialog");
    setOpenDialog(true);
  }

  useEffect(() => {
    if (!sessionStorage.getItem("hasVisited")) {
      sessionStorage.setItem("hasVisited", "true");
      window.location.reload();
    }
  }, []);

  function closeForgotPasswordDialog() {
    setOpenDialog(false);
  }

  function handleEmailChange(e) {
    setEmail(e.target.value);
  }
  
  function handlePasswordReset() {
    
    if (!email || !email.includes('@')) {
      // Display a popup notifying the user that the email address is not valid
      toast.error('Please enter a valid email address.');
      return; // Stop further execution
    }
    
    console.log("Password reset request submitted for email:", email);
  
    const usersRef = collection(firestore, 'Users');
    const emailQuery = query(usersRef, where('email', '==', email));
  
    getDocs(emailQuery)
      .then((querySnapshot) => {
        if (!querySnapshot.empty) { // If the querySnapshot is not empty, email exists in the database
          closeForgotPasswordDialog();
  
          sendPasswordResetEmail(auth, email)
            .then(() => {
              handleSnackbarOpen(); // Open Snackbar only when email is sent successfully
              closeForgotPasswordDialog();
            })
            .catch((error) => {
              console.error(`Error sending password reset email: ${error.message}`);
              // Handle error here, e.g., display error message to the user
            });
        } else {
          toast.error("The provided email address is not registered.");
        }
      })
      .catch((error) => {
        console.error("Error checking email in database:", error);
        // Handle error here, e.g., display error message to the user
      });
  }

  const handleSubmit = async () => {
    const auth = getAuth();
    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        if (!user.emailVerified) {
          toast.error("Please verify your email before logging in.");
        } else {
          await getUserRoleAndRedirect(user.uid, navigate);
        }
      })
      .catch((error) => {
        toast.error(`Login failed: ${error.message}`);
      });
  };

  return (
    <div className="signup-content">
      <div className="signup-content">
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MuiAlert
            onClose={handleSnackbarClose}
            severity="success"
            sx={{ width: "100%" }}
          >
            Password reset email sent!
          </MuiAlert>
        </Snackbar>
      </div>
      <Link to="/" className="back-button">
        <IconButton style={{ color: "#ffffff" }}>
          <ArrowBackIosNewIcon />
        </IconButton>
      </Link>
      <div className="content-wrapper">
        <div className="title-slogan-container">
          <div className="title-container">
            <h1><br></br></h1>
            <h1><br></br></h1>


            <h1 className="login-title">
              
              Welcome Back to Patronus{" "}
              <WavingHandTwoToneIcon
                style={{ fontSize: "5rem", marginTop: "-0.5rem" }}
              />
            </h1>
          </div>

          <div className="slogan-container">
            <p className="slogan">
              Log in to support and engage with independent journalism
              effortlessly.
            </p>
          </div>
        </div>
        <div className="login-container">
          <div className="form-container">
            <Form onSubmit={handleSubmit} className="login-form">
              <FormLayout spacing={3}>
              
                <Field
                  name="email"
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
                <Field
                  name="password"
                  label="Password"
                  //You can't change the hidden password icon. It comes preinstalled and appears when you set the type
                  // to password. Try changing it to email and you'll see the icon disappear.
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />

                {/* <FormControlLabel
                  control={<Checkbox required />}
                  label="Remember me"
                /> */}
              </FormLayout>
              <Button
                type="submit"
                variant="contained"
                className="signup-button"
                style={{
                  textTransform: "none",
                  marginTop: "50px",
                  marginBottom:"25px",
                  color: "#ffffff",
                  padding: "13px", // Increase padding for a thicker button
                  fontWeight: "bold",
                }}
              >
                Log In
              </Button>
              <div className="divider-container">
                <hr className="divider-line" />
                <span className="divider-text">OR</span>
                <hr className="divider-line" />
              </div>
              <Button
                size="lg"
                variant="outlined"
                color="primary"
                className="flex items-center gap-3"
                onClick={handleGoogleSignIn}
                style={{ textTransform: "none" }}
              >
                <img
                  src="https://docs.material-tailwind.com/icons/google.svg"
                  alt="Google"
                  className="h-9 w-6"
                />
                Continue with Google
              </Button>
              <div className="login-footer">
                <div className="trouble-sign-in">
                  <a href="#!" onClick={openForgotPasswordDialog}>
                    Trouble signing in?
                  </a>
                </div>
                <div className="sign-up">
                  <p className="login-link">
                    New to Patronus?{" "}
                    <Link
                      to="/signup"
                      style={{ color: "#1565c0", textDecoration: "underline" }}
                    >
                      Sign Up
                    </Link>
                  </p>
                </div>
              </div>
            </Form>
          </div>
        </div>
      </div>
      <Dialog open={openDialog} onClose={closeForgotPasswordDialog}>
        <DialogTitle style={{ paddingBottom: 0 }}>
          Trouble signing in?
        </DialogTitle>
        <DialogContent>
          <p style={{ marginBottom: "16px", fontSize: "14px" }}>
            Enter your email address below, and we'll send you a link to reset
            your password.
          </p>
          <TextField
            autoFocus
            margin="dense"
            id="email"
            label="Email Address"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            InputProps={{
              className: "dialog-input",
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handlePasswordReset}
            color="primary"
            variant="contained"
            style={{ textTransform: "none" }}
          >
            Reset password
          </Button>
          <Button
            onClick={closeForgotPasswordDialog}
            color="primary"
            variant="outlined"
            style={{ textTransform: "none" }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Login;
