import { useEffect, useLayoutEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, RefreshCw, Loader2, ShieldAlert } from "lucide-react";
import OppReviewSummaryCards from "@/components/admin/opp-review/OppReviewSummaryCards";
import OppReviewTabs from "@/components/admin/opp-review/OppReviewTabs";
import LaunchReadinessPanel from "@/components/admin/opp-review/LaunchReadinessPanel";

// Expanded internal/QA/proof term list — covers all spec requirements
export const INTERNAL_TERMS = [
  "qa", "smoke", "proof", "runtime", "test", "clientsurge", "codex", "ignore",
  "example.com", "clientsurge.test", "no-reply", "noreply", "backfill-test",
  "ai_brain_backfill", "backfill",
];

// Numeric-only weak problem values (e.g. "90", "43")
const NUMERIC_ONLY_PATTERN = /^\d{1,5}$/;

// Import source that indicates bulk imported prospects
const IMPORTED_SOURCES = ["lead_dashboard_5378_2026_05_29", "imported", "csv_import", "bulk_import", "legacy"];

export function isInternalRecord(record) {
  const fields = [
    record.source,
    record.business_name,
    record.full_name,
    record.problem,
    record.notes,
    record.description,
    record.email,
    record.enrichment_notes,
    record.import_source,
    ...(Array.isArray(record.source_history) ? record.source_history : []),
  ];
  const combined = fields.filter(Boolean).join(" ").toLowerCase();
  return INTERNAL_TERMS.some((term) => combined.includes(term));
}

export function isImportedRecord(record) {
  if (!record.import_source && record.source !== "imported" && record.lead_source !== "imported") return false;
  const src = (record.import_source || record.source || "").toLowerCase();
  return IMPORTED_SOURCES.some((s) => src.includes(s)) || record.source === "imported" || record.lead_source === "imported";
}

export function getMissingContactFlags(record) {
  const flags = [];
  const hasEmail = record.email && !record.email.includes("example.com") && !record.email.includes("no-reply");
  const hasPhone = record.phone || record.phone_number;
  if (!hasEmail && !hasPhone) flags.push("No email or phone");
  else if (!hasEmail) flags.push("No email");
  else if (!hasPhone) flags.push("No phone");
  return flags;
}

export function needsVerification(record) {
  if (isInternalRecord(record)) return false;
  const problem = record.problem || record.message || "";
  const hasWeakProblem = !problem || problem.trim().length < 8 || NUMERIC_ONLY_PATTERN.test(problem.trim());
  const hasMissingContact = getMissingContactFlags(record).length > 0;
  const hasMissingNormalized = !record.normalized_email && !record.normalized_phone && !record.normalized_business_name;
  const hasQuestionableIndustry = !record.industry && !record.business_type;
  return hasWeakProblem || hasMissingContact || (hasMissingNormalized && hasQuestionableIndustry);
}

export function getReviewLabel(record) {
  if (record.do_not_contact || record.outreach_status === "do_not_contact") return "Do not contact";
  if (record.email_unsubscribed) return "Keep suppressed";
  if (record.email_bounced) return "Keep suppressed";
  if (isInternalRecord(record)) return "Exclude from sales metrics";
  if (record.dedupe_status === "duplicate_candidate" || record.dedupe_status === "merged_duplicate" || record.dedupe_duplicate_of || record.dedupe_group_key || (record.dedupe_merged_ids && record.dedupe_merged_ids.length > 0)) return "Manual audit candidate";
  if (isImportedRecord(record)) return "Verify website/contact info";
  const missing = getMissingContactFlags(record);
  if (missing.length > 0) return "Verify website/contact info";
  if (!record.consent_given) return "Confirm consent before outreach";
  if (record.crm_stage === "Audit Booked" || record.status === "Booked" || record.booking_status === "booked") return "Check audit context";
  if (record.lead_score >= 70 || record.activation_priority === "Hot" || record.segment_label === "HOT") return "Review first";
  if (needsVerification(record)) return "Verify website/contact info";
  return "Review first";
}

