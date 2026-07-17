import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]{4,}$/i;

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
] as const;

const KEY_EVENTS = ["generate_lead", "begin_checkout", "purchase", "demo_booked"] as const;

function uniqueAllowed(values: unknown, allowed: readonly string[], fallback: readonly string[]) {
  if (!Array.isArray(values)) return [...fallback];
  return [...new Set(values.map((value) => String(value || "").trim()).filter((value) => allowed.includes(value)))];
}

function isAdmin(user: Record<string, unknown> | null | undefined) {
  return user?.role === "admin" || user?.role === "super_admin";
}

function containsLegacySecret(record: Record<string, unknown> | null | undefined) {
  return typeof record?.api_secret === "string" && record.api_secret.trim().length > 0;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!isAdmin(user)) {
      return Response.json({ error: "Unauthorized — admin or super_admin required" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    if (Object.prototype.hasOwnProperty.call(body, "api_secret")) {
      return Response.json(
        {
          error: "Do not send GA4 API secrets to this function. Store GA4_API_SECRET in Base44 Secrets and use it only from backend code.",
          code: "GA4_SECRET_MUST_USE_SECRET_STORE",
        },
        { status: 400 },
      );
    }

    const measurementId = String(body.measurement_id || "").trim().toUpperCase();
    if (!MEASUREMENT_ID_PATTERN.test(measurementId)) {
      return Response.json({ error: "Invalid measurement_id format. Expected G-XXXXXXXXXX." }, { status: 400 });
    }

    const trackedEvents = uniqueAllowed(body.tracked_events, TRACKED_EVENTS, TRACKED_EVENTS);
    const conversionEvents = uniqueAllowed(body.conversion_events, KEY_EVENTS, KEY_EVENTS);

    const existing = await base44.asServiceRole.entities.GA4Configuration.filter(
      { measurement_id: measurementId },
      "-created_date",
      100,
    ).catch(() => []);

    const payload = {
      measurement_id: measurementId,
      enabled: body.enabled !== false,
      tracked_events: trackedEvents,
      conversion_events: conversionEvents,
      enhanced_measurement_enabled: body.enhanced_measurement_enabled !== false,
      server_side_tracking_enabled: false,
      setup_status: "configured",
      notes: "Configuration saved. Status remains configured until Realtime/DebugView and server-side delivery are independently verified.",
    };

    const legacySecretDetected = existing.some(containsLegacySecret);
    let legacySecretScrubbed = false;
    let config;

    if (legacySecretDetected) {
      config = await base44.asServiceRole.entities.GA4Configuration.create(payload);
      const deletionResults = await Promise.all(
        existing.map(async (record: any) => {
          try {
            await base44.asServiceRole.entities.GA4Configuration.delete(record.id);
            return true;
          } catch {
            return false;
          }
        }),
      );
      legacySecretScrubbed = deletionResults.every(Boolean);

      if (!legacySecretScrubbed) {
        return Response.json(
          {
            error: "A clean GA4 configuration was created, but at least one legacy secret-bearing record could not be deleted.",
            code: "GA4_LEGACY_SECRET_SCRUB_INCOMPLETE",
            config,
          },
          { status: 500 },
        );
      }
    } else {
      config = existing?.[0]?.id
        ? await base44.asServiceRole.entities.GA4Configuration.update(existing[0].id, payload)
        : await base44.asServiceRole.entities.GA4Configuration.create(payload);
    }

    return Response.json({
      success: true,
      config,
      legacy_secret_detected: legacySecretDetected,
      legacy_secret_scrubbed: legacySecretScrubbed,
      message: legacySecretDetected
        ? "GA4 configuration saved and the legacy secret-bearing record was destroyed."
        : "GA4 configuration saved without storing any private credential in the entity.",
    });
  } catch (error) {
    console.error("[setupGA4Configuration]", error);
    return Response.json({ error: error?.message || "Unknown setup error" }, { status: 500 });
  }
});
