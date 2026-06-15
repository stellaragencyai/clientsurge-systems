import { CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";

function ReadinessRow({ label, value, status }) {
  const icon =
    status === "good" ? <CheckCircle2 style={{ width: "15px", height: "15px", color: "#16a34a", flexShrink: 0 }} /> :
    status === "warn" ? <AlertCircle style={{ width: "15px", height: "15px", color: "#d97706", flexShrink: 0 }} /> :
    status === "bad"  ? <XCircle     style={{ width: "15px", height: "15px", color: "#dc2626", flexShrink: 0 }} /> :
                        <Info        style={{ width: "15px", height: "15px", color: "#6b7280", flexShrink: 0 }} />;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 0", borderBottom: "1px solid rgba(10,22,40,0.05)" }}>
      {icon}
      <span style={{ fontSize: "13px", color: "#0A1628", flex: 1 }}>{label}</span>
      <span style={{
        fontSize: "12px", fontWeight: "700", padding: "2px 10px", borderRadius: "9999px",
        background: status === "good" ? "rgba(22,163,74,0.08)" : status === "warn" ? "rgba(217,119,6,0.08)" : status === "bad" ? "rgba(220,38,38,0.08)" : "rgba(107,114,128,0.08)",
        color: status === "good" ? "#16a34a" : status === "warn" ? "#d97706" : status === "bad" ? "#dc2626" : "#6b7280",
        border: `1px solid ${status === "good" ? "rgba(22,163,74,0.2)" : status === "warn" ? "rgba(217,119,6,0.2)" : status === "bad" ? "rgba(220,38,38,0.2)" : "rgba(107,114,128,0.2)"}`,
      }}>
        {value}
      </span>
    </div>
  );
}

export default function LaunchReadinessPanel({ classified }) {
  const { real, internal, missingContact, consentMissing, duplicates, suppressed, highPriority } = classified;

  const consentMissingCount = (consentMissing || []).length;
  const missingContactCount = (missingContact || []).length;
  const dupCount = (duplicates || []).length;
  const internalCount = (internal || []).length;
  const realCount = (real || []).length;
  const highCount = (highPriority || []).length;

  return (
    <div style={{
      background: "rgba(255,255,255,0.96)",
      border: "1px solid rgba(0,136,204,0.15)",
      borderRadius: "16px",
      padding: "20px 24px",
      marginBottom: "28px",
      boxShadow: "0 2px 12px rgba(0,136,204,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
        <CheckCircle2 style={{ width: "16px", height: "16px", color: "#0088CC" }} />
        <span style={{ fontSize: "13px", fontWeight: "800", color: "#0A1628", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Launch Readiness Summary
        </span>
      </div>

      <ReadinessRow
        label="Real opportunities visible (non-QA, non-suppressed)"
        value={realCount}
        status={realCount > 0 ? "good" : "warn"}
      />
      <ReadinessRow
        label="Internal / proof records excluded from priority queue"
        value={`${internalCount} excluded`}
        status={internalCount > 0 ? "warn" : "good"}
      />
      <ReadinessRow
        label="Records missing usable contact info"
        value={missingContactCount}
        status={missingContactCount > 50 ? "bad" : missingContactCount > 0 ? "warn" : "good"}
      />
      <ReadinessRow
        label="Consent not confirmed"
        value={consentMissingCount}
        status={consentMissingCount > 100 ? "bad" : consentMissingCount > 0 ? "warn" : "good"}
      />
      <ReadinessRow
        label="Duplicate candidates requiring review"
        value={dupCount}
        status={dupCount > 20 ? "bad" : dupCount > 0 ? "warn" : "good"}
      />
      <ReadinessRow
        label="High-priority inbound (score ≥70 or HOT or booked)"
        value={highCount}
        status={highCount > 0 ? "good" : "neutral"}
      />

      {/* Suggested next step */}
      <div style={{
        marginTop: "14px",
        background: "rgba(0,136,204,0.05)",
        border: "1px solid rgba(0,136,204,0.15)",
        borderRadius: "10px",
        padding: "12px 16px",
        display: "flex",
        alignItems: "flex-start",
        gap: "8px",
      }}>
        <Info style={{ width: "14px", height: "14px", color: "#0088CC", flexShrink: 0, marginTop: "1px" }} />
        <div>
          <span style={{ fontSize: "12px", fontWeight: "800", color: "#0088CC", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Suggested Next Safe Step:&nbsp;
          </span>
          <span style={{ fontSize: "12px", color: "rgba(10,22,40,0.7)" }}>
            Manual verification only. Review the Priority tab, confirm contact details and consent on each record before passing to any outreach workflow.
          </span>
        </div>
      </div>
    </div>
  );
}