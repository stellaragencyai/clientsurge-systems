import { base44 } from "@/api/base44Client";

const ADMIN_SETTINGS_SYSTEM_FIELDS = new Set([
  "id",
  "created_date",
  "updated_date",
  "created_by",
  "created_by_id",
  "is_sample",
  "_ga4",
]);

export const GA4_MEASUREMENT_ID = "G-H6QT342ZN9";
export const GA4_TRACKED_EVENTS = [
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
export const GA4_KEY_EVENTS = ["generate_lead", "begin_checkout", "purchase", "demo_booked"];

function extractStatus(error) {
  return error?.status || error?.response?.status || error?.data?.status || error?.data?.statusCode || error?.data?.code;
}

function extractErrorText(error) {
  return [error?.message, error?.data?.error, error?.data?.message, error?.response?.data?.error, error?.response?.data?.message]
    .filter(Boolean)
    .join(" ");
}

export function isAdminSettingsFunctionNotFound(error) {
  const status = extractStatus(error);
  const text = extractErrorText(error);
  return status === 404 || /\b404\b|status code 404|not found/i.test(text);
}

export function getAdminSettingsError(error, fallback) {
  if (isAdminSettingsFunctionNotFound(error)) {
    return "The GA4 verification backend is not deployed yet. Publish the latest Base44 backend functions, then retry.";
  }
  return error?.data?.error || error?.response?.data?.error || error?.message || fallback;
}

function getAdminSettingsEntity() {
  const entity = base44?.entities?.AdminSettings;
  if (!entity) throw new Error("AdminSettings entity API is unavailable");
  return entity;
}

function unwrapSettingsPayload(response, fallback = {}) {
  return response?.data?.settings || response?.data || fallback;
}

function unwrapFunctionPayload(response) {
  return response?.data || response || {};
}

function parseGa4Evidence(notes) {
  if (!notes || typeof notes !== "string") return {};
  try {
    const parsed = JSON.parse(notes);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    const verificationId = notes.match(/Verification ID:\s*([a-f0-9-]+)/i)?.[1] || null;
    return verificationId ? { verification_id: verificationId } : {};
  }
}

function summarizeGa4Records(records = []) {
  const config = records?.[0] || null;
  const hasLegacySecret = records.some((record) => typeof record?.api_secret === "string" && record.api_secret.trim());
  const trackedEvents = new Set(config?.tracked_events || []);
  const keyEvents = new Set(config?.conversion_events || []);
  const missingTrackedEvents = GA4_TRACKED_EVENTS.filter((eventName) => !trackedEvents.has(eventName));
  const missingKeyEvents = GA4_KEY_EVENTS.filter((eventName) => !keyEvents.has(eventName));
  const evidence = parseGa4Evidence(config?.notes);
  const canonicalTrackedEvents = missingTrackedEvents.length === 0;
  const canonicalKeyEvents = missingKeyEvents.length === 0;
  const operationallyVerified = Boolean(
    config &&
      config.setup_status === "active" &&
      config.server_side_tracking_enabled === true &&
      config.last_verified_at
  );

  return {
    config,
    record_count: records?.length || 0,
    has_legacy_secret: hasLegacySecret,
    canonical_tracked_events: canonicalTrackedEvents,
    canonical_key_events: canonicalKeyEvents,
    missing_tracked_events: missingTrackedEvents,
    missing_key_events: missingKeyEvents,
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
      config &&
        records.length === 1 &&
        config.measurement_id === GA4_MEASUREMENT_ID &&
        config.enabled === true &&
        config.enhanced_measurement_enabled === true &&
        !hasLegacySecret &&
        canonicalTrackedEvents &&
        canonicalKeyEvents &&
        (config.setup_status === "configured" || config.setup_status === "active")
    ),
  };
}

function sanitizeSettingsForEntity(settings = {}) {
  return Object.fromEntries(Object.entries(settings || {}).filter(([key]) => !ADMIN_SETTINGS_SYSTEM_FIELDS.has(key)));
}

async function fetchAdminSettingsFromEntity() {
  const entity = getAdminSettingsEntity();
  const records = await entity.list("-created_date", 1);
  return records?.[0] || {};
}

