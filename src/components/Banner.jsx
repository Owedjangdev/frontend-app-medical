
import { useNavigate } from 'react-router-dom';

import { bannerStyles } from '../assets/dummyStyles';

import { 
  Stethoscope, 
  Star, 
  Ribbon, 
  Clock, 
  ShieldUser, 
  User, 
  Calendar, 
  Phone  
} from "lucide-react";
// Importation de l'image principale de la bannière
import banner from "../assets/BannerImg.png";

const Banner = () => {
 
    const navigate = useNavigate();

  return (
    <div className={bannerStyles.bannerContainer}>
      <div className={bannerStyles.mainContainer}>
        
        {/* --- EFFETS DE BORDURE ANIMÉS --- */}
        {/* Cette section gère l'aspect visuel "néon" ou animé autour du contenu principal */}
        <div className={bannerStyles.borderOutline}>
          <div className={bannerStyles.outerAnimatedBand}></div>
          <div className={bannerStyles.innerWhiteBorder}></div>
        </div>

        <div className={bannerStyles.contentContainer}>
          <div className={bannerStyles.flexContainer}>
            
            {/* ==========================================
                PARTIE GAUCHE : Textes et Boutons d'action
                ========================================== */}
            <div className={bannerStyles.leftContent}>
              
              {/* Badge d'en-tête (Stéthoscope + Nom de la marque) */}
              <div className={bannerStyles.headerBadgeContainer}>
                <div className={bannerStyles.stethoscopeContainer}>
                  <div className={bannerStyles.stethoscopeInner}>
                    <Stethoscope className={bannerStyles.stethoscopeIcon}/>
                  </div>
                </div>

                <div className={bannerStyles.titleContainer}>
                  <h1 className={bannerStyles.title}>
                    Medi
                    <span className={bannerStyles.titleGradient}>Cals</span>
                  </h1>
                </div>
              </div>

              {/* Section des étoiles (Preuve sociale) */}
              <div className={bannerStyles.starsContainer}>
                <div className={bannerStyles.starsInner}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star className={bannerStyles.starIcon} key={star} />
                  ))}
                </div>
              </div>

              {/* Slogan principal (Tagline) */}
              <p className={bannerStyles.tagline}>
                Des soins de santé d'excellence
                <span className={`block ${bannerStyles.taglineHighlight}`}>
                  À portée de main
                </span>
              </p>

              {/* Grille des caractéristiques clés (Features) */}
              <div className={bannerStyles.featuresGrid}>
                <div>
                  {/* Spécialistes Certifiés */}
                  <div className={`${bannerStyles.featureItem} ${bannerStyles.featureBorderGreen}`}>
                    <Ribbon className={bannerStyles.featureIcon} />
                    <span className={bannerStyles.featureText}>
                      Spécialistes certifiés
                    </span>
                  </div>

                  {/* Disponibilité 24/7 */}
                  <div className={`${bannerStyles.featureItem} ${bannerStyles.featureBorderBlue}`}>
                    <Clock className={bannerStyles.featureIcon} />
                    <span className={bannerStyles.featureText}>
                      Disponible 24/7
                    </span>
                  </div>
                </div>

                <div>
                  {/* Sécurité des données */}
                  <div className={`${bannerStyles.featureItem} ${bannerStyles.featureBorderEmerald}`}>
                    <ShieldUser className={bannerStyles.featureIcon} />
                    <span className={bannerStyles.featureText}>
                      Sûr & Sécurisé
                    </span>
                  </div>

                  {/* Nombre de médecins */}
                  <div className={`${bannerStyles.featureItem} ${bannerStyles.featureBorderPurple}`}>
                    <User className={bannerStyles.featureIcon} />
                    <span className={bannerStyles.featureText}>
                     +500 Médecins
                    </span>
                  </div>
                </div>

                {/* --- BOUTONS D'ACTION (CTA) --- */}
                
                {/* Bouton pour prendre rendez-vous (Navigation interne) */}
                <button
                  onClick={() => navigate("/doctors")}
                  className={bannerStyles.bookButton}
                >
                  <div className={bannerStyles.bookButtonOverlay}></div>
                  <div className={bannerStyles.bookButtonContent}>
                    <Calendar className={bannerStyles.bookButtonIcon} />
                    <span>Prendre rendez-vous</span>
                  </div>
                </button>

                {/* Bouton d'urgence (Appel direct via protocole tel:) */}
                <button
                  onClick={() => (window.location.href = "tel:8299431275")}
                  className={bannerStyles.emergencyButton}
                >
                  <div className={bannerStyles.emergencyButtonContent}>
                    <Phone className={bannerStyles.emergencyButtonIcon} />
                    <span>Appel d'urgence</span>
                  </div>
                </button>
              </div>
            </div>

            {/* ==========================================
                PARTIE DROITE : Image de présentation
                ========================================== */}
            <div className={bannerStyles.rightImageSection}>
              <div className={bannerStyles.imageContainer}>
                <div className={bannerStyles.imageFrame}>
                  <img
                    src={banner}
                    alt="Illustration médicale MediCals"
                    className={bannerStyles.image}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;