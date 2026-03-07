import React, { useState } from 'react';
import { navbarStylesDr } from '../assets/dummyStyles';
import logo from '../assets/logo.png';
import { useLocation, useParams, NavLink } from 'react-router-dom';
import { LogOut, Home, Calendar, Edit, Menu, X } from "lucide-react";

const DoctorNavbar = () => {
    const [open, setOpen] = useState(false);
    const params = useParams();
    const location = useLocation();

    // Logique d'URL et items de navigation
    const doctorId = params.id;
    const basePath = `/doctor-admin/${doctorId}`;

    const navItems = [
        { name: "Dashboard", to: `${basePath}`, Icon: Home },
        { name: "Appointments", to: `${basePath}/appointments`, Icon: Calendar },
        { name: "Edit Profile", to: `${basePath}/profile/edit`, Icon: Edit },
    ];

    return (
        <nav className={navbarStylesDr.navContainer}>
            {/* Section Gauche : Logo et Texte */}
            <div className={navbarStylesDr.leftBrand}>
                <div className={navbarStylesDr.logoContainer}>
                    <img src={logo} alt="logo" className={navbarStylesDr.logoImage} />
                </div>
                <div className={navbarStylesDr.brandTextContainer}>
                    <div className={navbarStylesDr.brandTitle}>MedTek</div>
                    <div className={navbarStylesDr.brandSubtitle}>Healthcare Solutions</div>
                </div>
            </div>

            {/* Section Centre : Navigation Desktop */}
            <div className={navbarStylesDr.desktopMenu}>
                <div className={navbarStylesDr.desktopMenuItems}>
                    {navItems.map(({ name, to, Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === basePath}
                            className={({ isActive }) => `
                                ${navbarStylesDr.baseLink} ${
                                    isActive 
                                    ? navbarStylesDr.activeLink 
                                    : navbarStylesDr.inactiveLink
                                }
                            `}
                            onClick={() => setOpen(false)}
                        >
                            <span className={navbarStylesDr.linkContent}>
                                <Icon size={16} className={navbarStylesDr.linkIcon} />
                                <span className={navbarStylesDr.linkText}>{name}</span>
                            </span>
                        </NavLink>
                    ))}
                </div>
            </div>

            {/* Section Droite : Logout & Hamburgers */}
            <div className={navbarStylesDr.rightActions}>
                <button 
                    onClick={() => { window.location.href = '/doctor-admin/login'; }} 
                    className={navbarStylesDr.logoutButtonDesktop}
                >
                    <LogOut size={16} />
                    <span>Logout</span>
                </button>

                {/* Boutons Toggle (Mobile & Tablette) */}
                <button onClick={() => setOpen((s) => !s)} className={navbarStylesDr.hamburgerButtonMd}>
                    {open ? <X size={20} /> : <Menu size={20} />}
                </button>
                <button onClick={() => setOpen((s) => !s)} className={navbarStylesDr.hamburgerButtonLg}>
                    {open ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Menu Mobile (Conteneur dynamique) */}
            <div className={navbarStylesDr.mobileMenuContainer(open)}>
                <div className={navbarStylesDr.mobileMenuContent}>
                    {navItems.map(({ name, to, Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === basePath}
                            className={({ isActive }) => `
                                ${navbarStylesDr.mobileBaseLink} ${
                                    isActive 
                                    ? navbarStylesDr.mobileActiveLink 
                                    : navbarStylesDr.mobileInactiveLink
                                }
                            `}
                            onClick={() => setOpen(false)}
                        >
                            <Icon size={18} className="text-emerald-400" />
                            <span>{name}</span>
                        </NavLink>
                    ))}

                    {/* Bouton Logout Mobile */}
                    <button 
                        onClick={() => {
                            setOpen(false);
                            window.location.href = '/doctor-admin/login';
                        }}
                        className={navbarStylesDr.mobileLogoutButton}
                    >
                        <div className={navbarStylesDr.mobileLogoutContent}>
                            <LogOut size={16} />
                            <span>Logout</span>
                        </div>
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default DoctorNavbar;