import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || "https://backend-app-medical.onrender.com";

const VerifyPaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Vérification du paiement...");
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const verifyPayment = async () => {
      // 1. Cas annulation
      if (location.pathname === '/appointment/cancel') {
        setStatus("Paiement annulé.");
        setTimeout(() => {
          if (!cancelled) navigate("/appointments?payment_status=Cancelled", { replace: true });
        }, 1500);
        return;
      }

      // 2. Récupérer session_id
      const params = new URLSearchParams(location.search || "");
      const sessionId = params.get("session_id");

      if (!sessionId) {
        setError("session_id manquant dans l'URL.");
        setTimeout(() => {
          if (!cancelled) navigate("/appointments?payment_status=Failed", { replace: true });
        }, 2000);
        return;
      }

      setStatus("Confirmation du paiement en cours...");

      // 3. Confirmer le paiement
      try {
        const res = await axios.get(`${API_BASE}/api/appointments/verify`, {
          params: { session_id: sessionId },
          timeout: 15000,
        });

        if (cancelled) return;

        if (res?.data?.success) {
          setStatus("Paiement confirmé ! Redirection...");
          setTimeout(() => {
            if (!cancelled) navigate("/appointments?payment_status=Paid", { replace: true });
          }, 1000);
        } else {
          setError(`Échec: ${res?.data?.message || "Réponse inattendue"}`);
          setTimeout(() => {
            if (!cancelled) navigate("/appointments?payment_status=Failed", { replace: true });
          }, 2000);
        }
      } catch (err) {
        if (cancelled) return;

        if (err?.response?.status === 409) {
          setStatus("Paiement déjà confirmé ! Redirection...");
          setTimeout(() => {
            if (!cancelled) navigate("/appointments?payment_status=Paid", { replace: true });
          }, 1000);
          return;
        }

        const msg = err?.response?.data?.message || err?.message || "Erreur réseau";
        setError(`Erreur: ${msg}`);
        setTimeout(() => {
          if (!cancelled) navigate("/appointments?payment_status=Failed", { replace: true });
        }, 2000);
      }
    };

    verifyPayment();
    return () => { cancelled = true; };
  }, [location, navigate]);

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      {error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <p>{status}</p>
      )}
    </div>
  );
};

export default VerifyPaymentPage;