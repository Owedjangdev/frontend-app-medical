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
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const API_BASE = "https://backend-app-medical.onrender.com";
const API = axios.create({ baseURL: API_BASE });

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────
function pad(n) { return String(n).padStart(2, "0"); }

function parseDateTime(dateStr, timeStr) {
  if (!dateStr) return new Date(0);
  const direct = new Date(`${dateStr} ${timeStr || ""}`);
  if (!isNaN(direct)) return direct;

  const parts = (dateStr || "").split(" ");
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const months = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
    const month = months[m];
    if (month === undefined) return new Date(0);
    let [t, ampm] = (timeStr || "0:00 AM").split(" ");
    let [hh, mm] = (t || "0:00").split(":");
    hh = Number(hh) || 0; mm = Number(mm) || 0;
    if (ampm === "PM" && hh < 12) hh += 12;
    if (ampm === "AM" && hh === 12) hh = 0;
    return new Date(Number(y), month, Number(d), hh, mm);
  }
  return new Date(0);
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", timeZone: "UTC",
  });
}

function computeStatus(item) {
  if (!item) return "Pending";
  const now = new Date();
  const raw = item.status || "";

  if (raw === "Canceled"  || raw === "Annuler")      return "Canceled";
  if (raw === "Completed" || raw === "Completer")    return "Completed";

  if (raw === "Rescheduled" || raw === "Reprogrammer") {
    if (item.rescheduledTo?.date && item.rescheduledTo?.time) {
      if (now >= parseDateTime(item.rescheduledTo.date, item.rescheduledTo.time)) return "Completed";
    }
    return "Rescheduled";
  }

  if (raw === "Confirmed" || raw === "Confirmer") {
    return now >= parseDateTime(item.date, item.time) ? "Completed" : "Confirmed";
  }

  if (now >= parseDateTime(item.date, item.time)) return "Completed";
  return item.confirmed ? "Confirmed" : "Pending";
}

function normalizePaymentMethod(method) {
  if (!method) return "Cash";
  if (method === "En ligne" || method === "Online") return "Online";
  return "Cash";
}

function normalizeRescheduled(rt) {
  if (!rt) return null;
  if (rt.date && rt.time) return { date: rt.date, time: rt.time };
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
        {formatDate(item.date)}
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
            {formatDate(item.rescheduledTo.date)} · {item.rescheduledTo.time}
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
        {formatDate(item.date)}
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
            {formatDate(item.rescheduledTo.date)} · {item.rescheduledTo.time}
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
      const resp    = await API.get("/api/appointments/me", { headers });
      const fetched = resp?.data?.appointments ?? resp?.data?.data ?? resp?.data ?? [];
      const arr     = Array.isArray(fetched) ? fetched : [];
      setDoctorAppts(arr.filter((a) => (a.doctorId != null) || !!a.doctorName || !a.serviceId));
    } catch {
      if (user?.id) {
        try {
          const r2      = await API.get(`/api/appointments/me?createdBy=${user.id}`, { headers });
          const fetched = r2?.data?.appointments ?? r2?.data?.data ?? r2?.data ?? [];
          const arr     = Array.isArray(fetched) ? fetched : [];
          setDoctorAppts(arr.filter((a) => (a.doctorId != null) || !!a.doctorName || !a.serviceId));
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
      const resp    = await API.get("/api/service-appointments/me", { headers });
      const fetched = resp?.data?.appointments ?? resp?.data?.data ?? resp?.data ?? [];
      setServiceAppts(Array.isArray(fetched) ? fetched : []);
    } catch {
      if (user?.id) {
        try {
          const r2      = await API.get(`/api/service-appointments/me?createdBy=${user.id}`, { headers });
          const fetched = r2?.data?.appointments ?? r2?.data?.data ?? r2?.data ?? [];
          setServiceAppts(Array.isArray(fetched) ? fetched : []);
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
  // ── Normalisation médecins ──────────────────────────────────────────────────
  const appointmentData = useMemo(() => {
    return doctorAppts.map((a) => {
      const doctorObj = (typeof a.doctorId === "object" && a.doctorId) ? a.doctorId : {};
      const image     = doctorObj.imageUrl || doctorObj.image || doctorObj.avatar || a.doctorImage?.url || a.doctorImage || "";
      const doctorName =
        (doctorObj.name  && String(doctorObj.name).trim())  ||
        (a.doctorName    && String(a.doctorName).trim())    ||
        (a.doctor        && String(a.doctor).trim())        || "Doctor";
      const specialization = doctorObj.specialization || a.specialization || a.speciality || "";
      const date           = a.date || "";
      let   time           = a.time || "";
      if (!time && a.hour !== undefined && a.ampm) time = `${a.hour}:${pad(a.minute ?? 0)} ${a.ampm}`;
      const payment        = a.payment?.method || "Cash";
      const rescheduledTo  = normalizeRescheduled(a.rescheduledTo || { date: a.rescheduledDate, time: a.rescheduledTime });
      const item = { id: String(a._id || a.id || ""), image, doctorName, specialization, date, time, payment, rescheduledTo, status: a.status || "" };
      return { ...item, status: computeStatus(item) };
    });
  }, [doctorAppts]);

  // ── Normalisation services ──────────────────────────────────────────────────
  const serviceData = useMemo(() => {
    return serviceAppts.map((s) => {
      const svc   = (typeof s.serviceId === "object" && s.serviceId) ? s.serviceId : {};
      const image = svc.imageUrl || svc.image || svc.imageSmall || s.serviceImage?.url || s.serviceImage || "";
      const name  = s.serviceName || svc.name || svc.title || "Service";
      const price = s.fees ?? s.amount ?? s.price ?? 0;
      const date  = s.date || "";
      let   time  = s.time || "";
      if (!time && s.hour !== undefined && s.ampm) time = `${s.hour}:${pad(s.minute ?? 0)} ${s.ampm}`;
      const payment       = s.payment?.method || "Cash";
      const rescheduledTo = normalizeRescheduled(s.rescheduledTo || null);
      const item = { id: String(s._id || s.id || ""), image, name, price, date, time, payment, rescheduledTo, status: s.status || "" };
      return { ...item, status: computeStatus(item) };
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