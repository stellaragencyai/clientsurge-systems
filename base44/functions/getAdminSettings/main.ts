import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const GA4_MEASUREMENT_ID = "G-H6QT342ZN9";

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

const DEFAULT_ADMIN_SETTINGS = {
  description: "",
  twilio_enabled: false,
  twilio_from_number: "",
  twilio_account_sid_present: false,
  twilio_auth_token_present: false,
  whatsapp_enabled: false,
  whatsapp_from_number: "",
  resend_enabled: false,
  resend_from_email: "",
  gmail_enabled: false,
  gmail_from_email: "",
  lead_notification_email: "",
  booking_link_default: "",
  allowed_admin_ips: [],
  webhook_enabled: false,
  webhook_url: "",
  voice_webhook_url: "",
  sms_webhook_url: "",
  missed_call_webhook_url: "",
  sms_status_callback_url: "",
  last_webhook_test_result: "",
  last_webhook_test_at: "",
  sms_template: "",
  email_confirmation_template: "",
  missed_call_sms_template: "",
  follow_up_day1_sms: "",
  follow_up_day3_sms: "",
  follow_up_day7_sms: "",
  missed_call_followup_email_1: "",
  missed_call_followup_email_2: "",
  follow_up_booking_prompt_sms: "",
  follow_up_booking_prompt_email: "",
  admin_notification_template: "",
  nurture_step1_subject: "",
  nurture_step1_body: "",
  nurture_step2_subject: "",
  nurture_step2_body: "",
  nurture_step3_subject: "",
  nurture_step3_body: "",
  nurture_step4_subject: "",
  nurture_step4_body: "",
  nurture_step5_subject: "",
  nurture_step5_body: "",
  nurture_step6_subject: "",
  nurture_step6_body: "",
  nurture_step7_subject: "",
  nurture_step7_body: "",
  nurture_step8_subject: "",
  nurture_step8_body: "",
  cadence_default_mode: "auto",
  cadence_switch_attempts: 3,
  cadence_pause_on_reply: true,
  cadence_engagement_threshold: 50,
  cadence_max_attempts: 6,
  voice_calls_enabled: false,
  inbound_voice_enabled: false,
  payment_recovery_voice_enabled: false,
  voice_briefing_enabled: false,
  voice_briefing_phone: "",
  voice_forwarding_phone: "",
  elevenlabs_agent_ids: {},
  elevenlabs_phone_number_ids: {},
};

function secureJson(data: Record<string, unknown> = {}, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Frame-Options": "DENY",
      ...(init.headers || {}),
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

function missingEvents(actual: unknown, expected: readonly string[]) {
  const actualSet = new Set(
    Array.isArray(actual) ? actual.map((eventName) => String(eventName || "").trim()) : [],
  );
  return expected.filter((eventName) => !actualSet.has(eventName));
}

function parseGa4Evidence(notes: unknown) {
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

function summarizeGa4Records(records: any[], measurementId = GA4_MEASUREMENT_ID) {
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

async function listGa4ConfigurationRecords(base44: any, limit = 5000) {
  const entity = base44?.asServiceRole?.entities?.GA4Configuration;
  if (!entity) throw new Error("GA4Configuration entity API is unavailable.");
  if (typeof entity.list === "function") return entity.list("-created_date", limit);
  if (typeof entity.filter === "function") return entity.filter({}, "-created_date", limit);
  throw new Error("GA4Configuration entity does not expose list or filter.");
}

function normalizeAdminSettings(record: any = {}) {
  return {
    ...DEFAULT_ADMIN_SETTINGS,
    ...(record || {}),
  };
}

async function loadAdminSettings(base44: any) {
  const records = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
  const record = Array.isArray(records) && records.length > 0 ? records[0] : null;

  return {
    record,
    settings: normalizeAdminSettings(record || {}),
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
    const records = await listGa4ConfigurationRecords(base44).catch(() => []);
    const ga4Status = summarizeGa4Records(records, GA4_MEASUREMENT_ID);

    return secureJson({
      success: true,
      settings,
      ga4_status: ga4Status,
      ga4_migration: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load admin settings";
    return secureJson({ success: false, error: message }, { status: 500 });
  }
});
