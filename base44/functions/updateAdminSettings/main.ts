import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { secureJson } from "../_shared/response.ts";
import { saveAdminSettings } from "../_shared/adminSettings.js";

function numericFieldError(settings, field, min, max) {
  if (settings[field] === undefined || settings[field] === null || settings[field] === "") {
    return null;
  }

  const value = Number(settings[field]);
  if (!Number.isFinite(value) || value < min || value > max) {
    return `${field} must be between ${min} and ${max}`;
  }

  settings[field] = value;
  return null;
}

function validateAdminSettings(settings) {
  return (
    numericFieldError(settings, "cadence_max_attempts", 2, 20) ||
    numericFieldError(settings, "cadence_switch_attempts", 1, 10) ||
    numericFieldError(settings, "cadence_engagement_threshold", 0, 100)
  );
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);

    let user;
    try {
      user = await base44.auth.me();
    } catch {
      user = null;
    }

    if (!user) {
      return secureJson({ error: "Unauthorized: User not authenticated" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return secureJson({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));
    const settings = payload?.settings || payload;

    if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
      return secureJson({ error: "Missing settings object" }, { status: 400 });
    }

    const validationError = validateAdminSettings(settings);
    if (validationError) {
      return secureJson({ error: validationError }, { status: 400 });
    }

    const savedSettings = await saveAdminSettings({
      base44,
      actor: user,
      patch: settings,
    });

    console.log(`Settings updated by ${user.email}: ${Object.keys(settings).join(", ")}`);

    return secureJson({
      success: true,
      settings: savedSettings,
    });
  } catch (error) {
    console.error("updateAdminSettings error:", error);
    const message = error instanceof Error ? error.message : "Failed to update settings";
    return secureJson({ error: message }, { status: 500 });
  }
});
