import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Edit2, Save, X, Plus, Calendar, Clock,
  Image as ImageIcon, Trash, Star, User,
  Briefcase, GraduationCap, MapPin, DollarSign,
  CheckCircle, AlertCircle, BadgeIndianRupee, UserCog,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────
const STORAGE_KEY = "doctorToken_v1";
const API_BASE    = "https://backend-app-medical.onrender.com/api/docteur";

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRES
// ─────────────────────────────────────────────────────────────────────────────
function parse12HourTimeToMinutes(t) {
  if (!t) return 0;
  const [time, ampm] = (t || "").split(" ");
  const [hh, mm] = (time || "0:00").split(":");
  let h = Number(hh) % 12;
  if ((ampm || "").toUpperCase() === "PM") h += 12;
  return h * 60 + Number(mm || 0);
}

function formatTimeFromInput(time24) {
  if (!time24) return time24;
  const [h, m] = time24.split(":");
  let hr = Number(h);
  const ampm = hr >= 12 ? "PM" : "AM";
  hr = hr % 12 || 12;
  return `${String(hr).padStart(2, "0")}:${m} ${ampm}`;
}

/**
 * Normalise le schedule venant du backend.
 *
 * Mongoose Map sérialisé peut arriver sous plusieurs formes :
 *   1. Plain object   { "2026-02-04": ["11:00 AM", ...], ... }  ← cas normal
 *   2. Tableau de paires [[date, slots], ...]                   ← Map.toJSON()
 *   3. Objet indexé   { "0": [date, slots], "1": ... }          ← Map.entries() sérialisé
 *
 * On normalise tout vers la forme 1.
 */
function normalizeSchedule(raw) {
  if (!raw) return {};

  // Cas 2 : tableau de paires
  if (Array.isArray(raw)) {
    const out = {};
    raw.forEach(([date, slots]) => { if (date) out[date] = Array.isArray(slots) ? slots : []; });
    return dedupeAndSortSchedule(out);
  }

  if (typeof raw !== "object") return {};

  const keys = Object.keys(raw);
  if (keys.length === 0) return {};

  // Cas 3 : objet indexé { "0": [date, slots], ... }
  const looksLikeIndexedPairs =
    keys.every((k) => !isNaN(Number(k))) &&
    keys.every((k) => Array.isArray(raw[k]) && raw[k].length === 2 && typeof raw[k][0] === "string");

  if (looksLikeIndexedPairs) {
    const out = {};
    keys.forEach((k) => { out[raw[k][0]] = Array.isArray(raw[k][1]) ? raw[k][1] : []; });
    return dedupeAndSortSchedule(out);
  }

  // Cas 1 : plain object standard
  return dedupeAndSortSchedule(raw);
}

function dedupeAndSortSchedule(schedule = {}) {
  const out = {};
  Object.entries(schedule || {}).forEach(([date, slots]) => {
    if (!Array.isArray(slots)) return;
    const uniq = Array.from(new Set(slots));
    uniq.sort((a, b) => parse12HourTimeToMinutes(a) - parse12HourTimeToMinutes(b));
    out[date] = uniq;
  });
  return out;
}

/**
 * "2026-02-04" → "Wed, Feb 4"  (sans décalage de fuseau)
 */
function formatDateLabel(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", timeZone: "UTC",
  });
}

/**
 * Le backend stocke availability: "Disponible" | "Indisponible"
 */
function isDocAvailable(doc) {
  return doc?.availability === "Disponible";
}

