import React, { useEffect, useState } from "react";
import { ArrowLeft, Clock, FileText, IndianRupee, Send, Phone } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import toast, { Toaster } from "react-hot-toast";

import { serviceDetailStyles as s } from "../assets/dummyStyles";

const DEFAULT_HOST = "https://backend-app-medical.onrender.com".replace(/\/$/, "");

function normDate(d) {
  const dt = new Date(d);
  return isNaN(dt) ? null : dt.toISOString().split("T")[0];
}

function sortDates(arr) {
  if (!Array.isArray(arr)) return [];
  const uniq = [...new Set(arr.map(normDate).filter(Boolean))];
  const parsed = uniq.map((ds) => ({ ds, d: new Date(ds) }));
  const v = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const now = v(new Date());
  const past   = parsed.filter((p) => v(p.d) < now).sort((a, b) => v(b.d) - v(a.d));
  const future = parsed.filter((p) => v(p.d) >= now).sort((a, b) => v(a.d) - v(b.d));
  return [...past, ...future].map((p) => p.ds);
}

function shapeService(doc) {
  const o = {};
  o.id    = doc._id ?? doc.id ?? doc.slug ?? String(doc.name).replace(/\s+/g, "-").toLowerCase();
  o.name  = doc.name  ?? doc.title ?? "Service";
  o.image = doc.image || doc.imageUrl || doc.imageURL || doc.image_path || null;
  o.price = typeof doc.price === "number" ? doc.price : Number(doc.price) || 0;
  o.about = doc.about ?? doc.description ?? doc.shortDescription ?? "";
  o.instructions = Array.isArray(doc.instructions) ? doc.instructions : [];

  let dates = Array.isArray(doc.dates) ? doc.dates.slice() : [];
  let slots = {};

  if (doc.slots && !Array.isArray(doc.slots) && typeof doc.slots === "object") {
    slots = { ...doc.slots };
    if (!dates.length) dates = Object.keys(slots);
  } else if (Array.isArray(doc.slots)) {
    const arr = doc.slots.slice();
    if (dates.length) {
      dates.forEach((d) => (slots[d] = arr.slice()));
    } else {
      const t = new Date().toISOString().split("T")[0];
      slots[t] = arr;
      dates = [t];
    }
  } else {
    if (dates.length) {
      dates.forEach((d) => (slots[d] = []));
    } else {
      const t = new Date().toISOString().split("T")[0];
      dates = [t];
      slots[t] = [];
    }
  }

  o.dates    = sortDates(dates);
  o.slots    = slots;
  o.imageAlt = doc.imageAlt ?? doc.alt ?? o.name;
  o.raw      = doc;
  return o;
}

