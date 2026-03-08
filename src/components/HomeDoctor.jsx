import React, { useState, useEffect } from 'react';
import { homeDoctorsStyles, iconSize } from '../assets/dummyStyles';
import { Link } from 'react-router-dom';
import { Medal, ChevronRight, MousePointer2Off } from "lucide-react";

const API_BASE = 'https://backend-app-medical.onrender.com';

const HomeDoctors = ({ previewCount = 8 }) => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const normalizeDoctors = (items) =>
        (Array.isArray(items) ? items : []).map((d) => ({
            id: d._id || d.id,
            name: d.name || "Inconnu",
            specialization: d.specialization || "Généraliste",
            image: d.imageUrl || d.image || d.imageSmall || d.imageSrc || "",
            experience: d.experience || d.experience === 0 ? String(d.experience) : "0",
            fee: d.fee ?? d.price ?? 0,
        
            available:
                typeof d.availability === "string"
                    ? d.availability === "Disponible" ||
                      d.availability.toLowerCase() === "available"
                    : typeof d.available === "boolean"
                    ? d.available
                    : d.availability === true,
            raw: d,
        }));

    const fetchDoctors = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${API_BASE}/api/docteur`);
            const json = await res.json().catch(() => null);

            if (!res.ok) {
                setError((json && json.message) || `Erreur lors du chargement (${res.status})`);
                setDoctors([]);
                return;
            }

            const items = (json && (json.data || json)) || [];
            setDoctors(normalizeDoctors(items));
        } catch (err) {
            console.error("Erreur chargement docteurs:", err);
            setError("Erreur réseau lors du chargement des médecins.");
            setDoctors([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, []);

    const preview = doctors.slice(0, previewCount);

    return (
        <section className={homeDoctorsStyles.section}>
            <div className={homeDoctorsStyles.container}>

                {/* --- EN-TÊTE DE LA SECTION --- */}
                <div className={homeDoctorsStyles.header}>
                    <h1 className={homeDoctorsStyles.title}>
                        Notre{" "}
                        <span className={homeDoctorsStyles.titleSpan}>Équipe Médicale</span>
                    </h1>
                    <p className={homeDoctorsStyles.subtitle}>
                        Prenez rendez-vous rapidement avec nos spécialistes vérifiés.
                    </p>
                </div>

                {/* --- GESTION DE L'ERREUR --- */}
                {error && (
                    <div className={homeDoctorsStyles.errorContainer}>
                        <div className={homeDoctorsStyles.errorText}>{error}</div>
                        <button className={homeDoctorsStyles.retryButton} onClick={fetchDoctors}>
                            Réessayer
                        </button>
                    </div>
                )}

                {/* --- ÉTAT DE CHARGEMENT (SQUELETTE) --- */}
                {loading ? (
                    <div className={homeDoctorsStyles.skeletonGrid}>
                        {Array.from({ length: previewCount }).map((_, i) => (
                            <div key={i} className={homeDoctorsStyles.skeletonCard}>
                                <div className={homeDoctorsStyles.skeletonImage}></div>
                                <div className={homeDoctorsStyles.skeletonText1}></div>
                                <div className={homeDoctorsStyles.skeletonText2}></div>
                                <div className="flex gap-2 mt-auto">
                                    <div className={homeDoctorsStyles.skeletonButton}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* --- GRILLE DES DOCTEURS --- */
                    <div className={homeDoctorsStyles.doctorsGrid}>
                        {preview.map((doctor) => (
                            <article
                                key={doctor.id || doctor.name}
                                className={homeDoctorsStyles.article}
                            >
                                {/* Image selon disponibilité */}
                                {doctor.available ? (
                                    <Link
                                        to={`/doctors/${doctor.id}`}
                                        state={{ doctor: doctor.raw || doctor }}
                                    >
                                        <div className={homeDoctorsStyles.imageContainerAvailable}>
                                            <img
                                                src={doctor.image || "/placeholder-doctor.jpg"}
                                                alt={doctor.name}
                                                loading="lazy"
                                                className={homeDoctorsStyles.image}
                                                onError={(e) => {
                                                    e.currentTarget.onerror = null;
                                                    e.currentTarget.src = "/placeholder-doctor.jpg";
                                                }}
                                            />
                                        </div>
                                    </Link>
                                ) : (
                                    <div className={homeDoctorsStyles.imageContainerUnavailable}>
                                        <img
                                            src={doctor.image || "/placeholder-doctor.jpg"}
                                            alt={doctor.name}
                                            loading="lazy"
                                            className={homeDoctorsStyles.image}
                                        />
                                        <div className={homeDoctorsStyles.unavailableBadge}>
                                            Non disponible
                                        </div>
                                    </div>
                                )}

                                {/* Corps de la carte */}
                                <div className={homeDoctorsStyles.cardBody}>
                                    <h3 className={homeDoctorsStyles.doctorName}>
                                        {doctor.name}
                                    </h3>

                                    <p className={homeDoctorsStyles.doctorSpec}>
                                        {doctor.specialization}
                                    </p>

                                    {/* Badge expérience */}
                                    <div className={homeDoctorsStyles.experienceContainer}>
                                        <div className={homeDoctorsStyles.experienceBadge}>
                                            <Medal className={`${iconSize.small} h-4`} />
                                            <span>{doctor.experience} ans d'expérience</span>
                                        </div>
                                    </div>

                                    {/* Bouton dynamique */}
                                    <div className={homeDoctorsStyles.buttonContainer}>
                                        <div className="w-full">
                                            {doctor.available ? (
                                                <Link
                                                    to={`/doctors/${doctor.id}`}
                                                    state={{ doctor: doctor.raw || doctor }}
                                                    className={homeDoctorsStyles.buttonAvailable}
                                                >
                                                    <ChevronRight className="w-5 h-5" />
                                                    Réserver
                                                </Link>
                                            ) : (
                                                <button disabled className={homeDoctorsStyles.buttonUnavailable}>
                                                    <MousePointer2Off className="w-5" />
                                                    Indisponible
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            <style>{homeDoctorsStyles.customCSS}</style>
        </section>
    );
};

export default HomeDoctors;