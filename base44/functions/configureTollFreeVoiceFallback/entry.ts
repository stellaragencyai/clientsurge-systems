import { createClientFromRequest } from "npm:@base44/sdk@0.8.39";

const FALLBACK_FORWARDING_NUMBER = "+16025874608";

function normalizePhoneE164(phone: unknown) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
  return null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return json({ error: "Admin access required" }, 403);
    }

    const normalizedFallback = normalizePhoneE164(FALLBACK_FORWARDING_NUMBER);
    if (!normalizedFallback) {
      return json({ error: "Configured fallback number is invalid" }, 500);
    }

    const settingsList = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
    const settings = settingsList?.[0];
    if (!settings?.id) {
      return json({ error: "AdminSettings record not found" }, 404);
    }

    await base44.asServiceRole.entities.AdminSettings.update(settings.id, {
      inbound_voice_enabled: false,
      voice_forwarding_phone: normalizedFallback,
      voice_webhook_url: "https://clientsurgesystems.com/functions/receiveInboundVoiceCall",
    });

    const updated = await base44.asServiceRole.entities.AdminSettings.get(settings.id);

    return json({
      success: true,
      mode: "non_ai_forwarding",
      inbound_voice_enabled: updated?.inbound_voice_enabled === true,
      voice_forwarding_phone: updated?.voice_forwarding_phone || null,
      voice_webhook_url: updated?.voice_webhook_url || null,
      expected_behavior: "Inbound calls receive the ClientSurge greeting and are forwarded to the configured personal number.",
    });
  } catch (error) {
    console.error("[configureTollFreeVoiceFallback]", error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