export function getWhyPrioritized(record) {
  const reasons = [];
  if (record.lead_score >= 80) reasons.push(`High lead score (${record.lead_score})`);
  if (record.segment_label === "HOT") reasons.push("Segment: HOT");
  if (record.activation_priority === "Hot") reasons.push("Activation priority: Hot");
  if (record.booking_status === "booked" || record.crm_stage === "Audit Booked" || record.status === "Booked") reasons.push("Audit requested or audit link sent");
  if (record.booked_at || record.booking_link_sent_at) reasons.push("Free automation audit requested");
  if (record.website || record.website_url || record.business_website_url) reasons.push("Website present");
  if (record.enrichment_notes) reasons.push("Enrichment hook available");
  if (record.source === "website_form" || record.source === "Website") reasons.push("Organic inbound");
  if (record.industry || record.business_type) reasons.push(`Industry: ${record.industry || record.business_type}`);
  if (record.import_source) reasons.push(`Imported via ${record.import_source}`);
  // Problem keyword matching
  const problem = (record.problem || record.message || "").toLowerCase();
  const problemKeywords = ["lead", "missed call", "booking", "quote", "follow-up", "followup", "automation"];
  if (problemKeywords.some((kw) => problem.includes(kw))) reasons.push("Problem mentions key automation need");
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

  const classified = useMemo(() => {
    const internal = allRecords.filter(isInternalRecord);
    const suppressed = allRecords.filter(
      (r) => !isInternalRecord(r) && (
        r.do_not_contact ||
        r.email_unsubscribed ||
        r.email_bounced ||
        r.outreach_status === "do_not_contact"
      )
    );
    const duplicates = allRecords.filter(
      (r) => !isInternalRecord(r) && !suppressed.includes(r) && (
        r.dedupe_status === "duplicate_candidate" ||
        r.dedupe_status === "merged_duplicate" ||
        r.dedupe_duplicate_of ||
        r.dedupe_group_key ||
        (r.dedupe_merged_ids && r.dedupe_merged_ids.length > 0)
      )
    );
    const imported = allRecords.filter(
      (r) => !isInternalRecord(r) && !suppressed.includes(r) && isImportedRecord(r)
    );
    const missingContact = allRecords.filter(
      (r) => !isInternalRecord(r) && !suppressed.includes(r) && getMissingContactFlags(r).length > 0
    );
    const needsVerify = allRecords.filter(
      (r) => !isInternalRecord(r) && !suppressed.includes(r) && needsVerification(r)
    );
    // High priority: excludes QA, suppressed, and do-not-contact records
    const highPriority = allRecords.filter(
      (r) =>
        !isInternalRecord(r) &&
        !suppressed.includes(r) &&
        !r.do_not_contact &&
        r.outreach_status !== "do_not_contact" &&
        (
          r.lead_score >= 70 ||
          r.segment_label === "HOT" ||
          r.activation_priority === "Hot" ||
          r.booking_status === "booked" ||
          r.crm_stage === "Audit Booked"
        )
    );
    const real = allRecords.filter(
      (r) => !isInternalRecord(r) && !suppressed.includes(r)
    );
    const consentMissing = real.filter((r) => !r.consent_given);

    return { internal, suppressed, duplicates, missingContact, imported, highPriority, real, needsVerify, consentMissing };
  }, [allRecords]);

  return (
    <div className="min-h-screen bg-background">
      {/* Prominent read-only safety banner */}
      <div style={{
        background: "rgba(220,38,38,0.06)",
        borderBottom: "2px solid rgba(220,38,38,0.2)",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}>
        <ShieldAlert style={{ width: "18px", height: "18px", color: "#dc2626", flexShrink: 0 }} />
        <span style={{ fontSize: "13px", fontWeight: "700", color: "#991b1b" }}>
          Manual review only. This page never sends messages, starts campaigns, or contacts leads.
        </span>
      </div>

      <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "32px clamp(16px,3vw,40px)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
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
            {/* 1. Summary Cards */}
            <OppReviewSummaryCards classified={classified} />
            {/* 2. Launch Readiness Panel */}
            <LaunchReadinessPanel classified={classified} />
            {/* 3. Tabs + Queue */}
            <OppReviewTabs classified={classified} allRecords={allRecords} />
          </>
        )}
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}