import { getReviewLabel, getWhyPrioritized, getMissingContactFlags, isInternalRecord } from "@/internal-pages/OpportunityReviewQueue";

const LABEL_STYLES = {
  "Review first": { color: "#0088CC", bg: "rgba(0,136,204,0.08)", border: "rgba(0,136,204,0.2)" },
  "Verify business details": { color: "#8b5cf6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.2)" },
  "Check booking context": { color: "#22c55e", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)" },
  "Keep suppressed": { color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)" },
  "Exclude from metrics": { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
  "Duplicate — verify": { color: "#6b7280", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.2)" },
};

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1px", minWidth: "100px" }}>
      <span style={{ fontSize: "10px", fontWeight: "700", color: "rgba(10,22,40,0.4)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
      <span style={{ fontSize: "13px", color: "#0A1628", fontWeight: "500", wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}

function Flag({ text, variant = "neutral" }) {
  const colors = {
    neutral: { color: "#6b7280", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.2)" },
    warn: { color: "#d97706", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
    danger: { color: "#dc2626", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)" },
  };
  const s = colors[variant];
  return (
    <span style={{
      fontSize: "11px", fontWeight: "600", padding: "2px 8px", borderRadius: "9999px",
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
    }}>
      {text}
    </span>
  );
}

export default function OppRecordCard({ record }) {
  const label = getReviewLabel(record);
  const why = getWhyPrioritized(record);
  const missingFlags = getMissingContactFlags(record);
  const internal = isInternalRecord(record);
  const labelStyle = LABEL_STYLES[label] || LABEL_STYLES["Review first"];

  const businessName = record.business_name || record.full_name || "—";
  const industry = record.industry || record.business_type || record.industry_slug || null;
  const score = record.lead_score > 0 ? record.lead_score : (record.engagement_score > 0 ? record.engagement_score : null);
  const source = record.source || record.import_source || record.current_lead_source || null;
  const status = record.crm_stage || record.status || record.lead_status || null;
  const website = record.website || record.website_url || record.business_website_url || null;
  const problem = record.problem || record.message || null;
  const booking = record.booking_status || (record.crm_stage === "Audit Booked" ? "booked" : null);
  const sourceType = record._source_type === "website_lead" ? "Website Lead" : "CRM Lead";

  // Visible review flags
  const flags = [];
  if (internal) flags.push({ text: "Internal/QA", variant: "warn" });
  if (record.do_not_contact || record.outreach_status === "do_not_contact") flags.push({ text: "Do Not Contact", variant: "danger" });
  if (record.email_unsubscribed) flags.push({ text: "Unsubscribed", variant: "warn" });
  if (record.email_bounced) flags.push({ text: "Email Bounced", variant: "warn" });
  if (record.dedupe_status === "duplicate_candidate") flags.push({ text: "Duplicate Candidate", variant: "neutral" });
  if (record.dedupe_status === "merged_duplicate") flags.push({ text: "Merged Duplicate", variant: "neutral" });
  missingFlags.forEach((f) => flags.push({ text: f, variant: "warn" }));

  return (
    <div style={{
      background: "hsl(var(--card))",
      border: "1px solid hsl(var(--border))",
      borderRadius: "14px",
      padding: "16px 20px",
      transition: "box-shadow 0.2s",
    }}>
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "15px", fontWeight: "800", color: "#0A1628" }}>{businessName}</span>
          <span style={{
            fontSize: "10px", fontWeight: "600", padding: "2px 7px", borderRadius: "9999px",
            background: "rgba(0,174,239,0.08)", border: "1px solid rgba(0,174,239,0.2)", color: "#0088CC",
          }}>{sourceType}</span>
          {score !== null && (
            <span style={{
              fontSize: "12px", fontWeight: "700", padding: "2px 8px", borderRadius: "9999px",
              background: score >= 70 ? "rgba(34,197,94,0.1)" : "rgba(107,114,128,0.08)",
              border: `1px solid ${score >= 70 ? "rgba(34,197,94,0.25)" : "rgba(107,114,128,0.18)"}`,
              color: score >= 70 ? "#15803d" : "#6b7280",
            }}>
              Score: {score}
            </span>
          )}
        </div>
        {/* Review label — display only */}
        <span style={{
          fontSize: "12px", fontWeight: "700", padding: "4px 12px", borderRadius: "9999px",
          background: labelStyle.bg, border: `1px solid ${labelStyle.border}`, color: labelStyle.color,
          whiteSpace: "nowrap",
        }}>
          {label}
        </span>
      </div>

      {/* Fields grid */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "10px" }}>
        <Field label="Industry / Type" value={industry} />
        <Field label="Source" value={source} />
        <Field label="Status" value={status} />
        <Field label="Booking" value={booking} />
        {website && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", minWidth: "100px" }}>
            <span style={{ fontSize: "10px", fontWeight: "700", color: "rgba(10,22,40,0.4)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Website</span>
            <a
              href={website.startsWith("http") ? website : `https://${website}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: "13px", color: "#0088CC", fontWeight: "500", wordBreak: "break-word" }}
            >
              {website.replace(/^https?:\/\//, "").slice(0, 40)}
            </a>
          </div>
        )}
        {problem && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", flex: "1 1 200px", minWidth: "160px" }}>
            <span style={{ fontSize: "10px", fontWeight: "700", color: "rgba(10,22,40,0.4)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Problem / Hook</span>
            <span style={{ fontSize: "13px", color: "#0A1628", fontWeight: "500", lineHeight: 1.5 }}>
              {problem.slice(0, 120)}{problem.length > 120 ? "…" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Why prioritized */}
      <div style={{
        background: "rgba(0,174,239,0.04)", borderRadius: "8px", padding: "8px 12px",
        marginBottom: flags.length > 0 ? "10px" : "0",
      }}>
        <span style={{ fontSize: "11px", fontWeight: "700", color: "#0088CC", textTransform: "uppercase", letterSpacing: "0.07em", marginRight: "6px" }}>
          Why prioritized:
        </span>
        <span style={{ fontSize: "12px", color: "rgba(10,22,40,0.6)" }}>{why}</span>
      </div>

      {/* Flags row */}
      {flags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {flags.map((f, i) => <Flag key={i} text={f.text} variant={f.variant} />)}
        </div>
      )}
    </div>
  );
}