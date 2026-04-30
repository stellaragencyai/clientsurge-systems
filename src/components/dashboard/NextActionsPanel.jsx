import { useState } from "react";
import { CheckCircle2, Circle, Clock, ChevronRight, ArrowRight } from "lucide-react";

const actionsByService = {
  instant_lead_response: [
    { action: "Verify SMS number is active", detail: "Confirm your Twilio number is configured", status: "in_progress" },
    { action: "Test with a sample lead", detail: "Submit a test form to trigger the response", status: "pending" },
    { action: "Review response template", detail: "Check and approve your auto-reply copy", status: "pending" },
  ],
  missed_call_text_back: [
    { action: "Connect Twilio account", detail: "Provide your Twilio SID and auth token", status: "in_progress" },
    { action: "Configure missed call webhook", detail: "Point your Twilio number to our handler", status: "pending" },
    { action: "Run a test missed call", detail: "Call your number and confirm the text fires", status: "pending" },
  ],
  nurture_sequence_14d: [
    { action: "Approve email templates", detail: "Review the 14-day sequence messages", status: "in_progress" },
    { action: "Set follow-up timing", detail: "Confirm send times for each step", status: "pending" },
    { action: "Test sequence with a real email", detail: "Trigger the sequence and verify delivery", status: "pending" },
  ],
  ai_booking_agent: [
    { action: "Add your booking link", detail: "Paste your Calendly or booking URL", status: "in_progress" },
    { action: "Configure intake form fields", detail: "Define which fields to capture from leads", status: "pending" },
    { action: "Test the full booking flow", detail: "Walk through the booking as a lead", status: "pending" },
  ],
  lead_reactivation: [
    { action: "Import your old lead list", detail: "Upload a CSV of dormant leads", status: "in_progress" },
    { action: "Define reactivation message", detail: "Approve the re-engagement copy", status: "pending" },
    { action: "Schedule the first batch", detail: "Set the send date for the campaign", status: "pending" },
  ],
  review_request: [
    { action: "Provide your review link", detail: "Paste your Google or Yelp review URL", status: "in_progress" },
    { action: "Choose trigger event", detail: "Decide when to send the request (post-appointment)", status: "pending" },
    { action: "Send a test review request", detail: "Fire a test to confirm delivery", status: "pending" },
  ],
};

export default function NextActionsPanel({ serviceKey }) {
  const initial = actionsByService[serviceKey] || [];
  const [items, setItems] = useState(initial);

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