import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const DEFAULTS = {
  sms_enabled: false,
  email_enabled: true,
  marketing_enabled: false,
  appointment_updates: true,
  service_updates: true,
  support_updates: true,
};

function secureJson(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function cleanEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return secureJson({ success: false, error: "Method not allowed" }, 405);

  const requestId = `prefs_read_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const userEmail = cleanEmail(user?.email);
    if (!userEmail) return secureJson({ success: false, error: "Authentication required", request_id: requestId }, 401);

    const context = await base44.asServiceRole.functions.invoke("getClientPortalContext", {}).catch(() => ({ data: {} }));
    const clientId = context?.data?.project?.client_id || context?.data?.order?.client_id || null;

    const filters = clientId ? { client_id: clientId } : { user_email: userEmail };
    const rows = await base44.asServiceRole.entities.CommunicationPreference.filter(filters, "-updated_date", 1).catch(() => []);
    const row = rows?.[0] || null;

    const preferences = row
      ? {
          sms_enabled: row.sms_enabled === true,
          email_enabled: row.email_enabled !== false,
          marketing_enabled: row.marketing_enabled === true,
          appointment_updates: row.appointment_updates !== false,
          service_updates: row.service_updates !== false,
          support_updates: row.support_updates !== false,
        }
      : DEFAULTS;

    return secureJson({
      success: true,
      request_id: requestId,
      record_id: row?.id || null,
      client_id: clientId,
      user_email: userEmail,
      preferences,
      preference_updated_at: row?.preference_updated_at || row?.updated_date || null,
    });
  } catch (error) {
    return secureJson({ success: false, error: error?.message || "Unable to load preferences", request_id: requestId }, 500);
  }
});
