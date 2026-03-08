import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { X, Search, ChevronRight, ArrowRight, Medal } from "lucide-react";
import { MousePointer2Off } from "lucide-react";

import {doctorsPageStyles as styles} from"../assets/dummyStyles"

const DoctorsPage = () => {
  const API_BASE = "https://backend-app-medical.onrender.com";

  const [allDoctors, setAllDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);

  const loadDoctors = async () => {
    let mounted = true;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/docteur`);
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          (json && json.message) || `Failed to load doctors (${res.status})`;
        if (mounted) {
          setError(msg);
          setAllDoctors([]);
          setLoading(false);
        }
        return;
      }

      const items = (json && (json.data || json)) || [];
      const normalized = (Array.isArray(items) ? items : []).map((d) => {
        const id = d._id || d.id;
        const image =
          d.imageUrl || d.image || d.imageSmall || d.imageSrc || "";

        let available = true;
        if (typeof d.availability === "string") {
          // ✅ CORRECTION : on accepte "Disponible" (français) ET "available" (anglais)
          available =
            d.availability === "Disponible" ||
            d.availability.toLowerCase() === "available";
        } else if (typeof d.available === "boolean") {
          available = d.available;
        } else if (typeof d.availability === "boolean") {
          available = d.availability;
        } else {
          available =
            d.availability === "Available" || d.available === true;
        }

        return {
          id,
          name: d.name || "Unknown",
          specialization: d.specialization || "",
          image,
          experience:
            d.experience !== undefined && d.experience !== null
              ? String(d.experience)
              : "-",
          fee: d.fee ?? d.price ?? 0,
          available,
          raw: d,
        };
      });

      if (mounted) {
        setAllDoctors(normalized);
        setError("");
      }
    } catch (err) {
      console.error("load doctors error:", err);
      if (mounted) {
        setError("Network error while loading doctors.");
        setAllDoctors([]);
      }
    } finally {
      if (mounted) setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredDoctors = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return allDoctors;
    return allDoctors.filter(
      (doctor) =>
        (doctor.name || "").toLowerCase().includes(q) ||
        (doctor.specialization || "").toLowerCase().includes(q)
    );
  }, [allDoctors, searchTerm]);

  const displayedDoctors = showAll
    ? filteredDoctors
    : filteredDoctors.slice(0, 8);

  return (
    <div className={styles.mainContainer}>
      {/* CSS Animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in     { animation: fade-in 0.9s ease-out both; }
        .animate-fade-in-up  { animation: fade-in-up 0.9s ease-out both; }
        .animate-slide-up    { animation: slide-up 0.8s ease-out both; }

        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>

      {/* Background decorative shapes */}
      <div className={styles.backgroundShape1} />
      <div className={styles.backgroundShape2} />

      <div className={styles.wrapper}>
        {/* Header */}
        <div className={styles.headerContainer}>
          <h1 className={styles.headerTitle}>Our Medical Experts</h1>
          <p className={styles.headerSubtitle}>
            Find your ideal doctor by name or specialization
          </p>
        </div>

        {/* Search bar */}
        <div className={styles.searchContainer}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search doctors by name or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            {searchTerm.length > 0 && (
              <button
                onClick={() => setSearchTerm("")}
                className={styles.clearButton}
                aria-label="Clear search"
              >
                <X size={20} strokeWidth={3.5} />
              </button>
            )}
          </div>
        </div>

        {/* Loading skeletons */}
        {loading ? (
          <div className={styles.skeletonGrid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonImage} />
                <div className={styles.skeletonName} />
                <div className={styles.skeletonSpecialization} />
                <div className={styles.skeletonButton} />
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error state */
          <div className={styles.errorContainer}>
            <div className={styles.errorText}>{error}</div>
            <button onClick={loadDoctors} className={styles.retryButton}>
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Doctors grid */}
            <div
              className={`${styles.doctorsGrid} ${
                filteredDoctors.length === 0 ? "opacity-70" : "opacity-100"
              }`}
            >
              {filteredDoctors.length === 0 ? (
                <p className={styles.noResults}>
                  No doctors found for "{searchTerm}"
                </p>
              ) : (
                displayedDoctors.map((doctor, index) => (
                  <div
                    key={doctor.id || `${doctor.name}-${index}`}
                    className={`${styles.doctorCard} ${
                      !doctor.available ? styles.doctorCardUnavailable : ""
                    }`}
                    style={{ animationDelay: `${index * 90}ms` }}
                    role="article"
                  >
                    {/* Doctor image */}
                    {doctor.available ? (
                      <Link
                        to={`/doctors/${doctor.id}`}
                        state={{ doctor: doctor.raw || doctor }}
                        className="focus:outline-none focus:ring-2 focus:ring-emerald-300 rounded-full block"
                      >
                        <div className={styles.imageContainer}>
                          <img
                            src={doctor.image || "/placeholder-doctor.jpg"}
                            alt={doctor.name}
                            loading="lazy"
                            className={styles.doctorImage}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "/placeholder-doctor.jpg";
                            }}
                          />
                        </div>
                      </Link>
                    ) : (
                      <div
                        className={`${styles.imageContainer} ${styles.imageContainerUnavailable}`}
                      >
                        <img
                          src={doctor.image || "/placeholder-doctor.jpg"}
                          alt={doctor.name}
                          loading="lazy"
                          className={styles.doctorImageUnavailable}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/placeholder-doctor.jpg";
                          }}
                        />
                      </div>
                    )}

                    {/* Doctor info */}
                    <div className={styles.doctorInfo}>
                      <h3 className={styles.doctorName}>{doctor.name}</h3>
                      <p className={styles.doctorSpecialization}>
                        {doctor.specialization}
                      </p>

                      <div className={styles.experienceBadge}>
                        <Medal className={styles.experienceIcon} />
                        <span>{doctor.experience || "-"} years Experience</span>
                      </div>

                      {/* CTA Button */}
                      {doctor.available ? (
                        <Link
                          to={`/doctors/${doctor.id}`}
                          state={{ doctor: doctor.raw || doctor }}
                          className={styles.bookButton}
                        >
                          <ChevronRight size={18} />
                          Book Now
                        </Link>
                      ) : (
                        <button
                          disabled
                          className={styles.notAvailableButton}
                        >
                          <MousePointer2Off size={18} />
                          Not Available
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* View More button */}
            {!showAll && filteredDoctors.length > 8 && (
              <div className={styles.viewMoreContainer}>
                <button
                  onClick={() => setShowAll(true)}
                  className={styles.viewMoreButton}
                >
                  <span>View All Medical Experts</span>
                  <ArrowRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DoctorsPage;