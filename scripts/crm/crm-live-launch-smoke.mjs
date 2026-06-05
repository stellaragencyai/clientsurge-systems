import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

const APP_ID = "69dc4a79656fdba136d413d3";
const API_ROOT = `https://base44.app/api/apps/${APP_ID}`;
const STAGES_TO_VERIFY = [
  "Not Contacted",
  "Contacted",
  "Opened / Clicked",
  "Replied",
  "Audit Booked",
  "Audit Completed",
  "Proposal Sent",
  "Won",
  "Lost",
  "Follow Up Later",
];

function readCliAuth() {
  const authPath = resolve(homedir(), ".base44/auth/auth.json");
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

async function apiFetch(path, { method = "GET", body } = {}) {
  const token = await getAccessToken();
  const response = await fetch(`${API_ROOT}${path}`, {
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
  if (!response.ok) {
    throw new Error(`${method} ${path} failed ${response.status}: ${JSON.stringify(payload).slice(0, 500)}`);
  }
  return payload;
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, got ${actual}`);
}

async function smokeIndustry(industry, index, runId) {
  const now = new Date().toISOString();
  const lead = await apiFetch("/entities/Leads", {
    method: "POST",
    body: {
      full_name: `CRM Smoke ${industry}`,
      owner_contact_name: `CRM Smoke ${industry}`,
      business_name: `ClientSurge CRM Smoke ${industry} ${runId}`,
      email: `crm-smoke+${industry}-${runId}@clientsurge.test`,
      phone: `+1555010${String(index).padStart(3, "0")}`,
      website_url: `https://crm-smoke-${industry}.example.com`,
      website: `https://crm-smoke-${industry}.example.com`,
      business_type: industry,
      industry,
      city: "Phoenix",
      state: "AZ",
      problem: "QA launch smoke record only; do not contact.",
      source: "crm_live_smoke_test",
      source_history: ["crm_live_smoke_test", `page:/${industry}`],
      page_submitted_from: `/${industry}`,
      package_interest: "growth_system",
      crm_tag: industry,
      industry_tags: [industry],
      lead_score: 1,
      status: "New",
      crm_stage: "Not Contacted",
      outreach_status: "not_contacted",
      do_not_contact: true,
      notes: `CRM launch smoke test ${runId}. Test data only. Created ${now}.`,
      import_source: "crm_live_smoke_test",
      consent_given: false,
    },
  });

  const leadId = lead.id;
  if (!leadId) throw new Error(`Create returned no id for ${industry}`);

  for (const stage of STAGES_TO_VERIFY) {
    const patch = {
      crm_stage: stage,
      last_activity_at: new Date().toISOString(),
      do_not_contact: true,
      notes: `CRM launch smoke test ${runId}. Verified stage ${stage}. Test data only.`,
    };
    if (stage === "Contacted") {
      patch.status = "Contacted";
      patch.outreach_status = "contacted";
      patch.last_contacted_date = new Date().toISOString();
    }
    if (stage === "Replied") {
      patch.status = "Replied";
      patch.outreach_status = "replied";
    }
    if (stage === "Audit Booked") {
      patch.status = "Booked";
      patch.outreach_status = "booked";
      patch.booked_at = new Date().toISOString();
    }
    if (stage === "Won") patch.payment_source = "manual_payment";
    if (stage === "Lost" || stage === "Follow Up Later") patch.outreach_status = "do_not_contact";
    if (stage === "Follow Up Later") patch.follow_up_date = new Date(Date.now() + 7 * 86400_000).toISOString();
    await apiFetch(`/entities/Leads/${leadId}`, { method: "PUT", body: patch });
  }

  const final = await apiFetch(`/entities/Leads/${leadId}`);
  assertEqual(final.industry, industry, `${industry} industry`);
  assertEqual(final.crm_tag, industry, `${industry} crm_tag`);
  assertEqual(final.crm_stage, "Follow Up Later", `${industry} final crm_stage`);
  assertEqual(final.outreach_status, "do_not_contact", `${industry} outreach_status`);
  assertEqual(final.do_not_contact, true, `${industry} do_not_contact`);
  for (const field of [
    "business_name",
    "owner_contact_name",
    "email",
    "phone",
    "website_url",
    "industry",
    "city",
    "state",
    "source",
    "lead_score",
    "outreach_status",
    "last_contacted_date",
    "follow_up_date",
    "notes",
    "page_submitted_from",
    "package_interest",
    "crm_tag",
    "created_date",
    "updated_date",
  ]) {
    if (final[field] === undefined || final[field] === null || final[field] === "") {
      throw new Error(`${industry} missing live field ${field}`);
    }
  }

  return {
    industry,
    lead_id: leadId,
    crm_stage: final.crm_stage,
    crm_tag: final.crm_tag,
    outreach_status: final.outreach_status,
    do_not_contact: final.do_not_contact,
  };
}

async function main() {
  const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const results = [];
  for (const [index, industry] of ["roofing", "hvac", "dental"].entries()) {
    results.push(await smokeIndustry(industry, index + 1, runId));
  }

  console.log(JSON.stringify({
    ok: true,
    run_id: runId,
    app_id: APP_ID,
    records_created: results.length,
    results,
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exit(1);
});
