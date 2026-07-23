import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const GA4_MEASUREMENT_ID = "G-H6QT342ZN9";
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
];
const GA4_KEY_EVENTS = ["generate_lead", "begin_checkout", "purchase", "demo_booked"];
const DEBUG_ENDPOINT = "https://www.google-analytics.com/debug/mp/collect";
const COLLECT_ENDPOINT = "https://www.google-analytics.com/mp/collect";
const PRODUCTION_URL = "https://clientsurgesystems.com/";

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Frame-Options": "DENY",
    },
  });
}

function cleanString(value: unknown, maxLength = 240) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
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

function hasLegacySecret(record: any) {
  return typeof record?.api_secret === "string" && record.api_secret.trim().length > 0;
}

function missingEvents(actual: unknown, expected: string[]) {
  const set = new Set(Array.isArray(actual) ? actual.map((event) => String(event)) : []);
  return expected.filter((event) => !set.has(event));
}

function verifyRecordIntegrity(records: any[]) {
  const config = records.find((record) => record?.measurement_id === GA4_MEASUREMENT_ID) || null;
  const missingTrackedEvents = missingEvents(config?.tracked_events, GA4_TRACKED_EVENTS);
  const missingKeyEvents = missingEvents(config?.conversion_events, GA4_KEY_EVENTS);
  const legacySecretRecordIds = records.filter(hasLegacySecret).map((record) => cleanString(record?.id, 80));

  return {
    passed: Boolean(
      records.length === 1 &&
        config &&
        config.enabled === true &&
        config.enhanced_measurement_enabled === true &&
        config.measurement_id === GA4_MEASUREMENT_ID &&
        legacySecretRecordIds.length === 0 &&
        missingTrackedEvents.length === 0 &&
        missingKeyEvents.length === 0
    ),
    record_count: records.length,
    measurement_id: config?.measurement_id || null,
    enabled: config?.enabled === true,
    enhanced_measurement_enabled: config?.enhanced_measurement_enabled === true,
    no_legacy_secret: legacySecretRecordIds.length === 0,
    legacy_secret_record_ids: legacySecretRecordIds,
    missing_tracked_events: missingTrackedEvents,
    missing_key_events: missingKeyEvents,
  };
}

async function listRecords(base44: any) {
  return await base44.asServiceRole.entities.GA4Configuration.list("-created_date", 50);
}

function buildCheck(passed: boolean, details: Record<string, unknown> = {}) {
  return { passed, ...details };
}

function failedCheckNames(checks: Record<string, { passed: boolean }>, mandatoryPassed: boolean) {
  const failed = Object.entries(checks)
    .filter(([name, check]) => name !== "final_status_update" && check?.passed !== true)
    .map(([name]) => name);
  if (mandatoryPassed && checks.final_status_update?.passed !== true) failed.push("final_status_update");
  return failed;
}

function sanitizeValidationMessage(message: any) {
  return {
    field_path: cleanString(message?.fieldPath, 160),
    description: cleanString(message?.description, 300),
    validation_code: cleanString(message?.validationCode, 120),
    severity: cleanString(message?.severity, 40),
  };
}

function isErrorValidationMessage(message: any) {
  const severity = cleanString(message?.severity, 40).toUpperCase();
  const code = cleanString(message?.validationCode || message?.validation_code, 120).toUpperCase();
  return severity === "ERROR" || code.includes("INVALID") || code.includes("REQUIRED");
}

async function postMeasurementProtocol(endpoint: string, measurementId: string, apiSecret: string, body: unknown) {
  const url = new URL(endpoint);
  url.searchParams.set("measurement_id", measurementId);
  url.searchParams.set("api_secret", apiSecret);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
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
      payload = {};
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

async function fetchText(url: string) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": "ClientSurge-GA4-Verification/2.1" },
  });
  return { response, text: await response.text() };
}

async function checkProductionSite() {
  try {
    const { response, text: html } = await fetchText(PRODUCTION_URL);
    const brandContentPresent = /ClientSurge Systems|AI-powered sales system|AI automation systems/i.test(html);
    const directoryExposureDetected = /manages\s+\d+\s+data types|available pages|generated page directory|app pages/i.test(html);
    const internalRouteInventoryDetected = /AdminSettings|FunctionAudit|\/admin\/broken-flows|\/client-portal.*\/setup/ims.test(html);
    const rawErrorPageDetected = /Application error|Internal Server Error|Unhandled Runtime Error|ReferenceError|TypeError:|SyntaxError:/i.test(html);
    const cspPresent = Boolean(response.headers.get("content-security-policy"));
    const coopPresent = Boolean(response.headers.get("cross-origin-opener-policy"));

    return {
      passed: Boolean(
        response.ok &&
          brandContentPresent &&
          !directoryExposureDetected &&
          !internalRouteInventoryDetected &&
          !rawErrorPageDetected &&
          cspPresent &&
          coopPresent
      ),
      status: response.status,
      final_url: response.url,
      brand_content_present: brandContentPresent,
      directory_exposure_detected: directoryExposureDetected,
      internal_route_inventory_detected: internalRouteInventoryDetected,
      raw_error_page_detected: rawErrorPageDetected,
      csp_present: cspPresent,
      coop_present: coopPresent,
    };
  } catch (error) {
    return {
      passed: false,
      status: 0,
      final_url: PRODUCTION_URL,
      brand_content_present: false,
      directory_exposure_detected: false,
      internal_route_inventory_detected: false,
      raw_error_page_detected: false,
      csp_present: false,
      coop_present: false,
      error: error instanceof Error ? cleanString(error.message, 200) : "production_site_request_failed",
    };
  }
}

