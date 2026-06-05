import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

const APP_ID = "69dc4a79656fdba136d413d3";
const API_ROOT = `https://base44.app/api/apps/${APP_ID}`;
const IMPORT_SOURCE = "lead_dashboard_5378_2026_05_29";
const PAGE_SIZE = 5000;
const DEFAULT_CONCURRENCY = 2;
const DEFAULT_MAX_RETRIES = 8;

function parseArgs() {
  return {
    apply: process.argv.includes("--apply"),
    confirmBackup: process.argv.includes("--confirm-backup"),
    dedupeMark: process.argv.includes("--dedupe-mark"),
    limit: Number(process.argv.find((arg) => arg.startsWith("--limit="))?.split("=")[1] || 0),
    concurrency: Number(process.argv.find((arg) => arg.startsWith("--concurrency="))?.split("=")[1] || DEFAULT_CONCURRENCY),
    maxRetries: Number(process.argv.find((arg) => arg.startsWith("--max-retries="))?.split("=")[1] || DEFAULT_MAX_RETRIES),
  };
}

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value) {
  return clean(value).toLowerCase();
}

function normalizePhone(value) {
  const digits = clean(value).replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
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
  if (Array.isArray(next)) return JSON.stringify(current || []) !== JSON.stringify(next);
  return (current ?? "") !== (next ?? "");
}

function dedupePatchNeeded(row = {}, patch = {}) {
  if (patch.dedupe_status === "keeper") {
    const currentMerged = new Set(Array.isArray(row.dedupe_merged_ids) ? row.dedupe_merged_ids : []);
    const nextMerged = Array.isArray(patch.dedupe_merged_ids) ? patch.dedupe_merged_ids : [];
    return row.dedupe_status !== "keeper" || nextMerged.some((id) => !currentMerged.has(id));
  }

  if (patch.dedupe_status === "duplicate_candidate") {
    return (
      row.dedupe_status !== "duplicate_candidate" ||
      row.dedupe_duplicate_of !== patch.dedupe_duplicate_of ||
      row.dedupe_group_key !== patch.dedupe_group_key ||
      row.crm_stage !== patch.crm_stage ||
      row.outreach_status !== patch.outreach_status ||
      row.do_not_contact !== true
    );
  }

  return Object.entries(patch).some(([field, value]) => shouldPatch(row[field], value));
}

function buildBackfillPatch(lead) {
  const inferred = inferIndustry(lead);
  const patch = {
    crm_stage: stageFor(lead),
    industry: inferred.industry,
    crm_tag: clean(lead.crm_tag) || inferred.industry,
    page_submitted_from: clean(lead.page_submitted_from) || clean(lead.source_page) || IMPORT_SOURCE,
    source_history: sourceHistoryFor(lead),
    website_url: clean(lead.website_url) || clean(lead.website),
    owner_contact_name: clean(lead.owner_contact_name) || clean(lead.full_name),
    city: clean(lead.city),
    state: clean(lead.state),
    lead_score: Number.isFinite(Number(lead.lead_score)) ? Number(lead.lead_score) : 0,
    outreach_status: clean(lead.outreach_status) || "not_contacted",
  };
  return Object.fromEntries(Object.entries(patch).filter(([field, value]) => shouldPatch(lead[field], value)));
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
  ].filter(Boolean).length + (Number(lead.lead_score) || 0) / 100;
}

function groupBy(rows, keyFn) {
  const map = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return [...map.entries()].filter(([, group]) => group.length > 1);
}

