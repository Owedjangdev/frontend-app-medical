import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { toast, ToastContainer } from "react-toastify";
import { doctorDetailStyles as s } from "../assets/dummyStyles";
import "react-toastify/dist/ReactToastify.css";
import {
  ArrowLeft,
  Star,
  Heart,
  Award,
  Users,
  Stethoscope,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Info,
  CheckCircle,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "";

// ✅ CORRECTION: suppression du filtre regex /^\d{4}-\d{2}-\d{2}$/ qui bloquait les clés
function normalizeSchedule(raw) {
  if (!raw) return {};

  // Cas Map (côté client, rare mais possible)
  if (typeof raw.forEach === "function" && !Array.isArray(raw)) {
    const obj = {};
    raw.forEach((val, key) => {
      obj[key] = Array.isArray(val) ? val : [];
    });
    return obj;
  }

  // Cas plain object (le plus fréquent — ce que l'API renvoie)
  if (typeof raw === "object" && !Array.isArray(raw)) {
    const obj = {};
    Object.entries(raw).forEach(([k, v]) => {
      // On ignore uniquement les propriétés internes Mongoose
      if (k.startsWith("$") || k === "_doc") return;
      // ✅ Plus de filtre regex — on accepte toutes les clés date valides
      obj[k] = Array.isArray(v) ? v : [];
    });
    return obj;
  }

  return {};
}

function getScheduleDates(schedule) {
  const normalized = normalizeSchedule(schedule);
  const keys = Object.keys(normalized);
  if (!keys.length) return [];

  const parsed = keys
    .map((k) => {
      const parts = k.split("-").map(Number);
      if (parts.length !== 3) return null;
      const [y, m, day] = parts;
      const dd = new Date(y, m - 1, day);
      if (!isNaN(dd.getTime())) return { key: k, date: dd };
      return null;
    })
    .filter(Boolean);

  const dateOnlyValue = (d) =>
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const todayVal = dateOnlyValue(new Date());

  return parsed
    .filter((p) => dateOnlyValue(p.date) >= todayVal)
    .sort((a, b) => dateOnlyValue(a.date) - dateOnlyValue(b.date))
    .map((p) => p.date);
}

function normalizePhoneTo10(phone) {
  if (!phone) return "";
  const digits = ("" + phone).replace(/\D/g, "");
  if (!digits) return "";
  return digits.length <= 10 ? digits : digits.slice(-10);
}

export default function DoctorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: "", age: "", mobile: "", gender: "", email: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { getToken, isLoaded: authLoaded } = useAuth();
  const { isSignedIn, user, isLoaded: userLoaded } = useUser();

  useEffect(() => { setIsVisible(true); }, []);

  useEffect(() => {
    if (!userLoaded || !user) return;
    const fullName =
      user.fullName ||
      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      "";
    const rawPhone =
      user.primaryPhone ||
      (user.phoneNumbers?.length > 0 ? user.phoneNumbers[0] : "") ||
      "";
    const phone = normalizePhoneTo10(rawPhone);
    const email =
      user.emailAddresses?.[0]?.emailAddress ||
      user.primaryEmailAddress ||
      "";
    setFormData((prev) => ({
      ...prev,
      name: prev.name || fullName,
      mobile: prev.mobile || phone,
      email: prev.email || email,
    }));
  }, [userLoaded, user]);

  useEffect(() => {
    let mounted = true;
    async function fetchDoctor() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/docteur/${id}`);
        const rawText = await res.text();
        if (!res.ok) {
          let message = `Failed to fetch (status ${res.status})`;
          try {
            const body = JSON.parse(rawText);
            message = body.message || message;
          } catch {}
          throw new Error(message);
        }
        let payload;
        try {
          payload = JSON.parse(rawText);
        } catch {
          throw new Error(
            `Réponse invalide du serveur. Reçu: ${rawText.slice(0, 100)}`
          );
        }
        let doc = payload?.data || null;

        // ✅ Normaliser le schedule dès la réception
        if (doc && doc.schedule !== undefined) {
          doc = { ...doc, schedule: normalizeSchedule(doc.schedule) };
        }

        if (mounted) setDoctor(doc);
      } catch (err) {
        if (mounted) setError(err.message || "Failed to fetch doctor");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchDoctor();
    return () => { mounted = false; };
  }, [id]);

  const next7 = useMemo(() => getScheduleDates(doctor?.schedule), [doctor]);
  const fee = Number(doctor?.fee ?? doctor?.fees ?? 0);

  const slots = useMemo(() => {
    if (!selectedDate || !doctor?.schedule) return [];
    // ✅ FIX: utiliser les méthodes locales pour éviter le décalage UTC
    const key = [
      selectedDate.getFullYear(),
      String(selectedDate.getMonth() + 1).padStart(2, "0"),
      String(selectedDate.getDate()).padStart(2, "0"),
    ].join("-");
    return normalizeSchedule(doctor.schedule)[key] || [];
  }, [selectedDate, doctor]);

  const handleBooking = async () => {
    if (isSubmitting) return;
    if (!formData.name || !formData.age || !formData.mobile || !formData.gender) {
      toast.error("Please fill all patient details!", {
        position: "top-center",
        autoClose: 2000,
      });
      return;
    }
    const mobileDigits = (formData.mobile || "").replace(/\D/g, "");
    if (mobileDigits.length !== 10) {
      toast.error("Mobile number must be exactly 10 digits.", {
        position: "top-center",
        autoClose: 2500,
      });
      return;
    }
    if (!selectedDate || !selectedSlot) {
      toast.error("Please select a date and time slot", {
        position: "top-center",
        autoClose: 2000,
      });
      return;
    }
    if (!authLoaded || !userLoaded) {
      toast.error("Authentication not ready. Please try again in a moment.", {
        position: "top-center",
        autoClose: 2000,
      });
      return;
    }
    if (!isSignedIn) {
      toast.error("You must sign in to create an appointment.", {
        position: "top-center",
        autoClose: 2200,
      });
      return;
    }

    setIsSubmitting(true);
    // ✅ FIX: utiliser les méthodes locales pour éviter le décalage UTC
    const dateISO = [
      selectedDate.getFullYear(),
      String(selectedDate.getMonth() + 1).padStart(2, "0"),
      String(selectedDate.getDate()).padStart(2, "0"),
    ].join("-");
    const specialityValue =
      doctor?.specialization ||
      doctor?.speciality ||
      doctor?.specialityName ||
      "";
    const payload = {
      doctorId: id,
      doctorName: doctor?.name || "",
      speciality: specialityValue,
      owner: doctor?.owner || undefined,
      doctorImageUrl: doctor?.imageUrl || doctor?.image || "",
      doctorImagePublicId:
        doctor?.imagePublicId || doctor?.image?.publicId || "",
      patientName: formData.name,
      mobile: mobileDigits,
      age: formData.age,
      gender: formData.gender,
      date: dateISO,
      time: selectedSlot,
      fee,
      fees: fee,
      paymentMethod: paymentMethod || "Online",
      email: formData.email || undefined,
    };

    try {
      const token = await getToken();
      if (!token) throw new Error("Failed to obtain authentication token.");
      const res = await fetch(`${API_BASE}/api/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(
          body?.message || body?.error || `Booking failed (${res.status})`,
          { position: "top-center" }
        );
        setIsSubmitting(false);
        return;
      }
      if (body?.checkoutUrl) {
        window.location.href = body.checkoutUrl;
        return;
      }
      toast.success("Booking successful", {
        position: "top-center",
        autoClose: 1500,
      });
      setTimeout(() => {
        window.location.href = "/appointments?payment_status=Pending";
      }, 700);
    } catch (err) {
      toast.error(err?.message || "Network error - booking failed", {
        position: "top-center",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={s.loadingContainer}>
        <div className="text-emerald-600 text-lg animate-pulse">
          Loading doctor...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={s.errorContainer}>
        <div className={s.errorContent}>
          <div className={s.errorText}>Error</div>
          <div className={s.errorMessage}>{error}</div>
          <button onClick={() => navigate("/doctors")} className={s.backButton}>
            <ArrowLeft size={20} /> Back to Doctors
          </button>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className={s.notFoundContainer}>
        <div className={s.notFoundContent}>
          <div className={s.notFoundEmoji}>😷</div>
          <h1 className={s.notFoundTitle}>Doctor Not Found</h1>
          <button onClick={() => navigate("/doctors")} className={s.backButton}>
            <ArrowLeft size={20} /> Back to Doctors
          </button>
        </div>
      </div>
    );
  }

  const rating = doctor?.rating ?? 4.8;
  const mobileDigits = (formData.mobile || "").replace(/\D/g, "");
  const isMobileValid = mobileDigits.length === 10;

  // ✅ Toutes les conditions pour activer le bouton
  const isBookingReady =
    Boolean(selectedDate) &&
    Boolean(selectedSlot) &&
    Boolean(formData.name?.trim()) &&
    Boolean(formData.age) &&
    isMobileValid &&
    Boolean(formData.gender) &&
    authLoaded &&
    userLoaded &&
    isSignedIn;

  return (
    <div className={s.pageContainer}>
      <ToastContainer />

      {/* ── Header ── */}
      <div className={s.headerContainer}>
        <div className={s.headerContent}>
          <div className={s.headerFlex}>
            <button
              onClick={() => navigate("/doctors")}
              className={s.headerBackButton}
            >
              <ArrowLeft size={18} />
              <span className={s.headerBackButtonText}>Back</span>
            </button>
            <h1 className={s.headerTitle}>Doctor Profile</h1>
            <div className={s.headerRatingContainer}>
              <Star className={s.headerRatingIcon} size={18} />
              <span className={s.headerRatingText}>{rating}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div
        className={`${s.mainContent} ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* ── Profile Card ── */}
        <div className={s.profileCard}>
          <div className={s.profileGrid}>
            <div className={s.leftColumn}>
              <div className={s.avatarContainer}>
                <div className={s.avatarGlow} />
                <img
                  src={
                    doctor.imageUrl ||
                    doctor.image ||
                    "/placeholder-doctor.png"
                  }
                  alt={doctor.name}
                  className={s.avatarImage}
                />
              </div>
              <div className={s.statsGrid}>
                <div className={s.statBox}>
                  <Heart className={`${s.statIcon} text-rose-500`} />
                  <div className={s.statValue}>
                    {doctor.successRate ?? doctor.success ?? "98%"}
                  </div>
                  <div className={s.statLabel}>Success</div>
                </div>
                <div className={s.statBox}>
                  <Award className={`${s.statIcon} text-amber-500`} />
                  <div className={s.statValue}>
                    {doctor.experience ? `${doctor.experience} Yrs` : "3 Years"}
                  </div>
                  <div className={s.statLabel}>Experience</div>
                </div>
                <div className={s.statBox}>
                  <Users className={`${s.statIcon} text-emerald-500`} />
                  <div className={s.statValue}>{doctor.patients ?? "12000"}</div>
                  <div className={s.statLabel}>Patients</div>
                </div>
              </div>
            </div>

            <div className={s.rightColumn}>
              <div>
                <h2 className={s.doctorName}>{doctor.name}</h2>
                <div className="mt-2">
                  <span className={s.specializationBadge}>
                    <Stethoscope className="w-4 h-4" />
                    {doctor.specialization ||
                      doctor.speciality ||
                      doctor.specialityName ||
                      "Specialist"}
                  </span>
                </div>
              </div>
              <div className={s.infoGrid}>
                <div className={s.infoItem}>
                  <Award className={s.infoIcon} />
                  <div>
                    <div className={s.infoLabel}>Qualifications</div>
                    <div className={s.infoValue}>
                      {doctor.qualification ||
                        doctor.qualifications ||
                        "MBBS"}
                    </div>
                  </div>
                </div>
                <div className={s.infoItem}>
                  <MapPin className={s.infoIcon} />
                  <div>
                    <div className={s.infoLabel}>Location</div>
                    <div className={s.infoValue}>
                      {doctor.location || doctor.city || "Delhi"}
                    </div>
                  </div>
                </div>
                <div className={s.infoItem}>
                  <DollarSign className={s.infoIcon} />
                  <div>
                    <div className={s.infoLabel}>Consultation Fee</div>
                    <div className={s.feeValue}>₹{fee.toLocaleString()}</div>
                  </div>
                </div>
                <div className={s.infoItem}>
                  <CheckCircle className={s.infoIcon} />
                  <div>
                    <div className={s.infoLabel}>Availability</div>
                    <div className={s.infoValue}>
                      {doctor.availability || "Available"}
                    </div>
                  </div>
                </div>
              </div>
              <div className={s.aboutContainer}>
                <div className={s.aboutHeader}>
                  <Info className={s.aboutIcon} />
                  <h3 className={s.aboutTitle}>About Doctor</h3>
                </div>
                <p className={s.aboutText}>
                  {doctor.about ||
                    doctor.description ||
                    "No description available."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Appointment Section ── */}
        <div className={s.appointmentContainer}>
          <div className={s.appointmentContent}>
            <div className={s.appointmentHeader}>
              <Calendar className={s.appointmentIcon} />
              <h2 className={s.appointmentTitle}>Book Your Appointment</h2>
            </div>
            <div className={s.appointmentGrid}>

              {/* Left column */}
              <div className={s.dateSection}>
                <div>
                  <h3 className={s.dateTitle}>
                    <Calendar className={s.dateTitleIcon} />
                    Select Date
                  </h3>
                  <div className={s.dateScrollContainer}>
                    <div className={s.dateButtonsContainer}>
                      {next7.length === 0 ? (
                        <p className="text-gray-500 text-sm">
                          No available dates.
                        </p>
                      ) : (
                        next7.map((date) => {
                          const isSelected =
                            selectedDate &&
                            date.toDateString() === selectedDate.toDateString();
                          return (
                            <button
                              key={date.toISOString()}
                              onClick={() => {
                                setSelectedDate(date);
                                setSelectedSlot("");
                              }}
                              className={`${s.dateButton} ${
                                isSelected
                                  ? s.dateButtonSelected
                                  : s.dateButtonUnselected
                              }`}
                            >
                              <div className={s.dateContent}>
                                <div className={s.dateWeekday}>
                                  {date.toLocaleDateString("en-US", {
                                    weekday: "short",
                                  })}
                                </div>
                                <div className={s.dateDay}>{date.getDate()}</div>
                                <div className={s.dateMonth}>
                                  {date.toLocaleDateString("en-US", {
                                    month: "short",
                                  })}
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className={s.patientForm}>
                  <h3 className={s.patientFormTitle}>Patient Details</h3>
                  <div className={s.patientFormGrid}>
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, name: e.target.value }))
                      }
                      className={s.formInput}
                    />
                    <input
                      type="number"
                      placeholder="Age"
                      value={formData.age}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, age: e.target.value }))
                      }
                      className={s.formInput}
                    />
                    <input
                      type="tel"
                      placeholder="Mobile Number (10 digits)"
                      value={formData.mobile}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, mobile: e.target.value }))
                      }
                      className={s.formInput}
                    />
                    <select
                      value={formData.gender}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, gender: e.target.value }))
                      }
                      className={s.formSelect}
                    >
                      <option value="">Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, email: e.target.value }))
                      }
                      className={s.emailInput}
                    />
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className={s.timeSlotsSection}>
                <div>
                  <h3 className={s.timeSlotsTitle}>
                    <Clock className={s.timeSlotsIcon} />
                    Available Time Slots
                  </h3>
                  {!selectedDate ? (
                    <p className={s.noSlotsMessage}>
                      Please select a date first.
                    </p>
                  ) : slots.length === 0 ? (
                    <p className={s.noSlotsMessage}>
                      No time slots for this date.
                    </p>
                  ) : (
                    <div className={s.timeSlotsContainer}>
                      {slots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`${s.timeSlotButton} ${
                            selectedSlot === slot
                              ? s.timeSlotButtonSelected
                              : s.timeSlotButtonUnselected
                          }`}
                        >
                          <div className={s.timeSlotContent}>
                            <Clock className={s.timeSlotIcon} />
                            {slot}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className={s.summaryContainer}>
                  <div className={s.summaryItem}>
                    <div className={s.summaryRow}>
                      <span className={s.summaryLabel}>Selected Doctor:</span>
                      <span className={s.summaryValue}>
                        {doctor.name || "—"}
                      </span>
                    </div>
                    <div className={s.summaryRow}>
                      <span className={s.summaryLabel}>Doctor Speciality:</span>
                      <span className={s.summaryValue}>
                        {doctor.specialization ||
                          doctor.speciality ||
                          doctor.specialityName ||
                          "—"}
                      </span>
                    </div>
                    <div className={s.summaryRow}>
                      <span className={s.summaryLabel}>Selected Date:</span>
                      <span
                        className={
                          selectedDate
                            ? s.summaryValue
                            : "font-semibold text-rose-500 text-sm"
                        }
                      >
                        {selectedDate
                          ? selectedDate.toLocaleDateString("en-US", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "Not selected"}
                      </span>
                    </div>
                    <div className={s.summaryRow}>
                      <span className={s.summaryLabel}>Selected Time:</span>
                      <span
                        className={
                          selectedSlot
                            ? s.summaryValue
                            : "font-semibold text-rose-500 text-sm"
                        }
                      >
                        {selectedSlot || "Not selected"}
                      </span>
                    </div>
                    <div className={s.summaryRow}>
                      <span className={s.summaryLabel}>Consultation Fee:</span>
                      <span className={s.feeDisplay}>
                        ₹{fee.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className={s.paymentContainer}>
                    <span className={s.paymentLabel}>Payment:</span>
                    <div className={s.paymentOptions}>
                      {["Cash", "Online"].map((method) => (
                        <label
                          key={method}
                          className={`${s.paymentOption} ${
                            paymentMethod === method
                              ? s.paymentOptionSelected
                              : s.paymentOptionUnselected
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment"
                            value={method}
                            checked={paymentMethod === method}
                            onChange={() => setPaymentMethod(method)}
                            className={s.paymentRadio}
                          />
                          {method}
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleBooking}
                    disabled={!isBookingReady || isSubmitting}
                    className={`${s.bookingButton} ${
                      isBookingReady && !isSubmitting
                        ? s.bookingButtonEnabled
                        : s.bookingButtonDisabled
                    }`}
                  >
                    <div className={s.bookingButtonContent}>
                      <CheckCircle className={s.bookingIcon} />
                      {isSubmitting ? "Booking..." : "Confirm Booking"}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}