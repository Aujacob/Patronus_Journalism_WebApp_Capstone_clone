import React from 'react';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Subscriptions from './Subscriptions.js';


const Membership = ({ testSubscriptions, handleDialogOpen }) => {
  return (
    <div
      className="membership-box"
      style={{ backgroundColor: "#1f1f1f", color: "white" }}
    >
      <h2 className="big-heading">Your Subscriptions</h2>
      <div>
        {testSubscriptions.length > 0 ? (
          testSubscriptions.map((sub, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
                backgroundColor: "#333",
                color: "white",
                padding: "10px",
                borderRadius: "5px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <img
                  src={sub.profilePic}
                  alt="Profile"
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "25px",
                    marginRight: "15px",
                    border: "1px solid #555",
                  }}
                />
                <span>{sub.journalistUsername}</span>
              </div>
              <IconButton
                onClick={() => handleDialogOpen(sub)}
                style={{
                  backgroundColor: "transparent",
                  color: "#ff5555",
                  border: "none",
                  borderRadius: "5px",
                  textTransform: "none",
                }}
                aria-label="delete"
              >
                <DeleteIcon style={{ color: "#ff5555" }} />
              </IconButton>
            </div>
          ))
        ) : (
          <p>No subscriptions to display.</p>
        )}
      </div>
    </div>
  );
};

export default Membership;
