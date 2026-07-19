import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const DEFAULT_MEASUREMENT_ID = "G-H6QT342ZN9";
const MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]{4,}$/i;
const KEY_EVENTS = ["generate_lead", "begin_checkout", "purchase", "demo_booked"];
const DEBUG_ENDPOINT = "https://www.google-analytics.com/debug/mp/collect";
const COLLECT_ENDPOINT = "https://www.google-analytics.com/mp/collect";
const PRODUCTION_URL = "https://clientsurgesystems.com/";

function isAdmin(user: Record<string, unknown> | null | undefined) {
  return user?.role === "admin" || user?.role === "super_admin";
}

function containsLegacySecret(record: Record<string, unknown> | null | undefined) {
  return typeof record?.api_secret === "string" && record.api_secret.trim().length > 0;
}

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
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
    try { payload = text ? JSON.parse(text) : {}; } catch {}
    return { ok: response.ok, status: response.status, payload };
  } finally {
    clearTimeout(timeout);
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!isAdmin(user)) return jsonResponse({ error: "Admin access required", code: "FORBIDDEN" }, 403);

    const measurementId = String(Deno.env.get("GA4_MEASUREMENT_ID") || DEFAULT_MEASUREMENT_ID).trim().toUpperCase();
    const apiSecret = String(Deno.env.get("GA4_API_SECRET") || "").trim();
    const secretPresent = apiSecret.length > 0;

    const records = await base44.asServiceRole.entities.GA4Configuration.filter(
      { measurement_id: measurementId },
      "-created_date",
      20,
    ).catch(() => []);
    const config = records?.[0] || null;
    const keyEvents = new Set(config?.conversion_events || []);
    const configClean = Boolean(
      config &&
      records.length === 1 &&
      !containsLegacySecret(config) &&
      KEY_EVENTS.every((eventName) => keyEvents.has(eventName)) &&
      config.enabled === true
    );

    let productionCheck = { ok: false, status: 0, final_url: PRODUCTION_URL, directory_exposure_detected: false };
    try {
      const response = await fetch(PRODUCTION_URL, { redirect: "follow", headers: { "User-Agent": "ClientSurge-GA4-Verification/1.0" } });
      const html = await response.text();
      productionCheck = {
        ok: response.ok,
        status: response.status,
        final_url: response.url,
        directory_exposure_detected: /manages\s+\d+\s+data types|available pages|generated page directory/i.test(html),
      };
    } catch {}

    if (!MEASUREMENT_ID_PATTERN.test(measurementId) || !secretPresent || !configClean) {
      return jsonResponse({
        success: false,
        verified: false,
        measurement_id: measurementId,
        checks: {
          measurement_id_valid: MEASUREMENT_ID_PATTERN.test(measurementId),
          api_secret_present: secretPresent,
          configuration_clean: configClean,
          production_reachable: productionCheck.ok,
          public_directory_clean: !productionCheck.directory_exposure_detected,
        },
        error: !secretPresent
          ? "GA4_API_SECRET is missing from Base44 Secrets."
          : !configClean
            ? "GA4Configuration is not clean and canonical."
            : "GA4 measurement ID is invalid.",
      }, 409);
    }

    const verificationId = crypto.randomUUID();
    const payload = {
      client_id: `server.verification.${verificationId}`,
      non_personalized_ads: true,
      validation_behavior: "ENFORCE_RECOMMENDATIONS",
      events: [{
        name: "ga4_verification",
        params: {
          event_id: verificationId,
          engagement_time_msec: 1,
          verification_source: "clientsurge_admin",
          debug_mode: 1,
        },
      }],
    };

    const debugResult = await postMeasurementProtocol(DEBUG_ENDPOINT, measurementId, apiSecret, payload);
    const validationMessages = Array.isArray((debugResult.payload as any)?.validationMessages)
      ? (debugResult.payload as any).validationMessages
      : [];
    const debugAccepted = debugResult.ok && validationMessages.length === 0;

    let collectResult = { ok: false, status: 0, payload: {} as unknown };
    if (debugAccepted) collectResult = await postMeasurementProtocol(COLLECT_ENDPOINT, measurementId, apiSecret, payload);

    const verified = Boolean(
      debugAccepted &&
      collectResult.ok &&
      productionCheck.ok &&
      !productionCheck.directory_exposure_detected
    );

    if (config?.id) {
      await base44.asServiceRole.entities.GA4Configuration.update(config.id, {
        server_side_tracking_enabled: Boolean(debugAccepted && collectResult.ok),
        setup_status: verified ? "active" : "configured",
        last_verified_at: verified ? new Date().toISOString() : config.last_verified_at || null,
        notes: verified
          ? `Operational verification passed at ${new Date().toISOString()}: canonical configuration clean, production reachable, public directory exposure absent, Measurement Protocol debug validation accepted, and verification event accepted for collection. Verification ID: ${verificationId}.`
          : `Verification incomplete at ${new Date().toISOString()}. Debug accepted: ${debugAccepted}; collect accepted: ${collectResult.ok}; production reachable: ${productionCheck.ok}; directory exposure: ${productionCheck.directory_exposure_detected}.`,
      });
    }

    return jsonResponse({
      success: verified,
      verified,
      verification_id: verificationId,
      measurement_id: measurementId,
      verified_at: verified ? new Date().toISOString() : null,
      checks: {
        measurement_id_valid: true,
        api_secret_present: true,
        configuration_clean: configClean,
        production_reachable: productionCheck.ok,
        public_directory_clean: !productionCheck.directory_exposure_detected,
        measurement_protocol_debug_accepted: debugAccepted,
        measurement_protocol_collect_accepted: collectResult.ok,
      },
      validation_messages: validationMessages,
      production: productionCheck,
      message: verified
        ? "GA4 operational verification passed. The verification event was validated and accepted by Google Analytics Measurement Protocol."
        : "GA4 verification did not pass every required check.",
    }, verified ? 200 : 409);
  } catch (error) {
    console.error("[verifyGA4Configuration]", error);
    return jsonResponse({
      success: false,
      verified: false,
      error: error instanceof Error ? error.message : "GA4 verification failed",
    }, 500);
  }
});
