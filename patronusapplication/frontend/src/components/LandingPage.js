import React, { useRef, useState } from 'react';
import '../stylecss/LandingPage.css'; // Importing custom CSS styles for the Landing Page
import { Link } from 'react-router-dom'; // Importing Link component from react-router-dom for navigation
import Nav from '../actualComp/Nav'; 
import {
  Input,
  Navbar,
  MobileNav,
  Typography,
  Button,
  IconButton,
  Accordion,
  AccordionHeader,
  AccordionBody,
} from "@material-tailwind/react"; // Importing UI components from Material Tailwind library
import '../stylecss/GradientBackground.css';


// Custom Accordion component with predefined styles
export function AccordionCustomStyles() {
  const [open, setOpen] = React.useState(1);
 
  // Function to handle accordion header click and toggle open/close state
  const handleOpen = (value) => setOpen(open === value ? 0 : value);
 
  return (
    <>
      <Accordion open={open === 1} className="mb-2 rounded-lg border border-blue-gray-100 px-4">
        <AccordionHeader
          onClick={() => handleOpen(1)}
          className={`border-b-0 transition-colors ${
            open === 1 ? "text-blue-500 hover:!text-blue-700" : ""
          }`}
        >
          What is a Patronus Journal?
        </AccordionHeader>
        <AccordionBody style={{ textAlign: 'left' }} className="pt-0 text-base font-normal">
        Patronus offers a digital platform dedicated to empowering creators and journalists by
        providing them with a space to share their work, insights, and perspectives, with a wider audience.
        </AccordionBody>
      </Accordion>
      <Accordion open={open === 2} className="mb-2 rounded-lg border border-blue-gray-100 px-4">
        <AccordionHeader
          onClick={() => handleOpen(2)}
          className={`border-b-0 transition-colors ${
            open === 2 ? "text-blue-500 hover:!text-blue-700" : ""
          }`}
        >
          Do I need to pay for a Patronus Journal?
        </AccordionHeader>
        <AccordionBody style={{ textAlign: 'left' }} className="pt-0 text-base font-normal">
        It's free to get started on Patronus. If you turn on paid subscriptions, 
        Patronus will keep a 10% cut of revenues for operating costs like development and customer support. There is no hidden fees and we only make money when writers do.
        </AccordionBody>
      </Accordion>
      <Accordion open={open === 3} className="rounded-lg border border-blue-gray-100 px-4">
        <AccordionHeader
          onClick={() => handleOpen(3)}
          className={`border-b-0 transition-colors ${
            open === 3 ? "text-blue-500 hover:!text-blue-700" : ""
          }`}
        >
          Do I own what I publish on Patronus?
        </AccordionHeader>
        <AccordionBody style={{ textAlign: 'left' }} className="pt-0 text-base font-normal">
        You always own your own content and your relationships with your audience.
        </AccordionBody>
      </Accordion>
    </>
  );
}
//Augustine here I made the landing page and the original style and the faq component, and noura added her own style to it

// Main Landing Page component
function LandingPage() {

const faqRef = useRef(null);
const [open, setOpen] = useState(0); // Default none open
//alows scrolling to faq component
const scrollToFAQ = () => {
  if (faqRef.current) {
    faqRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

// Function to handle open/close state of sections
const handleOpen = (value) => setOpen(open === value ? 0 : value);
  

//actual rendering of landing page
  return (
    <div><Nav />
      <div className="landing">
        <div className="bg1">
        
          <div className="main-content">
            <h1>Connect to Stories,<br/>Change the Narrative</h1>
            <p>Where direct subscriptions power independent journalism</p>
            <Button 
            onClick={scrollToFAQ} // onClick event handler
            variant="contained" 
            color="primary" 
            className='min-w-[120px] bg-blue-700' 
            style={{ textTransform: 'none' }}
          >
            Learn More
          </Button> 
            
            
          </div>
        </div>

        <div className="bg3" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingRight: '100px', textAlign: 'right' }}>
  <h1 style={{ maxWidth: '650px', marginBottom: '20px' }}>Transforming the Digital News Landscape</h1>
  <p style={{ maxWidth: '650px', marginBottom: '20px' }}>
    Our platform revolutionizes the way
    News Organizations deliver value to their audience.
  </p>
  <div style={{ display: 'flex', justifyContent: 'flex-end', width: '650px', paddingTop: '20px' }}>
  {/* link to sign up page */}
    <Link to="/signup">
      <Button type="submit" variant="contained" color="primary" className='min-w-[120px] bg-blue-700' style={{ textTransform: 'none' }}>
        Subscribe Now
      </Button>
    </Link>
  </div>


        </div>
        {/* FAQ button */}
      <div className='faq' ref={faqRef}>
        <h1 className='faq-title'>Patronus Basics FAQ</h1>
        <div className="text-center">
          <AccordionCustomStyles />
        </div>
        </div>
        <div className="bg5">
          <div className="content5">
          <h1></h1>
            <h1>Get Started in Minutes</h1>

            </div>
            {/* link to sign up page */}
            <div className="buttoncenter">
              <Link to="/signup">
                <Button type="submit" variant="contained" color="primary" className= 'min-w-[10px] bg-blue-700' style = {{textTransform: 'none',}}>
                  Create Your Patronus Journal
                </Button> 
              </Link>
            </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