function buildDedupePlans(rows) {
  const activeRows = rows.filter(
    (lead) => lead.dedupe_status !== "duplicate_candidate" &&
      !lead.dedupe_duplicate_of &&
      lead.crm_stage !== "Lost" &&
      lead.outreach_status !== "do_not_contact"
  );
  const groups = [
    ...groupBy(activeRows, (lead) => normalizeEmail(lead.email)).map(([key, group]) => ({ type: "email", key, group })),
    ...groupBy(activeRows, (lead) => normalizePhone(lead.phone)).map(([key, group]) => ({ type: "phone", key, group })),
    ...groupBy(activeRows, (lead) => normalizeDomain(lead.website_url || lead.website)).map(([key, group]) => ({ type: "website", key, group })),
    ...groupBy(activeRows, (lead) => {
      const business = normalizeBusinessName(lead.business_name);
      const city = clean(lead.city).toLowerCase();
      const state = clean(lead.state).toLowerCase();
      return business && city && state ? `${business}|${city}|${state}` : "";
    }).map(([key, group]) => ({ type: "business_city_state", key, group, manualReview: true })),
  ];

  const keeperMergedIds = new Map();
  const duplicatePatches = new Map();
  const markedAt = new Date().toISOString();

  for (const candidate of groups) {
    if (candidate.manualReview) continue;
    const keeperPool = candidate.group.filter(
      (lead) => lead.dedupe_status !== "duplicate_candidate" && !lead.dedupe_duplicate_of && lead.crm_stage !== "Lost"
    );
    const sorted = [...(keeperPool.length > 0 ? keeperPool : candidate.group)].sort((a, b) => {
      const diff = completenessScore(b) - completenessScore(a);
      if (diff) return diff;
      return new Date(b.updated_date || b.created_date || 0) - new Date(a.updated_date || a.created_date || 0);
    });
    const keeper = sorted[0];
    if (!keeper?.id) continue;
    if (!keeperMergedIds.has(keeper.id)) keeperMergedIds.set(keeper.id, new Set(keeper.dedupe_merged_ids || []));
    for (const dupe of candidate.group.filter((lead) => lead.id !== keeper.id)) {
      if (!dupe.id || dupe.order_id || dupe.client_id || dupe.crm_stage === "Won") continue;
      keeperMergedIds.get(keeper.id).add(dupe.id);
      if (duplicatePatches.has(dupe.id)) continue;
      duplicatePatches.set(dupe.id, {
        crm_stage: "Lost",
        outreach_status: "do_not_contact",
        do_not_contact: true,
        dedupe_status: "duplicate_candidate",
        dedupe_duplicate_of: keeper.id,
        dedupe_group_key: `${candidate.type}:${candidate.key}`,
        dedupe_marked_at: markedAt,
        notes: [
          dupe.notes || "",
          `[Deduped ${markedAt}]: non-destructively marked duplicate candidate of ${keeper.id}`,
        ].filter(Boolean).join("\n"),
      });
    }
  }

  const keeperPatches = [...keeperMergedIds.entries()].map(([id, mergedIds]) => ({
    id,
    patch: {
      dedupe_status: "keeper",
      dedupe_merged_ids: [...mergedIds],
      dedupe_marked_at: markedAt,
    },
  }));
  const dupePatches = [...duplicatePatches.entries()].map(([id, patch]) => ({ id, patch }));
  return { groups, keeperPatches, dupePatches };
}

function countBy(rows, resolver) {
  const counts = {};
  for (const row of rows) {
    const key = resolver(row) || "missing";
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]));
}

function readCliAuth() {
  const authPath = path.resolve(homedir(), ".base44/auth/auth.json");
  if (!existsSync(authPath)) throw new Error("Base44 CLI auth is missing. Run base44 login first.");
  return { authPath, auth: JSON.parse(readFileSync(authPath, "utf8")) };
}

