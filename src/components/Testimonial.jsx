// Importation de React et des Hooks nécessaires
// useRef : pour accéder directement aux éléments du DOM (les conteneurs qui défilent)
// useState : pour gérer l'état (ex: savoir si l'animation est en pause ou non)
// useEffect : pour exécuter du code après l'affichage du composant (ici, l'animation)
import React, { useRef, useState, useEffect } from "react";

// Importation de l'icône "Étoile" pour les notes
import { Star } from "lucide-react";

// Importation des styles
import { testimonialStyles } from "../assets/dummyStyles";

const Testimonial = () => {
  // ==========================================
  // RÉFÉRENCES ET ÉTATS
  // ==========================================
  
  // Références pour cibler les conteneurs HTML des deux colonnes (gauche et droite)
  const scrollRefLeft = useRef(null);
  const scrollRefRight = useRef(null);
  
  // État pour mettre l'animation en pause lorsque l'utilisateur survole avec sa souris ou touche l'écran
  const [isPaused, setIsPaused] = useState(false);

  // ==========================================
  // DONNÉES DES TÉMOIGNAGES
  // ==========================================
  const testimonials = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      role: "Cardiologue", // Traduit
      rating: 5,
      text: "Le système de prise de rendez-vous est incroyablement efficace. Il me fait gagner un temps précieux et m'aide à me concentrer sur les soins aux patients.", // Traduit
      image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
      type: "doctor", // Gardé en anglais car c'est utilisé pour la logique de filtrage
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Patient",
      rating: 5,
      text: "Prendre rendez-vous n'a jamais été aussi simple. L'interface est intuitive et les rappels sont très utiles !",
      image: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=400&q=80",
      type: "patient",
    },
    {
      id: 3,
      name: "Dr. Robert Martinez",
      role: "Pédiatre",
      rating: 4,
      text: "Cette plateforme a considérablement simplifié les opérations de notre clinique. La gestion des patients est beaucoup plus organisée.",
      image: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=400&q=80",
      type: "doctor",
    },
    {
      id: 4,
      name: "Emily Williams",
      role: "Patient",
      rating: 5,
      text: "Pouvoir prendre rendez-vous en ligne 24h/24 et 7j/7 change la donne. Le système de confirmation me rassure.",
      image: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=400&q=80",
      type: "patient",
    },
    {
      id: 5,
      name: "Dr. Amanda Lee",
      role: "Dermatologue",
      rating: 5,
      text: "Excellente plateforme pour gérer les rendez-vous. Les rappels automatisés réduisent considérablement les absences.",
      image: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=400&q=80",
      type: "doctor",
    },
    {
      id: 6,
      name: "David Thompson",
      role: "Patient",
      rating: 5,
      text: "Le temps d'attente a considérablement diminué depuis que j'utilise cette plateforme. Très pratique et facile à utiliser.",
      image: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=400&q=80",
      type: "patient",
    },
  ];

  // Séparation des données en deux tableaux : un pour les médecins, un pour les patients
  const leftTestimonials = testimonials.filter((t) => t.type === "doctor");
  const rightTestimonials = testimonials.filter((t) => t.type === "patient");

  // ==========================================
  // EFFET D'ANIMATION (Défilement continu)
  // ==========================================
  useEffect(() => {
    // Récupération des éléments DOM via les références
    const scrollLeft = scrollRefLeft.current;
    const scrollRight = scrollRefRight.current;
    
    // Si les éléments n'existent pas encore dans le DOM, on arrête là
    if (!scrollLeft || !scrollRight) return;

    const scrollSpeed = 0.5; // Vitesse de défilement
    let rafId; // Identifiant de l'animation (pour pouvoir l'annuler si besoin)

    // Fonction qui gère le défilement fluide
    const smoothScroll = () => {
      // Si l'animation n'est PAS en pause
      if (!isPaused) {
        // La colonne de gauche défile vers le bas
        scrollLeft.scrollTop += scrollSpeed;
        // La colonne de droite défile vers le haut
        scrollRight.scrollTop -= scrollSpeed;

        // Logique de boucle infinie (seamless loop) :
        // Note : Plus bas dans le code, on double les tableaux ([...liste, ...liste]) 
        // pour que la hauteur totale soit doublée. Quand on arrive à la moitié de la hauteur (scrollHeight / 2),
        // on revient au début instantanément (sans que ça se voie) pour créer l'illusion d'un défilement infini.
        if (scrollLeft.scrollTop >= scrollLeft.scrollHeight / 2) {
          scrollLeft.scrollTop = 0;
        }
        if (scrollRight.scrollTop <= 0) {
          scrollRight.scrollTop = scrollRight.scrollHeight / 2;
        }
      }
      // requestAnimationFrame appelle la fonction smoothScroll 60 fois par seconde pour une animation très fluide
      rafId = requestAnimationFrame(smoothScroll);
    };

    // Démarrage de l'animation
    rafId = requestAnimationFrame(smoothScroll);
    
    // Nettoyage de l'effet quand le composant est démonté pour éviter les fuites de mémoire
    return () => cancelAnimationFrame(rafId);
    
  // Ce useEffect se relancera si `isPaused` change d'état
  }, [isPaused]);

  // ==========================================
  // FONCTIONS ET SOUS-COMPOSANTS D'AIDE
  // ==========================================

  // Fonction pour générer visuellement les étoiles (5 au total)
  const renderStars = (rating) =>
    // Crée un tableau de 5 éléments et le parcourt
    Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        // Si l'index est inférieur à la note (rating), l'étoile est "active" (colorée), sinon "inactive" (grisée)
        className={
          i < rating
            ? testimonialStyles.activeStar
            : testimonialStyles.inactiveStar
        }
      >
        <Star className={testimonialStyles.star} />
      </span>
    ));

  // Sous-composant qui représente UNE carte de témoignage
  // Il prend en paramètres (props) les données du témoignage et la direction (gauche ou droite) pour appliquer les bons styles
  const TestimonialCard = ({ testimonial, direction }) => (
    <div
      className={`${testimonialStyles.testimonialCard} ${
        direction === "left"
          ? testimonialStyles.leftCardBorder
          : testimonialStyles.rightCardBorder
      }`}
    >
      <div className={testimonialStyles.cardContent}>
        {/* Photo de profil */}
        <img
          src={testimonial.image}
          alt={testimonial.name}
          className={testimonialStyles.avatar}
        />
        <div className={testimonialStyles.textContainer}>
          <div className={testimonialStyles.nameRoleContainer}>
            <div>
              {/* Nom du testeur */}
              <h4
                className={`${testimonialStyles.name} ${
                  direction === "left"
                    ? testimonialStyles.leftName
                    : testimonialStyles.rightName
                }`}
              >
                {testimonial.name}
              </h4>
              {/* Rôle du testeur (Cardiologue, Patient, etc.) */}
              <p className={testimonialStyles.role}>{testimonial.role}</p>
            </div>
            
            {/* Affichage des étoiles — visible uniquement sur grand écran (géré via CSS) */}
            <div className={testimonialStyles.starsContainer}>
              {renderStars(testimonial.rating)}
            </div>
          </div>

          {/* Texte du témoignage */}
          <p className={testimonialStyles.quote}>"{testimonial.text}"</p>

          {/* Affichage des étoiles adapté pour les écrans mobiles */}
          <div className={testimonialStyles.mobileStarsContainer}>
            {renderStars(testimonial.rating)}
          </div>
        </div>
      </div>
    </div>
  );

  // ==========================================
  // RENDU PRINCIPAL DU COMPOSANT
  // ==========================================
  return (
    <div className={testimonialStyles.container}>
      
      {/* En-tête de la section */}
      <div className={testimonialStyles.headerContainer}>
        <h2 className={testimonialStyles.title}>La Voix de la Confiance</h2>
        <p className={testimonialStyles.subtitle}>
          Des histoires vraies de médecins et de patients partageant leurs expériences positives avec notre plateforme de santé.
        </p>
      </div>

      {/* Grille à 2 colonnes avec gestion de la pause au survol de la souris */}
      <div
        className={testimonialStyles.grid}
        onMouseEnter={() => setIsPaused(true)} // Met en pause quand la souris entre
        onMouseLeave={() => setIsPaused(false)} // Reprend quand la souris sort
      >
        
        {/* ==========================================
            COLONNE GAUCHE : Professionnels de santé
            ========================================== */}
        <div
          className={`${testimonialStyles.columnContainer} ${testimonialStyles.leftColumnBorder}`}
        >
          <div
            className={`${testimonialStyles.columnHeader} ${testimonialStyles.leftColumnHeader}`}
          >
            🧑‍⚕️ Professionnels de Santé
          </div>
          <div
            className={testimonialStyles.scrollContainer}
            ref={scrollRefLeft} // Connexion de la référence pour l'animation
            onTouchStart={() => setIsPaused(true)} // Met en pause sur mobile (toucher)
            onTouchEnd={() => setIsPaused(false)} // Reprend sur mobile (fin du toucher)
          >
            {/* On double le tableau [...liste, ...liste] pour permettre l'effet de boucle infinie visuelle */}
            {[...leftTestimonials, ...leftTestimonials].map((t, i) => (
              <TestimonialCard key={`L-${i}`} testimonial={t} direction="left" />
            ))}
          </div>
        </div>

        {/* ==========================================
            COLONNE DROITE : Patients
            ========================================== */}
        <div
          className={`${testimonialStyles.columnContainer} ${testimonialStyles.rightColumnBorder}`}
        >
          <div
            className={`${testimonialStyles.columnHeader} ${testimonialStyles.rightColumnHeader}`}
          >
            🧑 Patients
          </div>
          <div
            className={testimonialStyles.scrollContainer}
            ref={scrollRefRight} // Connexion de la référence pour l'animation
            onTouchStart={() => setIsPaused(true)} // Met en pause sur mobile
            onTouchEnd={() => setIsPaused(false)} // Reprend sur mobile
          >
            {/* Même technique de duplication du tableau pour le défilement infini */}
            {[...rightTestimonials, ...rightTestimonials].map((t, i) => (
              <TestimonialCard key={`R-${i}`} testimonial={t} direction="right" />
            ))}
          </div>
        </div>
      </div>

      {/* Injection des styles CSS qui gèrent potentiellement des animations complémentaires */}
      <style>{testimonialStyles.animationStyles}</style>
    </div>
  );
};

export default Testimonial;