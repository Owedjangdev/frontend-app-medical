import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { loginPageStyles, toastStyles } from "../assets/dummyStyles";
import logo from "../assets/logo.png";

// ─── Clés localStorage — identiques partout dans l'app ───────────────────────
const STORAGE_KEY    = "doctorToken_v1";   // token JWT
const DOCTOR_ID_KEY  = "doctorId_v1";      // id du docteur connecté

const LoginPage = () => {
  const API_BASE = "https://backend-app-medical.onrender.com";
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => {
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("All fields are required.", { style: toastStyles.errorToast });
      return;
    }

    setBusy(true);

    try {
      const res  = await fetch(`${API_BASE}/api/docteur/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(json?.message || "Login failed", { duration: 4000 });
        setBusy(false);
        return;
      }

      // ── Récupération du token ────────────────────────────────────────────────
      const token = json?.token || json?.data?.token || json?.data?.accessToken;

      if (!token) {
        toast.error("Token d'authentification manquant");
        setBusy(false);
        return;
      }

      // ── Récupération de l'id du docteur ─────────────────────────────────────
      const doctorId =
        json?._id            ||
        json?.data?._id      ||
        json?.doctor?._id    ||
        json?.data?.doctor?._id ||
        null;

      if (!doctorId) {
        toast.error("Identifiant docteur manquant dans la réponse");
        setBusy(false);
        return;
      }

      // ── ✅ SAUVEGARDE dans localStorage ─────────────────────────────────────
      localStorage.setItem(STORAGE_KEY,   token);
      localStorage.setItem(DOCTOR_ID_KEY, doctorId);

      // Déclenche l'événement storage pour que la Navbar se mette à jour
      window.dispatchEvent(new StorageEvent("storage", {
        key:      STORAGE_KEY,
        newValue: token,
      }));

      toast.success("Connexion réussie — redirection...", {
        style: toastStyles.successToast,
      });

      setTimeout(() => {
        navigate(`/doctor-admin/${doctorId}`);
      }, 700);

    } catch (err) {
      console.error("[LOGIN] Erreur réseau:", err);
      toast.error("Erreur réseau lors de la connexion");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={loginPageStyles.mainContainer}>
      <Toaster position="top-right" reverseOrder={false} />

      <button onClick={() => navigate("/")} className={loginPageStyles.backButton}>
        <ArrowLeft className={loginPageStyles.backButtonIcon} />
        Back to Home
      </button>

      <div className={loginPageStyles.loginCard}>
        <div className={loginPageStyles.logoContainer}>
          <img src={logo} alt="logo" className={loginPageStyles.logo} />
        </div>

        <h2 className={loginPageStyles.title}>Doctor Admin</h2>
        <p className={loginPageStyles.subtitle}>
          Sign in to manage your profile &amp; schedule
        </p>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className={loginPageStyles.input}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className={loginPageStyles.input}
            required
          />
          <button
            type="submit"
            disabled={busy}
            className={loginPageStyles.submitButton}
          >
            {busy ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;