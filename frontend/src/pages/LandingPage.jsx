import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/LandingPage/Hero';
import About from '../components/LandingPage/About';
import Achievements from '../components/LandingPage/Achievements';
import Gallery from '../components/LandingPage/Gallery';
import Testimonials from '../components/LandingPage/Testimonials';
import CallToAction from '../components/LandingPage/CallToAction';
import Footer from '../components/LandingPage/Footer';

const LandingPage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <About />
      <Achievements />
      <Gallery />
      <Testimonials />
      <CallToAction />
      <Footer />
    </div>
  );
};

export default LandingPage;