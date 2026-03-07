// Importation de React pour créer le composant
import React from 'react';

// Importation des styles (qui semblent être gérés via un fichier externe ou un objet)
import { footerStyles } from '../assets/dummyStyles';

// Importation de l'image du logo
import logo from '../assets/logo.png';

// Importation de 'Link' depuis react-router-dom pour gérer la navigation sans recharger la page
import { Link } from 'react-router-dom';

// Importation des icônes depuis la bibliothèque 'lucide-react'
import {
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Activity,
  Stethoscope,
} from "lucide-react";

// ==========================================
// DONNÉES STATIQUES (Listes de liens et services)
// Le fait d'utiliser des tableaux ici permet de garder le code JSX (plus bas) propre et facile à modifier.
// ==========================================

// Liste des liens de navigation rapides
const quickLinks = [
  { name: "Accueil", href: "/" },
  { name: "Médecins", href: "/doctors" },
  { name: "Services", href: "/services" },
  { name: "Contact", href: "/contact" },
  { name: "Rendez-vous", href: "/appointments" },
];

// Liste des services médicaux proposés
const services = [
  { name: "Contrôle de tension", href: "/services" },
  { name: "Test de glycémie", href: "/services" },
  { name: "Numération formule sanguine", href: "/services" },
  { name: "Radiographie", href: "/services" },
  { name: "Test de glycémie", href: "/services" }, // Note: Ce service était en doublon dans le code original
];

// Liste des réseaux sociaux avec leurs icônes, couleurs et liens respectifs
const socialLinks = [
  { Icon: Facebook, color: footerStyles.facebookColor, name: "Facebook", href: "https://www.facebook.com/people/Hexagon-Digital-Services/61567156598660/" },
  { Icon: Twitter, color: footerStyles.twitterColor, name: "Twitter", href: "https://www.linkedin.com/company/hexagondigtial-services/" }, // Attention, c'est un lien LinkedIn dans le code original, mais je l'ai laissé tel quel
  { Icon: Instagram, color: footerStyles.instagramColor, name: "Instagram", href: "http://instagram.com/hexagondigitalservices" },
  { Icon: Linkedin, color: footerStyles.linkedinColor, name: "LinkedIn", href: "https://www.linkedin.com/company/hexagondigtial-services/" },
  { Icon: Youtube, color: footerStyles.youtubeColor, name: "YouTube", href: "https://youtube.com/@hexagondigitalservices" },
];

