import React, { useState, useMemo, useEffect } from "react";
import { Search, X, Phone, Calendar } from "lucide-react";
import { listPageStyles } from "../assets/dummyStyles";

const API_BASE = "https://backend-app-medical.onrender.com/api";

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRES
// ─────────────────────────────────────────────────────────────────────────────

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

function to24HourFromMaybe12(rawTime) {
  if (!rawTime) return "";
  const m = rawTime.match(/(\d+):(\d+)\s*(AM|PM|am|pm)?/);
  if (!m) return rawTime;
  let hh = parseInt(m[1], 10);
  const mm = m[2];
  const ampm = m[3];
  if (!ampm) return `${String(hh).padStart(2, "0")}:${mm}`;
  const up = ampm.toUpperCase();
  if (up === "AM") { if (hh === 12) hh = 0; }
  else { if (hh !== 12) hh += 12; }
  return `${String(hh).padStart(2, "0")}:${mm}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAPPING STATUTS
// ─────────────────────────────────────────────────────────────────────────────

function backendToFrontendStatus(s) {
  if (!s) return "pending";
  const v = String(s).toLowerCase();
  if (v === "pending") return "pending";
  if (v === "confirmed") return "confirmed";
  if (v === "completed" || v === "complete") return "complete";
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
  if (v === "cancelled") return "Cancelled";
  if (v === "rescheduled") return "Rescheduled";
  return fs;
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSFORMATION
// ─────────────────────────────────────────────────────────────────────────────

const transformAppointment = (a) => {
  const patient  = a.patientName || a.patient || a.name || "Unknown";
  const age      = a.age ?? a.patientAge ?? "";
  const gender   = a.gender || "";
  const doctorName  = (a.doctorId && a.doctorId.name) || a.doctorName || a.doctor || "";
  const doctorImage = (a.doctorId && (a.doctorId.imageUrl || a.doctorId.image)) || a.doctorImage || a.doctorImageUrl || "";
  const speciality  = (a.doctorId && (a.doctorId.specialization || a.doctorId.speciality)) || a.speciality || a.specialization || "";
  const mobile = a.mobile || a.phone || "";
  const fee    = Number(a.fees ?? a.fee ?? a.payment?.amount ?? 0) || 0;
  const date   = a.date || (a.slot && a.slot.date) || "";
  const rawTime = a.time || (a.slot && a.slot.time) ||
    (a.hour !== null && a.hour !== undefined
      ? `${String(a.hour).padStart(2, "0")}:${String(a.minute || 0).padStart(2, "0")}`
      : "");
  const time   = to24HourFromMaybe12(rawTime);
  const status = backendToFrontendStatus(a.status || a.payment?.status || "pending");
  return { id: a._id || a.id, patient, age, gender, doctorName, doctorImage, speciality, mobile, date, time, fee, status, raw: a };
};

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const base = listPageStyles.statusBadgeBase;
  if (status === "complete")    return <span className={`${base} ${listPageStyles.statusBadgeComplete}`}>Completed</span>;
  if (status === "cancelled")   return <span className={`${base} ${listPageStyles.statusBadgeCancelled}`}>Cancelled</span>;
  if (status === "confirmed")   return <span className={`${base} ${listPageStyles.statusBadgeConfirmed}`}>Confirmed</span>;
  if (status === "rescheduled") return <span className={`${base} ${listPageStyles.statusBadgeRescheduled}`}>Rescheduled</span>;
  return <span className={`${base} ${listPageStyles.statusBadgePending}`}>Pending</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS SELECT
// ─────────────────────────────────────────────────────────────────────────────

function StatusSelect({ appointment, onChange }) {
  const terminal = appointment.status === "complete" || appointment.status === "cancelled";

  if (appointment.status === "rescheduled") {
    return (
      <select
        value={appointment.status}
        onChange={(e) => onChange(e.target.value)}
        className={`${listPageStyles.statusSelect} ${listPageStyles.statusSelectEnabled}`}
      >
        <option value="rescheduled" disabled>Rescheduled</option>
        <option value="complete">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    );
  }

  return (
    <select
      value={appointment.status}
      onChange={(e) => onChange(e.target.value)}
      disabled={terminal}
      className={`${listPageStyles.statusSelect} ${terminal ? listPageStyles.statusSelectDisabled : listPageStyles.statusSelectEnabled}`}
      title={terminal ? "Status cannot be changed" : "Change status"}
    >
      <option value="pending">Pending</option>
      <option value="confirmed">Confirmed</option>
      <option value="complete">Completed</option>
      <option value="cancelled">Cancelled</option>
    </select>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESCHEDULE BUTTON
// ─────────────────────────────────────────────────────────────────────────────

function RescheduleButton({ appointment, onReschedule }) {
  const terminal = appointment.status === "complete" || appointment.status === "cancelled";
  const [editing, setEditing] = useState(false);

  const minDate = useMemo(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }, []);

  const [date, setDate] = useState(() => {
    const raw = appointment.date ? String(appointment.date).slice(0, 10) : "";
    return raw >= minDate ? raw : minDate;
  });
  const [time, setTime] = useState(appointment.time || "09:00");

  function save() {
    if (!date || !time || date < minDate) return;
    onReschedule(date, time);
    setEditing(false);
  }

  function cancel() {
    const raw = appointment.date ? String(appointment.date).slice(0, 10) : "";
    setDate(raw >= minDate ? raw : minDate);
    setTime(appointment.time || "09:00");
    setEditing(false);
  }

  return (
    <div className="w-full">
      {!editing ? (
        <div className="flex justify-end">
          <button
            onClick={() => !terminal && setEditing(true)}
            disabled={terminal}
            className={`${listPageStyles.rescheduleButton} ${terminal ? listPageStyles.rescheduleButtonDisabled : listPageStyles.rescheduleButtonEnabled}`}
          >
            Reschedule
          </button>
        </div>
      ) : (
        <div className={listPageStyles.rescheduleForm}>
          <input type="date" value={date} min={minDate} onChange={(e) => setDate(e.target.value)} className={listPageStyles.dateInput} />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={listPageStyles.timeInput} />
          <div className={listPageStyles.rescheduleButtons}>
            <button onClick={save} className={listPageStyles.saveButton}>Save</button>
            <button onClick={cancel} className={listPageStyles.cancelButton}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

const ListPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      setError(null);
      try {
        const res  = await fetch(`${API_BASE}/appointments`);
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const data = await res.json();
        const raw  = Array.isArray(data) ? data : data.appointments || data.data || [];
        const sorted = raw.sort((a, b) => {
          const da = parseDateTime(
            a.date || (a.slot && a.slot.date) || "1970-01-01",
            to24HourFromMaybe12(a.time || (a.slot && a.slot.time) || "00:00")
          );
          const db = parseDateTime(
            b.date || (b.slot && b.slot.date) || "1970-01-01",
            to24HourFromMaybe12(b.time || (b.slot && b.slot.time) || "00:00")
          );
          return db - da;
        });
        setAppointments(sorted.map(transformAppointment));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  // ── Mise à jour statut ─────────────────────────────────────────────────────
  const updateStatus = async (id, newStatus) => {
    const backendStatus = frontendToBackendStatus(newStatus);
    setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status: newStatus } : a));
    try {
      const res = await fetch(`${API_BASE}/appointments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: backendStatus }),
      });
      if (!res.ok) throw new Error("Échec de la mise à jour du statut");
    } catch (err) {
      console.error("updateStatus error:", err);
    }
  };

  // ── Reprogrammation ────────────────────────────────────────────────────────
  const updateDateTime = async (id, newDate, newTime) => {
    setAppointments((prev) =>
      prev.map((a) => a.id === id ? { ...a, date: newDate, time: newTime, status: "rescheduled" } : a)
    );
    try {
      const res = await fetch(`${API_BASE}/appointments/${id}/reschedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newDate, time: newTime, status: "Rescheduled" }),
      });
      if (!res.ok) throw new Error("Échec de la reprogrammation");
    } catch (err) {
      console.error("updateDateTime error:", err);
    }
  };

  // ── Filtrage ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const matchSearch = !search ||
        a.patient.toLowerCase().includes(search.toLowerCase()) ||
        a.doctorName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [appointments, search, statusFilter]);

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <div className={listPageStyles.pageContainer}>
      <div className={listPageStyles.contentWrapper}>

        {/* En-tête */}
        <div className={listPageStyles.headerContainer}>
          <div>
            <h1 className={listPageStyles.headerTitle}>All Appointments</h1>
            <p className={listPageStyles.headerSubtitle}>Latest at top · search by patient name</p>
          </div>

          {/* Recherche + Filtre */}
          <div className={listPageStyles.searchFilterContainer}>
            <div className={listPageStyles.searchContainer}>
              <div className={listPageStyles.searchIconContainer}>
                <Search className={listPageStyles.searchIcon} />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={listPageStyles.searchInput}
                placeholder="Search Patient Name"
              />
              {search && (
                <button onClick={() => setSearch("")} className={listPageStyles.clearSearchButton}>
                  <X className={listPageStyles.clearSearchIcon} />
                </button>
              )}
            </div>

            <div className={listPageStyles.filterContainer}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`${listPageStyles.statusSelect} ${listPageStyles.statusSelectEnabled}`}
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="complete">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contenu */}
        {loading ? (
          <div className={listPageStyles.loadingContainer}>Loading Appointments...</div>
        ) : error ? (
          <div className={listPageStyles.errorContainer}>Error: {error}</div>
        ) : filtered.length === 0 ? (
          <div className={listPageStyles.loadingContainer}>No appointments found.</div>
        ) : (
          <div className={listPageStyles.appointmentsList}>
            <div className={listPageStyles.appointmentsGrid}>
              {filtered.map((a) => (
                <article key={a.id} className={listPageStyles.appointmentCard}>

                  {/* Avatar + infos patient */}
                  <header className={listPageStyles.cardHeader}>
                    <div className={listPageStyles.cardAvatar}>
                      {a.doctorImage ? (
                        <img
                          src={a.doctorImage}
                          alt={a.doctorName}
                          className={listPageStyles.cardAvatarImage}
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      ) : (
                        <div className={listPageStyles.cardAvatarFallback}>
                          {(a.doctorName || "D").charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className={listPageStyles.cardContent}>
                      <div className={listPageStyles.cardPatientName}>{a.patient}</div>
                      <div className={listPageStyles.cardPatientInfo}>
                        {a.age ? `${a.age} yrs` : ""}
                        {a.age && a.gender ? " · " : ""}
                        {a.gender}
                      </div>
                    </div>
                  </header>

                  {/* Médecin + Spécialité */}
                  {(a.doctorName || a.speciality) && (
                    <div className={listPageStyles.cardDoctorInfo}>
                      {a.doctorName && <span className={listPageStyles.cardDoctorName}>{a.doctorName}</span>}
                      {a.speciality && <div className={listPageStyles.cardSpeciality}>{a.speciality}</div>}
                    </div>
                  )}

                  {/* Date + Heure + Fee */}
                  <div className={listPageStyles.dateTimeSection}>
                    <div className={listPageStyles.dateTimeContainer}>
                      <Calendar className={listPageStyles.calendarIcon} />
                      <span className={listPageStyles.dateText}>
                        {formatDate(a.date)}
                        {a.time ? ` · ${formatTimeAMPM(a.time)}` : ""}
                      </span>
                    </div>
                    {a.fee > 0 && <div className={listPageStyles.feeText}>Fee: ${a.fee}</div>}
                  </div>

                  {/* Contact + Statut */}
                  <div className={listPageStyles.contactStatusSection}>
                    {a.mobile && (
                      <div className={listPageStyles.phoneContainer}>
                        <Phone className={listPageStyles.phoneIcon} />
                        <span className={listPageStyles.phoneNumber}>{a.mobile}</span>
                      </div>
                    )}
                    <div className={listPageStyles.statusContainer}>
                      <StatusBadge status={a.status} />
                      <StatusSelect appointment={a} onChange={(s) => updateStatus(a.id, s)} />
                    </div>
                  </div>

                  {/* Reschedule */}
                  <div className={listPageStyles.rescheduleContainer}>
                    <RescheduleButton
                      appointment={a}
                      onReschedule={(d, t) => updateDateTime(a.id, d, t)}
                    />
                  </div>

                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListPage;