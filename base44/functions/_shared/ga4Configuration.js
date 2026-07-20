export const GA4_MEASUREMENT_ID = "G-H6QT342ZN9";

export const GA4_TRACKED_EVENTS = Object.freeze([
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
]);

export const GA4_KEY_EVENTS = Object.freeze([
  "generate_lead",
  "begin_checkout",
  "purchase",
  "demo_booked",
]);

export function isAdmin(user) {
  return user?.role === "admin" || user?.role === "super_admin";
}

export function cleanString(value, maxLength = 200) {
  return String(value || "").trim().slice(0, maxLength);
}

export function containsLegacySecret(record) {
  return typeof record?.api_secret === "string" && record.api_secret.trim().length > 0;
}

export function payloadContainsApiSecret(value, seen = new Set()) {
  if (!value || typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);

  for (const [key, child] of Object.entries(value)) {
    if (String(key).toLowerCase() === "api_secret") return true;
    if (payloadContainsApiSecret(child, seen)) return true;
  }
  return false;
}

export function missingEvents(actual, expected) {
  const actualSet = new Set(Array.isArray(actual) ? actual.map((eventName) => String(eventName || "").trim()) : []);
  return expected.filter((eventName) => !actualSet.has(eventName));
}

export function parseGa4Evidence(notes) {
  const text = cleanString(notes, 4000);
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    const verificationId = text.match(/Verification ID:\s*([a-f0-9-]+)/i)?.[1] || "";
    return verificationId ? { verification_id: verificationId } : null;
  }
}

export function verifyGa4RecordIntegrity(records, measurementId = GA4_MEASUREMENT_ID) {
  const list = Array.isArray(records) ? records : [];
  const config = list[0] || null;
  const missingTrackedEvents = missingEvents(config?.tracked_events, GA4_TRACKED_EVENTS);
  const missingKeyEvents = missingEvents(config?.conversion_events, GA4_KEY_EVENTS);
  const legacySecretRecordIds = list
    .filter(containsLegacySecret)
    .map((record) => cleanString(record?.id, 80))
    .filter(Boolean);

  const details = {
    record_count: list.length,
    record_count_ok: list.length === 1,
    measurement_id_ok: config?.measurement_id === measurementId,
    enabled_ok: config?.enabled === true,
    enhanced_measurement_enabled_ok: config?.enhanced_measurement_enabled === true,
    no_legacy_secret: legacySecretRecordIds.length === 0,
    canonical_tracked_events: missingTrackedEvents.length === 0,
    canonical_key_events: missingKeyEvents.length === 0,
    missing_tracked_events: missingTrackedEvents,
    missing_key_events: missingKeyEvents,
    legacy_secret_record_ids: legacySecretRecordIds,
    setup_status: config?.setup_status || "",
    server_side_tracking_enabled: config?.server_side_tracking_enabled === true,
    last_verified_at: config?.last_verified_at || null,
  };

  return {
    ...details,
    passed: Boolean(
      config &&
        details.record_count_ok &&
        details.measurement_id_ok &&
        details.enabled_ok &&
        details.enhanced_measurement_enabled_ok &&
        details.no_legacy_secret &&
        details.canonical_tracked_events &&
        details.canonical_key_events
    ),
  };
}

export function summarizeGa4Records(records, measurementId = GA4_MEASUREMENT_ID) {
  const list = Array.isArray(records) ? records : [];
  const config = list[0] || null;
  const integrity = verifyGa4RecordIntegrity(list, measurementId);
  const evidence = parseGa4Evidence(config?.notes);
  const operationallyVerified = Boolean(
    integrity.passed &&
      config?.setup_status === "active" &&
      config?.server_side_tracking_enabled === true &&
      config?.last_verified_at
  );

  return {
    config,
    record_count: list.length,
    has_legacy_secret: !integrity.no_legacy_secret,
    canonical_tracked_events: integrity.canonical_tracked_events,
    canonical_key_events: integrity.canonical_key_events,
    missing_tracked_events: integrity.missing_tracked_events,
    missing_key_events: integrity.missing_key_events,
    enabled: config?.enabled === true,
    enhanced_measurement_enabled: config?.enhanced_measurement_enabled === true,
    setup_status: config?.setup_status || "not_configured",
    server_side_tracking_enabled: config?.server_side_tracking_enabled === true,
    last_verified_at: config?.last_verified_at || null,
    operationally_verified: operationallyVerified,
    verification_id: evidence?.verification_id || null,
    production_site_health: evidence?.production_site?.passed ?? null,
    measurement_protocol_validation_status: evidence?.measurement_protocol_debug?.passed ?? null,
    measurement_protocol_delivery_status: evidence?.measurement_protocol_delivery?.passed ?? null,
    clean: Boolean(
      integrity.passed &&
        (config?.setup_status === "configured" || config?.setup_status === "active")
    ),
  };
}

export async function listGa4ConfigurationRecords(base44, limit = 5000) {
  const entity = base44?.asServiceRole?.entities?.GA4Configuration;
  if (!entity) throw new Error("GA4Configuration entity API is unavailable.");
  if (typeof entity.list === "function") return entity.list("-created_date", limit);
  if (typeof entity.filter === "function") return entity.filter({}, "-created_date", limit);
  throw new Error("GA4Configuration entity does not expose list or filter.");
}

