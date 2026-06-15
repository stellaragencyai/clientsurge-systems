import { getReviewLabel, getWhyPrioritized, getMissingContactFlags, isInternalRecord, isImportedRecord } from "@/internal-pages/OpportunityReviewQueue";

const LABEL_STYLES = {
  "Review first":                    { color: "#0088CC",  bg: "rgba(0,136,204,0.08)",   border: "rgba(0,136,204,0.2)" },
  "Verify website/contact info":     { color: "#7c3aed",  bg: "rgba(124,58,237,0.08)",  border: "rgba(124,58,237,0.2)" },
  "Check booking context":           { color: "#16a34a",  bg: "rgba(22,163,74,0.08)",   border: "rgba(22,163,74,0.2)" },
  "Keep suppressed":                 { color: "#dc2626",  bg: "rgba(220,38,38,0.08)",   border: "rgba(220,38,38,0.2)" },
  "Exclude from sales metrics":      { color: "#d97706",  bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)" },
  "Manual audit candidate":          { color: "#64748b",  bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.2)" },
  "Do not contact":                  { color: "#dc2626",  bg: "rgba(220,38,38,0.1)",    border: "rgba(220,38,38,0.25)" },
  "Confirm consent before outreach": { color: "#ea580c",  bg: "rgba(234,88,12,0.08)",   border: "rgba(234,88,12,0.2)" },
};

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1px", minWidth: "90px" }}>
      <span style={{ fontSize: "10px", fontWeight: "700", color: "rgba(10,22,40,0.38)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
      <span style={{ fontSize: "13px", color: "#0A1628", fontWeight: "500", wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}

const CHIP_COLORS = {
  neutral:    { color: "#64748b", bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.2)" },
  warn:       { color: "#d97706", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)" },
  danger:     { color: "#dc2626", bg: "rgba(220,38,38,0.09)",   border: "rgba(220,38,38,0.22)" },
  green:      { color: "#16a34a", bg: "rgba(22,163,74,0.08)",   border: "rgba(22,163,74,0.2)" },
  blue:       { color: "#0088CC", bg: "rgba(0,136,204,0.08)",   border: "rgba(0,136,204,0.2)" },
  purple:     { color: "#7c3aed", bg: "rgba(124,58,237,0.08)",  border: "rgba(124,58,237,0.2)" },
  orange:     { color: "#ea580c", bg: "rgba(234,88,12,0.08)",   border: "rgba(234,88,12,0.2)" },
};

function Chip({ text, variant = "neutral" }) {
  const s = CHIP_COLORS[variant] || CHIP_COLORS.neutral;
  return (
    <span style={{
      fontSize: "11px", fontWeight: "600", padding: "2px 8px", borderRadius: "9999px",
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
      whiteSpace: "nowrap",
    }}>
      {text}
    </span>
  );
}

export default function OppRecordCard({ record, activeTab }) {
  const label = getReviewLabel(record);
  const why = getWhyPrioritized(record);
  const missingFlags = getMissingContactFlags(record);
  const internal = isInternalRecord(record);
  const imported = isImportedRecord(record);
  const labelStyle = LABEL_STYLES[label] || LABEL_STYLES["Review first"];

  const businessName = record.business_name || record.full_name || "—";
  const industry = record.industry || record.business_type || record.industry_slug || null;
  const score = record.lead_score > 0 ? record.lead_score : (record.engagement_score > 0 ? record.engagement_score : null);
  const source = record.source || record.import_source || null;
  const status = record.crm_stage || record.status || record.lead_status || null;
  const website = record.website || record.website_url || record.business_website_url || null;
  const problem = record.problem || record.message || null;
  const booking = record.booking_status || (record.crm_stage === "Audit Booked" ? "booked" : null);
  const sourceType = record._source_type === "website_lead" ? "Website Lead" : "CRM Lead";
  const hasDedupe = record.dedupe_status || record.dedupe_duplicate_of || record.dedupe_group_key || (record.dedupe_merged_ids && record.dedupe_merged_ids.length > 0);

  // Build risk chips
  const chips = [];
  if (internal)                                                             chips.push({ text: "QA/Proof",          variant: "warn" });
  if (imported)                                                             chips.push({ text: "Imported",           variant: "purple" });
  if (!record.consent_given)                                                chips.push({ text: "Consent Missing",    variant: "orange" });
  if (missingFlags.includes("No email") || missingFlags.includes("No email or phone")) chips.push({ text: "No Email", variant: "warn" });
  if (missingFlags.includes("No phone") || missingFlags.includes("No email or phone")) chips.push({ text: "No Phone", variant: "warn" });
  if (hasDedupe)                                                            chips.push({ text: "Duplicate Candidate",variant: "neutral" });
  if (record.do_not_contact || record.outreach_status === "do_not_contact") chips.push({ text: "Do Not Contact",    variant: "danger" });
  if (record.email_bounced)                                                 chips.push({ text: "Email Bounced",      variant: "danger" });
  if (record.email_unsubscribed)                                            chips.push({ text: "Email Unsubscribed", variant: "danger" });
  if (booking)                                                              chips.push({ text: "Booked",             variant: "green" });
  if (score !== null && score >= 70)                                        chips.push({ text: "High Score",         variant: "blue" });
  if (!internal && !imported && (missingFlags.length > 0 || !record.consent_given)) chips.push({ text: "Needs Verification", variant: "warn" });

  return (
    <div style={{
      background: "hsl(var(--card))",
      border: internal ? "1px solid rgba(245,158,11,0.25)" : "1px solid hsl(var(--border))",
      borderRadius: "12px",
      padding: "14px 18px",
    }}>
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "14px", fontWeight: "800", color: "#0A1628" }}>{businessName}</span>
          <span style={{
            fontSize: "10px", fontWeight: "600", padding: "2px 7px", borderRadius: "9999px",
            background: "rgba(0,174,239,0.08)", border: "1px solid rgba(0,174,239,0.2)", color: "#0088CC",
          }}>{sourceType}</span>
          {score !== null && (
            <span style={{
              fontSize: "11px", fontWeight: "700", padding: "2px 7px", borderRadius: "9999px",
              background: score >= 70 ? "rgba(22,163,74,0.1)" : "rgba(107,114,128,0.08)",
              border: `1px solid ${score >= 70 ? "rgba(22,163,74,0.25)" : "rgba(107,114,128,0.18)"}`,
              color: score >= 70 ? "#15803d" : "#6b7280",
            }}>
              Score: {score}
            </span>
          )}
        </div>
        {/* Recommended Next Step label */}
        <span style={{
          fontSize: "11px", fontWeight: "700", padding: "3px 11px", borderRadius: "9999px",
          background: labelStyle.bg, border: `1px solid ${labelStyle.border}`, color: labelStyle.color,
          whiteSpace: "nowrap",
        }}>
          {label}
        </span>
      </div>

      {/* Risk chips */}
      {chips.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "10px" }}>
          {chips.map((c, i) => <Chip key={i} text={c.text} variant={c.variant} />)}
        </div>
      )}

      {/* Imported label */}
      {imported && activeTab === "imported" && (
        <div style={{
          fontSize: "12px", fontStyle: "italic", color: "#7c3aed",
          marginBottom: "8px", paddingLeft: "2px",
        }}>
          Imported prospect — verify before outreach.
        </div>
      )}

      {/* Fields grid */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginBottom: "10px" }}>
        <Field label="Industry / Type" value={industry} />
        <Field label="Source" value={source} />
        <Field label="Status" value={status} />
        <Field label="Booking" value={booking} />
        {website && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", minWidth: "90px" }}>
            <span style={{ fontSize: "10px", fontWeight: "700", color: "rgba(10,22,40,0.38)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Website</span>
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
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", flex: "1 1 200px", minWidth: "150px" }}>
            <span style={{ fontSize: "10px", fontWeight: "700", color: "rgba(10,22,40,0.38)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Problem / Hook</span>
            <span style={{ fontSize: "13px", color: "#0A1628", fontWeight: "500", lineHeight: 1.5 }}>
              {problem.slice(0, 120)}{problem.length > 120 ? "…" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Why prioritized */}
      <div style={{
        background: "rgba(0,174,239,0.04)", borderRadius: "8px", padding: "7px 11px",
      }}>
        <span style={{ fontSize: "11px", fontWeight: "700", color: "#0088CC", textTransform: "uppercase", letterSpacing: "0.06em", marginRight: "6px" }}>
          Why prioritized:
        </span>
        <span style={{ fontSize: "12px", color: "rgba(10,22,40,0.6)" }}>{why}</span>
      </div>
    </div>
  );
}