// ==========================================
// COMPOSANT PRINCIPAL : Footer
// ==========================================
const Footer = () => {
  // Récupère l'année actuelle de manière dynamique pour le copyright (ex: 2026)
  const currentYear = new Date().getFullYear();

  return (
    // Conteneur principal du pied de page
    <footer className={footerStyles.footerContainer}>

      {/* --- Éléments Décoratifs : Icônes flottantes en arrière-plan --- */}
      <div className={footerStyles.floatingIcon1}>
        <Stethoscope className={footerStyles.stethoscopeIcon} />
      </div>
      <div className={footerStyles.floatingIcon2}>
        <Activity className={footerStyles.activityIcon} />
      </div>

      <div className={footerStyles.mainContent}>
        {/* Système de grille pour organiser les 4 colonnes du footer */}
        <div className={footerStyles.gridContainer}>

          {/* ==========================================
              COLONNE 1 : Informations sur l'entreprise (Logo, Description, Contact)
              ========================================== */}
          <div className={footerStyles.companySection}>
            {/* En-tête de la colonne : Logo et Nom */}
            <div className={footerStyles.logoContainer}>
              <img src={logo} alt="Logo de l'entreprise" className={footerStyles.logoImage} />
              <div>
                <h2 className={footerStyles.companyName}>MediCare</h2>
                <p className={footerStyles.companyTagline}>Solutions de Santé</p>
              </div>
            </div>

            {/* Brève description de l'entreprise */}
            <p className={footerStyles.companyDescription}>
              Votre partenaire de confiance dans l'innovation en matière de santé. 
              Nous nous engageons à fournir des soins médicaux exceptionnels avec une technologie de pointe et un service empathique.
            </p>

            {/* Coordonnées de contact (Téléphone, Email, Adresse) */}
            <div className={footerStyles.contactContainer}>
              <div className={footerStyles.contactItem}>
                <div className={footerStyles.contactIconWrapper}>
                  <Phone className={footerStyles.contactIcon} />
                </div>
                <span className={footerStyles.contactText}>+229 01 54 21 56 93</span>
              </div>
              <div className={footerStyles.contactItem}>
                <div className={footerStyles.contactIconWrapper}>
                  <Mail className={footerStyles.contactIcon} />
                </div>
                <span className={footerStyles.contactText}>epiphanedev@gmail.com</span>
              </div>
              <div className={footerStyles.contactItem}>
                <div className={footerStyles.contactIconWrapper}>
                  <MapPin className={footerStyles.contactIcon} />
                </div>
                <span className={footerStyles.contactText}>Lucknow, Inde</span>
              </div>
            </div>
          </div>

          {/* ==========================================
              COLONNE 2 : Liens Rapides de navigation
              ========================================== */}
          <div className={footerStyles.linksSection}>
            <h3 className={footerStyles.sectionTitle}>Liens Rapides</h3>
            <ul className={footerStyles.linksList}>
              {/* On utilise la méthode .map() pour parcourir le tableau quickLinks défini plus haut et générer une balise <li> pour chaque lien */}
              {quickLinks.map((link, index) => (
                <li key={link.name} className={footerStyles.linkItem}>
                  <Link
                    to={link.href}
                    className={footerStyles.quickLink}
                    // Ajout d'un léger délai d'animation (cascade) basé sur l'index de l'élément
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={footerStyles.quickLinkIconWrapper}>
                      <ArrowRight className={footerStyles.quickLinkIcon} />
                    </div>
                    <span>{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ==========================================
              COLONNE 3 : Nos Services
              ========================================== */}
          <div className={footerStyles.linksSection}>
            <h3 className={footerStyles.sectionTitle}>Nos Services</h3>
            <ul className={footerStyles.linksList}>
              {/* Même principe : on boucle sur le tableau services */}
              {services.map((service, index) => (
                // Utilisation de l'index comme clé (attention : il est préférable d'utiliser un ID unique si possible)
                <li key={index}>
                  <Link to={service.href} className={footerStyles.serviceLink}>
                    <span className={footerStyles.serviceIcon}></span>
                    <span>{service.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ==========================================
              COLONNE 4 : Newsletter et Réseaux Sociaux
              ========================================== */}
          <div className={footerStyles.newsletterSection}>
            <h3 className={footerStyles.newsletterTitle}>Restez Connectés</h3>
            <p className={footerStyles.newsletterDescription}>
              Abonnez-vous pour recevoir des conseils de santé, des mises à jour médicales et des informations sur le bien-être directement dans votre boîte de réception.
            </p>

            {/* Formulaire de Newsletter version Mobile */}
            <div className={footerStyles.mobileNewsletterContainer}>
              <input
                type="email"
                placeholder="Entrez votre e-mail"
                className={footerStyles.emailInput}
              />
              <button className={footerStyles.mobileSubscribeButton}>
                S'abonner
              </button>
            </div>

            {/* Formulaire de Newsletter version Bureau (Desktop) */}
            <div className={footerStyles.desktopNewsletterContainer}>
              <input
                type="email"
                placeholder="Entrez votre e-mail"
                className={footerStyles.desktopEmailInput}
              />
              <button className={footerStyles.desktopSubscribeButton}>
                <span className={footerStyles.desktopButtonText}>S'abonner</span>
              </button>
            </div>

            {/* Icônes des réseaux sociaux */}
            <div className={footerStyles.socialContainer}>
              {/* On déstructure directement les propriétés (Icon, color, name, href) lors du .map() */}
              {socialLinks.map(({ Icon, color, name, href }, index) => (
                <a
                  key={name}
                  href={href}
                  target="_blank" // Ouvre le lien dans un nouvel onglet
                  rel="noopener noreferrer" // Bonne pratique de sécurité lors de l'utilisation de target="_blank"
                  className={`${footerStyles.socialLink} ${color}`}
                  aria-label={name} // Améliore l'accessibilité (lecteurs d'écran)
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <div className={footerStyles.socialIconBackground} />
                  <Icon className={footerStyles.socialIcon} />
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* ==========================================
            BARRE INFÉRIEURE : Copyright et Crédits
            ========================================== */}
        <div className={footerStyles.bottomSection}>
          <div className={footerStyles.copyright}>
            {/* Affiche l'année actuelle dynamiquement */}
            <span>&copy; {currentYear} MediCals</span>
          </div>
          <div className={footerStyles.designerText}>
            <span>Conçu par </span>
            <a
              href="https://houehanouepiphane.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className={footerStyles.designerLink}
            >
             OweDev Digitaly
            </a>
          </div>
        </div>
      </div>

      {/* Injection des styles d'animation s'ils existent dans l'objet footerStyles */}
      <style>{footerStyles.animationStyles}</style>
    </footer>
  );
};

// Exportation du composant pour pouvoir l'utiliser ailleurs dans l'application
export default Footer;