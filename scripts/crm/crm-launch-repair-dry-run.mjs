import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const APP_ID = "69dc4a79656fdba136d413d3";
const LEADS_URL = `https://base44.app/api/apps/${APP_ID}/entities/Leads`;
const IMPORT_SOURCE = "lead_dashboard_5378_2026_05_29";
const PAGE_SIZE = 5000;

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value) {
  return clean(value).toLowerCase();
}

function normalizePhone(value) {
  return clean(value).replace(/\D/g, "");
}

function normalizeDomain(value) {
  const raw = clean(value);
  if (!raw) return "";
  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return new URL(withProtocol).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

function normalizeBusinessName(value) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function sourceHistoryFor(lead) {
  const existing = Array.isArray(lead.source_history) ? lead.source_history : [];
  return [...new Set([...existing, clean(lead.source), clean(lead.import_source), IMPORT_SOURCE].filter(Boolean))];
}

function stageFor(lead) {
  const stage = clean(lead.crm_stage);
  if (stage) return stage;

  const status = clean(lead.status);
  if (status === "New") return "Not Contacted";
  if (status === "Contacted") return "Contacted";
  if (status === "Replied") return "Replied";
  if (status === "Booked") return "Audit Booked";
  if (status === "Closed" && (lead.order_id || lead.client_id || lead.payment_status === "paid")) return "Won";
  if (status === "Closed") return "Proposal Sent";
  if (lead.email_unsubscribed || lead.do_not_contact) return "Follow Up Later";
  if (lead.email_bounced) return "Lost";
  return "Not Contacted";
}

function inferIndustry(lead) {
  const existing = clean(lead.industry);
  if (existing) return { industry: existing, confidence: "existing" };

  const businessType = clean(lead.business_type || lead.niche);
  if (businessType) return { industry: businessType, confidence: "business_type" };

  const haystack = [
    lead.business_name,
    lead.source,
    lead.crm_tag,
    lead.page_submitted_from,
    ...(Array.isArray(lead.industry_tags) ? lead.industry_tags : []),
  ].join(" ").toLowerCase();

  if (/\broof|roofing|roofer\b/.test(haystack)) return { industry: "roofing", confidence: "strong_inference" };
  if (/\bhvac|air conditioning|heating\b/.test(haystack)) return { industry: "hvac", confidence: "strong_inference" };
  if (/\bdental|dentist|orthodont/.test(haystack)) return { industry: "dental", confidence: "strong_inference" };
  return { industry: "Other Local Services", confidence: "low" };
}

function shouldPatch(current, next) {
  if (Array.isArray(next)) {
    return JSON.stringify(current || []) !== JSON.stringify(next);
  }
  return (current ?? "") !== (next ?? "");
}

function buildBackfillPatch(lead) {
  const inferred = inferIndustry(lead);
  const nextSourceHistory = sourceHistoryFor(lead);
  const patch = {
    crm_stage: stageFor(lead),
    industry: inferred.industry,
    crm_tag: clean(lead.crm_tag) || inferred.industry,
    page_submitted_from: clean(lead.page_submitted_from) || clean(lead.source_page) || IMPORT_SOURCE,
    source_history: nextSourceHistory,
    website_url: clean(lead.website_url) || clean(lead.website),
    owner_contact_name: clean(lead.owner_contact_name) || clean(lead.full_name),
    city: clean(lead.city),
    state: clean(lead.state),
    lead_score: Number.isFinite(Number(lead.lead_score)) ? Number(lead.lead_score) : 0,
    outreach_status: clean(lead.outreach_status) || "not_contacted",
  };

  const changedFields = Object.entries(patch)
    .filter(([field, value]) => shouldPatch(lead[field], value))
    .map(([field]) => field);

  return {
    id: lead.id,
    changedFields,
    manualReview: inferred.confidence === "low",
    industryConfidence: inferred.confidence,
  };
}

function countBy(rows, resolver) {
  const counts = {};
  for (const row of rows) {
    const key = resolver(row) || "missing";
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]));
}

function groupBy(rows, keyFn) {
  const map = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return [...map.values()].filter((group) => group.length > 1);
}

function completenessScore(lead) {
  return [
    lead.email,
    lead.phone,
    lead.website_url || lead.website,
    lead.industry || lead.business_type,
    lead.crm_stage || lead.status,
    lead.source_history?.length,
    lead.order_id || lead.client_id,
  ].filter(Boolean).length;
}