async function saveAdminSettingsToEntity(settings) {
  const entity = getAdminSettingsEntity();
  const patch = sanitizeSettingsForEntity(settings);
  const records = await entity.list("-created_date", 1);
  const existing = records?.[0];
  return existing?.id ? entity.update(existing.id, patch) : entity.create(patch);
}

export async function runGa4FinalVerification() {
  let response;
  try {
    response = await base44.functions.invoke("verifyGA4Configuration", {});
  } catch (error) {
    if (!isAdminSettingsFunctionNotFound(error)) throw error;
    response = await base44.functions.invoke("configureGA4Analytics", {
      measurement_id: GA4_MEASUREMENT_ID,
      mode: "verify",
    });
  }
  const data = unwrapFunctionPayload(response);
  if (data?.success === false || data?.verified === false || data?.error) {
    const error = new Error(data?.error || data?.message || "GA4 final verification failed");
    error.data = data;
    throw error;
  }
  return data;
}

export async function fetchGa4ConfigurationStatus() {
  try {
    const response = await base44.functions.invoke("getAdminSettings", {});
    const payload = unwrapFunctionPayload(response);
    if (payload?.ga4_status) return payload.ga4_status;
    if (payload?.ga4_migration?.record_count !== undefined) return payload.ga4_migration;
  } catch (error) {
    if (!isAdminSettingsFunctionNotFound(error)) {
      console.warn("[fetchGa4ConfigurationStatus] backend status read failed", error);
    }
  }

  try {
    const records = await base44.entities.GA4Configuration.filter(
      { measurement_id: GA4_MEASUREMENT_ID },
      "-created_date",
      10,
    );
    return summarizeGa4Records(records || []);
  } catch (error) {
    return {
      config: null,
      record_count: 0,
      has_legacy_secret: null,
      canonical_tracked_events: false,
      canonical_key_events: false,
      missing_tracked_events: GA4_TRACKED_EVENTS,
      missing_key_events: GA4_KEY_EVENTS,
      enabled: false,
      enhanced_measurement_enabled: false,
      setup_status: "not_configured",
      server_side_tracking_enabled: false,
      last_verified_at: null,
      operationally_verified: false,
      verification_id: null,
      production_site_health: null,
      measurement_protocol_validation_status: null,
      measurement_protocol_delivery_status: null,
      clean: false,
      error: error?.message || "Unable to read GA4 status",
    };
  }
}

export async function repairGa4Configuration() {
  const payload = {
    measurement_id: GA4_MEASUREMENT_ID,
    enabled: true,
    enhanced_measurement_enabled: true,
    tracked_events: GA4_TRACKED_EVENTS,
    conversion_events: GA4_KEY_EVENTS,
  };

  const response = await base44.functions.invoke("setupGA4Configuration", payload);
  const data = unwrapFunctionPayload(response);
  if (data?.success === false || data?.error) {
    const error = new Error(data?.error || "GA4 configuration migration failed");
    error.data = data;
    throw error;
  }
  return data;
}

export async function ensureGa4Configuration() {
  const repairResult = await repairGa4Configuration();
  const verification = await runGa4FinalVerification();
  return { ...repairResult, verification };
}

export async function fetchAdminSettings() {
  let settings;
  let backendGa4 = null;
  try {
    const response = await base44.functions.invoke("getAdminSettings", {});
    const payload = unwrapFunctionPayload(response);
    settings = payload?.settings || {};
    backendGa4 = payload?.ga4_status || payload?.ga4_migration || null;
  } catch (error) {
    if (!isAdminSettingsFunctionNotFound(error)) throw error;
    settings = await fetchAdminSettingsFromEntity();
  }

  const ga4Status = backendGa4 || await fetchGa4ConfigurationStatus();
  return { ...settings, _ga4: ga4Status };
}

export async function saveAdminSettings(settings) {
  const sanitized = sanitizeSettingsForEntity(settings);
  try {
    const response = await base44.functions.invoke("updateAdminSettings", { settings: sanitized });
    return { ...unwrapSettingsPayload(response, sanitized), _ga4: settings?._ga4 };
  } catch (error) {
    if (isAdminSettingsFunctionNotFound(error)) {
      const saved = await saveAdminSettingsToEntity(sanitized);
      return { ...saved, _ga4: settings?._ga4 };
    }
    throw error;
  }
}
