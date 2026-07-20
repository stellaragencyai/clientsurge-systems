import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const GA4_MEASUREMENT_ID = "G-H6QT342ZN9";
const MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]{4,}$/i;

const GA4_TRACKED_EVENTS = Object.freeze([
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

const GA4_KEY_EVENTS = Object.freeze([
  "generate_lead",
  "begin_checkout",
  "purchase",
  "demo_booked",
]);

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Frame-Options": "DENY",
    },
  });
}

function isAdmin(user: any) {
  const roles = [
    user?.role,
    user?.user_role,
    ...(Array.isArray(user?.roles) ? user.roles : []),
    ...(Array.isArray(user?.app_roles) ? user.app_roles : []),
  ]
    .filter(Boolean)
    .map((role) => String(role).toLowerCase());
  return roles.includes("admin") || roles.includes("super_admin");
}

function cleanString(value: unknown, maxLength = 200) {
  return String(value || "").trim().slice(0, maxLength);
}

function containsLegacySecret(record: any) {
  return typeof record?.api_secret === "string" && record.api_secret.trim().length > 0;
}

function payloadContainsApiSecret(value: unknown, seen = new Set<unknown>()) {
  if (!value || typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (String(key).toLowerCase() === "api_secret") return true;
    if (payloadContainsApiSecret(child, seen)) return true;
  }
  return false;
}

function missingEvents(actual: unknown, expected: readonly string[]) {
  const actualSet = new Set(
    Array.isArray(actual) ? actual.map((eventName) => String(eventName || "").trim()) : [],
  );
  return expected.filter((eventName) => !actualSet.has(eventName));
}

function verifyGa4RecordIntegrity(records: any[], measurementId = GA4_MEASUREMENT_ID) {
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

async function listGa4ConfigurationRecords(base44: any, limit = 5000) {
  const entity = base44?.asServiceRole?.entities?.GA4Configuration;
  if (!entity) throw new Error("GA4Configuration entity API is unavailable.");
  if (typeof entity.list === "function") return entity.list("-created_date", limit);
  if (typeof entity.filter === "function") return entity.filter({}, "-created_date", limit);
  throw new Error("GA4Configuration entity does not expose list or filter.");
}

function buildGa4SetupGuide(measurementId = GA4_MEASUREMENT_ID) {
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

function buildCanonicalGa4Payload({ notes = "", setupStatus = "configured" } = {}) {
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

async function repairCanonicalGa4Configuration(base44: any) {
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
    (error as any).details = { failed_deletions: failedDeletions };
    throw error;
  }

  const remainingRecords = await listGa4ConfigurationRecords(base44);
  const remaining = Array.isArray(remainingRecords) ? remainingRecords : [];
  const integrity = verifyGa4RecordIntegrity(remaining);
  if (
    remaining.length !== 1 ||
    !integrity.passed ||
    remaining[0]?.setup_status !== "configured" ||
    remaining[0]?.server_side_tracking_enabled === true ||
    remaining[0]?.last_verified_at
  ) {
    const error = new Error("GA4_CANONICAL_CONFIGURATION_INCOMPLETE");
    (error as any).details = { integrity };
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

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!isAdmin(user)) {
      return jsonResponse({ error: "Unauthorized: admin or super_admin required" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    if (payloadContainsApiSecret(body)) {
      return jsonResponse(
        {
          error: "Do not send GA4 API secrets to this function. Store GA4_API_SECRET in Base44 Secrets and use it only from backend code.",
          code: "GA4_SECRET_MUST_USE_SECRET_STORE",
        },
        400,
      );
    }

    const requestedMeasurementId = String(body.measurement_id || GA4_MEASUREMENT_ID).trim().toUpperCase();
    if (!MEASUREMENT_ID_PATTERN.test(requestedMeasurementId)) {
      return jsonResponse({ error: "Invalid measurement_id format. Expected G-XXXXXXXXXX." }, 400);
    }
    if (requestedMeasurementId !== GA4_MEASUREMENT_ID) {
      return jsonResponse(
        {
          error: `ClientSurge GA4 must use the canonical Measurement ID ${GA4_MEASUREMENT_ID}.`,
          code: "GA4_MEASUREMENT_ID_MISMATCH",
        },
        400,
      );
    }

    const result = await repairCanonicalGa4Configuration(base44);

    return jsonResponse({
      ...result,
      secret_required_for_browser_tracking: false,
      secret_store_name: "GA4_API_SECRET",
      message: result.legacy_secret_detected
        ? "GA4 configuration saved and every duplicate or legacy secret-bearing record was deleted. Rotate any previously exposed GA4 API secret before relying on server-side tracking."
        : "GA4 configuration saved as one clean canonical record without storing any private credential in the entity.",
    });
  } catch (error) {
    console.error("[setupGA4Configuration]", error);
    const message = error instanceof Error ? error.message : "Unknown setup error";
    return jsonResponse(
      {
        success: false,
        error: message,
        code: message,
        details: error instanceof Error ? (error as any).details || null : null,
      },
      500,
    );
  }
});
