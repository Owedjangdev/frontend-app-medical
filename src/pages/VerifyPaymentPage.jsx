import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = "http://localhost:4000";

const VerifyPaymentPage = () => {
    
  console.log("✅ VerifyPaymentPage monté !");  // ← ajoute cette ligne
  
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        let cancelled = false;

        const varifyPayment = async () => {
            const params = new URLSearchParams(location.search || "");
            const sessionId = params.get("session_id");

            // Gestion de l'annulation via le chemin URL
            if (location.pathname === '/appointment/cancel') {
                if (!cancelled) {
                    navigate("/appointments?payment_status=Cancelled", { replace: true });
                    return;
                }
            }

            // Vérification de la présence du session_id
            if (!sessionId) {
                if (!cancelled) {
                    navigate("/appointments?payment_status=Failed", { replace: true });
                    return;
                }
            }

            try {
                // Appel API pour confirmer le paiement
                const res = await axios.get(`${API_BASE}/api/appointments/verify`, {
                    params: { session_id: sessionId },
                    timeout: 15000,
                });

                if (cancelled) return;

                // Redirection selon le succès de la réponse
                if (res?.data?.success) {
                    navigate("/appointments?payment_status=Paid", { replace: true });
                } else {
                    navigate("/appointments?payment_status=Failed", { replace: true });
                }

            } catch (error) {
                // Gestion des erreurs de l'appel API
                console.error("Payment verification failed:", error);
                if (!cancelled) {
                    navigate("/appointments?payment_status=Failed", { replace: true });
                }
            }
        };

        varifyPayment();

        // Nettoyage pour éviter les fuites de mémoire
        return () => {
            cancelled = true;
        };
    }, [location, navigate]);

    return null;
};

export default VerifyPaymentPage;