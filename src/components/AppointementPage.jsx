import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useSearchParams } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import {
  CalendarDays, Clock, CreditCard, Wallet,
  CheckCircle, Bell, XCircle, User, Stethoscope,
  Sparkles, RefreshCw, AlertCircle,
} from "lucide-react";
import {
  appointmentPageStyles,
  cardStyles,
  badgeStyles,
  iconSize,
} from "../assets/dummyStyles";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
const API_BASE_URL = "https://backend-app-medical.onrender.com";
const API_CLIENT = axios.create({ baseURL: API_BASE_URL });

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const MONTH_MAP = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_SEPARATOR = ":";
const SPACE_SEPARATOR = " ";
const APPOINTMENT_STATUS_CANCELED = ["Canceled", "Annuler"];
const APPOINTMENT_STATUS_COMPLETED = ["Completed", "Completer"];
const APPOINTMENT_STATUS_RESCHEDULED = ["Rescheduled", "Reprogrammer"];
const APPOINTMENT_STATUS_CONFIRMED = ["Confirmed", "Confirmer"];
const PAYMENT_METHOD_ONLINE = ["En ligne", "Online"];
const DEFAULT_HOUR = 0;
const HOURS_IN_12HOUR_FORMAT = 12;

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formats a number with leading zeros (e.g., 5 -> "05")
 */
function padNumberWithZeros(number) {
  return String(number).padStart(2, "0");
}

/**
 * Converts date string (DD Mon YYYY) and time string to Date object
 */
function parseDateTime(dateString, timeString) {
  if (!dateString) return new Date(0);

  // Try direct parsing first
  const directParseDate = new Date(`${dateString} ${timeString || ""}`);
  if (!isNaN(directParseDate)) return directParseDate;

  // Parse format: "15 Jan 2024"
  const dateComponents = (dateString || "").split(SPACE_SEPARATOR);
  if (dateComponents.length !== 3) return new Date(0);

  const [dayString, monthName, yearString] = dateComponents;
  const monthIndex = MONTH_MAP[monthName];
  if (monthIndex === undefined) return new Date(0);

  const [timeComponent, period] = (timeString || "0:00 AM").split(SPACE_SEPARATOR);
  let [hours, minutes] = (timeComponent || "0:00").split(TIME_SEPARATOR);
  hours = Number(hours) || DEFAULT_HOUR;
  minutes = Number(minutes) || 0;

  // Convert 12-hour to 24-hour format
  if (period === "PM" && hours < HOURS_IN_12HOUR_FORMAT) hours += HOURS_IN_12HOUR_FORMAT;
  if (period === "AM" && hours === HOURS_IN_12HOUR_FORMAT) hours = 0;

  return new Date(Number(yearString), monthIndex, Number(dayString), hours, minutes);
}

/**
 * Formats ISO date (YYYY-MM-DD) to readable format (Mon, 15 Jan)
 */
