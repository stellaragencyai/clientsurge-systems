import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const DEFAULT_PAGE_SIZE = 500;
const MAX_PAGE_SIZE = 1000;
const MAX_PAGES = 25;
const APPLY_LIMIT = 500;
const CONFIRM_PHRASE = "BACKFILL JUNK";

function s(value: unknown) {
  return String(value || "").trim();
}

function lower(value: unknown) {
  return s(value).toLowerCase();
}

function digits(value: unknown) {
  return s(value).replace(/\D/g, "");
}

function includesAny(text: string, patterns: string[]) {
  return patterns.some((pattern) => text.includes(pattern));
}

const emailMarkers = [
  "clientsurge.test",
  "clientsurge-install.internal",
  "@clientsurge.test",
  ".internal",
  "backfill-test",
  "test@example.com",
];

const sourceMarkers = [
  "crm_live_smoke_test",
  "smoke",
  "install_test",
  "post_patch_verification",
  "runaibraininstallerbackfill",
  "admin_test_lead",
  "testwebsiteleadautomation",
  "launch audit",
  "backfill",
];

const nameMarkers = [
  "clientsurge smoke qa",
  "clientsurge crm smoke",
  "client surge smoke",
  "sarah smoke test",
  "admin test lead",
  "install test",
  "test owner",
  "crm smoke",
  "backfill test",
  "test hvac co",
];

const rawImportCodes = new Set([
  "raw_import_no_contact",
  "missing_city_state_no_contact",
  "generic_business_name",
  "duplicate_no_contact",
]);

const internalCodes = new Set([
  "internal_test",
  "internal_test_source",
  "internal_test_business_name",
  "internal_test_full_name",
  "example_email",
  "test_phone_555",
  "test_website",
  "generic_inquiry_name",
]);

const conversionStates = new Set(["BOOKED", "WON"]);
const conversionStatuses = new Set(["Booked", "Closed"]);
const conversionStages = new Set(["Audit Booked", "Won Pending Payment", "Won"]);

