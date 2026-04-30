import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Clock, ChevronRight, ArrowRight } from "lucide-react";

// Actions shown per install stage — contextually correct
const actionsByStage = {
  "Paid": [
    { action: "Payment confirmed", detail: "Your order is in the queue", status: "completed" },
    { action: "Awaiting install kickoff", detail: "Our team will begin setup shortly", status: "in_progress" },
    { action: "Onboarding call scheduling", detail: "Check your email for a scheduling link", status: "pending" },
  ],
  "Ready for Install": [
    { action: "Payment confirmed", detail: "Your order is in the queue", status: "completed" },
    { action: "Install team assigned", detail: "Your dedicated installer has been assigned", status: "completed" },
    { action: "Configuration in progress", detail: "Our team is building your system now", status: "in_progress" },
  ],
  "Configuring": [
    { action: "System configuration underway", detail: "We're setting up your automation flows", status: "in_progress" },
    { action: "Review setup details", detail: "Our team may reach out with a quick question", status: "pending" },
    { action: "Testing phase coming next", detail: "We'll run full tests before going live", status: "pending" },
  ],
  "Testing": [
    { action: "Configuration complete", detail: "Your system has been built and is ready for testing", status: "completed" },
    { action: "Live testing in progress", detail: "We're firing test leads and validating responses", status: "in_progress" },
    { action: "Your approval", detail: "We'll notify you once testing passes for sign-off", status: "pending" },
  ],
  "Live": [
    { action: "System fully configured", detail: "All automation flows are built", status: "completed" },
    { action: "Testing passed", detail: "All systems verified and validated", status: "completed" },
    { action: "System is live and running", detail: "Your automation is capturing and responding to leads", status: "completed" },
  ],
  "Error": [
    { action: "Issue detected", detail: "Our team has been alerted and is investigating", status: "in_progress" },
    { action: "Contact support", detail: "Email support@clientsurgesystems.com or call us", status: "pending" },
    { action: "Resolution in progress", detail: "We'll notify you once resolved", status: "pending" },
  ],
};

export default function NextActionsPanel({ serviceKey, installStatus = "Paid" }) {
  const initial = actionsByStage[installStatus] || actionsByStage["Paid"];
  const [items, setItems] = useState(initial);

  // Update items when installStatus changes (live polling)
  useEffect(() => {
    setItems(actionsByStage[installStatus] || actionsByStage["Paid"]);
  }, [installStatus]);

  const toggle = (idx) => {
    setItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, status: item.status === "completed" ? "pending" : "completed" } : item
    ));
  };

  const completedCount = items.filter(i => i.status === "completed").length;

  return (
    <div style={{
      borderRadius: "12px",
      background: "rgba(154,92,46,0.04)",
      border: "1px solid rgba(154,92,46,0.1)",
      padding: "16px",
      marginTop: "12px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <p style={{ fontSize: "11px", fontWeight: "800", color: "#9a5c2e", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
          Next Actions
        </p>
        <span style={{
          fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "9999px",
          background: completedCount === items.length ? "rgba(34,197,94,0.15)" : "rgba(154,92,46,0.1)",
          color: completedCount === items.length ? "#22c55e" : "#9a5c2e",
          border: `1px solid ${completedCount === items.length ? "rgba(34,197,94,0.25)" : "rgba(154,92,46,0.15)"}`,
        }}>
          {completedCount}/{items.length} done
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {items.map((item, idx) => {
          const isComplete = item.status === "completed";
          const isCurrent = item.status === "in_progress";
          return (
            <button
              key={idx}
              onClick={() => toggle(idx)}
              style={{
                display: "flex", alignItems: "flex-start", gap: "10px",
                padding: "10px 12px", borderRadius: "10px",
                background: isComplete ? "rgba(34,197,94,0.06)" : isCurrent ? "rgba(245,158,11,0.06)" : "rgba(255,255,255,0.6)",
                border: `1px solid ${isComplete ? "rgba(34,197,94,0.2)" : isCurrent ? "rgba(245,158,11,0.2)" : "rgba(154,92,46,0.08)"}`,
                cursor: "pointer", textAlign: "left", transition: "all 0.2s ease",
                width: "100%",
              }}
            >
              {/* Checkbox */}
              <div style={{ marginTop: "1px", flexShrink: 0 }}>
                {isComplete ? (
                  <CheckCircle2 style={{ width: "16px", height: "16px", color: "#22c55e" }} />
                ) : isCurrent ? (
                  <Clock style={{ width: "16px", height: "16px", color: "#f59e0b" }} />
                ) : (
                  <Circle style={{ width: "16px", height: "16px", color: "rgba(154,92,46,0.35)" }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: "13px", fontWeight: "600", margin: "0 0 2px",
                  color: isComplete ? "rgba(27,20,13,0.45)" : "#1b140d",
                  textDecoration: isComplete ? "line-through" : "none",
                }}>
                  {item.action}
                </p>
                <p style={{ fontSize: "11px", color: "rgba(27,20,13,0.45)", margin: 0, lineHeight: 1.4 }}>
                  {item.detail}
                </p>
              </div>
              {!isComplete && <ChevronRight style={{ width: "14px", height: "14px", color: "rgba(27,20,13,0.25)", marginTop: "2px", flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>

      {completedCount > 0 && completedCount < items.length && (
        <p style={{ fontSize: "11px", color: "rgba(27,20,13,0.45)", textAlign: "center", margin: "10px 0 0" }}>
          {items.length - completedCount} action{items.length - completedCount > 1 ? "s" : ""} remaining
        </p>
      )}
      {completedCount === items.length && items.length > 0 && (
        <p style={{ fontSize: "12px", color: "#22c55e", fontWeight: "700", textAlign: "center", margin: "10px 0 0" }}>
          ✓ All actions complete — you're ready to go live!
        </p>
      )}
    </div>
  );
}