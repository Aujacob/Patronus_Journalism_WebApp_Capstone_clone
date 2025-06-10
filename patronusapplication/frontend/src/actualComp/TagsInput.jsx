import React, { useState } from 'react';
// for inputting tags into article
const TagsInput = ({ tags, onAddTag, onRemoveTag }) => {
  const [inputValue, setInputValue] = useState('');
//for changing the text
  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };
  //Augustine

//actually adding the created tagg
  const handleAddTag = (event) => {
    if (event.key === 'Enter' && inputValue.trim()) {
      onAddTag(inputValue.trim());
      setInputValue('');
    }
  };
  //for the button that adds tags to work
  const handleAddTagButtonClick = (event) => {
    event.preventDefault(); 
    if (inputValue.trim()) {
      onAddTag(inputValue.trim());
      setInputValue('');
    }
  };
//for the removal of tags to work
  const handleRemoveTag = (tag) => {
    onRemoveTag(tag);
  };
//actually displaying the tags created
  const renderTags = () => {
    return tags.map((tag, index) => (
        
      <div key={index} className="tag">
        {tag}
        {onRemoveTag && (
          <button type="button" style={{
            backgroundColor: '#007bff',
            fontSize: '15px',
            color: 'white',
            padding: '0px 5px',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer',
            marginLeft: '10px' // Add margin-left for spacing
          }}  onClick={() => handleRemoveTag(tag)}>
            Remove Tag
          </button>
        )}
      </div>
    ));
  };
//css for all the buttons and inputs mentioned above
  return (
    <div className="tags-input">
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleAddTag}
        placeholder="Add a tag"

      />
      <h1><br/></h1>
      <button style={{ 
      backgroundColor: '#007bff', 
      color: 'white', 
      padding: '0px 5px',      borderRadius: '5px', 
      border: 'none', 
      cursor: 'pointer' }} 
      onClick={handleAddTagButtonClick}>
        Add Tag
      </button>
      <h1><br/></h1>
      {tags.length > 0 && (
        <div className="tag-list">{renderTags()}</div>
      )}
    </div>
  );
};

export default TagsInput;
