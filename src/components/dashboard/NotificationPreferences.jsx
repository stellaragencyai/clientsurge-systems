import { Bell, MessageSquare, Mail } from "lucide-react";
import { useState } from "react";

export default function NotificationPreferences({ orderId }) {
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySMS, setNotifySMS] = useState(true);

  const handleSave = async () => {
    // In a real app, this would POST to a backend function
  };

  return (
    <div style={{
      borderRadius: "12px",
      background: "rgba(245,217,168,0.06)",
      border: "1px solid rgba(154,92,46,0.12)",
      padding: "14px",
      marginTop: "16px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <Bell style={{ width: "14px", height: "14px", color: "#9a5c2e" }} />
        <p style={{ fontSize: "10px", fontWeight: "800", color: "#9a5c2e", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
          Status Notifications
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {/* Email toggle */}
        <button
          onClick={() => setNotifyEmail(!notifyEmail)}
          style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "10px 12px", borderRadius: "8px",
            background: notifyEmail ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.5)",
            border: `1px solid ${notifyEmail ? "rgba(34,197,94,0.2)" : "rgba(154,92,46,0.1)"}`,
            cursor: "pointer", transition: "all 0.2s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = notifyEmail ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.7)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = notifyEmail ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.5)";
          }}
        >
          <Mail style={{ width: "14px", height: "14px", color: notifyEmail ? "#22c55e" : "rgba(27,20,13,0.3)" }} />
          <span style={{ fontSize: "12px", fontWeight: "600", color: notifyEmail ? "#16a34a" : "rgba(27,20,13,0.5)", flex: 1, textAlign: "left" }}>
            Email notifications
          </span>
          <div style={{
            width: "16px", height: "16px", borderRadius: "4px",
            background: notifyEmail ? "#22c55e" : "rgba(154,92,46,0.1)",
            border: `1px solid ${notifyEmail ? "#16a34a" : "rgba(154,92,46,0.2)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {notifyEmail && <span style={{ fontSize: "10px", color: "white", fontWeight: "bold" }}>✓</span>}
          </div>
        </button>

        {/* SMS toggle */}
        <button
          onClick={() => setNotifySMS(!notifySMS)}
          style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "10px 12px", borderRadius: "8px",
            background: notifySMS ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.5)",
            border: `1px solid ${notifySMS ? "rgba(34,197,94,0.2)" : "rgba(154,92,46,0.1)"}`,
            cursor: "pointer", transition: "all 0.2s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = notifySMS ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.7)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = notifySMS ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.5)";
          }}
        >
          <MessageSquare style={{ width: "14px", height: "14px", color: notifySMS ? "#22c55e" : "rgba(27,20,13,0.3)" }} />
          <span style={{ fontSize: "12px", fontWeight: "600", color: notifySMS ? "#16a34a" : "rgba(27,20,13,0.5)", flex: 1, textAlign: "left" }}>
            SMS notifications
          </span>
          <div style={{
            width: "16px", height: "16px", borderRadius: "4px",
            background: notifySMS ? "#22c55e" : "rgba(154,92,46,0.1)",
            border: `1px solid ${notifySMS ? "#16a34a" : "rgba(154,92,46,0.2)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {notifySMS && <span style={{ fontSize: "10px", color: "white", fontWeight: "bold" }}>✓</span>}
          </div>
        </button>
      </div>
    </div>
  );
}