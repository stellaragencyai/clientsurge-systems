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
export const GA4_REPAIR_STAGES = [
  { id: "entity_cleanup", label: "Repairing configuration..." },
  { id: "secret_validation", label: "Checking secrets..." },
  { id: "google_validation", label: "Validating Google Analytics..." },
  { id: "production_security", label: "Checking production..." },
  { id: "final_activation", label: "Finalizing..." },
  { id: "ga4_fully_verified", label: "GA4 Fully Verified" },
];

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
  const entity = base44?.entities?.AdminSettings || base44?.asServiceRole?.entities?.AdminSettings;
  if (!entity) throw new Error("AdminSettings entity API is unavailable");
  return entity;
}

function unwrapSettingsPayload(response, fallback = {}) {
  return response?.data?.settings || response?.data || fallback;
}

function unwrapFunctionPayload(response) {
  return response?.data || response || {};
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

function buildGa4FunctionError(data, fallback) {
  const error = new Error(data?.error || data?.message || fallback);
  error.data = data;
  error.stage = data?.stage || data?.failed_stage || null;
  error.failed_stage = data?.failed_stage || data?.stage || null;
  error.failed_checks = data?.failed_checks || [];
  return error;
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
    const records = await base44.entities.GA4Configuration.list("-created_date", 10);
    const config = records?.[0] || null;
    const hasLegacySecret = Boolean(config && typeof config.api_secret === "string" && config.api_secret.trim());
    const keyEvents = new Set(config?.conversion_events || []);
    const canonicalKeyEvents = GA4_KEY_EVENTS.every((eventName) => keyEvents.has(eventName));
    const trackedEvents = new Set(config?.tracked_events || []);
    const canonicalTrackedEvents = GA4_TRACKED_EVENTS.every((eventName) => trackedEvents.has(eventName));
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
      operationally_verified: operationallyVerified,
      clean: Boolean(
        config &&
        records.length === 1 &&
        !hasLegacySecret &&
        canonicalTrackedEvents &&
        canonicalKeyEvents &&
        (config.setup_status === "configured" || config.setup_status === "active")
      ),
    };
  } catch (error) {
    return {
      config: null,
      record_count: 0,
      has_legacy_secret: null,
      canonical_key_events: false,
      operationally_verified: false,
      clean: false,
      error: error?.message || "Unable to read GA4 status",
    };
  }
}

export async function ensureGa4Configuration({ onStage } = {}) {
  const payload = {
    measurement_id: GA4_MEASUREMENT_ID,
    enabled: true,
    enhanced_measurement_enabled: true,
    tracked_events: GA4_TRACKED_EVENTS,
    conversion_events: GA4_KEY_EVENTS,
  };

  try {
    onStage?.("entity_cleanup");
    const response = await base44.functions.invoke("setupGA4Configuration", payload);
    onStage?.("final_activation");
    const data = unwrapFunctionPayload(response);
    if (data?.success === false || data?.verified === false || data?.error) {
      throw buildGa4FunctionError(data, "GA4 verification failed");
    }
    onStage?.("ga4_fully_verified");
    return { repair: data?.repair || null, verification: data };
  } catch (error) {
    if (error?.data || error?.stage || error?.failed_stage) {
      throw error;
    }
    const wrapped = new Error(getAdminSettingsError(error, "GA4 verification failed"));
    wrapped.data = error?.data || null;
    wrapped.stage = error?.stage || error?.data?.stage || error?.data?.failed_stage || null;
    wrapped.failed_stage = wrapped.stage;
    throw wrapped;
  }
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
  const preservedGa4Status = settings?._ga4;
  settings = sanitizeSettingsForEntity(settings);
  try {
    const response = await base44.functions.invoke("updateAdminSettings", { settings });
    return { ...unwrapSettingsPayload(response, settings), _ga4: preservedGa4Status };
  } catch (error) {
    if (isAdminSettingsFunctionNotFound(error)) {
      const saved = await saveAdminSettingsToEntity(settings);
      return { ...saved, _ga4: preservedGa4Status };
    }
    throw error;
  }
}
