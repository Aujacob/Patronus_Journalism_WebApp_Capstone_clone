import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { firestore } from "../firebase";
import {
  Button,
  IconButton,
  FormControlLabel,
  Switch,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBack";
import { toast } from "react-toastify";
import { Form, FormLayout, Field } from "@saas-ui/react";

function GoogleSignup() {
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("Member");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();

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

  
  useEffect(() => {
    let isMounted = true;

    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (isMounted && !user) navigate("/login");
    });

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleRoleChange = (event) => {
    setUserRole(event.target.checked ? "Journalist" : "Member");
  };

  
  const handleSubmit = async (event) => {

    const auth = getAuth();
    const user = auth.currentUser;

    if (user && user.uid) {
      try {
        await setDoc(doc(firestore, "Users", user.uid), {
          username: userName,
          userId: user.uid,
          role: userRole,
          email: user.email,
        });

        await signOut(auth);

        toast.success("Account Updated Successfully");
        navigate("/login");
      } catch (error) {
        console.error("Error updating user info", error);
        toast.error(`Error updating user info: ${error.message}`);
      }
    } else {
      toast.error("No authenticated user found.");
    }
  };

  return (
    <div className="signup-content">
      <Link to="/" className="back-button">
        <IconButton style={{ color: "#ffffff" }}>
          <ArrowBackIosNewIcon />
        </IconButton>
      </Link>
      <div className="content-wrapper">
        <div className="title-slogan-container">
          <div className="title-container">
            <h1 className="signup-title">
            You're Almost There, We Just Need Some More Information!
            </h1>
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
                </div>
                
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
                Complete Signup
              </Button>

            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
 

export default GoogleSignup;