import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Clock } from "lucide-react";

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
    { action: "Payment & kickoff complete", detail: "We have everything we need to build", status: "completed" },
    { action: "System configuration underway", detail: "We're setting up your automation flows", status: "in_progress" },
    { action: "Testing phase coming next", detail: "We'll run full tests before going live", status: "pending" },
  ],
  "Testing": [
    { action: "System fully configured", detail: "All automation flows are built", status: "completed" },
    { action: "Live testing in progress", detail: "We're firing test leads and validating responses", status: "in_progress" },
    { action: "Final sign-off", detail: "We'll notify you once testing passes", status: "pending" },
  ],
  "Live": [
    { action: "System fully configured", detail: "All automation flows are built", status: "completed" },
    { action: "Testing passed", detail: "All systems verified and validated", status: "completed" },
    { action: "System is live and running", detail: "Your automation is capturing and responding to leads", status: "completed" },
  ],
  "Error": [
    { action: "Issue detected", detail: "Our team has been alerted and is investigating", status: "in_progress" },
    { action: "Investigation underway", detail: "We're identifying the root cause", status: "in_progress" },
    { action: "Resolution in progress", detail: "We'll notify you once resolved", status: "pending" },
  ],
};

export default function NextActionsPanel({ installStatus = "Paid" }) {
  const [items, setItems] = useState(actionsByStage[installStatus] || actionsByStage["Paid"]);

  useEffect(() => {
    setItems(actionsByStage[installStatus] || actionsByStage["Paid"]);
  }, [installStatus]);

  const completedCount = items.filter(i => i.status === "completed").length;

  return (
    <div style={{
      borderRadius: "12px",
      background: "rgba(0,136,204,0.04)",
      border: "1px solid rgba(0,136,204,0.1)",
      padding: "16px",
      marginTop: "12px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <p style={{ fontSize: "11px", fontWeight: "800", color: "#0077B6", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
          Installation Progress
        </p>
        <span style={{
          fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "9999px",
          background: completedCount === items.length ? "rgba(34,197,94,0.15)" : "rgba(0,136,204,0.1)",
          color: completedCount === items.length ? "#22c55e" : "#0077B6",
          border: `1px solid ${completedCount === items.length ? "rgba(34,197,94,0.25)" : "rgba(0,136,204,0.15)"}`,
        }}>
          {completedCount}/{items.length} complete
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {items.map((item, idx) => {
          const isComplete = item.status === "completed";
          const isCurrent = item.status === "in_progress";
          return (
            <div
              key={idx}
              style={{
                display: "flex", alignItems: "flex-start", gap: "10px",
                padding: "10px 12px", borderRadius: "10px",
                background: isComplete ? "rgba(34,197,94,0.06)" : isCurrent ? "rgba(0,174,239,0.06)" : "rgba(255,255,255,0.6)",
                border: `1px solid ${isComplete ? "rgba(34,197,94,0.2)" : isCurrent ? "rgba(0,174,239,0.2)" : "rgba(0,136,204,0.08)"}`,
              }}
            >
              <div style={{ marginTop: "1px", flexShrink: 0 }}>
                {isComplete ? (
                  <CheckCircle2 style={{ width: "16px", height: "16px", color: "#22c55e" }} />
                ) : isCurrent ? (
                  <Clock style={{ width: "16px", height: "16px", color: "#00AEEF", animation: "spin 3s linear infinite" }} />
                ) : (
                  <Circle style={{ width: "16px", height: "16px", color: "rgba(0,136,204,0.3)" }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{
                  fontSize: "13px", fontWeight: "600", margin: "0 0 2px",
                  color: isComplete ? "rgba(10,22,40,0.45)" : "#1b140d",
                  textDecoration: isComplete ? "line-through" : "none",
                }}>
                  {item.action}
                </p>
                <p style={{ fontSize: "11px", color: "rgba(10,22,40,0.45)", margin: 0, lineHeight: 1.4 }}>
                  {item.detail}
                </p>
              </div>
              {isCurrent && (
                <span style={{
                  fontSize: "9px", fontWeight: "800", padding: "2px 7px", borderRadius: "9999px",
                  background: "rgba(0,174,239,0.15)", color: "#00AEEF",
                  border: "1px solid rgba(0,174,239,0.3)", flexShrink: 0,
                }}>IN PROGRESS</span>
              )}
            </div>
          );
        })}
      </div>

      {completedCount === items.length && items.length > 0 && (
        <p style={{ fontSize: "12px", color: "#22c55e", fontWeight: "700", textAlign: "center", margin: "10px 0 0" }}>
          ✓ All steps complete — your system is live!
        </p>
      )}
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}