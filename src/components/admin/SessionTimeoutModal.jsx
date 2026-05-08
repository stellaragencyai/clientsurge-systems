/**
 * SessionTimeoutModal.jsx — #75
 * Shows warning modal after 30min admin inactivity. Auto-logout at 35min.
 */
import { useEffect, useRef, useState } from "react";

const WARNING_MS  = 30 * 60 * 1000; // 30 min
const LOGOUT_MS   = 35 * 60 * 1000; // 35 min

export default function SessionTimeoutModal({ onLogout }) {
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 min to act
  const warnTimer  = useRef(null);
  const logoutTimer = useRef(null);
  const countdownInterval = useRef(null);

  const resetTimers = () => {
    setVisible(false);
    setCountdown(300);
    clearTimeout(warnTimer.current);
    clearTimeout(logoutTimer.current);
    clearInterval(countdownInterval.current);

    warnTimer.current = setTimeout(() => {
      setVisible(true);
      countdownInterval.current = setInterval(() => setCountdown(c => c - 1), 1000);
    }, WARNING_MS);

    logoutTimer.current = setTimeout(() => {
      onLogout?.();
    }, LOGOUT_MS);
  };

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach(e => window.addEventListener(e, resetTimers, { passive: true }));
    resetTimers();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimers));
      clearTimeout(warnTimer.current);
      clearTimeout(logoutTimer.current);
      clearInterval(countdownInterval.current);
    };
  }, []);

  if (!visible) return null;

  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#0D1B2E", border: "1px solid rgba(245,158,11,0.4)", borderRadius: 18, padding: "32px 28px", maxWidth: 400, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⏱️</div>
        <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 800, margin: "0 0 8px" }}>Session expiring soon</h3>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, margin: "0 0 20px", lineHeight: 1.6 }}>
          You'll be logged out in <b style={{ color: "#F59E0B" }}>{mins}:{String(secs).padStart(2,"0")}</b> due to inactivity.
        </p>
        <button onClick={resetTimers} style={{ background: "linear-gradient(135deg,#00D4FF,#00FFB3)", border: "none", borderRadius: 9999, padding: "11px 28px", color: "#0A0F1E", fontSize: 14, fontWeight: 800, cursor: "pointer", width: "100%" }}>
          Keep me logged in
        </button>
      </div>
    </div>
  );
}
