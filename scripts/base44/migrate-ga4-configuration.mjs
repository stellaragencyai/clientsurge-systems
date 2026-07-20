import process from "node:process";

const APP_ID = process.env.BASE44_APP_ID || "69dc4a79656fdba136d413d3";
const BASE44_ORIGIN = "https://app.base44.com";
const MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID || "G-H6QT342ZN9";

const TRACKED_EVENTS = [
  "page_view",
  "scroll",
  "scroll_depth",
  "cta_click",
  "pricing_view",
  "link_click",
  "form_submit_attempt",
  "form_submit",
  "generate_lead",
  "contact_form_submit",
  "audit_request_started",
  "audit_request_submitted",
  "begin_checkout",
  "purchase",
  "purchase_client_confirmation",
  "demo_booked",
  "onboarding_complete",
];

const CONVERSION_EVENTS = [
  "generate_lead",
  "begin_checkout",
  "purchase",
  "demo_booked",
];

function readAuth() {
  const raw = process.env.BASE44_AUTH_JSON || process.env.BASE_44_AUTH_JSON;
  if (!raw) {
    throw new Error("Missing GitHub secret BASE44_AUTH_JSON (or BASE_44_AUTH_JSON).");
  }

  const parsed = JSON.parse(raw);
  const auth = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!auth || typeof auth !== "object") throw new Error("Base44 auth JSON is invalid.");
  return auth;
}

async function resolveAccessToken(auth) {
  const accessToken = auth.accessToken;
  if (!accessToken) throw new Error("Base44 auth JSON does not contain accessToken.");

  if (Date.now() < Number(auth.expiresAt || 0) - 60_000) return accessToken;
  if (!auth.refreshToken) return accessToken;

  const form = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: auth.refreshToken,
    client_id: "base44_cli",
  });

  const response = await fetch(`${BASE44_ORIGIN}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.access_token) {
    throw new Error(`Unable to refresh Base44 authentication (HTTP ${response.status}).`);
  }
  return result.access_token;
}

async function main() {
  const auth = readAuth();
  const token = await resolveAccessToken(auth);
  const endpoint = `${BASE44_ORIGIN}/api/apps/${APP_ID}/functions/setupGA4Configuration`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "ClientSurge GitHub GA4 migration",
    },
    body: JSON.stringify({
      measurement_id: MEASUREMENT_ID,
      enabled: true,
      enhanced_measurement_enabled: true,
      tracked_events: TRACKED_EVENTS,
      conversion_events: CONVERSION_EVENTS,
    }),
  });

  const text = await response.text();
  let result;
  try {
    result = JSON.parse(text);
  } catch {
    result = { raw: text.slice(0, 1000) };
  }

  const data = result?.data && typeof result.data === "object" ? result.data : result;
  if (!response.ok || data?.success !== true) {
    throw new Error(`GA4 migration failed (HTTP ${response.status}): ${JSON.stringify(data)}`);
  }

  if (data.legacy_secret_detected && !data.legacy_secret_scrubbed) {
    throw new Error("Legacy GA4 secret was detected but not fully scrubbed.");
  }

  const config = data.config || {};
  const expectedConversions = CONVERSION_EVENTS.join(",");
  const actualConversions = Array.isArray(config.conversion_events) ? config.conversion_events.join(",") : "";
  const expectedTracked = TRACKED_EVENTS.join(",");
  const actualTracked = Array.isArray(config.tracked_events) ? config.tracked_events.join(",") : "";
  if (
    config.measurement_id !== MEASUREMENT_ID ||
    config.setup_status !== "configured" ||
    config.enabled !== true ||
    config.enhanced_measurement_enabled !== true ||
    config.server_side_tracking_enabled === true ||
    config.last_verified_at ||
    actualConversions !== expectedConversions ||
    actualTracked !== expectedTracked ||
    data.record_count !== 1 ||
    data.legacy_secret_scrubbed !== true ||
    data.clean !== true
  ) {
    throw new Error(`GA4 migration returned an unexpected configuration: ${JSON.stringify(config)}`);
  }

  console.log(JSON.stringify({
    success: true,
    measurement_id: config.measurement_id,
    setup_status: config.setup_status,
    record_count: data.record_count,
    legacy_secret_detected: data.legacy_secret_detected,
    legacy_secret_scrubbed: data.legacy_secret_scrubbed,
    tracked_events: config.tracked_events,
    conversion_events: config.conversion_events,
    server_side_tracking_enabled: config.server_side_tracking_enabled,
    last_verified_at: config.last_verified_at || null,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
