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
  { id: "repairing_configuration", label: "Repairing configuration..." },
  { id: "validating_secret_availability", label: "Validating secret availability..." },
  { id: "validating_with_google", label: "Validating with Google..." },
  { id: "sending_verification_event", label: "Sending verification event..." },
  { id: "checking_production_site", label: "Checking production site..." },
  { id: "finalizing", label: "Finalizing..." },
  { id: "ga4_fully_verified", label: "GA4 fully verified" },
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
  error.failed_stage = data?.failed_stage || null;
  error.failed_checks = data?.failed_checks || [];
  return error;
}

export async function runGa4FinalVerification({ onStage } = {}) {
  onStage?.("validating_secret_availability");
  onStage?.("validating_with_google");
  const response = await base44.functions.invoke("verifyGA4Configuration", {
    measurement_id: GA4_MEASUREMENT_ID,
  });
  onStage?.("finalizing");
  const data = unwrapFunctionPayload(response);
  if (data?.success === false || data?.verified === false || data?.error) {
    throw buildGa4FunctionError(data, "GA4 final verification failed");
  }
  onStage?.("ga4_fully_verified");
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

  let repairResult = null;
  let primaryError = null;
  try {
    onStage?.("repairing_configuration");
    const response = await base44.functions.invoke("setupGA4Configuration", payload);
    const data = unwrapFunctionPayload(response);
    if (data?.success === false || data?.error) throw buildGa4FunctionError(data, "GA4 configuration migration failed");
    repairResult = data;
  } catch (error) {
    primaryError = error;
  }

  if (!repairResult) {
    try {
      const status = await fetchGa4ConfigurationStatus();
      if (status?.clean) {
        repairResult = { already_clean: true, ...status };
      }
    } catch (fallbackError) {
      const primaryMessage = getAdminSettingsError(primaryError, "Primary GA4 repair failed");
      const fallbackMessage = getAdminSettingsError(fallbackError, "Unable to read current GA4 status");
      throw new Error(`${primaryMessage} ${fallbackMessage}`.trim());
    }
  }

  if (!repairResult) {
    throw new Error(getAdminSettingsError(primaryError, "GA4 repair did not complete"));
  }

  const verification = await runGa4FinalVerification({ onStage });
  return { repair: repairResult, verification };
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
