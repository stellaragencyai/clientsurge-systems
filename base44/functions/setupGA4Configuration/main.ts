import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const DEFAULT_GA4_MEASUREMENT_ID = "G-H6QT342ZN9";
const GA4_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]{4,}$/i;
const DEBUG_ENDPOINT = "https://www.google-analytics.com/debug/mp/collect";
const COLLECT_ENDPOINT = "https://www.google-analytics.com/mp/collect";
const PRODUCTION_URL = "https://clientsurgesystems.com";

const GA4_TRACKED_EVENTS = [
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
] as const;

const GA4_KEY_EVENTS = [
  "generate_lead",
  "begin_checkout",
  "purchase",
  "demo_booked",
] as const;

type Ga4Record = Record<string, any>;
type StageName =
  | "authentication"
  | "entity_cleanup"
  | "secret_validation"
  | "google_validation"
  | "production_security"
  | "final_activation";

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function failureBody(stage: StageName, error: string, extra: Record<string, unknown> = {}) {
  return {
    success: false,
    verified: false,
    stage,
    failed_stage: stage,
    error,
    ...extra,
  };
}

function isGa4Admin(user: Record<string, unknown> | null | undefined) {
  return user?.role === "admin" || user?.role === "super_admin";
}

function valuesArray(values: unknown) {
  return Array.isArray(values) ? values.map((value) => String(value || "").trim()).filter(Boolean) : [];
}

function containsLegacySecret(record: Ga4Record | null | undefined) {
  return Boolean(record && Object.prototype.hasOwnProperty.call(record, "api_secret"));
}

function missingValues(values: unknown, requiredValues: readonly string[]) {
  const present = new Set(valuesArray(values));
  return requiredValues.filter((value) => !present.has(value));
}

