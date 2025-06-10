import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getAuth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { firestore } from "../firebase";
import {
  Button,
  IconButton,
  FormControlLabel,
  Switch,
  Checkbox,
} from "@mui/material";
import { PasswordInput, Form, FormLayout, Field } from "@saas-ui/react";
import { toast } from "react-toastify";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import "../stylecss/Login.css";
import '../stylecss/GradientBackground.css';
function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [userRole, setUserRole] = useState("Member");

  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const [role, setRole] = useState("member");

  const handleGoogleSignup = () => {
    const provider = new GoogleAuthProvider();
    const auth = getAuth();
    signInWithPopup(auth, provider)
      .then((result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        const user = result.user;

        console.log("Google sign-in successful, navigating to /googlesignup");
        navigate("/googlesignup");
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        const email = error.email;
        const credential = GoogleAuthProvider.credentialFromError(error);
        console.log("Google sign-in error:", errorMessage);
        toast.error(errorMessage);
      });
  };

  const passwordValidity = {
    minChar: {
      isValid: password.length >= 8,
      message: "8 characters minimum",
    },
    number: {
      isValid: /\d/.test(password),
      message: "At least one number",
    },
    upperCase: {
      isValid: /[A-Z]/.test(password),
      message: "At least one uppercase character",
    },
    lowerCase: {
      isValid: /[a-z]/.test(password),
      message: "At least one lowercase character",
    },
    specialChar: {
      isValid: /[!@#$%^&*]/.test(password),
      message: "At least one special character",
    },
    match: {
      isValid: password === confirmPassword && password !== "",
      message: "Passwords match",
    },
  };

  const checkPasswordStrength = () => {
    let strength = 0;
    strength += passwordValidity.minChar ? 1 : 0;
    strength += passwordValidity.number ? 1 : 0;
    strength += passwordValidity.upperCase ? 1 : 0;
    strength += passwordValidity.specialChar ? 1 : 0;
  };


  //Function to generate a new user document in the Users collection on successful signup
  const addUserToFirestore = async (userId, email, username, userRole) => {
    try {
  
      const effectiveRole = userRole || 'Member'; 
  
      const userDocRef = doc(firestore, "Users", userId);
  
      await setDoc(userDocRef, {
        email: email,
        username: username,
        userId: userId,
        role: effectiveRole, 
      });
  
    } catch (error) {
      console.error("Error adding user to Firestore:", error);
    }
  };

  const handleSubmit = async (event) => {
    if (event && typeof event.preventDefault === "function") {
      event.preventDefault();
    } else {
      event = event || window.event;
      event.returnValue = false;
    }

    if (!Object.values(passwordValidity).every(Boolean)) {
      console.log("Password validity conditions not met.");
      return;
    }

    const auth = getAuth();
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      console.log("User created:", user);

      await addUserToFirestore(user.uid, email, userName, userRole);
      console.log("User added to Firestore successfully.");

      await sendEmailVerification(user);
      console.log("Email verification sent.");

      await signOut(auth);
      console.log("User signed out after account creation.");

      setSuccessMessage(
        "Account created successfully! Please check your email to verify your account."
      );
    } catch (error) {
      console.error("Signup error:", error.message);
      toast.error("Signup error: " + error.message);
      setErrorMessage("Signup error: " + error.message);
    }
  };
  const handleRoleChange = (event) => {
    setUserRole(event.target.checked ? "Journalist" : "Member");
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="signup-content2">
      <Link to="/" className="back-button">
        <IconButton style={{ color: "#ffffff" }}>
          <ArrowBackIosNewIcon />
        </IconButton>
      </Link>
      <div className="content-wrapper">
        <div className="title-slogan-container">
        <div className="title-container">
            <h1><br/></h1>
            <h1><br/></h1>
            <h1><br/></h1>
            <h1><br/></h1>
            <h1><br/></h1>

            <h1 className="custom-title">
              Join Our Patronus Tribe{" "}
              <HistoryEduIcon
                style={{ fontSize: "5rem", marginTop: "-0.5rem" }}
              />
            </h1>
          </div>

          <div className="slogan-container">
            <p className="slogan">
              Empowering Voices, Uncovering Truths. Be a Part of the Movement.
            </p>
            
          </div>
        </div>
        <div className="signup-container">
          <div className="form-container">
            <Form onSubmit={handleSubmit} className="signup-form">
              <FormLayout spacing={3}>
                <div className="form-row">
                  <Field
                    name="username"
                    label="Username"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your username"
                    required
                  />
                  <Field
                    name="email"
                    label="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <Field
                  name="password"
                  label="Create your Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    checkPasswordStrength();
                  }}
                  placeholder="*************"
                  type="password"
                  required
                />
                <Field
                  name="confirmPassword"
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="*************"
                  type="password"
                  required
                />
                <div className="password-requirements">
                  {Object.entries(passwordValidity).map(([key, req]) => (
                    <div key={key} className="password-requirement">
                      <span
                        className={
                          req.isValid
                            ? "requirement-valid"
                            : "requirement-invalid"
                        }
                      >
                        {req.isValid ? "✔" : "✖"}
                      </span>
                      <span className="requirement-text">{req.message}</span>
                    </div>
                  ))}
                </div>
                <FormControlLabel
                  control={<Checkbox required />}
                  label="I agree with Terms and Privacy Policy"
                />
              </FormLayout>
              <FormControlLabel
                control={
                  <Switch
                    checked={userRole === "Journalist"}
                    onChange={handleRoleChange}
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": {
                        color: "#1565c0",
                      },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                        {
                          backgroundColor: "#0d47a1",
                        },
                    }}
                  />
                }
                label={
                  userRole === "Member"
                    ? "Sign up as Member"
                    : "Sign up as Journalist"
                }
              />

              <Button
                type="submit"
                variant="contained"
                className="signup-button"
                style={{
                  textTransform: "none",
                  marginTop: "50px",
                  color: "#ffffff",
                  padding: "13px", // Increase padding for a thicker button
                  fontWeight: "bold",
                }}
              >
                Create Account
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
                onClick={handleGoogleSignup}
                style={{ textTransform: "none" }}
              >
                <img
                  src="https://docs.material-tailwind.com/icons/google.svg"
                  alt="Google"
                  className="h-9 w-6"
                />
                Continue with Google
              </Button>
              {errorMessage && <p className="error-message">{errorMessage}</p>}
              {successMessage && (
                <p className="success-message">{successMessage}</p>
              )}
              <p className="login-link">
                Already have an account?{"  "}
                <Link
                  to="/login"
                  style={{ color: "#1565c0", textDecoration: "underline" }}
                >
                  Log in
                </Link>
              </p>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
