import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import search from '../images/search.svg';
import logoo from '../images/logoo.png';
import Headroom from 'react-headroom';
import {
  Input,
  Navbar,
  MobileNav,
  Typography,
  Button,
  IconButton,
  

} from "@material-tailwind/react";


//Augustine

function Nav() {


  let [open, setOpen]=useState(false);

  
  

  return (
    //w-full extends the length of the navbar from the left to the right4
    //headroom allows for scrollability 
    <Headroom>
      <div className='shadow-md fixed w-full top-0 left-0 bg-transparent !border-color-white '>
        <div className='md:flex items-center justify-between bg-blue py-4 md:px-10 px-7'>
        <div className='md:flex space-x-4 '>
        
        {/* faq button code */}
          <Button type="submit" variant="contained" color="primary" ripple= {true} variant = "outlined"  style = {{textTransform: 'none',}} className= 'min-w-[120px] bg-bg border-white text-color-white'>
          
          FAQ
          </Button>
          

        </div>
        
          <Link to="/">
          <div className='font-bold text-2xl cursor-pointer flex items-center
            text-white-700 font: Helvetica'>
            
            <span className='text-3xl text-indigo-600 mr-1 pt-2'>
              <ion-icon name="logo-ionic"></ion-icon>
            </span>
            {/* logo */}
            <img src={logoo} alt="My Image" style={{ width: '300px', height: 'auto' }} />

            
          
          </div>
          
          </Link>
          {/* junk code */}
          <div onClick={()=>setOpen(!open)} className='text-3xl absolute right-8 top-6 cursor-pointer md:hidden'>
            <ion-icon name={open ? 'close':'menu'}></ion-icon>
          </div >

          <div className='flex space-x-4 '>

          
            {/* log in button */}
            <Link to="/login">
              <Button type="submit" variant="contained" color="primary" variant = "outlined" ripple= {true}  style = {{textTransform: 'none',}}  className= 'min-w-[120px] bg-bg border-white text-color-white' >

                Log In 
              </Button> 
            </Link>
            <Link to="/signup">
              {/* sign up button */}
              <Button type="submit" variant="contained"  style = {{textTransform: 'none',}} variant = "outlined" ripple= {true} className= 'min-w-[120px]  bg-blue-700 '>

                Sign Up
              </Button>
            </Link>

          </div>
        </div>
      </div>
    </Headroom>
  );
}

///can place navbar on any page and page will have it
export default Nav;