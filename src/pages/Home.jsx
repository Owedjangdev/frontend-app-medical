import React from 'react'

import Banner from '../components/Banner'
import Certification from '../components/Certification'
import HomeDoctors from '../components/HomeDoctor'
import Testiomonial from "../components/Testimonial"
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
const Home = () => {
  return (
    <div>
     <Navbar />
       <Banner/>
    <Certification/>
    <HomeDoctors/>
   <Testiomonial/>

   <Footer/>
    </div>
  )
}

export default Home