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
    return "Admin settings backend function is missing or not deployed. Re-publish the Base44 backend functions from GitHub.";
  }
  return error?.data?.error || error?.response?.data?.error || error?.message || fallback;
}

function getAdminSettingsEntity() {
  const entity = base44?.entities?.AdminSettings || base44?.asServiceRole?.entities?.AdminSettings;
  if (!entity) throw new Error("AdminSettings entity API is unavailable");
  return entity;
}

function unwrapSettingsPayload(response, fallback = {}) {
  return response?.data?.settings || response?.data || fallback;
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

export async function ensureGa4Configuration() {
  const payload = {
    measurement_id: GA4_MEASUREMENT_ID,
    enabled: true,
    enhanced_measurement_enabled: true,
    tracked_events: GA4_TRACKED_EVENTS,
    conversion_events: GA4_KEY_EVENTS,
  };

  const response = await base44.functions.invoke("setupGA4Configuration", payload);
  const data = response?.data || response || {};
  if (data?.success === false || data?.error) throw new Error(data?.error || "GA4 configuration migration failed");
  return data;
}

export async function fetchGa4ConfigurationStatus() {
  try {
    const records = await base44.entities.GA4Configuration.filter(
      { measurement_id: GA4_MEASUREMENT_ID },
      "-created_date",
      10,
    );
    const config = records?.[0] || null;
    const hasLegacySecret = Boolean(config && typeof config.api_secret === "string" && config.api_secret.trim());
    const keyEvents = new Set(config?.conversion_events || []);
    const canonicalKeyEvents = GA4_KEY_EVENTS.every((eventName) => keyEvents.has(eventName));
    return {
      config,
      record_count: records?.length || 0,
      has_legacy_secret: hasLegacySecret,
      canonical_key_events: canonicalKeyEvents,
      clean: Boolean(config && !hasLegacySecret && canonicalKeyEvents && config.setup_status === "configured"),
    };
  } catch (error) {
    return { config: null, record_count: 0, has_legacy_secret: null, canonical_key_events: false, clean: false, error: error?.message || "Unable to read GA4 status" };
  }
}

export async function fetchAdminSettings() {
  let settings;
  try {
    const response = await base44.functions.invoke("getAdminSettings", {});
    settings = unwrapSettingsPayload(response, {});
  } catch (error) {
    if (!isAdminSettingsFunctionNotFound(error)) throw error;
    settings = await fetchAdminSettingsFromEntity();
  }

  let migration = null;
  try {
    migration = await ensureGa4Configuration();
  } catch (error) {
    migration = { success: false, error: error?.message || "GA4 migration failed" };
  }
  const ga4Status = await fetchGa4ConfigurationStatus();
  return { ...settings, _ga4: { migration, ...ga4Status } };
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
