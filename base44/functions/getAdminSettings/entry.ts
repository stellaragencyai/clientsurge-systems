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

function hasLegacySecret(record: Record<string, unknown> | null | undefined) {
  return typeof record?.api_secret === "string" && record.api_secret.trim().length > 0;
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
    notes: "GA4 configuration self-healed through the authenticated Admin Settings fallback. Live Realtime/DebugView verification is still required before marking active.",
  };

  const legacyRecords = records.filter(hasLegacySecret);
  if (legacyRecords.length > 0) {
    const cleanConfig = await base44.asServiceRole.entities.GA4Configuration.create(payload);
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
      throw new Error("GA4 self-heal created a clean record but could not delete every legacy record.");
    }

    return { migrated: true, config_id: cleanConfig.id };
  }

  if (records[0]?.id) {
    const updated = await base44.asServiceRole.entities.GA4Configuration.update(records[0].id, payload);
    return { migrated: false, normalized: true, config_id: updated.id };
  }

  const created = await base44.asServiceRole.entities.GA4Configuration.create(payload);
  return { migrated: false, created: true, config_id: created.id };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return secureJson({ error: "Admin access required", code: "FORBIDDEN" }, { status: 403 });
    }

    const { settings } = await loadAdminSettings(base44);

    let ga4_migration = null;
    try {
      ga4_migration = await selfHealGa4Configuration(base44);
    } catch (migrationError) {
      console.error("[getAdminSettings] GA4 self-heal failed", migrationError);
      ga4_migration = {
        error: migrationError instanceof Error ? migrationError.message : "GA4 self-heal failed",
      };
    }

    return secureJson({ success: true, settings, ga4_migration });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load admin settings";
    return secureJson({ error: message }, { status: 500 });
  }
});