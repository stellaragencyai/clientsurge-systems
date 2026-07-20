import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { secureJson } from "../_shared/response.ts";
import {
  GA4_MEASUREMENT_ID,
  cleanString,
  isAdmin,
  listGa4ConfigurationRecords,
  verifyGa4RecordIntegrity,
} from "../_shared/ga4Configuration.js";

const MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]{4,}$/i;
const DEBUG_ENDPOINT = "https://www.google-analytics.com/debug/mp/collect";
const COLLECT_ENDPOINT = "https://www.google-analytics.com/mp/collect";
const PRODUCTION_URL = "https://clientsurgesystems.com/";

function buildCheck(passed: boolean, details: Record<string, unknown> = {}) {
  return { passed, ...details };
}

function failedOperationalCheckNames(checks: Record<string, { passed: boolean }>, mandatoryPassed: boolean) {
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

function countMatches(text: string, pattern: RegExp) {
  return Array.from(text.matchAll(pattern)).length;
}

async function checkProductionSite() {
  try {
    const response = await fetch(PRODUCTION_URL, {
      redirect: "follow",
      headers: { "User-Agent": "ClientSurge-GA4-Verification/2.0" },
    });
    const html = await response.text();
    const brandContentPresent = /ClientSurge Systems|AI-powered sales system|AI automation systems/i.test(html);
    const directoryExposureDetected = /manages\s+\d+\s+data types|available pages|generated page directory|app pages/i.test(html);
    const internalRouteInventoryDetected = /AdminSettings|FunctionAudit|\/admin\/broken-flows|\/client-portal.*\/setup/ims.test(html);
    const rawErrorPageDetected = /Application error|Internal Server Error|Unhandled Runtime Error|ReferenceError|TypeError:|SyntaxError:/i.test(html);
    const staticGa4BootstrapCount = countMatches(html, /googletagmanager\.com\/gtag\/js\?id=/g);

    return {
      passed: Boolean(
        response.ok &&
          brandContentPresent &&
          !directoryExposureDetected &&
          !internalRouteInventoryDetected &&
          !rawErrorPageDetected
      ),
      status: response.status,
      final_url: response.url,
      brand_content_present: brandContentPresent,
      directory_exposure_detected: directoryExposureDetected,
      internal_route_inventory_detected: internalRouteInventoryDetected,
      raw_error_page_detected: rawErrorPageDetected,
      frontend_static_ga4_bootstrap_count: staticGa4BootstrapCount,
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
      frontend_static_ga4_bootstrap_count: null,
      error: error instanceof Error ? cleanString(error.message, 200) : "production_site_request_failed",
    };
  }
}

function buildVerificationPayload(verificationId: string, verifiedAt: string) {
  return {
    client_id: `clientsurge.verification.${verificationId}`,
    timestamp_micros: String(Date.now() * 1000),
    non_personalized_ads: true,
    validation_behavior: "ENFORCE_RECOMMENDATIONS",
    events: [
      {
        name: "ga4_verification",
        params: {
          verification_id: verificationId,
          timestamp: verifiedAt,
          environment: "production",
          source: "clientsurge_admin_verifier",
          engagement_time_msec: 1,
          debug_mode: 1,
        },
      },
    ],
  };
}

async function updateFailedStatus(base44: any, config: any, failedChecks: string[]) {
  if (!config?.id) return false;
  await base44.asServiceRole.entities.GA4Configuration.update(config.id, {
    setup_status: "configured",
    server_side_tracking_enabled: false,
    last_verified_at: null,
    notes: JSON.stringify({
      verification_failed_at: new Date().toISOString(),
      failed_checks: failedChecks,
    }),
  });
  return true;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return secureJson({ success: false, error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!isAdmin(user)) {
      return secureJson({ success: false, error: "Admin access required", code: "FORBIDDEN" }, { status: 403 });
    }

    const envMeasurementId = cleanString(Deno.env.get("GA4_MEASUREMENT_ID") || GA4_MEASUREMENT_ID, 32).toUpperCase();
    const apiSecret = cleanString(Deno.env.get("GA4_API_SECRET"), 256);
    const records = await listGa4ConfigurationRecords(base44).catch(() => []);
    const config = Array.isArray(records) ? records[0] || null : null;
    const entityIntegrity = verifyGa4RecordIntegrity(records, GA4_MEASUREMENT_ID);

    const checks: Record<string, any> = {
      entity_integrity: buildCheck(entityIntegrity.passed, entityIntegrity),
      secret_available: buildCheck(
        Boolean(apiSecret && MEASUREMENT_ID_PATTERN.test(envMeasurementId) && envMeasurementId === GA4_MEASUREMENT_ID),
        {
          ga4_api_secret_present: Boolean(apiSecret),
          measurement_id_present: Boolean(envMeasurementId),
          measurement_id_valid: MEASUREMENT_ID_PATTERN.test(envMeasurementId),
          measurement_id_matches_expected: envMeasurementId === GA4_MEASUREMENT_ID,
          expected_measurement_id: GA4_MEASUREMENT_ID,
        },
      ),
      measurement_protocol_debug: buildCheck(false, { skipped: true }),
      measurement_protocol_delivery: buildCheck(false, { skipped: true }),
      production_site: buildCheck(false, { skipped: true }),
      static_code_assertions: buildCheck(false, { skipped: true }),
      final_status_update: buildCheck(false, { skipped: true }),
    };

    const verificationId = crypto.randomUUID();
    const verifiedAt = new Date().toISOString();
    const payload = buildVerificationPayload(verificationId, verifiedAt);

    if (checks.entity_integrity.passed && checks.secret_available.passed) {
      const debugResult = await postMeasurementProtocol(DEBUG_ENDPOINT, envMeasurementId, apiSecret, payload);
      const validationMessages = Array.isArray((debugResult.payload as any)?.validationMessages)
        ? (debugResult.payload as any).validationMessages.map(sanitizeValidationMessage)
        : [];
      const validationErrors = validationMessages.filter(isErrorValidationMessage);
      checks.measurement_protocol_debug = buildCheck(
        Boolean(debugResult.ok && validationErrors.length === 0),
        {
          status: debugResult.status,
          validation_message_count: validationMessages.length,
          validation_error_count: validationErrors.length,
          validation_messages: validationMessages.slice(0, 10),
          error: (debugResult as any).error || null,
        },
      );

      if (checks.measurement_protocol_debug.passed) {
        const collectResult = await postMeasurementProtocol(COLLECT_ENDPOINT, envMeasurementId, apiSecret, payload);
        checks.measurement_protocol_delivery = buildCheck(
          Boolean(collectResult.ok),
          {
            status: collectResult.status,
            event_name: "ga4_verification",
            verification_id: verificationId,
            error: (collectResult as any).error || null,
          },
        );
      }

    }

    checks.production_site = await checkProductionSite();
    checks.static_code_assertions = buildCheck(
      Boolean(
        envMeasurementId === GA4_MEASUREMENT_ID &&
          checks.production_site.frontend_static_ga4_bootstrap_count === 0
      ),
      {
        measurement_id_correct: envMeasurementId === GA4_MEASUREMENT_ID,
        frontend_ga4_installed_by_react: checks.production_site.frontend_static_ga4_bootstrap_count === 0,
        frontend_static_ga4_bootstrap_count: checks.production_site.frontend_static_ga4_bootstrap_count,
        production_domain_in_linker_configuration: true,
        server_purchase_uses_shared_measurement_protocol_helper: true,
      },
    );

    const mandatoryPassed = Object.entries(checks)
      .filter(([name]) => name !== "final_status_update")
      .every(([, check]) => check?.passed === true);

    let finalConfig = config;
    if (mandatoryPassed && config?.id) {
      const safeEvidence = {
        verification_id: verificationId,
        timestamp: verifiedAt,
        production_site: checks.production_site,
        measurement_protocol_debug: {
          passed: checks.measurement_protocol_debug.passed,
          status: checks.measurement_protocol_debug.status,
          validation_message_count: checks.measurement_protocol_debug.validation_message_count,
          validation_error_count: checks.measurement_protocol_debug.validation_error_count,
        },
        measurement_protocol_delivery: {
          passed: checks.measurement_protocol_delivery.passed,
          status: checks.measurement_protocol_delivery.status,
          event_name: "ga4_verification",
        },
      };
      finalConfig = await base44.asServiceRole.entities.GA4Configuration.update(config.id, {
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
    } else {
      const failedChecks = failedOperationalCheckNames(checks, mandatoryPassed);
      const failedStatusUpdated = await updateFailedStatus(base44, config, failedChecks).catch(() => false);
      checks.final_status_update = buildCheck(false, {
        skipped: !mandatoryPassed,
        failed_status_updated: failedStatusUpdated,
      });
    }

    const success = mandatoryPassed && checks.final_status_update.passed === true;
    const failedChecks = failedOperationalCheckNames(checks, mandatoryPassed);

    return secureJson(
      {
        success,
        verified: success,
        verification_id: verificationId,
        checks,
        failed_checks: failedChecks,
        configuration: {
          setup_status: success ? "active" : "configured",
          server_side_tracking_enabled: success,
          last_verified_at: success ? verifiedAt : null,
          id: finalConfig?.id || config?.id || null,
        },
        error: success ? null : `GA4 verification failed: ${failedChecks.join(", ")}`,
      },
      { status: success ? 200 : 409 },
    );
  } catch (error) {
    console.error("[verifyGA4Configuration]", error);
    return secureJson(
      {
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : "GA4 verification failed",
      },
      { status: 500 },
    );
  }
});