function buildGa4SetupGuide(measurementId = DEFAULT_GA4_MEASUREMENT_ID) {
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
- scroll / scroll_depth
- cta_click
- pricing_view
- link_click
- form_submit_attempt

Successful outcomes:
- form_submit
- generate_lead
- contact_form_submit
- audit_request_submitted
- begin_checkout
- purchase (server-verified Stripe webhook only)
- purchase_client_confirmation (browser confirmation; not a key event)
- demo_booked (only after the appointment is genuinely confirmed)

5. GA4 KEY EVENTS
In GA4 Admin -> Data display -> Key events, mark these exact event names:
- generate_lead
- begin_checkout
- purchase
- demo_booked

Do not mark page_view, scroll, cta_click, pricing_view, form_submit_attempt, contact_form_submit, audit_request_submitted, or purchase_client_confirmation as separate key events unless you intentionally want duplicate funnel counts.

6. MEASUREMENT PROTOCOL SECRET
Server-verified Stripe purchases use GA4 Measurement Protocol. Store the API secret only as Base44 Secret GA4_API_SECRET. Never store it in GA4Configuration, frontend code, logs, or entity records.

7. VERIFICATION
A database status is not proof. Confirm:
- exactly one GA4Configuration record remains;
- no GA4Configuration record contains api_secret;
- Measurement Protocol debug validation passes;
- a ga4_verification event is accepted for collection;
- the production homepage is healthy and does not expose Base44 internals;
- setup_status becomes active only after every mandatory check passes.
`.trim();
}

function canonicalGa4Payload({
  body = {},
  measurementId = DEFAULT_GA4_MEASUREMENT_ID,
  notes,
}: {
  body?: Ga4Record;
  measurementId?: string;
  notes?: string;
}) {
  return {
    measurement_id: measurementId,
    enabled: body.enabled !== false,
    tracked_events: [...GA4_TRACKED_EVENTS],
    conversion_events: [...GA4_KEY_EVENTS],
    enhanced_measurement_enabled: body.enhanced_measurement_enabled !== false,
    server_side_tracking_enabled: false,
    setup_status: "configured",
    setup_guide: buildGa4SetupGuide(measurementId),
    last_verified_at: null,
    notes: notes ||
      "Configuration repaired. Status remains configured until Google Measurement Protocol delivery and production health checks pass.",
  };
}

function summarizeGa4Records(records: Ga4Record[] = []) {
  const config = records[0] || null;
  const missingTrackedEvents = missingValues(config?.tracked_events, GA4_TRACKED_EVENTS);
  const missingKeyEvents = missingValues(config?.conversion_events, GA4_KEY_EVENTS);
  const legacySecretPresent = records.some(containsLegacySecret);
  const expectedStatus = config?.setup_status === "configured" || config?.setup_status === "active";
  const operationallyVerified = Boolean(
    config &&
      config.setup_status === "active" &&
      config.server_side_tracking_enabled === true &&
      config.last_verified_at,
  );

  return {
    config,
    record_count: records.length,
    has_legacy_secret: legacySecretPresent,
    canonical_tracked_events: missingTrackedEvents.length === 0,
    canonical_key_events: missingKeyEvents.length === 0,
    missing_tracked_events: missingTrackedEvents,
    missing_key_events: missingKeyEvents,
    operationally_verified: operationallyVerified,
    clean: Boolean(
      config &&
        records.length === 1 &&
        !legacySecretPresent &&
        config.measurement_id === DEFAULT_GA4_MEASUREMENT_ID &&
        config.enabled === true &&
        config.enhanced_measurement_enabled === true &&
        missingTrackedEvents.length === 0 &&
        missingKeyEvents.length === 0 &&
        expectedStatus,
    ),
  };
}

async function queryAllGa4Records(base44: any) {
  const records = await base44.asServiceRole.entities.GA4Configuration.list("-created_date", 100).catch(() => []);
  return Array.isArray(records) ? records : [];
}

async function deleteRecords(base44: any, records: Ga4Record[]) {
  return await Promise.all(
    records.map(async (record) => {
      try {
        await base44.asServiceRole.entities.GA4Configuration.delete(record.id);
        return { id: record.id, deleted: true };
      } catch (error) {
        return {
          id: record.id,
          deleted: false,
          error: error instanceof Error ? error.message : "Delete failed",
        };
      }
    }),
  );
}

async function repairGa4Configuration(base44: any, {
  body = {},
  measurementId = DEFAULT_GA4_MEASUREMENT_ID,
}: {
  body?: Ga4Record;
  measurementId?: string;
} = {}) {
  const existing = await queryAllGa4Records(base44);
  const payload = canonicalGa4Payload({
    body,
    measurementId,
    notes: "Configuration repaired by setupGA4Configuration. Status remains configured until live backend GA4 verification passes.",
  });
  const legacySecretDetected = existing.some(containsLegacySecret);
  const duplicateRecordsDetected = existing.length > 1;
  const reusableCanonical = existing.find(
    (record) => record?.id && record.measurement_id === measurementId && !containsLegacySecret(record),
  );

  let config: Ga4Record | null = null;
  let deletionResults: Array<{ id: string; deleted: boolean; error?: string }> = [];

  if (reusableCanonical) {
    config = await base44.asServiceRole.entities.GA4Configuration.update(reusableCanonical.id, payload);
    deletionResults = await deleteRecords(base44, existing.filter((record) => record.id !== reusableCanonical.id));
  } else {
    config = await base44.asServiceRole.entities.GA4Configuration.create(payload);
    deletionResults = await deleteRecords(base44, existing);
  }

  const failedDeletes = deletionResults.filter((result) => !result.deleted);
  if (failedDeletes.length > 0) {
    const error = new Error("GA4 repair could not delete every duplicate or legacy secret-bearing record.");
    (error as any).code = "GA4_RECORD_DELETE_INCOMPLETE";
    (error as any).deletion_results = deletionResults;
    (error as any).config = config;
    throw error;
  }

  const verifiedRecords = await queryAllGa4Records(base44);
  const summary = summarizeGa4Records(verifiedRecords);

  if (summary.record_count !== 1) {
    const error = new Error(`GA4 repair left ${summary.record_count} records; expected exactly one.`);
    (error as any).code = "GA4_RECORD_COUNT_INVALID";
    (error as any).summary = summary;
    throw error;
  }
  if (summary.has_legacy_secret) {
    const error = new Error("GA4 repair left a legacy api_secret value in GA4Configuration.");
    (error as any).code = "GA4_LEGACY_SECRET_REMAINED";
    (error as any).summary = summary;
    throw error;
  }
  if (!summary.canonical_tracked_events || !summary.canonical_key_events) {
    const error = new Error("GA4 repair left an incomplete canonical event catalog.");
    (error as any).code = "GA4_CANONICAL_EVENTS_INCOMPLETE";
    (error as any).summary = summary;
    throw error;
  }

  return {
    success: true,
    stage: "entity_cleanup",
    migrated: legacySecretDetected || duplicateRecordsDetected,
    legacy_secret_detected: legacySecretDetected,
    legacy_secret_scrubbed: legacySecretDetected ? deletionResults.every((result) => result.deleted) : false,
    duplicate_records_detected: duplicateRecordsDetected,
    duplicate_records_removed: deletionResults.filter((result) => result.deleted).length,
    deleted_record_ids: deletionResults.filter((result) => result.deleted).map((result) => result.id),
    secret_required_for_browser_tracking: false,
    secret_store_name: "GA4_API_SECRET",
    ...summary,
  };
}

async function markConfigurationFailed(base44: any, config: Ga4Record | null | undefined, stage: StageName, error: string) {
  if (!config?.id) return null;
  return await base44.asServiceRole.entities.GA4Configuration.update(config.id, {
    setup_status: "configured",
    server_side_tracking_enabled: false,
    last_verified_at: null,
    notes: `GA4 verification stopped at ${stage}: ${error}`,
  });
}

async function postMeasurementProtocol(endpoint: string, measurementId: string, apiSecret: string, body: unknown) {
  const url = new URL(endpoint);
  url.searchParams.set("measurement_id", measurementId);
  url.searchParams.set("api_secret", apiSecret);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    let payload: unknown = text;
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = text.slice(0, 500);
    }
    return { ok: response.ok, status: response.status, payload };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      payload: {},
      error: error instanceof Error && error.name === "AbortError" ? "ga4_timeout" : "ga4_request_failed",
    };
  } finally {
    clearTimeout(timeout);
  }
}

function validationMessages(payload: unknown) {
  return Array.isArray((payload as any)?.validationMessages)
    ? (payload as any).validationMessages
    : [];
}

function validationErrors(messages: any[]) {
  return messages.filter((message) => String(message?.severity || "").toUpperCase() === "ERROR");
}

function buildVerificationPayload(verificationId: string, timestamp: string) {
  return {
    client_id: "clientsurge-verification",
    timestamp_micros: String(Date.now() * 1000),
    non_personalized_ads: true,
    events: [
      {
        name: "ga4_verification",
        params: {
          verification_id: verificationId,
          timestamp,
          environment: "production",
          source: "clientsurge_admin_verification",
          engagement_time_msec: 1,
        },
      },
    ],
  };
}

async function validateGoogleMeasurementProtocol(measurementId: string, apiSecret: string, verificationId: string, timestamp: string) {
  const payload = buildVerificationPayload(verificationId, timestamp);
  const debugResult = await postMeasurementProtocol(DEBUG_ENDPOINT, measurementId, apiSecret, payload);
  const messages = validationMessages(debugResult.payload);
  const errors = validationErrors(messages);
  const debugPassed = Boolean(debugResult.ok && errors.length === 0);

  if (!debugPassed) {
    return {
      passed: false,
      debug: {
        passed: false,
        status: debugResult.status,
        validation_message_count: messages.length,
        error_message_count: errors.length,
        error_messages: errors.map((message) => ({
          fieldPath: message?.fieldPath || "",
          description: message?.description || "",
          validationCode: message?.validationCode || "",
        })),
        transport_error: (debugResult as any).error || null,
      },
      delivery: {
        passed: false,
        skipped: true,
        status: 0,
      },
    };
  }

  const collectResult = await postMeasurementProtocol(COLLECT_ENDPOINT, measurementId, apiSecret, payload);
  return {
    passed: Boolean(collectResult.ok),
    debug: {
      passed: true,
      status: debugResult.status,
      validation_message_count: messages.length,
      error_message_count: 0,
    },
    delivery: {
      passed: Boolean(collectResult.ok),
      skipped: false,
      status: collectResult.status,
      transport_error: (collectResult as any).error || null,
    },
  };
}

async function fetchProductionHealth() {
  const response = await fetch(PRODUCTION_URL, {
    redirect: "follow",
    headers: { "User-Agent": "ClientSurge-GA4-Verification/3.0" },
  });
  const html = await response.text();
  const normalized = html.replace(/\s+/g, " ");
  const forbiddenChecks = [
    { label: "available pages", pattern: /available\s+pages/i },
    { label: "manages data types", pattern: /manages\s+data\s+types/i },
    { label: "admin pages", pattern: /admin\s+pages/i },
    { label: "Base44 directory", pattern: /base44\s+directory/i },
  ];
  const forbidden_terms_detected = forbiddenChecks
    .filter((check) => check.pattern.test(normalized))
    .map((check) => check.label);

  return {
    passed: Boolean(response.ok && forbidden_terms_detected.length === 0),
    status: response.status,
    final_url: response.url,
    forbidden_terms_detected,
  };
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!isGa4Admin(user)) {
      return jsonResponse(failureBody("authentication", "Unauthorized: admin or super_admin required", { code: "FORBIDDEN" }), 403);
    }

    const body = await req.json().catch(() => ({}));
    if (Object.prototype.hasOwnProperty.call(body, "api_secret")) {
      return jsonResponse(
        failureBody(
          "secret_validation",
          "Do not send GA4 API secrets to this function. Store GA4_API_SECRET in Base44 Secrets and use it only from backend code.",
          { code: "GA4_SECRET_MUST_USE_SECRET_STORE" },
        ),
        400,
      );
    }

    const measurementId = String(body.measurement_id || DEFAULT_GA4_MEASUREMENT_ID).trim().toUpperCase();
    if (!GA4_MEASUREMENT_ID_PATTERN.test(measurementId) || measurementId !== DEFAULT_GA4_MEASUREMENT_ID) {
      return jsonResponse(
        failureBody(
          "entity_cleanup",
          `Invalid measurement_id. ClientSurge production GA4 must use ${DEFAULT_GA4_MEASUREMENT_ID}.`,
          { code: "GA4_MEASUREMENT_ID_INVALID" },
        ),
        400,
      );
    }

    let repairResult;
    try {
      repairResult = await repairGa4Configuration(base44, { body, measurementId });
    } catch (error) {
      return jsonResponse(
        failureBody("entity_cleanup", error instanceof Error ? error.message : "GA4 entity cleanup failed", {
          code: (error as any)?.code || "GA4_ENTITY_CLEANUP_FAILED",
          deletion_results: (error as any)?.deletion_results || undefined,
          summary: (error as any)?.summary || undefined,
        }),
        409,
      );
    }

    const config = repairResult.config;
    const checks: Record<string, unknown> = {
      entity_cleanup: {
        passed: true,
        record_count: repairResult.record_count,
        no_api_secret_in_entity: repairResult.has_legacy_secret === false,
        duplicate_records_removed: repairResult.duplicate_records_removed,
      },
    };

    const apiSecret = String(Deno.env.get("GA4_API_SECRET") || "").trim();
    if (!apiSecret) {
      await markConfigurationFailed(base44, config, "secret_validation", "GA4_API_SECRET missing");
      return jsonResponse(
        failureBody("secret_validation", "GA4_API_SECRET missing", {
          checks: {
            ...checks,
            secret_validation: { passed: false, api_secret_present: false },
          },
          repair: repairResult,
        }),
        409,
      );
    }
    checks.secret_validation = { passed: true, api_secret_present: true };

    const verifiedAt = new Date().toISOString();
    const verificationId = crypto.randomUUID();
    const googleValidation = await validateGoogleMeasurementProtocol(measurementId, apiSecret, verificationId, verifiedAt);
    checks.google_validation = {
      passed: googleValidation.passed,
      measurement_protocol_debug: googleValidation.debug,
      measurement_protocol_delivery: googleValidation.delivery,
    };

    if (!googleValidation.passed) {
      await markConfigurationFailed(base44, config, "google_validation", "Google Measurement Protocol validation failed");
      return jsonResponse(
        failureBody("google_validation", "Google Measurement Protocol validation failed", {
          verification_id: verificationId,
          checks,
          repair: repairResult,
        }),
        409,
      );
    }

    let productionHealth;
    try {
      productionHealth = await fetchProductionHealth();
    } catch (error) {
      productionHealth = {
        passed: false,
        status: 0,
        final_url: PRODUCTION_URL,
        forbidden_terms_detected: [],
        error: error instanceof Error ? error.message : "Production domain health check failed",
      };
    }
    checks.production_security = productionHealth;

    if (!productionHealth.passed) {
      await markConfigurationFailed(base44, config, "production_security", "Production domain health check failed");
      return jsonResponse(
        failureBody("production_security", "Production domain health check failed", {
          verification_id: verificationId,
          checks,
          repair: repairResult,
        }),
        409,
      );
    }

    const notes = "Verified through GA4 Measurement Protocol, production health check, and configuration integrity validation.";
    const updatedConfig = await base44.asServiceRole.entities.GA4Configuration.update(config.id, {
      setup_status: "active",
      server_side_tracking_enabled: true,
      last_verified_at: verifiedAt,
      notes,
    });

    checks.final_activation = {
      passed: true,
      setup_status: updatedConfig.setup_status,
      server_side_tracking_enabled: updatedConfig.server_side_tracking_enabled === true,
      last_verified_at: updatedConfig.last_verified_at || verifiedAt,
    };

    return jsonResponse({
      success: true,
      verified: true,
      stage: "final_activation",
      measurement_id: DEFAULT_GA4_MEASUREMENT_ID,
      verification_id: verificationId,
      verified_at: updatedConfig.last_verified_at || verifiedAt,
      setup_status: "active",
      server_side_tracking_enabled: true,
      last_verified_at: updatedConfig.last_verified_at || verifiedAt,
      notes,
      configuration: {
        id: updatedConfig.id,
        measurement_id: updatedConfig.measurement_id,
        setup_status: updatedConfig.setup_status,
        server_side_tracking_enabled: updatedConfig.server_side_tracking_enabled,
        last_verified_at: updatedConfig.last_verified_at || verifiedAt,
      },
      repair: repairResult,
      checks,
      message: "GA4 Fully Verified",
    });
  } catch (error) {
    console.error("[setupGA4Configuration]", error);
    return jsonResponse(
      failureBody("final_activation", error instanceof Error ? error.message : "Unknown setup error", {
        code: (error as any)?.code || "GA4_SETUP_FAILED",
      }),
      500,
    );
  }
});