function buildVerificationPayload() {
  return {
    client_id: `clientsurge-verifier-${crypto.randomUUID()}`,
    timestamp_micros: String(Date.now() * 1000),
    non_personalized_ads: true,
    events: [
      {
        name: "ga4_verification",
        params: {
          verification_id: `ga4_verify_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
          source: "base44_configureGA4Analytics",
          engagement_time_msec: 1,
        },
      },
    ],
  };
}

Deno.serve(async (req) => {
  const verifiedAt = new Date().toISOString();
  const checks: Record<string, any> = {
    entity_integrity: buildCheck(false),
    secret_available: buildCheck(false),
    measurement_protocol_debug: buildCheck(false),
    measurement_protocol_delivery: buildCheck(false),
    production_site: buildCheck(false),
    final_status_update: buildCheck(false),
  };

  try {
    if (req.method !== "POST") {
      return jsonResponse({ success: false, error: "Method not allowed" }, 405);
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!isAdmin(user)) {
      return jsonResponse({ success: false, error: "Unauthorized: admin or super_admin required" }, 403);
    }

    const records = await listRecords(base44);
    const config = records.find((record) => record?.measurement_id === GA4_MEASUREMENT_ID) || records[0] || null;
    const integrity = verifyRecordIntegrity(records);
    checks.entity_integrity = buildCheck(integrity.passed, integrity);

    const apiSecret = cleanString(Deno.env.get("GA4_API_SECRET"), 256);
    const envMeasurementId = cleanString(Deno.env.get("GA4_MEASUREMENT_ID") || GA4_MEASUREMENT_ID, 32).toUpperCase();
    checks.secret_available = buildCheck(Boolean(apiSecret && envMeasurementId === GA4_MEASUREMENT_ID), {
      ga4_api_secret_present: Boolean(apiSecret),
      measurement_id_matches: envMeasurementId === GA4_MEASUREMENT_ID,
    });

    if (checks.entity_integrity.passed && checks.secret_available.passed) {
      const payload = buildVerificationPayload();
      const debugResult = await postMeasurementProtocol(DEBUG_ENDPOINT, envMeasurementId, apiSecret, payload);
      const validationMessages = Array.isArray((debugResult.payload as any)?.validationMessages)
        ? (debugResult.payload as any).validationMessages
        : [];
      const sanitizedMessages = validationMessages.map(sanitizeValidationMessage);
      const debugAccepted = debugResult.ok && !validationMessages.some(isErrorValidationMessage);
      checks.measurement_protocol_debug = buildCheck(debugAccepted, {
        status: debugResult.status,
        validation_messages: sanitizedMessages,
      });

      if (debugAccepted) {
        const collectResult = await postMeasurementProtocol(COLLECT_ENDPOINT, envMeasurementId, apiSecret, payload);
        checks.measurement_protocol_delivery = buildCheck(collectResult.ok && [200, 204].includes(collectResult.status), {
          status: collectResult.status,
        });
      }
    }

    checks.production_site = await checkProductionSite();

    const mandatoryPassed =
      checks.entity_integrity.passed &&
      checks.secret_available.passed &&
      checks.measurement_protocol_debug.passed &&
      checks.measurement_protocol_delivery.passed &&
      checks.production_site.passed;

    const safeEvidence = {
      verified_at: verifiedAt,
      measurement_id: GA4_MEASUREMENT_ID,
      checks,
    };

    if (config?.id && mandatoryPassed) {
      await base44.asServiceRole.entities.GA4Configuration.update(config.id, {
        setup_status: "active",
        server_side_tracking_enabled: true,
        last_verified_at: verifiedAt,
        notes: JSON.stringify(safeEvidence),
      });
      checks.final_status_update = buildCheck(true, {
        setup_status: "active",
        server_side_tracking_enabled: true,
        last_verified_at: verifiedAt,
      });
    } else if (config?.id) {
      await base44.asServiceRole.entities.GA4Configuration.update(config.id, {
        setup_status: "configured",
        server_side_tracking_enabled: false,
        last_verified_at: null,
        notes: JSON.stringify({
          ...safeEvidence,
          failed_checks: failedCheckNames(checks, mandatoryPassed),
        }),
      });
      checks.final_status_update = buildCheck(true, {
        setup_status: "configured",
        server_side_tracking_enabled: false,
        last_verified_at: null,
      });
    }

    const failedChecks = failedCheckNames(checks, mandatoryPassed);
    return jsonResponse(
      {
        success: failedChecks.length === 0,
        verified: failedChecks.length === 0,
        measurement_id: GA4_MEASUREMENT_ID,
        setup_status: failedChecks.length === 0 ? "active" : "configured",
        server_side_tracking_enabled: failedChecks.length === 0,
        last_verified_at: failedChecks.length === 0 ? verifiedAt : null,
        failed_checks: failedChecks,
        checks,
      },
      failedChecks.length === 0 ? 200 : 424,
    );
  } catch (error) {
    console.error("[configureGA4Analytics]", error);
    return jsonResponse(
      {
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : "Unknown GA4 verification error",
        failed_checks: failedCheckNames(checks, false),
        checks,
      },
      500,
    );
  }
});
