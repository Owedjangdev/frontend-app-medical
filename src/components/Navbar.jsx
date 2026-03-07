import React, { useRef, useState , useEffect} from "react";
import { navbarStyles } from "../assets/dummyStyles";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";
import logo from "../assets/logo.png";
import { User, Key, Menu, X } from "lucide-react";
import { SignedOut, SignedIn , UserButton} from "@clerk/clerk-react";
const STORAGE_KEY = "doctorToken_v1";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // Vérification de l'état de connexion du docteur via le localStorage
  const [isDoctorLoggedIn, setIsDoctorLoggedIn] = useState(() => {
    try {
      return Boolean(localStorage.getItem(STORAGE_KEY));
    } catch {
      return false;
    }
  });




  useEffect(() => {
    const handleScroll = () => {
        const currentScrollY = window.scrollY;
        if (currentScrollY > lastScrollY && currentScrollY > 80) {
            setShowNavbar(false);
        } else {
            setShowNavbar(true);
        }
        setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
}, [lastScrollY]);





useEffect(() => {
    const onStorage = (e) => {
        if (e.key === STORAGE_KEY) {
            setIsDoctorLoggedIn(Boolean(e.newValue));
        }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
}, []);



useEffect(() => {
    const handleClickOutside = (event) => {
        if (isOpen && navRef.current && !navRef.current.contains(event.target)) {
            setIsOpen(false);
        }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
}, [isOpen]);




  const location = useLocation();
  const navRef = useRef(null);
  const clerk = useClerk();
  const navigate = useNavigate();

  const navItems = [
  { label: "Home", href: "/" },
  { label: "Docteur", href: "/doctors" },
  { label: "Services", href: "/services" },
  { label: "Rendez-vous", href: "/appointments" },
  { label: "Contact", href: "/contact" },
];

  return (
    <>
      {/* Injection des styles d'animation spécifiques */}
      <style>{navbarStyles.animationStyles}</style>

       {/* Ligne de bordure animée */}
       <div className={navbarStyles.navbarBorder}></div>

      {/* Conteneur de la Nav avec gestion de visibilité (Scroll) */}
      <nav    ref={navRef} className={`${navbarStyles.navbarContainer} ${
        showNavbar ? navbarStyles.navbarVisible : navbarStyles.navbarHidden
      }`}>
        <div className={navbarStyles.contentWrapper}>
          <div className={navbarStyles.flexContainer}>
            
            {/* Logo Section */}
            <Link to="/" className={navbarStyles.logoLink}>
              <div className={navbarStyles.logoContainer}>
                <div className={navbarStyles.logoImageWrapper}>
                  <img src={logo} alt="logo" className={navbarStyles.logoImage} />
                </div>
              </div>
              {/* Le texte du logo peut être ajouté ici selon tes styles */}
              <div className={navbarStyles.logoTextContainer}>
    <h1 className={navbarStyles.logoTitle}>Medicals

    </h1>
    <p className={navbarStyles.logoSubtitle}>
        Solutions de santé 
    </p>
</div>
            </Link>

            {/* Liens de navigation et boutons d'action ici */}


            <div className={navbarStyles.desktopNav}>
    <div className={navbarStyles.navItemsContainer}>
        {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
                <Link 
                    key={item.href} 
                    to={item.href}
                    className={`${navbarStyles.navItem} ${
                        isActive 
                            ? navbarStyles.navItemActive 
                            : navbarStyles.navItemInactive
                    }`}
                >
                    {item.label}
                </Link>
            );
        })}
    </div>
</div>
{/*Section de droite avec le bouton "Doctor Admin" visible uniquement si le docteur n'est pas connecté */}
<div className={navbarStyles.rightContainer}>
    <SignedOut>
        <Link 
            to="/doctor-admin/login" 
            className={navbarStyles.doctorAdminButton}
        >
            <User className={navbarStyles.doctorAdminIcon} />
            <span className={navbarStyles.doctorAdminText}>
                Doctor Admin
            </span>
        </Link>

        {/* Connexion patient */}
        <button
            onClick={() => clerk.openSignIn()}
            className={navbarStyles.loginButton}
        >
            <Key className={navbarStyles.loginIcon} />
            Login
        </button>
    </SignedOut>

<SignedIn>
        <UserButton afterSignOutUrl="/" />
    </SignedIn>


   
</div>

 {/* to toggle */}
<button
    onClick={() => setIsOpen(!isOpen)}
    className={navbarStyles.mobileToggle}
>
    {isOpen ? (
        <X className={navbarStyles.toggleIcon} />
    ) : (
        <Menu className={navbarStyles.toggleIcon} />
    )}
</button>





          </div>
        </div>

{/* Menu mobile qui s'affiche lorsque isOpen est true */  }
        {isOpen && (
    <div className={navbarStyles.mobileMenu}>
        {navItems.map((item, idx) => {
            const isActive = location.pathname === item.href;
            return (
                <Link
                    key={idx}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`${navbarStyles.mobileMenuItem} ${
                        isActive
                            ? navbarStyles.mobileMenuItemActive
                            : navbarStyles.mobileMenuItemInactive
                    }`}
                >
                    {item.label}
                </Link>
            );
        })}

<SignedOut>
            <Link 
                to="/doctor-admin/login"
                className={navbarStyles.mobileDoctorAdminButton}
                onClick={() => setIsOpen(false)}
            >
                Doctor Admin
            </Link>

            <button
                onClick={() => {
                    setIsOpen(false);
                    clerk.openSignIn();
                }}
                className={navbarStyles.mobileLoginButton}
            >
                Login
            </button>
        </SignedOut>


    </div>
)}








      </nav>
    </>
  );
};

export default Navbar;
