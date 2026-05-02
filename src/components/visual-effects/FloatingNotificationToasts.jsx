import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const notifications = [
  "📱 New lead captured - Tech startup, LA",
  "✅ Appointment booked - Med Spa, Miami",
  "💬 Follow-up sent - HVAC contractor, Phoenix",
  "🚀 System activated - Dental clinic, NYC",
  "⭐ 4.9 rating received - Beauty studio, LA",
];

export default function FloatingNotificationToasts() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      const id = Math.random();
      setToasts((prev) => [...prev, { id, text: notifications[index % notifications.length] }]);
      index++;

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 40,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        pointerEvents: "none",
      }}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 400, y: 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(200,150,92,0.25)",
              borderRadius: "12px",
              padding: "12px 16px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              fontSize: "12px",
              fontWeight: "600",
              color: "rgba(27,20,13,0.8)",
              whiteSpace: "nowrap",
            }}
          >
            {toast.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}