async function getAccessToken() {
  const record = readCliAuth();
  if (Date.now() < Number(record.auth.expiresAt || 0) - 60_000) return record.auth.accessToken;
  if (!record.auth.refreshToken) return record.auth.accessToken;
  const body = new URLSearchParams();
  body.set("grant_type", "refresh_token");
  body.set("refresh_token", record.auth.refreshToken);
  body.set("client_id", "base44_cli");
  const response = await fetch("https://app.base44.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const payload = await response.json();
  if (!response.ok) return record.auth.accessToken;
  const refreshed = {
    ...record.auth,
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token || record.auth.refreshToken,
    expiresAt: Date.now() + Number(payload.expires_in || 0) * 1000,
  };
  writeFileSync(record.authPath, `${JSON.stringify(refreshed, null, 2)}\n`, "utf8");
  return refreshed.accessToken;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function apiFetch(pathname, { method = "GET", body, maxRetries = DEFAULT_MAX_RETRIES } = {}) {
  const token = await getAccessToken();

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const response = await fetch(`${API_ROOT}${pathname}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-App-Id": APP_ID,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    let payload = text;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      // Keep raw body for diagnostics.
    }
    if (response.ok) return payload;

    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === maxRetries) {
      throw new Error(`${method} ${pathname} failed ${response.status}: ${JSON.stringify(payload).slice(0, 500)}`);
    }

    const retryAfter = Number(response.headers.get("retry-after") || 0);
    const backoffMs = retryAfter > 0
      ? retryAfter * 1000
      : Math.min(30000, 1000 * 2 ** attempt) + Math.floor(Math.random() * 500);
    await sleep(backoffMs);
  }

  throw new Error(`${method} ${pathname} failed after retries`);
}

async function fetchAllLeads() {
  const rows = [];
  for (let skip = 0; ; skip += PAGE_SIZE) {
    const page = await apiFetch(`/entities/Leads?limit=${PAGE_SIZE}&skip=${skip}`);
    rows.push(...page);
    if (!Array.isArray(page) || page.length < PAGE_SIZE) break;
  }
  return rows;
}

async function runLimited(items, concurrency, worker) {
  let index = 0;
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (index < items.length) {
      const current = items[index++];
      await worker(current);
    }
  });
  await Promise.all(workers);
}

async function main() {
  const args = parseArgs();
  if (args.apply && !args.confirmBackup) {
    throw new Error("Refusing to apply without --confirm-backup. The script writes a full backup before changes.");
  }

  const rows = await fetchAllLeads();
  const imported = rows.filter((lead) => lead.source === IMPORT_SOURCE || lead.import_source === IMPORT_SOURCE);
  const backfillPlans = imported
    .map((lead) => ({ id: lead.id, patch: buildBackfillPatch(lead) }))
    .filter((plan) => Object.keys(plan.patch).length > 0);
  const dedupe = buildDedupePlans(rows);
  const rowById = new Map(rows.map((row) => [row.id, row]));
  const dedupeKeeperPatches = dedupe.keeperPatches.filter(({ id, patch }) => {
    return dedupePatchNeeded(rowById.get(id), patch);
  });
  const dedupeDupePatches = dedupe.dupePatches.filter(({ id, patch }) => {
    return dedupePatchNeeded(rowById.get(id), patch);
  });

  const selectedBackfill = args.limit > 0 ? backfillPlans.slice(0, args.limit) : backfillPlans;
  const selectedKeeperPatches = args.limit > 0 ? dedupeKeeperPatches.slice(0, args.limit) : dedupeKeeperPatches;
  const selectedDupePatches = args.limit > 0 ? dedupeDupePatches.slice(0, args.limit) : dedupeDupePatches;

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputDir = path.resolve("private-data", "crm-launch-repair", timestamp);
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, "leads-backup.json"), JSON.stringify(rows, null, 2));
  await writeFile(path.join(outputDir, "backfill-apply-plan.json"), JSON.stringify(backfillPlans, null, 2));
  await writeFile(path.join(outputDir, "dedupe-mark-plan.json"), JSON.stringify({
    keeperPatches: dedupeKeeperPatches,
    dupePatches: dedupeDupePatches,
  }, null, 2));

  let backfillApplied = 0;
  let dedupeKeeperApplied = 0;
  let dedupeDuplicateApplied = 0;

  if (args.apply) {
    await runLimited(selectedBackfill, args.concurrency, async ({ id, patch }) => {
      await apiFetch(`/entities/Leads/${id}`, { method: "PUT", body: patch, maxRetries: args.maxRetries });
      backfillApplied++;
    });
    if (args.dedupeMark) {
      await runLimited(selectedKeeperPatches, args.concurrency, async ({ id, patch }) => {
        await apiFetch(`/entities/Leads/${id}`, { method: "PUT", body: patch, maxRetries: args.maxRetries });
        dedupeKeeperApplied++;
      });
      await runLimited(selectedDupePatches, args.concurrency, async ({ id, patch }) => {
        await apiFetch(`/entities/Leads/${id}`, { method: "PUT", body: patch, maxRetries: args.maxRetries });
        dedupeDuplicateApplied++;
      });
    }
  }

  const summary = {
    ok: true,
    mode: args.apply ? "applied" : "plan_only",
    output_dir: outputDir,
    total_leads: rows.length,
    imported_source: IMPORT_SOURCE,
    imported_count: imported.length,
    backfill: {
      planned_updates: backfillPlans.length,
      applied_updates: backfillApplied,
      changed_fields: countBy(backfillPlans.flatMap((plan) => Object.keys(plan.patch)), (field) => field),
      crm_stage_after: countBy(imported, (lead) => stageFor(lead)),
      industry_after: countBy(imported, (lead) => inferIndustry(lead).industry),
    },
    dedupe: {
      duplicate_groups: dedupe.groups.length,
      keeper_marks_planned: dedupeKeeperPatches.length,
      duplicate_marks_planned: dedupeDupePatches.length,
      keeper_marks_applied: dedupeKeeperApplied,
      duplicate_marks_applied: dedupeDuplicateApplied,
      destructive_delete_used: false,
      applied: args.apply && args.dedupeMark,
    },
  };
  await writeFile(path.join(outputDir, "summary.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exit(1);
});
