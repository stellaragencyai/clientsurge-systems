import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

const APP_ID = "69dc4a79656fdba136d413d3";
const API_ROOT = `https://base44.app/api/apps/${APP_ID}`;
const FUNCTION_ROOT = `${API_ROOT}/functions`;
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

function unwrapRecord(payload) {
  if (payload?.data && typeof payload.data === "object") return payload.data;
  if (payload?.lead && typeof payload.lead === "object") return payload.lead;
  return payload;
}

async function apiFetch(path, { method = "GET", body, origin } = {}) {
  const token = await getAccessToken();
  const response = await fetch(`${API_ROOT}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-App-Id": APP_ID,
      ...(origin ? { Origin: origin } : {}),
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

async function invokeFunction(functionName, body) {
  const token = await getAccessToken();
  const response = await fetch(`${FUNCTION_ROOT}/${functionName}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-App-Id": APP_ID,
      Origin: "https://clientsurgesystems.com",
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let payload = text;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    // Keep raw body for diagnostics.
  }
  if (!response.ok) {
    throw new Error(`Function ${functionName} failed ${response.status}: ${JSON.stringify(payload).slice(0, 500)}`);
  }
  return payload;
}

async function getLeadRecord(leadId, label) {
  const payload = await apiFetch(`/entities/Leads/${leadId}`);
  const record = unwrapRecord(payload);
  if (!record?.id) {
    throw new Error(`${label} did not resolve to a Leads CRM record: ${JSON.stringify(payload).slice(0, 500)}`);
  }
  return record;
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, got ${actual}`);
}

async function smokeIndustry(industry, index, runId) {
  const now = new Date().toISOString();
  const phoneSuffix = `${String(index).padStart(2, "0")}${Date.now().toString().slice(-6)}`;
  const intake = await invokeFunction("submitLeadCapture", {
      full_name: `CRM Smoke ${industry}`,
      business_name: `ClientSurge CRM Smoke ${industry} ${runId}`,
      email: `crm-smoke+${industry}-${runId}@clientsurge.test`,
      phone: `555${phoneSuffix}`,
      business_website_url: `https://crm-smoke-${industry}.example.com`,
      business_type: industry,
      problem: "QA launch smoke record only; do not contact.",
      source: "crm_live_smoke_test",
      source_page: `/${industry}`,
      service_interest: "growth_system",
      industry_slug: industry,
      industry_tags: [industry],
      consent_given: false,
      consent_source: "crm_live_smoke_test",
      consent_text_version: "crm_launch_smoke_v1",
      utm_source: "crm_smoke",
      utm_medium: "qa",
      utm_campaign: runId,
      message: `CRM launch smoke test ${runId}. Test data only. Created ${now}.`,
      website_url: "",
  });

  const leadId = intake.crm_lead_id || intake.lead_id;
  if (!leadId) {
    throw new Error(`submitLeadCapture returned no CRM lead id for ${industry}: ${JSON.stringify(intake).slice(0, 500)}`);
  }
  await getLeadRecord(leadId, `${industry} submitLeadCapture lead_id`);

  await apiFetch(`/entities/Leads/${leadId}`, {
    method: "PUT",
    body: {
      city: "Phoenix",
      state: "AZ",
      do_not_contact: true,
      outreach_status: "do_not_contact",
      notes: `CRM launch smoke test ${runId}. Test data only. Created ${now}.`,
    },
  });

  for (const stage of STAGES_TO_VERIFY) {
    const payload = {
      lead_id: leadId,
      crm_stage: stage,
      note: `CRM launch smoke test ${runId}. Verified stage ${stage}. Test data only.`,
    };
    if (stage === "Contacted") {
      payload.status = "Contacted";
    }
    if (stage === "Replied") {
      payload.status = "Replied";
    }
    if (stage === "Audit Booked") {
      payload.status = "Booked";
    }
    if (stage === "Won") {
      payload.status = "Closed";
    }
    if (stage === "Lost") {
      payload.status = "Closed";
    }
    if (stage === "Follow Up Later") {
      payload.status = "Contacted";
      payload.follow_up_date = new Date(Date.now() + 7 * 86400_000).toISOString();
    }
    await invokeFunction("updateLeadStatus", payload);
  }

  await apiFetch(`/entities/Leads/${leadId}`, {
    method: "PUT",
    body: {
      do_not_contact: true,
      outreach_status: "do_not_contact",
      email_unsubscribed: true,
    },
  });

  const final = unwrapRecord(await apiFetch(`/entities/Leads/${leadId}`));
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
  const runId = `${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 17)}-${Math.random().toString(36).slice(2, 8)}`;
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
