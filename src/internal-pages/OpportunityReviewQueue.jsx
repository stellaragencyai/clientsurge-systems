import { useEffect, useLayoutEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Eye, Users, Import, FlaskConical, Ban, PhoneMissed, Zap, RefreshCw, Loader2 } from "lucide-react";
import OppReviewSummaryCards from "@/components/admin/opp-review/OppReviewSummaryCards";
import OppReviewTabs from "@/components/admin/opp-review/OppReviewTabs";

// Terms that mark a record as internal/QA/proof — display-only classification
export const INTERNAL_TERMS = [
  "qa", "smoke", "proof", "runtime", "test", "clientsurge", "codex", "ignore",
];

export function isInternalRecord(record) {
  const fields = [
    record.source,
    record.business_name,
    record.problem,
    record.notes,
    record.description,
    record.enrichment_notes,
    record.import_source,
  ];
  const combined = fields.filter(Boolean).join(" ").toLowerCase();
  return INTERNAL_TERMS.some((term) => combined.includes(term));
}

export function getMissingContactFlags(record) {
  const flags = [];
  if (!record.email && !record.phone) flags.push("No email or phone");
  else if (!record.email) flags.push("No email");
  else if (!record.phone) flags.push("No phone");
  return flags;
}

export function getReviewLabel(record) {
  if (record.do_not_contact || record.email_unsubscribed) return "Keep suppressed";
  if (isInternalRecord(record)) return "Exclude from metrics";
  if (record.dedupe_status === "duplicate_candidate" || record.dedupe_status === "merged_duplicate") return "Duplicate — verify";
  const missing = getMissingContactFlags(record);
  if (missing.length > 0) return "Verify business details";
  if (record.crm_stage === "Booked" || record.status === "Booked" || record.booking_status === "booked") return "Check booking context";
  if ((record.lead_score >= 70) || (record.activation_priority === "Hot") || (record.segment_label === "HOT")) return "Review first";
  return "Review first";
}

export function getWhyPrioritized(record) {
  const reasons = [];
  if (record.lead_score >= 80) reasons.push(`High lead score (${record.lead_score})`);
  if (record.segment_label === "HOT") reasons.push("Segment: HOT");
  if (record.activation_priority === "Hot") reasons.push("Activation priority: Hot");
  if (record.booking_status === "booked" || record.crm_stage === "Audit Booked" || record.status === "Booked") reasons.push("Booking detected");
  if (record.website || record.website_url || record.business_website_url) reasons.push("Website present");
  if (record.problem && record.problem.length > 20) reasons.push("Detailed problem statement");
  if (record.enrichment_notes) reasons.push("Enrichment data available");
  if (record.source === "website_form" || record.source === "Website") reasons.push("Organic inbound");
  if (record.industry || record.business_type) reasons.push(`Industry: ${record.industry || record.business_type}`);
  if (record.import_source) reasons.push(`Imported via ${record.import_source}`);
  return reasons.length > 0 ? reasons.join(" · ") : "Standard inbound record";
}

export default function OpportunityReviewQueue() {
  useLayoutEffect(() => {
    const robots = document.querySelector('meta[name="robots"]');
    if (robots) robots.setAttribute("content", "noindex,nofollow");
    return () => { if (robots) robots.setAttribute("content", "index,follow"); };
  }, []);

  const [leads, setLeads] = useState([]);
  const [websiteLeads, setWebsiteLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [leadsRes, wlRes] = await Promise.all([
        base44.entities.Leads.list("-created_date", 200),
        base44.entities.WebsiteLead.list("-created_date", 200),
      ]);
      setLeads(leadsRes || []);
      setWebsiteLeads(wlRes || []);
    } catch (err) {
      setError("Failed to load records. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Normalise WebsiteLeads into a shape compatible with Leads fields
  const allRecords = useMemo(() => {
    const normalised = websiteLeads.map((wl) => ({
      ...wl,
      _source_type: "website_lead",
      full_name: wl.full_name || wl.first_name,
      email: wl.email,
      phone: wl.phone_number,
      industry: wl.business_type || wl.industry_slug,
      website: wl.business_website_url || wl.website_url,
      status: wl.lead_status,
      lead_score: wl.engagement_score || 0,
      source: wl.source || "website_form",
      import_source: null,
    }));
    const crmRecords = leads.map((l) => ({ ...l, _source_type: "crm_lead" }));
    return [...crmRecords, ...normalised];
  }, [leads, websiteLeads]);

  // Classify all records
  const classified = useMemo(() => {
    const internal = allRecords.filter(isInternalRecord);
    const suppressed = allRecords.filter(
      (r) => !isInternalRecord(r) && (r.do_not_contact || r.email_unsubscribed || r.outreach_status === "do_not_contact")
    );
    const duplicates = allRecords.filter(
      (r) => !isInternalRecord(r) && !suppressed.includes(r) &&
        (r.dedupe_status === "duplicate_candidate" || r.dedupe_status === "merged_duplicate")
    );
    const missingContact = allRecords.filter(
      (r) => !isInternalRecord(r) && !suppressed.includes(r) && getMissingContactFlags(r).length > 0
    );
    const imported = allRecords.filter(
      (r) => !isInternalRecord(r) && !suppressed.includes(r) &&
        (r.import_source || r.source === "imported" || r.lead_source === "imported")
    );
    const highPriority = allRecords.filter(
      (r) => !isInternalRecord(r) && !suppressed.includes(r) &&
        (r.lead_score >= 70 || r.segment_label === "HOT" || r.activation_priority === "Hot" ||
          r.booking_status === "booked" || r.crm_stage === "Audit Booked")
    );
    const real = allRecords.filter(
      (r) => !isInternalRecord(r) && !suppressed.includes(r)
    );

    return { internal, suppressed, duplicates, missingContact, imported, highPriority, real };
  }, [allRecords]);

  return (
    <div className="min-h-screen bg-background">
      {/* Top read-only banner */}
      <div style={{
        background: "rgba(245,158,11,0.08)",
        borderBottom: "1px solid rgba(245,158,11,0.25)",
        padding: "10px 24px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}>
        <AlertTriangle style={{ width: "16px", height: "16px", color: "#d97706", flexShrink: 0 }} />
        <span style={{ fontSize: "13px", fontWeight: "600", color: "#92400e" }}>
          Review queue only. No external actions run from this page.
        </span>
      </div>

      <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "32px clamp(16px,3vw,40px)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "800", color: "#0A1628", margin: "0 0 4px" }}>
              Opportunity Review Queue
            </h1>
            <p style={{ fontSize: "13px", color: "rgba(10,22,40,0.5)", margin: 0 }}>
              Admin-only · Read-only · Classify before any manual sales work
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "8px 16px", borderRadius: "9999px",
              background: "rgba(0,174,239,0.08)", border: "1px solid rgba(0,174,239,0.2)",
              color: "#0088CC", fontSize: "13px", fontWeight: "600", cursor: "pointer",
              opacity: loading ? 0.5 : 1,
            }}
          >
            <RefreshCw style={{ width: "13px", height: "13px", animation: loading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px", padding: "16px", marginBottom: "24px", color: "#dc2626", fontSize: "13px" }}>
            ⚠ {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <Loader2 style={{ width: "32px", height: "32px", color: "#00AEEF", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ fontSize: "14px", color: "rgba(10,22,40,0.5)" }}>Loading records…</p>
          </div>
        ) : (
          <>
            <OppReviewSummaryCards classified={classified} />
            <OppReviewTabs classified={classified} allRecords={allRecords} />
          </>
        )}
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}