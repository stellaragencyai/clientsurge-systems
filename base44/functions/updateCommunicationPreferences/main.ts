import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const ALLOWED_KEYS = [
  "sms_enabled",
  "email_enabled",
  "marketing_enabled",
  "appointment_updates",
  "service_updates",
  "support_updates",
];

function secureJson(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function cleanEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function pickPreferences(input = {}) {
  const out = {};
  for (const key of ALLOWED_KEYS) out[key] = input[key] === true;
  return out;
}

function changedFields(before, after) {
  return ALLOWED_KEYS.filter((key) => before?.[key] !== after?.[key]);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return secureJson({ success: false, error: "Method not allowed" }, 405);

  const requestId = `prefs_write_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const userEmail = cleanEmail(user?.email);
    if (!userEmail) return secureJson({ success: false, error: "Authentication required", request_id: requestId }, 401);

    const body = await req.json().catch(() => ({}));
    const next = pickPreferences(body?.preferences || body);

    const context = await base44.asServiceRole.functions.invoke("getClientPortalContext", {}).catch(() => ({ data: {} }));
    const clientId = context?.data?.project?.client_id || context?.data?.order?.client_id || null;
    const filters = clientId ? { client_id: clientId } : { user_email: userEmail };
    const rows = await base44.asServiceRole.entities.CommunicationPreference.filter(filters, "-updated_date", 1).catch(() => []);
    const existing = rows?.[0] || null;

    const previous = existing
      ? {
          sms_enabled: existing.sms_enabled === true,
          email_enabled: existing.email_enabled !== false,
          marketing_enabled: existing.marketing_enabled === true,
          appointment_updates: existing.appointment_updates !== false,
          service_updates: existing.service_updates !== false,
          support_updates: existing.support_updates !== false,
        }
      : {
          sms_enabled: false,
          email_enabled: true,
          marketing_enabled: false,
          appointment_updates: true,
          service_updates: true,
          support_updates: true,
        };

    const now = new Date().toISOString();
    const payload = {
      ...next,
      client_id: clientId,
      user_email: userEmail,
      consent_source: "client_dashboard_settings",
      consent_version: "client_preferences_v1_2026-07-11",
      preference_updated_at: now,
      updated_by_user_id: user?.id || null,
      sms_opt_out_at: previous.sms_enabled && !next.sms_enabled ? now : existing?.sms_opt_out_at || null,
      email_opt_out_at: previous.email_enabled && !next.email_enabled ? now : existing?.email_opt_out_at || null,
      marketing_opt_in_at: !previous.marketing_enabled && next.marketing_enabled ? now : existing?.marketing_opt_in_at || null,
    };

    const saved = existing
      ? await base44.asServiceRole.entities.CommunicationPreference.update(existing.id, payload)
      : await base44.asServiceRole.entities.CommunicationPreference.create(payload);

    const changed = changedFields(previous, next);
    await base44.asServiceRole.entities.CommunicationPreferenceHistory.create({
      client_id: clientId,
      user_email: userEmail,
      source: "client_dashboard_settings",
      consent_version: payload.consent_version,
      previous_preferences_json: JSON.stringify(previous),
      current_preferences_json: JSON.stringify(next),
      changed_fields: changed,
      changed_at: now,
      changed_by_user_id: user?.id || null,
      request_id: requestId,
    });

    await base44.asServiceRole.entities.CommunicationEvent.create({
      client_id: clientId,
      channel: "internal",
      direction: "system",
      event_type: "communication_preferences_updated",
      provider: "internal",
      status: "processed",
      subject: "Client communication preferences updated",
      message_body: `Updated fields: ${changed.join(", ") || "none"}`,
      context_type: "client_preferences",
      context_id: saved?.id || requestId,
      metadata_json: JSON.stringify({ request_id: requestId, user_email: userEmail, changed_fields: changed }),
    }).catch(() => {});

    return secureJson({
      success: true,
      request_id: requestId,
      record_id: saved?.id || existing?.id || null,
      preferences: next,
      changed_fields: changed,
      preference_updated_at: now,
    });
  } catch (error) {
    return secureJson({ success: false, error: error?.message || "Unable to save preferences", request_id: requestId }, 500);
  }
});