function hasReasonCode(record: any, set: Set<string>) {
  return (record?.quality_reason_codes || []).some((code: string) => set.has(s(code)));
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function hasUsefulContact(record: any) {
  return Boolean(
    s(record.email) ||
    s(record.phone) ||
    s(record.phone_number) ||
    s(record.website) ||
    s(record.website_url) ||
    s(record.canonical_website_url) ||
    s(record.business_website_url)
  );
}

function hasLeadConversionEvidence(lead: any) {
  return Boolean(
    Number(lead.total_revenue || 0) > 0 ||
    Number(lead.number_of_conversions || 0) > 0 ||
    s(lead.last_conversion_date) ||
    s(lead.order_id) ||
    ["stripe", "manual_payment"].includes(lower(lead.payment_source)) ||
    s(lead.booked_at) ||
    conversionStates.has(s(lead.lead_state)) ||
    conversionStatuses.has(s(lead.status)) ||
    conversionStages.has(s(lead.crm_stage)) ||
    ["replied", "booked"].includes(lower(lead.outreach_status)) ||
    lower(lead.reply_sentiment) === "positive"
  );
}

function hasWebsiteLeadEngagement(lead: any) {
  return Boolean(
    ["responded", "hot", "booked", "closed"].includes(lower(lead.lead_status)) ||
    ["responded", "sent"].includes(lower(lead.reply_status)) ||
    ["booked", "clicked"].includes(lower(lead.booking_status)) ||
    Number(lead.engagement_score || 0) > 0
  );
}

function leadSignals(lead: any) {
  const signals: string[] = [];
  const email = lower(lead.email || lead.canonical_email || lead.normalized_email);
  const sourceText = lower([lead.source, lead.import_source, lead.consent_source, lead.source_page, lead.page_submitted_from].join(" "));
  const nameText = lower([lead.business_name, lead.full_name, lead.owner_contact_name].join(" "));
  const phone = digits(lead.phone || lead.canonical_phone || lead.normalized_phone);
  const reason = lower(lead.quality_reason);

  if (["quarantine_candidate", "quarantined", "duplicate_candidate"].includes(s(lead.quality_review_status))) signals.push(`quality_status:${lead.quality_review_status}`);
  if (["duplicate_candidate", "merged_duplicate"].includes(s(lead.dedupe_status))) signals.push(`dedupe_status:${lead.dedupe_status}`);
  if (s(lead.dedupe_duplicate_of) && !hasLeadConversionEvidence(lead)) signals.push("duplicate_keeper_linked");
  if (includesAny(email, emailMarkers)) signals.push("email_marker");
  if (includesAny(sourceText, sourceMarkers)) signals.push("source_marker");
  if (includesAny(nameText, nameMarkers)) signals.push("name_marker");
  if (phone.length >= 7 && phone.includes("555")) signals.push("reserved_phone_pattern");
  if (hasReasonCode(lead, internalCodes)) signals.push("internal_reason_code");
  if (hasReasonCode(lead, rawImportCodes)) signals.push("raw_import_reason_code");
  if (reason.includes("raw import with no email, phone, or website")) signals.push("raw_import_no_contact_text");
  if (!hasUsefulContact(lead) && hasReasonCode(lead, rawImportCodes)) signals.push("no_useful_contact");

  return unique(signals);
}

function websiteLeadSignals(lead: any) {
  const signals: string[] = [];
  const email = lower(lead.email);
  const sourceText = lower([lead.source, lead.consent_source, lead.source_page, lead.message, lead.call_summary, lead.user_agent].join(" "));
  const nameText = lower([lead.business_name, lead.full_name, lead.first_name].join(" "));
  const phone = digits(lead.phone_number || lead.phone);

  if (lead.archived === true) signals.push("already_archived");
  if (lower(lead.lead_status) === "ignored") signals.push("ignored_status");
  if (includesAny(email, emailMarkers)) signals.push("email_marker");
  if (includesAny(sourceText, sourceMarkers)) signals.push("source_marker");
  if (includesAny(nameText, nameMarkers)) signals.push("name_marker");
  if (phone.length >= 7 && phone.includes("555")) signals.push("reserved_phone_pattern");
  if (lower(lead.business_type) === "test") signals.push("test_business_type");

  return unique(signals);
}

function buildLeadUpdate(lead: any, signals: string[], now: string) {
  if (!signals.length || hasLeadConversionEvidence(lead) || s(lead.quality_review_status) === "verified_outbound_ready") return null;
  const nextCodes = unique([...(lead.quality_reason_codes || []), ...signals]);
  return {
    quality_review_status: s(lead.dedupe_duplicate_of) || signals.some((x) => x.includes("duplicate")) ? "duplicate_candidate" : "quarantine_candidate",
    quality_reason: `Backfill quality review: ${signals.join(", ")}`,
    quality_reason_codes: nextCodes,
    quality_confidence: Math.max(Number(lead.quality_confidence || 0), signals.length >= 2 ? 95 : 80),
    audited_at: now,
  };
}

function buildWebsiteLeadUpdate(lead: any, signals: string[], now: string) {
  if (!signals.length || hasWebsiteLeadEngagement(lead)) return null;
  if (lead.archived === true && lower(lead.lead_status) === "ignored" && lead.automation_enabled === false) return null;
  return {
    archived: true,
    archived_at: lead.archived_at || now,
    lead_status: "ignored",
    cadence_paused: true,
    cadence_paused_at: lead.cadence_paused_at || now,
    automation_enabled: false,
    quality_notes: `Backfill quality review: ${signals.join(", ")}`,
  };
}

async function fetchPages(entity: any, pageSize: number, maxPages: number) {
  const records: any[] = [];
  for (let page = 0; page < maxPages; page++) {
    const offset = page * pageSize;
    const batch = await entity.list("-created_date", pageSize, offset).catch(() => []);
    records.push(...(batch || []));
    if (!batch || batch.length < pageSize) break;
  }
  return records;
}

async function applyUpdates(entity: any, updates: Array<{ id: string; update: Record<string, unknown> }>) {
  let applied = 0;
  const failed: Array<{ id: string; error: string }> = [];
  for (const item of updates) {
    try {
      await entity.update(item.id, item.update);
      applied += 1;
    } catch (error: any) {
      failed.push({ id: item.id, error: error?.message || "update failed" });
    }
  }
  return { applied, failed };
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed" }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.apply !== true;
    const confirmed = body.confirm_phrase === CONFIRM_PHRASE;
    const scope = ["leads", "website_leads", "both"].includes(body.scope) ? body.scope : "both";
    const pageSize = Math.min(Math.max(Number(body.page_size || DEFAULT_PAGE_SIZE), 1), MAX_PAGE_SIZE);
    const maxPages = Math.min(Math.max(Number(body.max_pages || 5), 1), MAX_PAGES);

    if (!dryRun && !confirmed) {
      return secureJson({
        success: false,
        error: `Apply mode requires confirm_phrase ${CONFIRM_PHRASE}`,
      }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const now = new Date().toISOString();
    const summary: any = {
      success: true,
      dry_run: dryRun,
      scope,
      page_size: pageSize,
      max_pages: maxPages,
      scanned: { leads: 0, website_leads: 0 },
      eligible: { leads: 0, website_leads: 0 },
      applied: { leads: 0, website_leads: 0 },
      failed: { leads: [], website_leads: [] },
      samples: { leads: [], website_leads: [] },
      generated_at: now,
    };

    if (scope === "leads" || scope === "both") {
      const leads = await fetchPages(base44.asServiceRole.entities.Leads, pageSize, maxPages);
      summary.scanned.leads = leads.length;
      const updates = leads.map((lead) => {
        const signals = leadSignals(lead);
        const update = buildLeadUpdate(lead, signals, now);
        return update ? { id: lead.id, update, signals, name: lead.business_name || lead.full_name || lead.email || lead.id } : null;
      }).filter(Boolean).slice(0, APPLY_LIMIT) as Array<{ id: string; update: any; signals: string[]; name: string }>;

      summary.eligible.leads = updates.length;
      summary.samples.leads = updates.slice(0, 20).map((item) => ({ id: item.id, name: item.name, signals: item.signals }));
      if (!dryRun) {
        const result = await applyUpdates(base44.asServiceRole.entities.Leads, updates.map((item) => ({ id: item.id, update: item.update })));
        summary.applied.leads = result.applied;
        summary.failed.leads = result.failed;
      }
    }

    if (scope === "website_leads" || scope === "both") {
      const websiteLeads = await fetchPages(base44.asServiceRole.entities.WebsiteLead, pageSize, maxPages);
      summary.scanned.website_leads = websiteLeads.length;
      const updates = websiteLeads.map((lead) => {
        const signals = websiteLeadSignals(lead);
        const update = buildWebsiteLeadUpdate(lead, signals, now);
        return update ? { id: lead.id, update, signals, name: lead.business_name || lead.full_name || lead.email || lead.id } : null;
      }).filter(Boolean).slice(0, APPLY_LIMIT) as Array<{ id: string; update: any; signals: string[]; name: string }>;

      summary.eligible.website_leads = updates.length;
      summary.samples.website_leads = updates.slice(0, 20).map((item) => ({ id: item.id, name: item.name, signals: item.signals }));
      if (!dryRun) {
        const result = await applyUpdates(base44.asServiceRole.entities.WebsiteLead, updates.map((item) => ({ id: item.id, update: item.update })));
        summary.applied.website_leads = result.applied;
        summary.failed.website_leads = result.failed;
      }
    }

    return secureJson(summary);
  } catch (error: any) {
    return secureJson({ success: false, error: error?.message || "Lead quality backfill failed" }, { status: 500 });
  }
});
