// FORM-03: Exit/Cancellation Survey — shown before redirecting to Stripe portal
// Captures churn reason + NPS rating, saves to ChurnFeedback entity

import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const CANCELLATION_REASONS = [
  { value: "too_expensive", label: "Too expensive" },
  { value: "automation_didnt_work", label: "Automation didn't work as expected" },
  { value: "setup_too_slow", label: "Setup took too long" },
  { value: "no_longer_needed", label: "No longer need it" },
  { value: "switching_provider", label: "Switching to another provider" },
  { value: "other", label: "Other" },
];

export default function CancellationSurvey({ onComplete, onSkip }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [nps, setNps] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await base44.entities.ChurnFeedback.create({
        cancellation_reason: reason,
        cancellation_details: details,
        nps_rating: nps,
        submitted_at: new Date().toISOString(),
      }).catch(() => {});
    } catch {}
    setLoading(false);
    setSubmitted(true);
    setTimeout(() => onComplete?.(), 1200);
  };

  if (submitted) {
    return (
      <div style={{ textAlign: "center", padding: "24px" }}>
        <p style={{ fontSize: "16px", fontWeight: 700, color: "#000", marginBottom: "8px" }}>
          Thanks for your feedback
        </p>
        <p style={{ fontSize: "13px", color: "#666" }}>Redirecting to your billing portal...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "480px", width: "100%" }}>
      <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#000", marginBottom: "6px" }}>
        Before you go...
      </h3>
      <p style={{ fontSize: "13px", color: "#666", marginBottom: "20px", lineHeight: 1.6 }}>
        Help us improve by sharing why you're cancelling. This takes 30 seconds.
      </p>

      {/* Reason */}
      <div style={{ marginBottom: "16px" }}>
        <label style={{ fontSize: "12px", fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "8px" }}>
          Primary reason for cancelling
        </label>
        <select
          value={reason}
          onChange={e => setReason(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", background: "#fff" }}
        >
          <option value="">Select a reason...</option>
          {CANCELLATION_REASONS.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      {/* Details */}
      <div style={{ marginBottom: "16px" }}>
        <label style={{ fontSize: "12px", fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "8px" }}>
          Anything else? (optional)
        </label>
        <textarea
          value={details}
          onChange={e => setDetails(e.target.value)}
          placeholder="Tell us what we could have done better..."
          rows={3}
          style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", resize: "vertical", boxSizing: "border-box" }}
        />
      </div>

      {/* NPS */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ fontSize: "12px", fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "8px" }}>
          How likely are you to recommend us? (1–5)
        </label>
        <div style={{ display: "flex", gap: "8px" }}>
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setNps(n)}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: "8px",
                border: `2px solid ${nps === n ? "#00AEEF" : "#ddd"}`,
                background: nps === n ? "rgba(0,174,239,0.08)" : "#fff",
                fontWeight: 700,
                fontSize: "15px",
                color: nps === n ? "#00AEEF" : "#555",
                cursor: "pointer",
              }}
            >
              {n}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
          <span style={{ fontSize: "11px", color: "#999" }}>Not likely</span>
          <span style={{ fontSize: "11px", color: "#999" }}>Very likely</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "8px",
            background: "#00AEEF",
            color: "#fff",
            fontWeight: 700,
            fontSize: "14px",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Saving..." : "Submit & Continue"}
        </button>
        <button
          onClick={onSkip}
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            background: "#f5f5f5",
            color: "#666",
            fontWeight: 600,
            fontSize: "13px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}