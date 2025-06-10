import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
//Augustine
function Footer() {
  //disqus required code
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    //code given to me by disqus
    const script = document.createElement('script');
    script.src = 'https://patronusjournalism-2.disqus.com/embed.js';
    script.async = true;
    script.setAttribute('data-timestamp', +new Date());
    (document.head || document.body).appendChild(script);

    const disqus_config = function() {
      this.page.url = location.pathname + location.search; // Combine path and query string
      // additional logic for generating a unique identifier, add it here
      this.page.identifier = ''; // Replace with a unique identifier
    };
  }, [location.pathname, location.search]);

  return (
 
      <div>
        {/* Your article content */}
        <div id="disqus_thread"></div>
      </div>
    
  );
}

//footer can be placed anywhere and disqus comments will load
export default Footer;