export default function ServiceDetail() {
  const { id }                   = useParams();
  const navigate                 = useNavigate();
  const { isSignedIn, getToken } = useAuth();

  const [patientName,   setPatientName]   = useState("");
  const [mobile,        setMobile]        = useState("");
  const [age,           setAge]           = useState("");
  const [gender,        setGender]        = useState("");
  const [email,         setEmail]         = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Online");
  const [selectedDate,  setSelectedDate]  = useState("");
  const [selectedTime,  setSelectedTime]  = useState("");

  const [service,     setService]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successMsg,  setSuccessMsg]  = useState(null);

  const okMobile = (m) => /^\d{10}$/.test(m);
  const okAge    = (a) => { const n = Number(a); return a !== "" && Number.isInteger(n) && n > 0 && n < 150; };

  const missingFields = () => {
    const m = [];
    if (!patientName.trim()) m.push("Full Name");
    if (!okMobile(mobile))   m.push("Mobile (10 digits)");
    if (!okAge(age))         m.push("Age");
    if (!gender)             m.push("Gender");
    if (!selectedDate)       m.push("Date");
    if (!selectedTime)       m.push("Time");
    return m;
  };
  const formValid = () => missingFields().length === 0;

  /* ── fetch service ──────────────────────────────────────── */
  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${DEFAULT_HOST}/api/services/${encodeURIComponent(id)}`,
          { headers: { Accept: "application/json" }, signal: ctrl.signal }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) throw new Error("not JSON");

        const json = await res.json();
        const doc  = json?.data ?? json?.service ?? json;
        const svc  = shapeService(doc);

        if (!alive) return;
        setService(svc);

        if (svc.dates.length) {
          setSelectedDate(svc.dates[0]);
          setSelectedTime("");
        }
      } catch (e) {
        if (e.name === "AbortError") return;
        console.error("Fetch service error:", e);
        if (alive) setService(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; ctrl.abort(); };
  }, [id]);

  /* ── submit booking ─────────────────────────────────────── */
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitError(null);
    setSuccessMsg(null);

    const miss = missingFields();
    if (miss.length) { setSubmitError(`${miss.join(", ")} ${miss.length > 1 ? "are" : "is"} required`); return; }
    if (!service)    { setSubmitError("Service not loaded"); return; }
    if (!isSignedIn) { toast.error("Please sign in to book."); return; }

    setSubmitting(true);
    try {
      const token = await getToken().catch(() => null);

      // ✅ FIX: patientName au lieu de customerName
      // ✅ FIX: amount au lieu de price
      // ✅ FIX: route /api/service-appointments au lieu de /api/bookings
      const payload = {
        serviceId:       (service.raw?._id || service.raw?.id) ?? service.id,
        serviceName:     service.name,
        serviceImageUrl: service.raw?.imageUrl || service.raw?.image || "",
        patientName:     patientName.trim(),
        mobile,
        age:             Number(age),
        gender,
        email,
        date:            selectedDate,
        time:            selectedTime,
        paymentMethod,
        amount:          service.price,
      };

      const res = await fetch(`${DEFAULT_HOST}/api/service-appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || `Booking failed (${res.status})`);
      }

      // Paiement Online → rediriger vers Stripe
      if (paymentMethod === "Online" && data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      // Paiement Cash → succès direct
      toast.success("Booking confirmed!");
      setSuccessMsg("Booking confirmed!");
      setPatientName(""); setMobile(""); setAge(""); setGender(""); setEmail(""); setSelectedTime("");
    } catch (err) {
      console.error("Booking error:", err);
      setSubmitError(err.message || "Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const availableSlots = (selectedDate && service?.slots?.[selectedDate]) || [];

  /* ── loading ────────────────────────────────────────────── */
   if (loading) return (
     <div className={s.loadingContainer}>
       <div className={s.loadingCard}>
         <h2 className={s.loadingTitle}>Chargement du service…</h2>
         <p className={s.loadingText}>Récupération des détails du serveur</p>
       </div>
     </div>
   );

   if (!service) return (
     <div className={s.loadingContainer}>
       <div className={s.loadingCard}>
         <h2 className={s.loadingTitle}>Service non trouvé</h2>
         <p className={s.loadingText}>Veuillez revenir en arrière et sélectionner un service valide.</p>
         <Link to="/services" className={s.backToServices}>Retour aux Services</Link>
       </div>
     </div>
   );

  /* ── render ─────────────────────────────────────────────── */
  return (
    <div className={s.pageContainer}>
      <Toaster position="top-right" />

      {/* NAV */}
      <nav className={s.navBar}>
        <div className={s.navContainer}>
          <button className={s.backButton} onClick={() => navigate(-1)}>
            <ArrowLeft size={15} /> Retour
          </button>
        </div>
      </nav>

      {/* GRID */}
      <div className={s.mainGrid}>

        {/* ════ LEFT ════ */}
        <div className={s.leftColumn}>

          {/* Service image */}
          <div className={s.imageContainer}>
            {service.image
              ? <img src={service.image} alt={service.imageAlt} className={s.image} />
              : <span className="text-emerald-300 text-sm">Aucune image</span>
            }
          </div>

          {/* Your Details */}
          <div className={s.detailsContainer}>
            <p className={s.detailsTitle}>
              <Phone size={15} /> Vos informations
            </p>
            <div className={s.detailsGrid}>

              <input
                 type="text"
                 placeholder="Nom complet *"
                 value={patientName}
                 onChange={(e) => setPatientName(e.target.value)}
                 className={!patientName.trim() && submitError ? s.invalidInput : s.input}
               />

               <input
                 type="tel"
                 placeholder="Téléphone (10 chiffres) *"
                 value={mobile}
                 maxLength={10}
                 onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                 className={mobile && !okMobile(mobile) ? s.invalidInput : s.input}
               />

               <input
                 type="number"
                 placeholder="Âge *"
                 value={age}
                 min={1}
                 max={149}
                 onChange={(e) => setAge(e.target.value)}
                 className={age && !okAge(age) ? s.invalidInput : s.input}
               />

               <select
                 value={gender}
                 onChange={(e) => setGender(e.target.value)}
                 className={!gender && submitError ? s.invalidInput : s.input}
               >
                 <option value="">Sélectionner le sexe *</option>
                 <option value="Male">Homme</option>
                 <option value="Female">Femme</option>
                 <option value="Other">Autre</option>
               </select>

               <input
                 type="email"
                 placeholder="Email (optionnel)"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className={s.emailInput}
               />
            </div>

            {/* Payment Method */}
             <div className="mt-4">
               <span className={s.paymentLabel}>Mode de paiement</span>
               <div className={s.paymentOptions}>
                 {[{ key: "Cash", label: "Espèces" }, { key: "Online", label: "En ligne" }].map((m) => (
                   <button
                     key={m.key}
                     type="button"
                     onClick={() => setPaymentMethod(m.key)}
                     className={s.paymentOption(paymentMethod === m.key)}
                   >
                     {m.label}
                   </button>
                 ))}
               </div>
             </div>
          </div>

          {/* Select Date */}
          <div className={s.dateSection}>
            <p className={s.dateTitle}>Sélectionner une date *</p>
            <div className={s.dateScrollContainer}>
              <div className={s.dateButtonsContainer}>
                {service.dates.length
                  ? service.dates.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => { setSelectedDate(d); setSelectedTime(""); }}
                        className={s.dateButton(selectedDate === d)}
                      >
                        {d}
                      </button>
                    ))
                  : <span className={s.noSlotsMessage}>Aucune date disponible</span>
                }
              </div>
            </div>
          </div>

          {/* Select Time */}
          <div className={s.timeSection}>
            <p className={s.timeTitle}>Sélectionner l'heure *</p>
            <div className={s.timeScrollContainer}>
              <div className={s.timeButtonsContainer}>
                {availableSlots.length
                  ? availableSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        className={s.timeButton(selectedTime === slot)}
                      >
                        <Clock size={13} />
                        {slot}
                      </button>
                    ))
                  : <span className={s.noSlotsMessage}>Aucun créneau pour cette date</span>
                }
              </div>
            </div>
          </div>

          {submitError && <p className={s.errorMessage}>{submitError}</p>}
          {successMsg  && <p className={s.successMessage}>{successMsg}</p>}

          {/* Confirm Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!formValid() || submitting}
            className={s.submitButton(formValid(), submitting)}
          >
            <Send size={15} />
            {submitting ? "Réservation en cours…" : `Confirmer la réservation • ₹${service.price}`}
          </button>

        </div>

        {/* ════ RIGHT ════ */}
        <div className={s.rightColumn}>

          <h1 className={s.serviceName}>{service.name}</h1>

          {service.about && (
            <div className={s.aboutContainer}>
              <p className={s.aboutTitle}>
                <FileText size={15} /> À propos de ce service
              </p>
              <p className={s.aboutText}>{service.about}</p>
            </div>
          )}

          <div className={s.priceContainer}>
            <IndianRupee size={15} className="text-emerald-600" />
            <span className={s.priceText}>{service.price}</span>
          </div>

          {service.instructions.length > 0 && (
            <div className={s.instructionsContainer}>
              <h3 className={s.instructionsTitle}>Instructions avant le test</h3>
              <ul className={s.instructionsList}>
                {service.instructions.map((inst, k) => (
                  <li key={k}>{inst}</li>
                ))}
              </ul>
            </div>
          )}

          <div className={s.summaryContainer}>
            <h3 className={s.summaryTitle}>Résumé de la réservation</h3>
            <div className={s.summaryContent}>
              <p className={s.summaryItem}><strong>Nom :</strong> {patientName.trim() || "Non rempli"}</p>
              <p className={s.summaryItem}><strong>Téléphone :</strong> {mobile || "Non rempli"}</p>
              <p className={s.summaryItem}><strong>Âge :</strong> {age || "Non rempli"}</p>
              <p className={s.summaryItem}><strong>Sexe :</strong> {gender || "Non rempli"}</p>
              <p className={s.summaryItem}><strong>Date :</strong> {selectedDate || "Non sélectionné"}</p>
              <p className={s.summaryItem}><strong>Heure :</strong> {selectedTime || "Non sélectionné"}</p>
              <p className={s.summaryItem}><strong>Paiement :</strong> {paymentMethod === "Cash" ? "Espèces" : "En ligne"}</p>
              <p className={s.summaryItem}><strong>Prix :</strong> ₹{service.price}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}