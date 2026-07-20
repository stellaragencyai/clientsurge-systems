import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import {
  DEFAULT_GA4_MEASUREMENT_ID,
  GA4_MEASUREMENT_ID_PATTERN,
  containsLegacySecret,
  isGa4Admin,
  repairGa4Configuration,
  summarizeGa4Records,
} from "./ga4Configuration.ts";

const DEBUG_ENDPOINT = "https://www.google-analytics.com/debug/mp/collect";
const COLLECT_ENDPOINT = "https://www.google-analytics.com/mp/collect";
const PRODUCTION_URL = "https://clientsurgesystems.com/";

type CheckResult = Record<string, any> & { passed: boolean };

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
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

function firstAssetUrl(html: string, baseUrl: string) {
  const scriptMatch = html.match(/<script[^>]+src=["']([^"']*\/assets\/[^"']+\.js)["']/i);
  const bareMatch = html.match(/\/assets\/[^"']+\.js/i);
  const src = scriptMatch?.[1] || bareMatch?.[0] || "";
  if (!src) return "";
  try {
    return new URL(src, baseUrl).href;
  } catch {
    return "";
  }
}

async function fetchProductionSite() {
  const response = await fetch(PRODUCTION_URL, {
    redirect: "follow",
    headers: { "User-Agent": "ClientSurge-GA4-Verification/2.0" },
  });
  const html = await response.text();
  const normalized = html.replace(/\s+/g, " ");
  const brandContentPresent = /ClientSurge Systems|Turn your website into an AI-powered sales system|AI automation systems/i.test(normalized);
  const directoryExposureDetected = /manages\s+\d+\s+data types|available pages|generated page directory|app pages/i.test(normalized);
  const rawErrorDetected = /Application error|Internal Server Error|Unhandled Runtime Error|Cannot GET|stack trace/i.test(normalized);

  return {
    html,
    check: {
      passed: Boolean(response.ok && brandContentPresent && !directoryExposureDetected && !rawErrorDetected),
      status: response.status,
      final_url: response.url,
      brand_content_present: brandContentPresent,
      directory_exposure_detected: directoryExposureDetected,
      raw_error_detected: rawErrorDetected,
    },
  };
}

async function inspectDeployedStaticCode(html: string, baseUrl: string) {
  const assetUrl = firstAssetUrl(html, baseUrl);
  let assetText = "";
  let assetStatus = 0;

  if (assetUrl) {
    try {
      const response = await fetch(assetUrl, {
        headers: { "User-Agent": "ClientSurge-GA4-Verification/2.0" },
      });
      assetStatus = response.status;
      assetText = await response.text();
    } catch {
      assetText = "";
    }
  }

  const source = `${html}\n${assetText}`;
  const staticGtagScriptTags = (
    html.match(/<script\b[^>]*\bsrc=["'][^"']*googletagmanager\.com\/gtag\/js[^"']*["'][^>]*>/gi) || []
  ).length;
  const gtagLoaderLiteralOccurrences = (assetText.match(/googletagmanager\.com\/gtag\/js/g) || []).length;
  const measurementIdPresent = source.includes(DEFAULT_GA4_MEASUREMENT_ID);
  const sendPageViewDisabled = /send_page_view["']?\s*:\s*(false|!1)/.test(source);
  const linkerDomainPresent =
    source.includes("clientsurgesystems.com") &&
    source.includes("www.clientsurgesystems.com");
  const browserPurchaseIsConfirmation = source.includes("purchase_client_confirmation");
  const ga4InstalledOnce = staticGtagScriptTags === 0 && gtagLoaderLiteralOccurrences >= 1 && gtagLoaderLiteralOccurrences <= 3;

  return {
    passed: Boolean(
      assetUrl &&
        measurementIdPresent &&
        ga4InstalledOnce &&
        sendPageViewDisabled &&
        linkerDomainPresent &&
        browserPurchaseIsConfirmation,
    ),
    asset_url: assetUrl || null,
    asset_status: assetStatus,
    measurement_id_present: measurementIdPresent,
    ga4_installed_once: ga4InstalledOnce,
    static_gtag_script_tags: staticGtagScriptTags,
    gtag_loader_literal_occurrences: gtagLoaderLiteralOccurrences,
    send_page_view_disabled: sendPageViewDisabled,
    linker_domain_present: linkerDomainPresent,
    browser_purchase_uses_confirmation_event: browserPurchaseIsConfirmation,
    server_purchase_helper_expected: true,
  };
}

function allPassed(checks: Record<string, CheckResult>) {
  return Object.values(checks).every((check) => check.passed === true);
}

function failedCheckNames(checks: Record<string, CheckResult>) {
  return Object.entries(checks)
    .filter(([, check]) => check.passed !== true)
    .map(([name]) => name);
}

function firstFailedStage(checks: Record<string, CheckResult>) {
  const ordered = [
    "entity_integrity",
    "secret_available",
    "measurement_protocol_debug",
    "measurement_protocol_delivery",
    "production_site",
    "static_code_assertions",
  ];
  return ordered.find((name) => checks[name]?.passed !== true) || null;
}

async function runGa4Verification(base44: any) {
  const now = new Date().toISOString();
  const envMeasurementId = String(Deno.env.get("GA4_MEASUREMENT_ID") || "").trim().toUpperCase();
  const measurementId = envMeasurementId || DEFAULT_GA4_MEASUREMENT_ID;
  const measurementIdMatchesExpected =
    (!envMeasurementId || envMeasurementId === DEFAULT_GA4_MEASUREMENT_ID) &&
    GA4_MEASUREMENT_ID_PATTERN.test(measurementId);
  const apiSecret = String(Deno.env.get("GA4_API_SECRET") || "").trim();
  const secretPresent = apiSecret.length > 0;

  const records = await base44.asServiceRole.entities.GA4Configuration.filter(
    { measurement_id: DEFAULT_GA4_MEASUREMENT_ID },
    "-created_date",
    100,
  ).catch(() => []);
  const summary = summarizeGa4Records(records);
  const config = summary.config;

  const checks: Record<string, CheckResult> = {
    entity_integrity: {
      passed: Boolean(
        summary.record_count === 1 &&
          config?.measurement_id === DEFAULT_GA4_MEASUREMENT_ID &&
          config?.enabled === true &&
          config?.enhanced_measurement_enabled === true &&
          records.every((record: Record<string, unknown>) => !containsLegacySecret(record)) &&
          summary.canonical_tracked_events &&
          summary.canonical_key_events,
      ),
      record_count: summary.record_count,
      measurement_id: config?.measurement_id || null,
      enabled: config?.enabled === true,
      enhanced_measurement_enabled: config?.enhanced_measurement_enabled === true,
      no_api_secret_in_entity: records.every((record: Record<string, unknown>) => !containsLegacySecret(record)),
      canonical_tracked_events: summary.canonical_tracked_events,
      canonical_key_events: summary.canonical_key_events,
      missing_tracked_events: summary.missing_tracked_events,
      missing_key_events: summary.missing_key_events,
    },
    secret_available: {
      passed: Boolean(secretPresent && measurementIdMatchesExpected),
      api_secret_present: secretPresent,
      measurement_id_source: envMeasurementId ? "GA4_MEASUREMENT_ID" : "default",
      measurement_id_matches_expected: measurementIdMatchesExpected,
    },
    measurement_protocol_debug: {
      passed: false,
      skipped: true,
      status: 0,
      validation_message_count: 0,
      error_message_count: 0,
    },
    measurement_protocol_delivery: {
      passed: false,
      skipped: true,
      status: 0,
    },
    production_site: {
      passed: false,
      status: 0,
      final_url: PRODUCTION_URL,
      brand_content_present: false,
      directory_exposure_detected: false,
      raw_error_detected: false,
    },
    static_code_assertions: {
      passed: false,
      asset_url: null,
      asset_status: 0,
    },
  };

  let productionHtml = "";
  try {
    const production = await fetchProductionSite();
    productionHtml = production.html;
    checks.production_site = production.check;
  } catch (error) {
    checks.production_site = {
      passed: false,
      status: 0,
      final_url: PRODUCTION_URL,
      brand_content_present: false,
      directory_exposure_detected: false,
      raw_error_detected: true,
      error: error instanceof Error ? error.message : "Production site check failed",
    };
  }

  if (productionHtml) {
    checks.static_code_assertions = await inspectDeployedStaticCode(productionHtml, PRODUCTION_URL);
  }

  const verificationId = crypto.randomUUID();
  const mpPayload = {
    client_id: `server.verification.${verificationId}`,
    timestamp_micros: String(Date.now() * 1000),
    non_personalized_ads: true,
    validation_behavior: "ENFORCE_RECOMMENDATIONS",
    events: [
      {
        name: "ga4_verification",
        params: {
          verification_id: verificationId,
          timestamp: now,
          environment: "production",
          source: "clientsurge_admin_verifier",
          engagement_time_msec: 1,
          debug_mode: 1,
        },
      },
    ],
  };

  if (checks.entity_integrity.passed && checks.secret_available.passed) {
    const debugResult = await postMeasurementProtocol(DEBUG_ENDPOINT, DEFAULT_GA4_MEASUREMENT_ID, apiSecret, mpPayload);
    const messages = validationMessages(debugResult.payload);
    const errors = validationErrors(messages);
    checks.measurement_protocol_debug = {
      passed: Boolean(debugResult.ok && errors.length === 0),
      skipped: false,
      status: debugResult.status,
      validation_message_count: messages.length,
      error_message_count: errors.length,
      error_messages: errors.map((message) => ({
        fieldPath: message?.fieldPath || "",
        description: message?.description || "",
        validationCode: message?.validationCode || "",
      })),
      transport_error: (debugResult as any).error || null,
    };

    if (checks.measurement_protocol_debug.passed) {
      const collectResult = await postMeasurementProtocol(COLLECT_ENDPOINT, DEFAULT_GA4_MEASUREMENT_ID, apiSecret, mpPayload);
      checks.measurement_protocol_delivery = {
        passed: collectResult.ok,
        skipped: false,
        status: collectResult.status,
        transport_error: (collectResult as any).error || null,
      };
    }
  }

  const verified = allPassed(checks);
  const failed_checks = failedCheckNames(checks);
  const failed_stage = firstFailedStage(checks);
  const configurationPatch = {
    server_side_tracking_enabled: verified,
    setup_status: verified ? "active" : "configured",
    last_verified_at: verified ? now : config?.last_verified_at || null,
    notes: verified
      ? `GA4 verification passed at ${now}. Verification ID: ${verificationId}. Production site healthy, public directory exposure absent, Measurement Protocol debug validation passed, and ga4_verification delivery was accepted.`
      : `GA4 verification failed at ${now}. Verification ID: ${verificationId}. Failed checks: ${failed_checks.join(", ")}.`,
  };

  let updatedConfig = null;
  if (config?.id) {
    updatedConfig = await base44.asServiceRole.entities.GA4Configuration.update(config.id, configurationPatch);
  }

  return {
    status: verified ? 200 : 409,
    body: {
      success: verified,
      verified,
      verification_id: verificationId,
      verified_at: verified ? now : null,
      failed_stage,
      failed_checks,
      checks,
      configuration: updatedConfig
        ? {
            id: updatedConfig.id,
            setup_status: updatedConfig.setup_status,
            server_side_tracking_enabled: updatedConfig.server_side_tracking_enabled,
            last_verified_at: updatedConfig.last_verified_at || null,
          }
        : null,
      message: verified
        ? "GA4 operational verification passed and the configuration is active."
        : "GA4 verification did not pass every required check.",
    },
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
      return jsonResponse({ error: "Unauthorized: admin or super_admin required", code: "FORBIDDEN" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    if (Object.prototype.hasOwnProperty.call(body, "api_secret")) {
      return jsonResponse(
        {
          error: "Do not send GA4 API secrets to this function. Store GA4_API_SECRET in Base44 Secrets and use it only from backend code.",
          code: "GA4_SECRET_MUST_USE_SECRET_STORE",
        },
        400,
      );
    }

    const measurementId = String(body.measurement_id || DEFAULT_GA4_MEASUREMENT_ID).trim().toUpperCase();
    if (!GA4_MEASUREMENT_ID_PATTERN.test(measurementId) || measurementId !== DEFAULT_GA4_MEASUREMENT_ID) {
      return jsonResponse(
        {
          error: `Invalid measurement_id. ClientSurge production GA4 must use ${DEFAULT_GA4_MEASUREMENT_ID}.`,
          code: "GA4_MEASUREMENT_ID_INVALID",
        },
        400,
      );
    }

    const action = String(body.action || body.mode || "repair").trim().toLowerCase();
    if (action === "verify" || body.verify === true) {
      const result = await runGa4Verification(base44);
      return jsonResponse(result.body, result.status);
    }

    const result = await repairGa4Configuration(base44, {
      body,
      measurementId,
      notes:
        "Configuration repaired by setupGA4Configuration. Status remains configured until live backend GA4 verification passes.",
    });

    return jsonResponse({
      ...result,
      message: result.legacy_secret_detected
        ? "GA4 configuration repaired, duplicate records removed, and legacy secret-bearing records destroyed. Rotate any previously exposed GA4 API secret before relying on server-side tracking."
        : "GA4 configuration repaired without storing any private credential in the entity.",
    });
  } catch (error) {
    console.error("[setupGA4Configuration]", error);
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown setup error",
        code: (error as any)?.code || "GA4_SETUP_FAILED",
        deletion_results: (error as any)?.deletion_results || undefined,
      },
      500,
    );
  }
});