function formatDateToReadable(isoDateString) {
  if (!isoDateString) return "";
  if (!ISO_DATE_PATTERN.test(isoDateString)) return isoDateString;

  const [year, monthString, dayString] = isoDateString.split("-").map(Number);
  const dateObject = new Date(Date.UTC(year, monthString - 1, dayString));

  return dateObject.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Determines appointment status based on appointment data and current time
 */
function computeAppointmentStatus(appointment) {
  if (!appointment) return "Pending";

  const currentTime = new Date();
  const appointmentStatus = appointment.status || "";

  if (APPOINTMENT_STATUS_CANCELED.includes(appointmentStatus)) return "Canceled";
  if (APPOINTMENT_STATUS_COMPLETED.includes(appointmentStatus)) return "Completed";

  if (APPOINTMENT_STATUS_RESCHEDULED.includes(appointmentStatus)) {
    const { date: rescheduledDate, time: rescheduledTime } = appointment.rescheduledTo || {};
    if (rescheduledDate && rescheduledTime) {
      const rescheduledDateTime = parseDateTime(rescheduledDate, rescheduledTime);
      if (currentTime >= rescheduledDateTime) return "Completed";
    }
    return "Rescheduled";
  }

  if (APPOINTMENT_STATUS_CONFIRMED.includes(appointmentStatus)) {
    const appointmentDateTime = parseDateTime(appointment.date, appointment.time);
    return currentTime >= appointmentDateTime ? "Completed" : "Confirmed";
  }

  const appointmentDateTime = parseDateTime(appointment.date, appointment.time);
  if (currentTime >= appointmentDateTime) return "Completed";
  return appointment.confirmed ? "Confirmed" : "Pending";
}

/**
 * Normalizes payment method to standard format
 */
function normalizePaymentMethod(paymentMethod) {
  if (!paymentMethod) return "Cash";
  if (PAYMENT_METHOD_ONLINE.includes(paymentMethod)) return "Online";
  return "Cash";
}

/**
 * Validates and returns rescheduled appointment data
 */
function extractRescheduledAppointment(rescheduledData) {
  if (!rescheduledData) return null;
  if (rescheduledData.date && rescheduledData.time) {
    return {
      date: rescheduledData.date,
      time: rescheduledData.time,
    };
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// BADGES
// ─────────────────────────────────────────────────────────────────────────────
function PaymentBadge({ payment }) {
  return normalizePaymentMethod(payment) === "Online" ? (
    <span className={badgeStyles.paymentBadge.online}>
      <CreditCard className={iconSize.small} /> Online
    </span>
  ) : (
    <span className={badgeStyles.paymentBadge.cash}>
      <Wallet className={iconSize.small} /> Cash
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    Completed:   { cls: badgeStyles.statusBadge.completed, icon: <CheckCircle className={iconSize.small} />,  label: "Completed" },
    Confirmed:   { cls: badgeStyles.statusBadge.confirmed, icon: <Bell className={iconSize.small} />,         label: "Confirmed" },
    Pending:     { cls: badgeStyles.statusBadge.pending,   icon: <Clock className={iconSize.small} />,        label: "Pending" },
    Canceled:    { cls: badgeStyles.statusBadge.canceled,  icon: <XCircle className={iconSize.small} />,      label: "Canceled" },
    Rescheduled: { cls: badgeStyles.statusBadge.default,   icon: <CalendarDays className={iconSize.small} />, label: "Rescheduled" },
  };
  const entry = map[status] || map.Pending;
  return <span className={entry.cls}>{entry.icon} {entry.label}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// CARDS
// ─────────────────────────────────────────────────────────────────────────────
function DoctorCard({ item }) {
  return (
    <div className={cardStyles.doctorCard}>
      <div className={cardStyles.doctorImageContainer}>
        {item.image
          ? <img src={item.image} alt={item.doctorName} className={cardStyles.image} loading="lazy" />
          : <User className="w-10 h-10 text-emerald-400" />
        }
      </div>
      <h3 className={cardStyles.doctorName}>{item.doctorName}</h3>
      {item.specialization && (
        <p className={cardStyles.specialization}>{item.specialization}</p>
      )}
      <p className={cardStyles.dateContainer}>
         <CalendarDays className={iconSize.medium} />
         {formatDateToReadable(item.date)}
       </p>
      <p className={cardStyles.timeContainer}>
        <Clock className={iconSize.medium} />
        {item.time}
      </p>
      <div className={cardStyles.badgesContainer}>
        <PaymentBadge payment={item.payment} />
        <StatusBadge status={item.status} />
      </div>
      {item.status === "Rescheduled" && item.rescheduledTo && (
        <div className={cardStyles.rescheduledText}>
          Rescheduled to{" "}
          <span className={cardStyles.rescheduledSpan}>
            {formatDateToReadable(item.rescheduledTo.date)} · {item.rescheduledTo.time}
          </span>
        </div>
      )}
    </div>
  );
}

function ServiceCard({ item }) {
  return (
    <div className={cardStyles.serviceCard}>
      <div className={cardStyles.serviceImageContainer}>
        {item.image
          ? <img src={item.image} alt={item.name} className={cardStyles.image} loading="lazy" />
          : <Sparkles className="w-10 h-10 text-blue-400" />
        }
      </div>
      <h3 className={cardStyles.serviceName}>{item.name}</h3>
      {item.price > 0 && (
        <p className={cardStyles.price}>₹{item.price}</p>
      )}
      <div className={cardStyles.serviceDateContainer}>
         <CalendarDays className={iconSize.medium} />
         {formatDateToReadable(item.date)}
       </div>
      <div className={cardStyles.serviceTimeContainer}>
        <Clock className={iconSize.medium} />
        {item.time}
      </div>
      <div className={cardStyles.badgesContainer}>
        <PaymentBadge payment={item.payment} />
        <StatusBadge status={item.status} />
      </div>
      {item.status === "Rescheduled" && item.rescheduledTo && (
        <div className={cardStyles.serviceRescheduledText}>
          Rescheduled to{" "}
          <span className={cardStyles.rescheduledSpan}>
            {formatDateToReadable(item.rescheduledTo.date)} · {item.rescheduledTo.time}
          </span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
const AppointementPage = () => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [searchParams] = useSearchParams();

  const [loadingDoctors,  setLoadingDoctors]  = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [doctorAppts,     setDoctorAppts]     = useState([]);
  const [serviceAppts,    setServiceAppts]    = useState([]);
  const [error,           setError]           = useState(null);

  // ✅ Toast selon le statut de paiement dans l'URL
  useEffect(() => {
    const paymentStatus = searchParams.get("payment_status");
    const servicePayment = searchParams.get("service_payment");

    if (paymentStatus === "Paid") {
      toast.success("Paiement confirmé ! Votre rendez-vous est réservé. 🎉", {
        duration: 4000,
      });
    } else if (paymentStatus === "Cancelled") {
      toast.error("Paiement annulé.", { duration: 3000 });
    } else if (paymentStatus === "Failed") {
      toast.error("Paiement échoué. Veuillez réessayer.", { duration: 3000 });
    }

    if (servicePayment === "Paid") {
      toast.success("Service réservé et payé avec succès ! 🎉", {
        duration: 4000,
      });
    } else if (servicePayment === "Cancelled") {
      toast.error("Paiement du service annulé.", { duration: 3000 });
    } else if (servicePayment === "Failed") {
      toast.error("Paiement du service échoué.", { duration: 3000 });
    }
  }, []); // ← une seule fois au montage

  // ── Fetch médecins ──────────────────────────────────────────────────────────
  const loadDoctorAppointments = useCallback(async () => {
    if (!isLoaded) return;
    setLoadingDoctors(true);
    setError(null);

    let token = null;
    try { token = await getToken(); } catch (e) { console.error("getToken:", e); }
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
       const response = await API_CLIENT.get("/api/appointments/me", { headers });
       const fetchedAppointments = response?.data?.appointments ?? response?.data?.data ?? response?.data ?? [];
       const appointmentList = Array.isArray(fetchedAppointments) ? fetchedAppointments : [];
       setDoctorAppts(appointmentList.filter((a) => (a.doctorId != null) || !!a.doctorName || !a.serviceId));
     } catch {
       if (user?.id) {
         try {
           const retryResponse = await API_CLIENT.get(`/api/appointments/me?createdBy=${user.id}`, { headers });
           const fetchedAppointments = retryResponse?.data?.appointments ?? retryResponse?.data?.data ?? retryResponse?.data ?? [];
           const appointmentList = Array.isArray(fetchedAppointments) ? fetchedAppointments : [];
           setDoctorAppts(appointmentList.filter((a) => (a.doctorId != null) || !!a.doctorName || !a.serviceId));
         } catch {
           setError("Failed to load doctor appointments.");
           setDoctorAppts([]);
         }
       } else {
         setError("Failed to load doctor appointments.");
         setDoctorAppts([]);
       }
     } finally {
       setLoadingDoctors(false);
     }
  }, [isLoaded, getToken, user]);

  // ── Fetch services ──────────────────────────────────────────────────────────
  const loadServiceAppointments = useCallback(async () => {
    if (!isLoaded) return;
    setLoadingServices(true);

    let token = null;
    try { token = await getToken(); } catch (e) { console.error("getToken:", e); }
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
       const response = await API_CLIENT.get("/api/service-appointments/me", { headers });
       const fetchedAppointments = response?.data?.appointments ?? response?.data?.data ?? response?.data ?? [];
       setServiceAppts(Array.isArray(fetchedAppointments) ? fetchedAppointments : []);
     } catch {
       if (user?.id) {
         try {
           const retryResponse = await API_CLIENT.get(`/api/service-appointments/me?createdBy=${user.id}`, { headers });
           const fetchedAppointments = retryResponse?.data?.appointments ?? retryResponse?.data?.data ?? retryResponse?.data ?? [];
           setServiceAppts(Array.isArray(fetchedAppointments) ? fetchedAppointments : []);
         } catch { setServiceAppts([]); }
       } else { setServiceAppts([]); }
     } finally {
       setLoadingServices(false);
     }
  }, [isLoaded, getToken, user]);

  // 🔍 DEBUG — à supprimer après diagnostic
  useEffect(() => {
    console.log("🔍 Clerk state:", { isLoaded, isSignedIn, userId: user?.id });
  }, [isLoaded, isSignedIn, user]);

  useEffect(() => {
    if (isLoaded) {
      loadDoctorAppointments();
      loadServiceAppointments();
    }
  }, [isLoaded, isSignedIn, user, loadDoctorAppointments, loadServiceAppointments]);
  // Normalize doctor appointments data for display
  const appointmentData = useMemo(() => {
    return doctorAppts.map((appointmentRecord) => {
      const doctorObject = (typeof appointmentRecord.doctorId === "object" && appointmentRecord.doctorId) 
        ? appointmentRecord.doctorId 
        : {};
      const doctorImageUrl = 
        doctorObject.imageUrl || 
        doctorObject.image || 
        doctorObject.avatar || 
        appointmentRecord.doctorImage?.url || 
        appointmentRecord.doctorImage || 
        "";
      const extractedDoctorName =
        (doctorObject.name && String(doctorObject.name).trim()) ||
        (appointmentRecord.doctorName && String(appointmentRecord.doctorName).trim()) ||
        (appointmentRecord.doctor && String(appointmentRecord.doctor).trim()) || 
        "Doctor";
      const doctorSpecialization = 
        doctorObject.specialization || 
        appointmentRecord.specialization || 
        appointmentRecord.speciality || 
        "";
      const appointmentDate = appointmentRecord.date || "";
      let appointmentTime = appointmentRecord.time || "";
      if (!appointmentTime && appointmentRecord.hour !== undefined && appointmentRecord.ampm) {
        appointmentTime = `${appointmentRecord.hour}:${padNumberWithZeros(appointmentRecord.minute ?? 0)} ${appointmentRecord.ampm}`;
      }
      const paymentMethod = appointmentRecord.payment?.method || "Cash";
      const rescheduledData = extractRescheduledAppointment(
        appointmentRecord.rescheduledTo || { 
          date: appointmentRecord.rescheduledDate, 
          time: appointmentRecord.rescheduledTime 
        }
      );
      const normalizedAppointment = { 
        id: String(appointmentRecord._id || appointmentRecord.id || ""), 
        image: doctorImageUrl, 
        doctorName: extractedDoctorName, 
        specialization: doctorSpecialization, 
        date: appointmentDate, 
        time: appointmentTime, 
        payment: paymentMethod, 
        rescheduledTo: rescheduledData, 
        status: appointmentRecord.status || "" 
      };
      return { ...normalizedAppointment, status: computeAppointmentStatus(normalizedAppointment) };
    });
  }, [doctorAppts]);

  // Normalize service appointments data for display
  const serviceData = useMemo(() => {
    return serviceAppts.map((serviceRecord) => {
      const serviceObject = (typeof serviceRecord.serviceId === "object" && serviceRecord.serviceId) 
        ? serviceRecord.serviceId 
        : {};
      const serviceImageUrl = 
        serviceObject.imageUrl || 
        serviceObject.image || 
        serviceObject.imageSmall || 
        serviceRecord.serviceImage?.url || 
        serviceRecord.serviceImage || 
        "";
      const serviceName = 
        serviceRecord.serviceName || 
        serviceObject.name || 
        serviceObject.title || 
        "Service";
      const servicePrice = serviceRecord.fees ?? serviceRecord.amount ?? serviceRecord.price ?? 0;
      const appointmentDate = serviceRecord.date || "";
      let appointmentTime = serviceRecord.time || "";
      if (!appointmentTime && serviceRecord.hour !== undefined && serviceRecord.ampm) {
        appointmentTime = `${serviceRecord.hour}:${padNumberWithZeros(serviceRecord.minute ?? 0)} ${serviceRecord.ampm}`;
      }
      const paymentMethod = serviceRecord.payment?.method || "Cash";
      const rescheduledData = extractRescheduledAppointment(serviceRecord.rescheduledTo || null);
      const normalizedService = { 
        id: String(serviceRecord._id || serviceRecord.id || ""), 
        image: serviceImageUrl, 
        name: serviceName, 
        price: servicePrice, 
        date: appointmentDate, 
        time: appointmentTime, 
        payment: paymentMethod, 
        rescheduledTo: rescheduledData, 
        status: serviceRecord.status || "" 
      };
      return { ...normalizedService, status: computeAppointmentStatus(normalizedService) };
    });
  }, [serviceAppts]);

  // ── RENDU ───────────────────────────────────────────────────────────────────
  return (
    <div className={appointmentPageStyles.pageContainer}>
      <Toaster position="top-right" />

      <div className={appointmentPageStyles.maxWidthContainer}>

        {/* Erreur */}
        {error && (
          <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-5 shrink-0" /> {error}
          </div>
        )}

        {/* ══ Section Médecins ══ */}
        <h1 className={appointmentPageStyles.doctorTitle}>
          Your Doctor Appointments
        </h1>

        {loadingDoctors && (
          <div className={appointmentPageStyles.loadingText}>
            <RefreshCw className="inline w-4 animate-spin mr-2" /> Loading Doctors...
          </div>
        )}

        {!loadingDoctors && appointmentData.length === 0 && (
          <div className={appointmentPageStyles.emptyStateText}>
            No doctor appointments found.
          </div>
        )}

        {!loadingDoctors && appointmentData.length > 0 && (
          <div className={appointmentPageStyles.doctorGrid}>
            {appointmentData.map((item) => (
              <DoctorCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* ══ Section Services ══ */}
        <h2 className={appointmentPageStyles.serviceTitle}>
          Your Booked Services
        </h2>

        {loadingServices && (
          <div className={appointmentPageStyles.serviceLoadingText}>
            <RefreshCw className="inline w-4 animate-spin mr-2" /> Loading Service Bookings...
          </div>
        )}

        {!loadingServices && serviceData.length === 0 && (
          <div className={appointmentPageStyles.serviceEmptyStateText}>
            No service bookings found.
          </div>
        )}

        {!loadingServices && serviceData.length > 0 && (
          <div className={appointmentPageStyles.serviceGrid}>
            {serviceData.map((item) => (
              <ServiceCard key={item.id} item={item} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default AppointementPage;