export function buildGa4SetupGuide(measurementId = GA4_MEASUREMENT_ID) {
  return `
GA4 SETUP GUIDE - ClientSurge Systems

1. WEB STREAM
Measurement ID: ${measurementId}
The browser only needs the Measurement ID. It is public configuration, not a secret.

2. SINGLE TAG INITIALIZATION
ClientSurge initializes GA4 through src/lib/ga4.js. Do not add a second gtag initialization in a page component, tag manager container, or layout.

3. SPA PAGE VIEWS
The app emits explicit page_view events for React Router navigation. Verify at least the home page, pricing, contact, book, product-signup, and order-success routes in GA4 DebugView.

4. CANONICAL EVENTS
Engagement events:
- page_view
- scroll
- scroll_depth
- cta_click
- pricing_view
- link_click
- form_submit_attempt

Successful outcomes:
- form_submit
- generate_lead
- contact_form_submit
- audit_request_started
- audit_request_submitted
- begin_checkout
- purchase (server-verified Stripe webhook only)
- purchase_client_confirmation (browser confirmation; not a key event)
- demo_booked (only after the appointment is genuinely confirmed)
- onboarding_complete

5. GA4 KEY EVENTS
In GA4 Admin, mark only these exact event names as key events:
- generate_lead
- begin_checkout
- purchase
- demo_booked

6. MEASUREMENT PROTOCOL SECRET
Server-verified Stripe purchases use GA4 Measurement Protocol. Store the API secret only as Base44 Secret GA4_API_SECRET. Never store it in GA4Configuration, frontend code, logs, or entity records.

7. VERIFICATION
A database status is not proof. The admin verifier must pass entity integrity, secret availability, Google debug validation, real Measurement Protocol delivery, production site health, and static code assertions before setup_status becomes active.
`;
}

export function buildCanonicalGa4Payload({ notes = "", setupStatus = "configured" } = {}) {
  return {
    measurement_id: GA4_MEASUREMENT_ID,
    enabled: true,
    tracked_events: [...GA4_TRACKED_EVENTS],
    conversion_events: [...GA4_KEY_EVENTS],
    enhanced_measurement_enabled: true,
    server_side_tracking_enabled: false,
    setup_status: setupStatus,
    setup_guide: buildGa4SetupGuide(GA4_MEASUREMENT_ID),
    last_verified_at: null,
    notes:
      notes ||
      "GA4 configuration repaired. Status remains configured until backend Measurement Protocol and production-site verification pass.",
  };
}

export async function repairCanonicalGa4Configuration(base44) {
  const entity = base44?.asServiceRole?.entities?.GA4Configuration;
  if (!entity) throw new Error("GA4Configuration entity API is unavailable.");

  const beforeRecords = await listGa4ConfigurationRecords(base44);
  const records = Array.isArray(beforeRecords) ? beforeRecords : [];
  const matchingRecords = records.filter((record) => record?.measurement_id === GA4_MEASUREMENT_ID);
  const reusableRecord = matchingRecords.find((record) => record?.id && !containsLegacySecret(record));
  const legacySecretDetected = records.some(containsLegacySecret);
  const payload = buildCanonicalGa4Payload();

  let config;
  let created = false;
  if (reusableRecord?.id) {
    config = await entity.update(reusableRecord.id, payload);
  } else {
    config = await entity.create(payload);
    created = true;
  }

  if (!config?.id) {
    throw new Error("GA4 repair could not resolve the canonical configuration id.");
  }

  const recordsToDelete = records.filter((record) => record?.id && record.id !== config.id);
  const deletionResults = await Promise.all(
    recordsToDelete.map(async (record) => {
      try {
        await entity.delete(record.id);
        return { id: cleanString(record.id, 80), deleted: true };
      } catch (error) {
        return {
          id: cleanString(record.id, 80),
          deleted: false,
          error: error instanceof Error ? cleanString(error.message, 180) : "delete_failed",
        };
      }
    }),
  );

  const failedDeletions = deletionResults.filter((result) => !result.deleted);
  if (failedDeletions.length > 0) {
    const error = new Error("GA4_LEGACY_SECRET_SCRUB_INCOMPLETE");
    error.details = { failed_deletions: failedDeletions };
    throw error;
  }

  const remainingRecords = await listGa4ConfigurationRecords(base44);
  const remaining = Array.isArray(remainingRecords) ? remainingRecords : [];
  const integrity = verifyGa4RecordIntegrity(remaining);
  if (remaining.length !== 1 || !integrity.passed || remaining[0]?.setup_status !== "configured" || remaining[0]?.server_side_tracking_enabled === true || remaining[0]?.last_verified_at) {
    const error = new Error("GA4_CANONICAL_CONFIGURATION_INCOMPLETE");
    error.details = { integrity };
    throw error;
  }

  return {
    success: true,
    migrated: legacySecretDetected || records.length !== 1 || created,
    created,
    config: remaining[0],
    config_id: remaining[0]?.id || config.id,
    before_record_count: records.length,
    record_count: remaining.length,
    duplicate_count_before: Math.max(0, records.length - 1),
    duplicate_records_deleted: deletionResults.filter((result) => result.deleted).length,
    legacy_secret_detected: legacySecretDetected,
    legacy_secret_scrubbed: !remaining.some(containsLegacySecret),
    canonical_tracked_events: integrity.canonical_tracked_events,
    canonical_key_events: integrity.canonical_key_events,
    setup_status: remaining[0]?.setup_status || "configured",
    server_side_tracking_enabled: remaining[0]?.server_side_tracking_enabled === true,
    last_verified_at: remaining[0]?.last_verified_at || null,
    clean: true,
    integrity,
  };
}