function summarizeDuplicateGroups(groups, type) {
  return groups.map((group) => {
    const sorted = [...group].sort((a, b) => {
      const scoreDiff = completenessScore(b) - completenessScore(a);
      if (scoreDiff) return scoreDiff;
      return new Date(b.updated_date || b.created_date || 0) - new Date(a.updated_date || a.created_date || 0);
    });
    return {
      type,
      size: group.length,
      keeper_id: sorted[0]?.id || null,
      merge_candidate_ids: sorted.slice(1).map((lead) => lead.id),
      high_confidence: ["email", "phone", "website"].includes(type),
    };
  });
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status} for ${url}`);
  }
  return response.json();
}

async function fetchAllLeads() {
  const rows = [];
  for (let skip = 0; ; skip += PAGE_SIZE) {
    const page = await fetchJson(`${LEADS_URL}?limit=${PAGE_SIZE}&skip=${skip}`);
    rows.push(...page);
    if (!Array.isArray(page) || page.length < PAGE_SIZE) break;
  }
  return rows;
}

async function main() {
  const rows = await fetchAllLeads();
  const imported = rows.filter((lead) => lead.source === IMPORT_SOURCE || lead.import_source === IMPORT_SOURCE);
  const dryRun = imported.map(buildBackfillPatch);
  const toUpdate = dryRun.filter((entry) => entry.changedFields.length > 0);
  const manualReview = dryRun.filter((entry) => entry.manualReview);

  const emailGroups = groupBy(rows, (lead) => normalizeEmail(lead.email));
  const phoneGroups = groupBy(rows, (lead) => normalizePhone(lead.phone));
  const businessLocationGroups = groupBy(rows, (lead) => {
    const business = normalizeBusinessName(lead.business_name);
    const city = clean(lead.city).toLowerCase();
    const state = clean(lead.state).toLowerCase();
    return business && city && state ? `${business}|${city}|${state}` : "";
  });
  const websiteGroups = groupBy(rows, (lead) => normalizeDomain(lead.website_url || lead.website));

  const duplicateSummary = [
    ...summarizeDuplicateGroups(emailGroups, "email"),
    ...summarizeDuplicateGroups(phoneGroups, "phone"),
    ...summarizeDuplicateGroups(websiteGroups, "website"),
    ...summarizeDuplicateGroups(businessLocationGroups, "business_city_state"),
  ];

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputDir = path.resolve("private-data", "crm-launch-repair", timestamp);
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, "leads-backup.json"), JSON.stringify(rows, null, 2));
  await writeFile(path.join(outputDir, "backfill-dry-run.json"), JSON.stringify(dryRun, null, 2));
  await writeFile(path.join(outputDir, "dedupe-dry-run-redacted.json"), JSON.stringify(duplicateSummary, null, 2));

  const summary = {
    output_dir: outputDir,
    total_leads: rows.length,
    imported_source: IMPORT_SOURCE,
    imported_count: imported.length,
    backfill: {
      would_update: toUpdate.length,
      would_skip: imported.length - toUpdate.length,
      manual_review_required: manualReview.length,
      changed_fields: countBy(toUpdate.flatMap((entry) => entry.changedFields), (field) => field),
      crm_stage_after: countBy(imported, (lead) => stageFor(lead)),
      industry_after: countBy(imported, (lead) => inferIndustry(lead).industry),
      missing_email: imported.filter((lead) => !clean(lead.email)).length,
      missing_phone: imported.filter((lead) => !clean(lead.phone)).length,
      missing_website: imported.filter((lead) => !clean(lead.website_url || lead.website)).length,
      missing_industry: imported.filter((lead) => !clean(lead.industry || lead.business_type)).length,
    },
    dedupe: {
      duplicate_email_groups: emailGroups.length,
      duplicate_phone_groups: phoneGroups.length,
      duplicate_website_groups: websiteGroups.length,
      duplicate_business_city_state_groups: businessLocationGroups.length,
      high_confidence_groups: duplicateSummary.filter((group) => group.high_confidence).length,
      manual_review_groups: duplicateSummary.filter((group) => !group.high_confidence).length,
    },
  };

  await writeFile(path.join(outputDir, "summary.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ error: error.message }, null, 2));
  process.exit(1);
});
