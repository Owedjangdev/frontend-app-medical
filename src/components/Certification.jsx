import React from 'react';

// Importation des assets (logos des certifications)
import C3 from "../assets/C3.png";
import C1 from "../assets/C1.png";
import C2 from "../assets/C2.png";
import C4 from "../assets/C4.svg";
import C5 from "../assets/C5.png";
import C6 from "../assets/C6.png";
import C7 from "../assets/C7.svg";

// Importation des styles centralisés
import { certificationStyles } from "../assets/dummyStyles";

// ==========================================
// CONFIGURATION DES DONNÉES
// On centralise les données pour faciliter la maintenance ou le passage à une API plus tard.
// ==========================================
const certifications = [
  { id: 1, name: "Commission Médicale", image: C1, type: "international" },
  { id: 2, name: "Approuvé par l'État", image: C2, type: "government" },
  { id: 3, name: "Accrédité NABH", image: C3, alt: "Accréditation NABH", type: "healthcare" },
  { id: 4, name: "Conseil Médical", image: C4, type: "government" },
  { id: 5, name: "Qualité des Soins", image: C5, alt: "Qualité des Soins", type: "healthcare" },
  { id: 6, name: "Conseil Paramédical", image: C6, alt: "Sécurité des Patients", type: "healthcare" },
  { id: 7, name: "Ministère de la Santé", image: C7, alt: "Ministère de la Santé", type: "government" }
];

const Certification = () => {
  // ASTUCE : On triple le tableau pour que l'animation de défilement (Marquee) 
  // soit fluide et ne montre jamais de "trou" ou de saut visuel.
  const duplicatedCertifications = [...certifications, ...certifications, ...certifications];

  return (
    <div className={certificationStyles.container}>
      
      {/* --- SECTION ARRIÈRE-PLAN --- */}
      <div className={certificationStyles.backgroundGrid}>
        <div className={certificationStyles.topLine}></div>
        <div className={certificationStyles.gridContainer}>
          <div className={certificationStyles.grid}>
            {/* Génération dynamique d'une grille de fond (144 cellules) pour l'esthétique */}
            {Array.from({ length: 144 }).map((_, i) => (
              <div key={i} className={certificationStyles.gridCell}></div>
            ))}
          </div>
        </div>
      </div>

      {/* --- CONTENEUR DE CONTENU PRINCIPAL --- */}
      <div className={certificationStyles.contentWrapper}>

        {/* --- EN-TÊTE (Titre, Sous-titre et Badge) --- */}
        <div className={certificationStyles.headingContainer}>
          <div className={certificationStyles.headingInner}>
            <div className={certificationStyles.leftLine}></div>
            <div className={certificationStyles.rightLine}></div>
            <h2 className={certificationStyles.title}>
              <span className={certificationStyles.titleText}>
                CERTIFICATION & EXCELLENCE
              </span>
            </h2>
          </div>

          <p className={certificationStyles.subtitle}>
            Normes de santé reconnues par le gouvernement et accréditées au niveau international.
          </p>

          <div className={certificationStyles.badgeContainer}>
            <div className={certificationStyles.badgeDot}></div>
            <span className={certificationStyles.badgeText}>
              OFFICIELLEMENT CERTIFIÉ
            </span>
          </div>
        </div>

        {/* --- SECTION DES LOGOS (SCROLLING INFINI) --- */}
        <div className={certificationStyles.logosContainer}>
          <div className={certificationStyles.logosInner}>
            <div className={certificationStyles.logosFlexContainer}>
              {/* Le conteneur Marquee anime tout ce qui se trouve à l'intérieur via CSS */}
              <div className={certificationStyles.logosMarquee}>
                {duplicatedCertifications.map((cert, index) => (
                  <div
                    key={`cert-${cert.id}-${index}`}
                    className={certificationStyles.logoItem}
                  >
                    <div className={certificationStyles.logoImage}>
                      <img
                        src={cert.image}
                        alt={cert.name}
                        className={certificationStyles.logoImage}
                        loading="lazy" // Optimisation du chargement
                      />
                    </div>
                    <span className={certificationStyles.logoText}>
                      {cert.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Injection des animations CSS spécifiques à ce composant */}
      <style>{certificationStyles.animationStyles}</style>
    </div>
  );
};

export default Certification;