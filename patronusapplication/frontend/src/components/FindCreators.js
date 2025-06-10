import React, { useState, useEffect } from "react";
import { Input, Button } from "@material-tailwind/react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { firestore } from "../firebase";
import { Link } from "react-router-dom";
import {
  HeartIcon,
  ScaleIcon,
  BuildingLibraryIcon,
  TrophyIcon,
  NewspaperIcon,
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
} from "@heroicons/react/24/solid";
import "../stylecss/FindCreators.css";
import defaultProfilePic from "../images/default.png";

import SelectSearch from "react-select-search";

export default function FindCreators() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const tags = ["Art", "Sports", "Finance", "News", "Politics"];
  let debounceTimer;

  const handleTagClick = (tag) => {
    setSearchQuery(tag); // Set search query directly to the tag
    handleSearch(tag); // Pass tag to handleSearch
  };

  const handleSearch = async (queryTag) => {
    try {
      setLoading(true);
      let q;
      if (queryTag) {
        q = query(
          collection(firestore, "Users"),
          where("role", "==", "Journalist"),
          where("articleTags", "array-contains", queryTag)
        );
      } else if (searchQuery) {
        const lowercaseQuery = searchQuery.toLowerCase();
        q = query(
          collection(firestore, "Users"),
          where("role", "==", "Journalist"),
          where("username", ">=", lowercaseQuery),
          where("username", "<=", lowercaseQuery + "\uf8ff")
        );
      } else {
        q = query(
          collection(firestore, "Users"),
          where("role", "==", "Journalist")
        );
      }

      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map((doc) => doc.data());
      setSearchResults(results);
      setLoading(false);
    } catch (error) {
      console.error("Error searching for creators:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    clearTimeout(debounceTimer);
    const value = e.target.value;
    setSearchQuery(value);
    debounceTimer = setTimeout(() => {
      handleSearch();
    }, 300); // debounce time in milliseconds
  };

  return (
    <div className="find-creators-container">
      <div className="find-creators-content">
        <h1 className="find-creators-title">Find Journalists</h1>
        <Input
          type="text"
          placeholder="Search for your favorite article genre or journalist username"
          color="blue"
          className="mb-4 search-input"
          value={searchQuery}
          onChange={handleInputChange}
          icon={<MagnifyingGlassIcon className="search-icon" />}
          style={{ padding: "15px", fontSize: "17px", width: "100%" }} // Ensures that the input is taking full width of its parent
        />

        <div className="tags-container" style={{ marginTop: "20px" }}>
          {tags.map((tag) => (
            <Button
              key={tag}
              rounded
              className="rounded-btn mr-2 tag-button"
              color="grey"
              onClick={() => handleTagClick(tag)}
              style={{
                border: "1px solid #ccc",
                padding: "8px 16px",
                fontSize: "16px",
                textTransform: "none",
              }}
            >
              {tag === "Art" && <HeartIcon className="tag-icon" />}
              {tag === "Sports" && <TrophyIcon className="tag-icon" />}
              {tag === "Finance" && <CurrencyDollarIcon className="tag-icon" />}
              {tag === "Politics" && (
                <BuildingLibraryIcon className="tag-icon" />
              )}
              {tag === "News" && <NewspaperIcon className="tag-icon" />}
              {tag}
            </Button>
          ))}
        </div>
        <div className="search-results-box" style={{ height: "200px" }}>
          {searchResults.map((result, index) => (
            <div className="user-card" key={index}>
              <div className="user-image">
                <img
                  src={result.photo || defaultProfilePic}
                  alt={`${result.username}`}
                  className="profile-photo"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = defaultProfilePic;
                  }}
                />
              </div>
              <div className="user-info">
                <Link to={`/${result.username}`} className="username">
                  {result.username}
                </Link>
                <p className="user-details">
                  {result.articleTags?.join(", ") ?? "No tags"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