// ─────────────────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────────────────
function ToastList({ toasts }) {
  return (
    <div style={{ position: "fixed", top: 12, right: 16, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10, maxWidth: 340 }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          padding: "12px 16px", borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          borderLeft: `4px solid ${t.type === "success" ? "#10b981" : t.type === "error" ? "#f43f5e" : "#3b82f6"}`,
          background: t.type === "success" ? "#f0fdf4" : t.type === "error" ? "#fff1f2" : "#eff6ff",
          animation: "slideIn 0.3s ease-out forwards",
        }}>
          {t.type === "error"
            ? <AlertCircle size={18} style={{ color: "#f43f5e", marginTop: 1, flexShrink: 0 }} />
            : <CheckCircle size={18} style={{ color: t.type === "success" ? "#10b981" : "#3b82f6", marginTop: 1, flexShrink: 0 }} />
          }
          <span style={{ fontSize: 13.5, fontWeight: 500, color: "#1f2937", fontFamily: "inherit" }}>{t.text}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FIELD
// ─────────────────────────────────────────────────────────────────────────────
function Field({ label, icon: Icon, value, onChange, editing, type = "text", min, max, step }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 28, height: 28, borderRadius: "50%", background: editing ? "#d1fae5" : "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={13} style={{ color: editing ? "#059669" : "#9ca3af" }} />
        </span>
        <label style={{ fontSize: 12.5, fontWeight: 600, color: "#065f46", fontFamily: "inherit" }}>{label}</label>
      </div>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={!editing}
        min={min} max={max} step={step}
        style={{ width: "100%", borderRadius: 999, border: `2px solid ${editing ? "#a7f3d0" : "#e5e7eb"}`, padding: "9px 16px", fontSize: 13.5, background: editing ? "rgba(236,253,245,0.5)" : "rgba(249,250,251,0.5)", color: editing ? "#111827" : "#6b7280", cursor: editing ? "text" : "not-allowed", outline: "none", transition: "all 0.2s", fontFamily: "inherit", boxSizing: "border-box" }}
        onFocus={(e) => { if (editing) { e.target.style.border = "2px solid #34d399"; e.target.style.boxShadow = "0 0 0 3px rgba(52,211,153,0.15)"; } }}
        onBlur={(e) => { e.target.style.border = `2px solid ${editing ? "#a7f3d0" : "#e5e7eb"}`; e.target.style.boxShadow = "none"; }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD DATE
// ─────────────────────────────────────────────────────────────────────────────
function AddDateControl({ onAdd, editing }) {
  const [dateVal, setDateVal] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  if (!editing) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input
        type="date" value={dateVal} min={today}
        onChange={(e) => setDateVal(e.target.value)}
        style={{ borderRadius: 10, padding: "8px 12px", border: "2px solid #a7f3d0", background: "white", fontSize: 13.5, outline: "none", fontFamily: "inherit", color: "#065f46" }}
      />
      <button
        onClick={() => { if (dateVal && dateVal >= today) { onAdd(dateVal); setDateVal(""); } }}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none", borderRadius: 10, padding: "8px 16px", cursor: "pointer", fontSize: 13.5, fontWeight: 600, fontFamily: "inherit", boxShadow: "0 2px 8px rgba(16,185,129,0.3)", transition: "all 0.2s" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, #059669, #047857)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, #10b981, #059669)"; }}
      >
        <Plus size={15} /> Add Date
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DATE CARD
// ─────────────────────────────────────────────────────────────────────────────
function DateCard({ dateStr, slots, editing, onAddSlot, onRemoveSlot, onRemoveDate }) {
  const [timeVal, setTimeVal] = useState("");
  return (
    <div
      style={{ background: "linear-gradient(145deg, #ffffff, #f0fdf4)", borderRadius: 18, border: "1px solid #d1fae5", padding: "16px 18px", boxShadow: "0 2px 12px rgba(16,185,129,0.08)", transition: "all 0.3s" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 28px rgba(16,185,129,0.15)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(16,185,129,0.08)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid #d1fae5" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 34, height: 34, borderRadius: "50%", background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Calendar size={17} style={{ color: "#059669" }} />
          </span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#065f46", fontFamily: "inherit" }}>{formatDateLabel(dateStr)}</div>
            <div style={{ fontSize: 11.5, color: "#6ee7b7", fontFamily: "inherit" }}>{dateStr}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: "#d1fae5", color: "#065f46", fontFamily: "inherit" }}>
            {slots.length} slot{slots.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => editing && onRemoveDate(dateStr)}
            style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "transparent", cursor: editing ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", color: editing ? "#f43f5e" : "#d1d5db", transition: "background 0.2s" }}
            onMouseEnter={(e) => { if (editing) e.currentTarget.style.background = "#fff1f2"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <Trash size={14} />
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: editing ? 14 : 0 }}>
        {slots.length === 0 && (
          <div style={{ textAlign: "center", color: "#a7f3d0", fontSize: 12.5, padding: "8px 0", fontFamily: "inherit" }}>No slots yet</div>
        )}
        {slots.map((slot) => (
          <div key={slot} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", borderRadius: 999, border: "1px solid #d1fae5", padding: "7px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={14} style={{ color: "#10b981", flexShrink: 0 }} />
              <span style={{ fontWeight: 600, color: "#065f46", fontSize: 13.5, fontFamily: "inherit" }}>{slot}</span>
            </div>
            <button
              onClick={() => editing && onRemoveSlot(dateStr, slot)}
              style={{ width: 24, height: 24, borderRadius: "50%", border: "none", background: "transparent", cursor: editing ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", color: editing ? "#f43f5e" : "#d1d5db", transition: "all 0.2s" }}
              onMouseEnter={(e) => { if (editing) e.currentTarget.style.background = "#fff1f2"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>

      {editing && (
        <div style={{ paddingTop: 12, borderTop: "1px solid #d1fae5" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="time" value={timeVal}
              onChange={(e) => setTimeVal(e.target.value)}
              style={{ flex: 1, borderRadius: 999, padding: "7px 12px", border: "1px solid #a7f3d0", background: "white", fontSize: 13, outline: "none", fontFamily: "inherit", color: "#065f46" }}
            />
            <button
              onClick={() => { if (timeVal) { onAddSlot(dateStr, timeVal); setTimeVal(""); } }}
              style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "#d1fae5", color: "#059669", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#a7f3d0"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#d1fae5"; }}
            >
              <Plus size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT BADGE
// ─────────────────────────────────────────────────────────────────────────────
function StatBadge({ icon: Icon, label, value, amber, fillStar, editing, onChange, min, max, step }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: amber ? "linear-gradient(135deg, #fffbeb, #fef3c7)" : "white", border: `1px solid ${amber ? "#fde68a" : "#d1fae5"}`, borderRadius: 999, padding: "7px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <Icon size={15} style={{ color: amber ? (fillStar ? "#f59e0b" : "#d97706") : "#10b981", fill: fillStar ? "#f59e0b" : "none", flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: amber ? "#92400e" : "#059669", fontFamily: "inherit" }}>{label}</div>
        {!editing
          ? <div style={{ fontSize: 13, fontWeight: 700, color: amber ? "#78350f" : "#065f46", fontFamily: "inherit" }}>
              {value ?? "—"}{label === "Rating" ? "/5" : ""}
            </div>
          : <input
              type="number" min={min} max={max} step={step}
              value={value ?? ""}
              onChange={(e) => onChange(e.target.value)}
              style={{ width: label === "Patients" ? 72 : 56, borderRadius: 999, border: `1px solid ${amber ? "#fde68a" : "#a7f3d0"}`, padding: "2px 8px", fontSize: 13, outline: "none", background: "transparent", fontFamily: "inherit", color: amber ? "#78350f" : "#065f46" }}
            />
        }
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function EditProfilePage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [doc,            setDoc]            = useState(null);
  const [editing,        setEditing]        = useState(false);
  const [imagePreview,   setImagePreview]   = useState("");
  const [localImageFile, setLocalImageFile] = useState(null);
  const [saveMessage,    setSaveMessage]    = useState(null);
  const [toasts,         setToasts]         = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [toggling,       setToggling]       = useState(false);

  // ── Toasts ──────────────────────────────────────────────────────────────────
  const addToast = (text, type = "success") => {
    const idt = Date.now() + Math.random();
    setToasts((prev) => [{ id: idt, text, type }, ...prev.slice(0, 2)]);
    setTimeout(() => setToasts((prev) => prev.filter((it) => it.id !== idt)), 3000);
  };

  // ── Fetch (réutilisable) ─────────────────────────────────────────────────────
  const loadDoctor = async () => {
    const res  = await fetch(`${API_BASE}/${id}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to fetch doctor");

    // Backend: { success: true, data: {...doctor} }
    const raw = json.data || json;

    return {
      ...raw,
      // Map Mongoose → plain object JS
      schedule: normalizeSchedule(raw.schedule),
      // Unifie imageUrl
      imageUrl: raw.imageUrl || raw.image || "",
      // Unifie fee / fees
      fee: raw.fee ?? raw.fees ?? 0,
    };
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const d = await loadDoctor();
        if (!cancelled) {
          setDoc(d);
          setImagePreview(d.imageUrl || "");
        }
      } catch (err) {
        if (!cancelled) addToast("Unable to load profile", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── Planning ─────────────────────────────────────────────────────────────────
  const addDate = (dateStr) => {
    if (doc.schedule[dateStr] !== undefined) { addToast("Date already exists", "error"); return; }
    setDoc((d) => ({ ...d, schedule: { ...d.schedule, [dateStr]: [] } }));
    addToast("Date added", "success");
  };

  const addSlot = (dateStr, time24) => {
    const formatted = formatTimeFromInput(time24);
    setDoc((d) => {
      const existing = d.schedule[dateStr] || [];
      if (existing.includes(formatted)) { addToast(`${formatted} already exists`, "error"); return d; }
      const next = [...existing, formatted].sort((a, b) => parse12HourTimeToMinutes(a) - parse12HourTimeToMinutes(b));
      return { ...d, schedule: { ...d.schedule, [dateStr]: next } };
    });
    addToast(`Slot ${formatted} added`, "success");
  };

  const removeSlot = (dateStr, slot) => {
    setDoc((d) => ({ ...d, schedule: { ...d.schedule, [dateStr]: (d.schedule[dateStr] || []).filter((s) => s !== slot) } }));
    addToast(`Removed ${slot}`, "info");
  };

  const removeDate = (dateStr) => {
    setDoc((d) => { const c = { ...d.schedule }; delete c[dateStr]; return { ...d, schedule: c }; });
    addToast(`Date ${dateStr} removed`, "info");
  };

  // ── Image ────────────────────────────────────────────────────────────────────
  const handleImageChange = (e) => {
    if (!editing) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setLocalImageFile(file);
    addToast("Image updated locally", "success");
  };

  // ── Toggle availability ──────────────────────────────────────────────────────
  // Backend: POST /:id/toggle-availability
  // Retourne { success: true, data: { availability: "Disponible"|"Indisponible", ... } }
  const toggleAvailability = async () => {
    if (!doc || toggling) return;
    setToggling(true);

    const wasAvailable = isDocAvailable(doc);
    // Optimiste
    setDoc((d) => ({ ...d, availability: wasAvailable ? "Indisponible" : "Disponible" }));

    try {
      const token = localStorage.getItem(STORAGE_KEY);
      if (!token) throw new Error("Session expirée — veuillez vous reconnecter");

      const res  = await fetch(`${API_BASE}/${id}/toggle-availability`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || `Erreur ${res.status}`);

      // Sync avec le serveur
      const updated = json.data || json;
      if (updated?.availability) {
        setDoc((d) => ({ ...d, availability: updated.availability }));
      }
      addToast(!wasAvailable ? "Statut : Disponible ✓" : "Statut : Indisponible", "success");
    } catch (err) {
      // Rollback
      setDoc((d) => ({ ...d, availability: wasAvailable ? "Disponible" : "Indisponible" }));
      addToast(err.message || "Impossible de mettre à jour le statut", "error");
    } finally {
      setToggling(false);
    }
  };

  // ── Reset ────────────────────────────────────────────────────────────────────
  const handleReset = async () => {
    try {
      setLoading(true);
      const d = await loadDoctor();
      setDoc(d);
      setImagePreview(d.imageUrl || "");
      setLocalImageFile(null);
      setEditing(false);
      addToast("Reset to server profile", "info");
    } catch (err) {
      addToast("Reset failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  // PUT /:id  → multipart/form-data
  // Le backend attend : name, specialization, experience, qualifications,
  //   location, about, fee, success, patients, rating, availability, schedule
  // availability doit être "Disponible" | "Indisponible" (valeur du backend)
  const handleSave = async () => {
    if (!doc) return;
    setSaveMessage({ type: "saving", text: "Saving profile..." });
    addToast("Saving...", "info");

    try {
      const form = new FormData();

      // Champs scalaires
      const fields = [
        "name", "specialization", "experience", "qualifications",
        "location", "about", "fee", "success", "patients", "rating",
      ];
      fields.forEach((k) => {
        if (doc[k] !== undefined && doc[k] !== null) form.append(k, String(doc[k]));
      });

      // availability : "Disponible" | "Indisponible"
      form.append("availability", doc.availability || "Disponible");

      // schedule sérialisé en JSON (plain object)
      form.append("schedule", JSON.stringify(doc.schedule || {}));

      // Image
      if (localImageFile) {
        form.append("image", localImageFile);
      } else if (doc.imageUrl && !doc.imageUrl.startsWith("blob:")) {
        form.append("imageUrl", doc.imageUrl);
      }

      const token   = localStorage.getItem(STORAGE_KEY);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res  = await fetch(`${API_BASE}/${id}`, { method: "PUT", headers, body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to save");

      // Backend retourne { success: true, data: {...doctor} }
      const raw = json.data || json;
      const updated = {
        ...raw,
        schedule: normalizeSchedule(raw.schedule),
        imageUrl: raw.imageUrl || raw.image || doc.imageUrl,
        fee:      raw.fee ?? raw.fees ?? doc.fee,
      };

      setDoc(updated);
      setLocalImageFile(null);
      setImagePreview(updated.imageUrl || imagePreview);
      setEditing(false);
      setSaveMessage({ type: "success", text: "Profile saved!" });
      addToast("Profile saved successfully!", "success");
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (err) {
      setSaveMessage({ type: "error", text: err.message || "Save failed" });
      addToast(err.message || "Save failed", "error");
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────────
  const available    = isDocAvailable(doc);
  const sortedDates  = Object.keys(doc?.schedule || {}).sort();

  // ── Loading / Error ──────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 44, height: 44, border: "4px solid #d1fae5", borderTop: "4px solid #10b981", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <div style={{ color: "#6b7280", fontSize: 15 }}>Loading profile...</div>
      </div>
    </div>
  );

  if (!doc) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif" }}>
      <div style={{ color: "#f43f5e", fontSize: 16 }}>Doctor not found.</div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDU
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", fontFamily: "Georgia, 'Times New Roman', serif", background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 50%, rgba(240,253,244,0.3) 100%)", padding: "24px 16px" }}>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>

      <ToastList toasts={toasts} />

      <div style={{ maxWidth: 1100, margin: "0 auto", paddingTop: 32 }}>
        <div style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)", borderRadius: 28, boxShadow: "0 20px 60px rgba(16,185,129,0.12), 0 2px 8px rgba(0,0,0,0.06)", border: "1px solid rgba(209,250,229,0.5)", overflow: "hidden" }}>

          {/* ══ BANDEAU VERT ══ */}
          <div style={{ position: "relative", height: 130, background: "linear-gradient(135deg, #34d399 0%, #10b981 40%, #059669 100%)", borderRadius: "28px 28px 0 0", overflow: "visible" }}>
            <div style={{ position: "absolute", left: 28, bottom: 0, transform: "translateY(50%)", zIndex: 10 }}>
              <div style={{ position: "relative" }}>
                <div style={{ width: 120, height: 120, borderRadius: "50%", overflow: "hidden", border: "4px solid white", boxShadow: "0 8px 28px rgba(0,0,0,0.18)", background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {imagePreview
                    ? <img src={imagePreview} alt={doc.name || "Doctor"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <User size={42} style={{ color: "#34d399" }} />
                  }
                </div>
                <label style={{ position: "absolute", bottom: 4, right: 4, width: 30, height: 30, borderRadius: "50%", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center", cursor: editing ? "pointer" : "not-allowed", opacity: editing ? 1 : 0.55, transition: "all 0.2s" }}>
                  <ImageIcon size={14} style={{ color: editing ? "#059669" : "#9ca3af" }} />
                  <input type="file" accept="image/*" onChange={handleImageChange} disabled={!editing} style={{ display: "none" }} />
                </label>
              </div>
            </div>
          </div>

          {/* ══ CONTENU ══ */}
          <div style={{ paddingTop: 80, paddingBottom: 36, paddingLeft: 28, paddingRight: 28 }}>

            {/* Header */}
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 36 }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <h1 style={{ fontSize: 30, fontWeight: 800, background: "linear-gradient(135deg, #065f46, #047857)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0, lineHeight: 1.2, fontFamily: "inherit" }}>
                  {doc.name || "Doctor"}
                </h1>
                <p style={{ display: "flex", alignItems: "center", gap: 6, margin: "6px 0 0", fontSize: 14.5, color: "#059669", fontFamily: "inherit" }}>
                  <Briefcase size={15} />
                  {doc.specialization || "Specialization"}{doc.location ? ` : ${doc.location}` : ""}
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
                  <StatBadge icon={User}       label="Patients" value={doc.patients} editing={editing} onChange={(v) => setDoc((d) => ({ ...d, patients: v }))} min={0} />
                  <StatBadge icon={CheckCircle} label="Success"  value={doc.success}  editing={editing} onChange={(v) => setDoc((d) => ({ ...d, success: v }))}  min={0} max={100} />
                  <StatBadge icon={Star}        label="Rating"   value={doc.rating}   editing={editing} onChange={(v) => setDoc((d) => ({ ...d, rating: v }))}   min={0} max={5} step={0.1} amber fillStar />

                  {/* Fee */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg, #fffbeb, #fef3c7)", border: "1px solid #fde68a", borderRadius: 999, padding: "7px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                    <BadgeIndianRupee size={15} style={{ color: "#d97706", flexShrink: 0 }} />
                    {!editing
                      ? <span style={{ fontSize: 13, fontWeight: 700, color: "#78350f", fontFamily: "inherit" }}>{doc.fee}</span>
                      : <input type="number" min={0} value={doc.fee ?? ""} onChange={(e) => setDoc((d) => ({ ...d, fee: e.target.value }))} style={{ width: 64, borderRadius: 999, border: "1px solid #fde68a", padding: "2px 8px", fontSize: 13, outline: "none", background: "transparent", fontFamily: "inherit", color: "#78350f" }} />
                    }
                    <span style={{ fontSize: 11, color: "#d97706", fontFamily: "inherit" }}>/ Session</span>
                  </div>
                </div>
              </div>

              {/* Boutons droite */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-end" }}>
                {/* Toggle */}
                <button
                  onClick={toggleAvailability} disabled={toggling}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 18px", borderRadius: 999, border: `2px solid ${available ? "#6ee7b7" : "#d1d5db"}`, background: available ? "linear-gradient(135deg, #f0fdf4, #dcfce7)" : "linear-gradient(135deg, #f9fafb, #f3f4f6)", cursor: toggling ? "not-allowed" : "pointer", opacity: toggling ? 0.65 : 1, boxShadow: "0 2px 10px rgba(0,0,0,0.07)", transition: "all 0.3s", fontFamily: "inherit" }}
                >
                  <div style={{ width: 38, height: 20, borderRadius: 999, background: available ? "#10b981" : "#9ca3af", position: "relative", transition: "background 0.3s", flexShrink: 0 }}>
                    <div style={{ position: "absolute", top: 2, left: available ? 20 : 2, width: 16, height: 16, borderRadius: "50%", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.3s" }} />
                  </div>
                  <span style={{ fontWeight: 600, fontSize: 13.5, color: available ? "#065f46" : "#6b7280", fontFamily: "inherit" }}>
                    {toggling ? "..." : available ? "Available" : "Unavailable"}
                  </span>
                </button>

                {/* Edit / Cancel */}
                <button
                  onClick={() => setEditing((e) => !e)}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 20px", borderRadius: 999, background: editing ? "linear-gradient(135deg, #f1f5f9, #e2e8f0)" : "linear-gradient(135deg, #10b981, #059669)", color: editing ? "#475569" : "white", border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 600, fontFamily: "inherit", boxShadow: editing ? "0 2px 8px rgba(0,0,0,0.1)" : "0 4px 14px rgba(16,185,129,0.35)", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                  {editing ? <><X size={15} /> Cancel Edit</> : <><Edit2 size={15} /> Edit Profile</>}
                </button>
              </div>
            </div>

            {/* ══ Personal Information ══ */}
            <section style={{ marginBottom: 32 }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 20, fontWeight: 700, color: "#065f46", margin: "0 0 22px", fontFamily: "inherit" }}>
                <span style={{ width: 30, height: 30, borderRadius: "50%", background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <User size={14} style={{ color: "#059669" }} />
                </span>
                Personal Information
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px 24px" }}>
                <Field label="Name"              icon={User}          value={doc.name}           onChange={(v) => setDoc((d) => ({ ...d, name: v }))}           editing={editing} />
                <Field label="Specialization"    icon={Briefcase}     value={doc.specialization} onChange={(v) => setDoc((d) => ({ ...d, specialization: v }))} editing={editing} />
                <Field label="Experience"        icon={GraduationCap} value={doc.experience}     onChange={(v) => setDoc((d) => ({ ...d, experience: v }))}     editing={editing} />
                <Field label="Qualifications"    icon={GraduationCap} value={doc.qualifications} onChange={(v) => setDoc((d) => ({ ...d, qualifications: v }))} editing={editing} />
                <Field label="Location"          icon={MapPin}        value={doc.location}       onChange={(v) => setDoc((d) => ({ ...d, location: v }))}       editing={editing} />
                <Field label="Patients"          icon={User}          value={doc.patients}       onChange={(v) => setDoc((d) => ({ ...d, patients: v }))}       editing={editing} />
                <Field label="Success"           icon={CheckCircle}   value={doc.success}        onChange={(v) => setDoc((d) => ({ ...d, success: v }))}        editing={editing} />
                <Field label="Rating (out of 5)" icon={Star}          value={doc.rating}         onChange={(v) => setDoc((d) => ({ ...d, rating: v }))}         editing={editing} type="number" min={0} max={5} step={0.1} />
                <Field label="Fee (INR)"         icon={DollarSign}    value={doc.fee}            onChange={(v) => setDoc((d) => ({ ...d, fee: v }))}            editing={editing} type="number" min={0} />
              </div>
            </section>

            {/* ══ About ══ */}
            <section style={{ marginBottom: 32 }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 20, fontWeight: 700, color: "#065f46", margin: "0 0 22px", fontFamily: "inherit" }}>
                <span style={{ width: 30, height: 30, borderRadius: "50%", background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <UserCog size={14} style={{ color: "#059669" }} />
                </span>
                About
              </h2>
              <div style={{ position: "relative" }}>
                <textarea
                  value={doc.about ?? ""}
                  onChange={(e) => setDoc((d) => ({ ...d, about: e.target.value }))}
                  disabled={!editing}
                  rows={4} maxLength={500}
                  placeholder="Write something about this doctor..."
                  style={{ width: "100%", borderRadius: 16, border: `2px solid ${editing ? "#a7f3d0" : "#e5e7eb"}`, padding: "14px 16px", fontSize: 13.5, background: editing ? "rgba(236,253,245,0.5)" : "rgba(249,250,251,0.5)", color: editing ? "#111827" : "#6b7280", cursor: editing ? "text" : "not-allowed", outline: "none", resize: "vertical", fontFamily: "inherit", transition: "all 0.2s", boxSizing: "border-box" }}
                  onFocus={(e) => { if (editing) { e.target.style.border = "2px solid #34d399"; e.target.style.boxShadow = "0 0 0 3px rgba(52,211,153,0.15)"; } }}
                  onBlur={(e) => { e.target.style.border = `2px solid ${editing ? "#a7f3d0" : "#e5e7eb"}`; e.target.style.boxShadow = "none"; }}
                />
                <span style={{ position: "absolute", bottom: 10, right: 14, fontSize: 11, color: "#9ca3af", fontFamily: "inherit" }}>
                  {(doc.about || "").length}/500
                </span>
              </div>
            </section>

            {/* ══ Schedule & Availability ══ */}
            <section style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 22 }}>
                <h2 style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 20, fontWeight: 700, color: "#065f46", margin: 0, fontFamily: "inherit" }}>
                  <span style={{ width: 30, height: 30, borderRadius: "50%", background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Calendar size={14} style={{ color: "#059669" }} />
                  </span>
                  Schedule &amp; Availability
                </h2>
                <AddDateControl onAdd={addDate} editing={editing} />
              </div>

              {sortedDates.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", borderRadius: 20, border: "2px dashed #a7f3d0", background: "rgba(240,253,244,0.5)" }}>
                  <Calendar size={44} style={{ color: "#6ee7b7", margin: "0 auto 12px", display: "block" }} />
                  <p style={{ color: "#059669", fontWeight: 600, margin: "0 0 4px", fontFamily: "inherit" }}>No schedule defined yet</p>
                  <p style={{ fontSize: 13, color: "#34d399", margin: 0, fontFamily: "inherit" }}>
                    {editing ? "Add a date above to get started" : "Enable editing to add schedule"}
                  </p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
                  {sortedDates.map((dateStr) => (
                    <DateCard
                      key={dateStr} dateStr={dateStr}
                      slots={doc.schedule[dateStr] || []}
                      editing={editing}
                      onAddSlot={addSlot}
                      onRemoveSlot={removeSlot}
                      onRemoveDate={removeDate}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* ══ Actions ══ */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, paddingTop: 24, borderTop: "1px solid #d1fae5" }}>
              <p style={{ fontSize: 13, margin: 0, fontFamily: "inherit" }}>
                {saveMessage
                  ? <span style={{ padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500, background: saveMessage.type === "saving" ? "#eff6ff" : saveMessage.type === "error" ? "#fff1f2" : "#f0fdf4", color: saveMessage.type === "saving" ? "#1d4ed8" : saveMessage.type === "error" ? "#be123c" : "#065f46", border: `1px solid ${saveMessage.type === "saving" ? "#bfdbfe" : saveMessage.type === "error" ? "#fecdd3" : "#a7f3d0"}`, fontFamily: "inherit" }}>
                      {saveMessage.text}
                    </span>
                  : <span style={{ color: "#9ca3af" }}>Make changes and save your profile</span>
                }
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <button
                  onClick={handleReset}
                  style={{ padding: "10px 24px", borderRadius: 999, border: "2px solid #a7f3d0", background: "transparent", color: "#059669", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#f0fdf4"; e.currentTarget.style.borderColor = "#34d399"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#a7f3d0"; }}
                >
                  Reset to Server
                </button>

                {editing && (
                  <button
                    onClick={handleSave}
                    disabled={saveMessage?.type === "saving"}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 24px", borderRadius: 999, background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none", cursor: saveMessage?.type === "saving" ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit", boxShadow: "0 4px 14px rgba(16,185,129,0.35)", opacity: saveMessage?.type === "saving" ? 0.7 : 1, transition: "all 0.2s" }}
                    onMouseEnter={(e) => { if (saveMessage?.type !== "saving") { e.currentTarget.style.background = "linear-gradient(135deg, #059669, #047857)"; e.currentTarget.style.transform = "scale(1.02)"; } }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, #10b981, #059669)"; e.currentTarget.style.transform = "scale(1)"; }}
                  >
                    {saveMessage?.type === "saving"
                      ? <><div style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.4)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Saving...</>
                      : <><Save size={15} /> Save Profile</>
                    }
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}