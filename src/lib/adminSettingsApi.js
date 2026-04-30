import { base44 } from "@/api/base44Client";

export function getAdminSettingsError(error, fallback) {
  return error?.data?.error || error?.message || fallback;
}

export async function fetchAdminSettings() {
  const response = await base44.functions.invoke("getAdminSettings", {});
  return response?.data || {};
}

export async function saveAdminSettings(settings) {
  const response = await base44.functions.invoke("updateAdminSettings", settings);
  return response?.data || settings;
}