import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Users,
  Phone,
  BadgeIndianRupee,
  RefreshCw,
} from "lucide-react";
import { dashboardStyles } from "../assets/dummyStyles";

const API_BASE = "https://backend-app-medical.onrender.com";

// --- Fonctions Utilitaires ---

function parseDateTime(date, time) {
  return new Date(`${date}T${time}:00`);
}

function formatTimeAMPM(time24) {
  if (!time24) return "";
  const [hh, mm] = time24.split(":");
  let h = parseInt(hh, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${mm} ${ampm}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function backendToFrontendStatus(s) {
  if (!s) return "pending";
  const v = String(s).toLowerCase();
  if (v === "pending") return "pending";
  if (v === "confirmed") return "confirmed";
  if (v === "completed") return "complete";
  if (v === "canceled" || v === "cancelled") return "cancelled";
  if (v === "rescheduled") return "rescheduled";
  return v;
}

function frontendToBackendStatus(fs) {
  if (!fs) return "Pending";
  const v = String(fs).toLowerCase();
  if (v === "pending") return "Pending";
  if (v === "confirmed") return "Confirmed";
  if (v === "complete") return "Completed";
  if (v === "cancelled") return "Canceled";
  if (v === "rescheduled") return "Rescheduled";
  return fs;
}

function to24Hour(timeStr) {
  if (!timeStr) return "00:00";
  const m = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return timeStr;
  let hh = Number(m[1]);
  const mm = m[2];
  const ampm = m[3];
  if (!ampm) {
    return `${String(hh).padStart(2, "0")}:${mm}`;
  }
  const up = ampm.toUpperCase();
  if (up === "AM") {
    if (hh === 12) hh = 0;
  } else {
    if (hh !== 12) hh += 12;
  }
  return `${String(hh).padStart(2, "0")}:${mm}`;
}

function to12HourFrom24(hhmm) {
  if (!hhmm) return "12:00 AM";
  const [hh, mm] = hhmm.split(":").map(Number);
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${String(h12)}:${String(mm).padStart(2, "0")} ${ampm}`;
}

function normalizeAppointment(a) {
  if (!a) return null;
  const id = a._id || a.id || String(Math.random()).slice(2);
  const patient = a.patientName || a.patient || a.name || "Unknown";
  const age = a.age ?? a.patientAge ?? "";
  const gender = a.gender || "";

  const doctorName =
    (a.doctorId && typeof a.doctorId === "object" && a.doctorId.name) ||
    a.doctorName ||
    "Doctor";

  const doctorImage =
    (a.doctorId && typeof a.doctorId === "object" && a.doctorId.imageUrl) ||
    a.doctorImage ||
    a.doctorImageUrl ||
    "";

  const speciality =
    (a.doctorId && (a.doctorId.specialization || a.doctorId.speciality)) ||
    a.speciality ||
    a.specialization ||
    "";

  const mobile = a.mobile || a.phone || "";
  const fee = Number(a.fees ?? a.fee ?? a.payment?.amount ?? 0) || 0;
  const date = a.date || (a.slot && a.slot.date) || "";

  const rawTime =
    a.time ||
    (a.slot && a.slot.time) ||
    (a.hour != null && a.minute != null
      ? `${String(a.hour).padStart(2, "0")}:${String(a.minute).padStart(2, "0")}`
      : "");

  const time24 = to24Hour(rawTime);
  const status = backendToFrontendStatus(
    a.status || (a.payment && a.payment.status) || "Pending"
  );

  return {
    id,
    patient,
    age,
    gender,
    doctorName,
    doctorImage,
    speciality,
    mobile,
    date,
    time: time24,
    fee,
    status,
    raw: a,
  };
}

// --- Sous-composants ---

function StatusBadge({ status }) {
  const s = dashboardStyles;
  const badgeMap = {
    complete: s.statusBadgeComplete,
    cancelled: s.statusBadgeCancelled,
    confirmed: s.statusBadgeConfirmed,
    rescheduled: s.statusBadgeRescheduled,
    pending: s.statusBadgePending,
  };
  const labelMap = {
    complete: "Completed",
    cancelled: "Cancelled",
    confirmed: "Confirmed",
    rescheduled: "Rescheduled",
    pending: "Pending",
  };
  return (
    <span className={`${s.statusBadgeBase} ${badgeMap[status] || s.statusBadgePending}`}>
      {labelMap[status] || status}
    </span>
  );
}

function AppointmentCard({ appt, onStatusChange }) {
  const s = dashboardStyles;
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(appt.date || "");
  const [rescheduleTime, setRescheduleTime] = useState(
    appt.time ? to12HourFrom24(appt.time) : ""
  );

  const isLocked = appt.status === "complete" || appt.status === "cancelled";

  const initials = appt.patient
    ? appt.patient
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  function handleStatusSelect(e) {
    const val = e.target.value;
    if (val === "rescheduled") {
      setShowReschedule(true);
    } else {
      onStatusChange(appt.id, val);
    }
  }

  function handleSaveReschedule() {
    onStatusChange(appt.id, "rescheduled", {
      date: rescheduleDate,
      time: to24Hour(rescheduleTime),
    });
    setShowReschedule(false);
  }

  return (
    <div className={s.appointmentCard}>
      {/* Header */}
      <div className={s.cardHeader}>
        <div className={s.cardAvatar}>
          {appt.doctorImage ? (
            <img
              src={appt.doctorImage}
              alt={appt.doctorName}
              className={s.cardAvatarImage}
            />
          ) : (
            <span className={s.cardAvatarFallback}>{initials}</span>
          )}
        </div>
        <div className={s.cardContent}>
          <p className={s.cardPatientName}>{appt.patient}</p>
          <p className={s.cardPatientInfo}>
            {[appt.age && `Age: ${appt.age}`, appt.gender]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <div className={s.cardDoctorInfo}>
            <span className="text-xs text-emerald-600">Dr. </span>
            <span className={s.cardDoctorName}>{appt.doctorName}</span>
            {appt.speciality && (
              <p className={s.cardSpeciality}>{appt.speciality}</p>
            )}
          </div>
          {appt.mobile && (
            <div className={s.cardPhoneContainer}>
              <Phone className={s.cardPhoneIcon} />
              <span>{appt.mobile}</span>
            </div>
          )}
        </div>
      </div>

      {/* Date & Time */}
      <div className={s.dateTimeContainer}>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-500" />
          <span className={s.dateText}>{formatDate(appt.date)}</span>
        </div>
        <span className={s.timeText}>{formatTimeAMPM(appt.time)}</span>
      </div>

      {/* Footer */}
      <div className={s.cardFooter}>
        <span className={s.feeText}>
          ₹ {appt.fee.toLocaleString("en-IN")}
        </span>

        {!showReschedule ? (
          <div className={s.statusContainer}>
            <StatusBadge status={appt.status} />
            <select
              className={`${s.statusSelect} ${
                isLocked ? s.statusSelectDisabled : s.statusSelectEnabled
              }`}
              value={appt.status}
              disabled={isLocked}
              onChange={handleStatusSelect}
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="complete">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rescheduled">Reschedule…</option>
            </select>
          </div>
        ) : (
          <div className={s.rescheduleForm}>
            <input
              type="date"
              className={s.rescheduleDateInput}
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
            />
            <input
              type="time"
              className={s.rescheduleTimeInput}
              value={appt.time}
              onChange={(e) => setRescheduleTime(e.target.value)}
            />
            <div className={s.rescheduleButtons}>
              <button className={s.saveButton} onClick={handleSaveReschedule}>
                Save
              </button>
              <button
                className={s.cancelButton}
                onClick={() => setShowReschedule(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Stats Card ---
function StatCard({ title, value, icon: Icon, gradientFrom, gradientTo, borderColor, to }) {
  const s = dashboardStyles;
  const inner = (
    <div className={s.statContent}>
      <div className={s.statTextContainer}>
        <p className={s.statTitle}>{title}</p>
        <p className={s.statValue}>{value}</p>
      </div>
      <div
        className={`${s.statIconContainer}  ${gradientFrom} ${gradientTo} ${borderColor}`}
      >
        <Icon className={s.statIcon} />
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className={`${s.statCard} cursor-pointer hover:scale-[1.02] transition-transform block`}>
        {inner}
      </Link>
    );
  }
  return <div className={s.statCard}>{inner}</div>;
}

// --- Composant Principal ---

export default function DashboardPage({ apiBase }) {
  const params = useParams();
  const location = useLocation();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const API = apiBase || API_BASE;
  const doctorId = params.id;

  async function fetchAppointments() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API}/api/appointments/doctor/${encodeURIComponent(doctorId)}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body?.message || `Failed to fetch appointments (${res.status})`
        );
      }
      const body = await res.json();
      const list = Array.isArray(body.appointments)
        ? body.appointments
        : Array.isArray(body)
        ? body
        : body.items ?? body.data ?? [];

      const normalized = (Array.isArray(list) ? list : [])
        .map(normalizeAppointment)
        .filter(Boolean);

      setAppointments(normalized);
    } catch (err) {
      console.error("fetchAppointments:", err);
      setError(err.message || "Failed to load appointments");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAppointments();
  }, [API, doctorId]);

  const sorted = useMemo(
    () =>
      [...appointments].sort(
        (a, b) => parseDateTime(b.date, b.time) - parseDateTime(a.date, a.time)
      ),
    [appointments]
  );

  const displayed = showAll ? sorted : sorted.slice(0, 12);

  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter(
    (a) => a.status === "complete"
  ).length;
  const cancelledAppointments = appointments.filter(
    (a) => a.status === "cancelled"
  ).length;
  const totalEarnings = appointments
    .filter((a) => a.status === "complete")
    .reduce((s, a) => s + (Number(a.fee) || 0), 0);

  async function updateStatusRemote(id, newStatusFrontend, extra) {
    const appt = appointments.find((p) => p.id === id);
    if (!appt) return;
    if (appt.status === "complete" || appt.status === "cancelled") return;

    const backendStatus = frontendToBackendStatus(newStatusFrontend);

    setAppointments((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: newStatusFrontend,
              ...(extra?.date ? { date: extra.date } : {}),
              ...(extra?.time ? { time: extra.time } : {}),
            }
          : p
      )
    );

    try {
      const res = await fetch(`${API}/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: backendStatus,
          ...(extra?.date ? { date: extra.date } : {}),
          ...(extra?.time ? { time: extra.time } : {}),
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.message || "Failed to update status");
      }
    } catch (err) {
      console.error("updateStatusRemote:", err);
      fetchAppointments();
      alert(err.message || "Error updating appointment status");
    }
  }

  const s = dashboardStyles;

  if (loading && appointments.length === 0) {
    return (
      <div className={s.pageContainer}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3 text-emerald-700">
            <RefreshCw className="w-8 h-8 animate-spin" />
            <p className="text-sm font-medium">Loading appointments…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && appointments.length === 0) {
    return (
      <div className={s.pageContainer}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-rose-700">
          <XCircle className="w-10 h-10" />
          <p className="text-sm font-medium">{error}</p>
          <button
            className={s.showMoreButton}
            onClick={fetchAppointments}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={s.pageContainer}>
      <div className={s.contentWrapper}>

        {/* Header */}
        <div className={s.headerContainer}>
          <div>
            <h1 className={s.headerTitle}>Doctor Dashboard</h1>
            <p className={s.headerSubtitle}>
              Showing appointments for doctor{" "}
              <span className="font-mono text-xs text-emerald-800">{doctorId}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={s.headerInfo}>
              {totalAppointments} total
            </span>
            <button
              className={s.refreshButton}
              onClick={fetchAppointments}
              disabled={loading}
            >
              <span className="flex items-center gap-1">
                <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={s.statsGrid}>
          <StatCard
            title="Total Appointments"
            value={totalAppointments}
            icon={Calendar}
            gradientFrom={s.accentTopEmerald.split(" ")[0]}
            gradientTo={s.accentTopEmerald.split(" ")[1]}
            borderColor={s.accentBottomEmerald}
            to={`/appointments/${doctorId}`}
          />
          <StatCard
            title="Total Earnings"
            value={`₹ ${totalEarnings.toLocaleString("en-IN")}`}
            icon={BadgeIndianRupee}
            gradientFrom={s.accentTopAmber.split(" ")[0]}
            gradientTo={s.accentTopAmber.split(" ")[1]}
            borderColor={s.accentBottomAmber}
          />
          <StatCard
            title="Completed"
            value={completedAppointments}
            icon={CheckCircle}
            gradientFrom={s.accentTopEmeraldLight.split(" ")[0]}
            gradientTo={s.accentTopEmeraldLight.split(" ")[1]}
            borderColor={s.accentBottomEmerald}
            to={`/appointments/${doctorId}?status=completed`}
          />
          <StatCard
            title="Cancelled"
            value={cancelledAppointments}
            icon={XCircle}
            gradientFrom={s.accentTopRose.split(" ")[0]}
            gradientTo={s.accentTopRose.split(" ")[1]}
            borderColor={s.accentBottomRose}
            to={`/appointments/${doctorId}?status=cancelled`}
          />
        </div>

        {/* Appointments Section */}
        <div className={s.appointmentsContainer}>
          <div className={s.appointmentsHeader}>
            <h2 className={s.appointmentsTitle}>Latest Appointments</h2>
            <span className={s.appointmentsTotal}>
              <Users className={s.totalIcon} />
              {totalAppointments} total
            </span>
          </div>

          {displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-emerald-700/60 gap-3">
              <Calendar className="w-10 h-10" />
              <p className="text-sm">No appointments found.</p>
            </div>
          ) : (
            <div className={s.cardsGrid}>
              {displayed.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appt={appt}
                  onStatusChange={updateStatusRemote}
                />
              ))}
            </div>
          )}

          {/* Show More — toujours visible, redirige vers /appointments/:id */}
          <div className={s.showMoreContainer}>
            <Link
              to={`/appointments/${doctorId}`}
              className={s.showMoreButton}
            >
              Show more
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}