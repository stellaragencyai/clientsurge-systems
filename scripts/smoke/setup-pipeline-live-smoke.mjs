import fs from "node:fs";
import path from "node:path";

const BASE_URL = (process.env.CLIENTSURGE_BASE_URL || process.env.BASE_URL || "https://clientsurgesystems.com").replace(/\/$/, "");
const ORDER_ID = process.env.TEST_ORDER_ID || process.env.CLIENTSURGE_TEST_ORDER_ID || "";
const SETUP_TOKEN = process.env.TEST_SETUP_TOKEN || process.env.CLIENTSURGE_TEST_SETUP_TOKEN || "";
const REPORT_PATH = process.env.REPORT_PATH || "reports/setup-pipeline-live-smoke.json";

const checks = [];

async function checkRoute(name, url, expect = [200, 301, 302, 401, 403]) {
  const started = Date.now();
  try {
    const response = await fetch(url, { redirect: "manual" });
    const ms = Date.now() - started;
    const ok = expect.includes(response.status);
    checks.push({ name, url, status: response.status, ok, ms });
  } catch (error) {
    checks.push({ name, url, ok: false, error: error.message, ms: Date.now() - started });
  }
}

const credentialsUrl = ORDER_ID
  ? `${BASE_URL}/setup/credentials?order_id=${encodeURIComponent(ORDER_ID)}${SETUP_TOKEN ? `&token=${encodeURIComponent(SETUP_TOKEN)}` : ""}`
  : `${BASE_URL}/setup/credentials`;

await checkRoute("home", `${BASE_URL}/`, [200]);
await checkRoute("credentials-route", credentialsUrl);
if (ORDER_ID) await checkRoute("setup-status-route", `${BASE_URL}/setup/status/${encodeURIComponent(ORDER_ID)}`);
await checkRoute("client-portal-route", `${BASE_URL}/client-portal`);
await checkRoute("admin-broken-flows-route", `${BASE_URL}/admin/broken-flows`);
await checkRoute("admin-publish-drift-route", `${BASE_URL}/admin/publish-drift`);

const report = {
  checked_at: new Date().toISOString(),
  base_url: BASE_URL,
  order_id_supplied: Boolean(ORDER_ID),
  setup_token_supplied: Boolean(SETUP_TOKEN),
  ok: checks.every((check) => check.ok),
  checks,
};

fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

if (!report.ok) {
  console.error("Live setup pipeline smoke failed:");
  for (const check of checks.filter((item) => !item.ok)) {
    console.error(`- ${check.name}: ${check.status || check.error} ${check.url}`);
  }
  console.error(`Report written to ${REPORT_PATH}`);
  process.exit(1);
}

console.log(`Live setup pipeline smoke passed. Report written to ${REPORT_PATH}`);
