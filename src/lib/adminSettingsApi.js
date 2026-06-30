import { base44 } from "@/api/base44Client";

const ADMIN_SETTINGS_SYSTEM_FIELDS = new Set([
  "id",
  "created_date",
  "updated_date",
  "created_by",
  "created_by_id",
  "is_sample",
]);

function extractStatus(error) {
  return (
    error?.status ||
    error?.response?.status ||
    error?.data?.status ||
    error?.data?.statusCode ||
    error?.data?.code
  );
}

function extractErrorText(error) {
  return [
    error?.message,
    error?.data?.error,
    error?.data?.message,
    error?.response?.data?.error,
    error?.response?.data?.message,
  ]
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
  const entity =
    base44?.entities?.AdminSettings ||
    base44?.asServiceRole?.entities?.AdminSettings;

  if (!entity) {
    throw new Error("AdminSettings entity API is unavailable");
  }

  return entity;
}

function unwrapSettingsPayload(response, fallback = {}) {
  return response?.data?.settings || response?.data || fallback;
}

function sanitizeSettingsForEntity(settings = {}) {
  return Object.fromEntries(
    Object.entries(settings || {}).filter(([key]) => !ADMIN_SETTINGS_SYSTEM_FIELDS.has(key))
  );
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

  if (existing?.id) {
    return entity.update(existing.id, patch);
  }

  return entity.create(patch);
}

export async function fetchAdminSettings() {
  try {
    const response = await base44.functions.invoke("getAdminSettings", {});
    return unwrapSettingsPayload(response, {});
  } catch (error) {
    if (isAdminSettingsFunctionNotFound(error)) {
      return fetchAdminSettingsFromEntity();
    }

    throw error;
  }
}

export async function saveAdminSettings(settings) {
  try {
    const response = await base44.functions.invoke("updateAdminSettings", { settings });
    return unwrapSettingsPayload(response, settings);
  } catch (error) {
    if (isAdminSettingsFunctionNotFound(error)) {
      return saveAdminSettingsToEntity(settings);
    }

    throw error;
  }
}
