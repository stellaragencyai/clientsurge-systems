import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { secureJson } from "../_shared/response.ts";
import { loadAdminSettings } from "../_shared/adminSettings.js";

const GA4_MEASUREMENT_ID = "G-H6QT342ZN9";
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
const KEY_EVENTS = ["generate_lead", "begin_checkout", "purchase", "demo_booked"];

function isAdmin(user: Record<string, unknown> | null | undefined) {
  return user?.role === "admin" || user?.role === "super_admin";
}

function hasLegacySecret(record: Record<string, unknown> | null | undefined) {
  return typeof record?.api_secret === "string" && record.api_secret.trim().length > 0;
}

function summarize(records: any[]) {
  const config = records?.[0] || null;
  const keyEvents = new Set(config?.conversion_events || []);
  const canonicalKeyEvents = KEY_EVENTS.every((eventName) => keyEvents.has(eventName));
  const legacySecretPresent = records.some(hasLegacySecret);
  return {
    config,
    record_count: records.length,
    has_legacy_secret: legacySecretPresent,
    canonical_key_events: canonicalKeyEvents,
    clean: Boolean(config && records.length === 1 && !legacySecretPresent && canonicalKeyEvents && config.setup_status === "configured"),
  };
}

async function selfHealGa4Configuration(base44: any) {
  const records = await base44.asServiceRole.entities.GA4Configuration.filter(
    { measurement_id: GA4_MEASUREMENT_ID },
    "-created_date",
    100,
  ).catch(() => []);

  const payload = {
    measurement_id: GA4_MEASUREMENT_ID,
    enabled: true,
    tracked_events: TRACKED_EVENTS,
    conversion_events: KEY_EVENTS,
    enhanced_measurement_enabled: true,
    server_side_tracking_enabled: false,
    setup_status: "configured",
    notes: "GA4 configuration repaired from Admin Settings. Live Realtime/DebugView verification is still required before marking active.",
  };

  const legacySecretDetected = records.some(hasLegacySecret);
  let config;

  if (legacySecretDetected) {
    config = await base44.asServiceRole.entities.GA4Configuration.create(payload);
    const deletionResults = await Promise.all(
      records.map(async (record: any) => {
        try {
          await base44.asServiceRole.entities.GA4Configuration.delete(record.id);
          return true;
        } catch {
          return false;
        }
      }),
    );
    if (!deletionResults.every(Boolean)) {
      throw new Error("GA4 repair created a clean record but could not delete every legacy record.");
    }
  } else if (records[0]?.id) {
    config = await base44.asServiceRole.entities.GA4Configuration.update(records[0].id, payload);
  } else {
    config = await base44.asServiceRole.entities.GA4Configuration.create(payload);
  }

  const verifiedRecords = await base44.asServiceRole.entities.GA4Configuration.filter(
    { measurement_id: GA4_MEASUREMENT_ID },
    "-created_date",
    100,
  ).catch(() => []);

  return {
    success: true,
    migrated: legacySecretDetected,
    config_id: config?.id || null,
    ...summarize(verifiedRecords),
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!isAdmin(user)) {
      return secureJson({ error: "Admin access required", code: "FORBIDDEN" }, { status: 403 });
    }

    const { settings } = await loadAdminSettings(base44);

    let ga4_migration;
    try {
      ga4_migration = await selfHealGa4Configuration(base44);
    } catch (migrationError) {
      ga4_migration = {
        success: false,
        error: migrationError instanceof Error ? migrationError.message : "GA4 repair failed",
      };
    }

    return secureJson({
      success: true,
      settings,
      ga4_migration,
      ga4_status: ga4_migration?.clean === true ? ga4_migration : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load admin settings";
    return secureJson({ error: message }, { status: 500 });
  }
});
