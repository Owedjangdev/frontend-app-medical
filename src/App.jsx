import React, { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { CircleChevronUp } from 'lucide-react'

// Imports des pages
import Home from './pages/Home'
import Doctor from './pages/Doctor'
import DoctorDetails from './pages/DoctorDetails'
import Service from './pages/Service'
import ServiceDetail from './pages/ServiceDetails'
import Contact from './pages/Contact'
import Login from './pages/Login'
import DHome from './pages/DHome'
import List from './Doctor/List'
import EditProfil from './Doctor/EditProfil'
import Appointement from './pages/Appointement'

// ✅ CORRECTION DES CHEMINS : On utilise "./pages/..." car le dossier est dans "src"
import VerifyPaymentPage from "./pages/VerifyPaymentPage"
import VerifyPaymentServicePage from "./pages/VerifyPaymentServicePage"

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const ScrollButton = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  
  return (
    <button
      onClick={scrollTop}
      className={`fixed right-4 bottom-6 z-50 w-11 h-11 rounded-full flex items-center justify-center 
        bg-emerald-600 text-white shadow-lg transition-all duration-300 
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} 
        hover:scale-110 hover:shadow-xl`}
      title="Go to top"
    >
      <CircleChevronUp size={22} />
    </button>
  );
};

const App = () => {
  return (
    <>
      <ScrollToTop />
      <div className="overflow-x-hidden bg-white text-gray-900 min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/doctors" element={<Doctor />} />
          <Route path="/doctors/:id" element={<DoctorDetails />} />
          <Route path="/services" element={<Service />} />
          <Route path="/services/:id" element={<ServiceDetail />} />
          <Route path="/appointments" element={<Appointement />} />
          <Route path="/contact" element={<Contact />} />
          
          <Route path="/doctor-admin/login" element={<Login />} />
          <Route path="/doctor-admin/:id" element={<DHome />} />
          <Route path="/doctor-admin/:id/appointments" element={<List />} />
          <Route path="/doctor-admin/:id/profile/edit" element={<EditProfil />} />

          {/* ✅ Routes de vérification Docteurs */}
          <Route path="/appointment/verify" element={<VerifyPaymentPage />} />
          <Route path="/appointment/cancel" element={<VerifyPaymentPage />} />
          
          {/* ✅ Routes de vérification Services (Commentaire JSX corrigé) */}
          <Route path="/service-appointment/verify" element={<VerifyPaymentServicePage />} />
          <Route path="/service-appointment/cancel" element={<VerifyPaymentServicePage />} />

          <Route path="*" element={<div className="flex h-screen items-center justify-center">404 - Page non trouvée</div>} />
        </Routes>
      </div>
      <ScrollButton />
    </>
  );
};

export default App;