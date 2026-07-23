import { createClientFromRequest } from "npm:@base44/sdk@0.8.39";

const TOLL_FREE_NUMBER = "+18778123630";
const EXPECTED_VOICE_WEBHOOK = "https://clientsurgesystems.com/functions/receiveInboundVoiceCall";
const EXPECTED_SMS_WEBHOOK = "https://clientsurgesystems.com/functions/receiveTwilioInboundSms";
const EXPECTED_STATUS_CALLBACK = "https://clientsurgesystems.com/functions/receiveTwilioSmsStatusCallback";

function bool(value: unknown) {
  return value === true;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "GET" && req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return json({ error: "Admin access required" }, 403);
    }

    const settingsList = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
    const settings = settingsList?.[0] || {};

    const registryRows = await base44.asServiceRole.entities.TwilioPhoneNumber.filter(
      { phone_number: TOLL_FREE_NUMBER, active: true },
      "-created_date",
      5,
    ).catch(() => []);
    const registry = registryRows?.[0] || null;

    const receptionistAgentId =
      settings?.elevenlabs_agent_ids?.receptionist ||
      settings?.elevenlabs_agent_ids?.general ||
      Deno.env.get("ELEVENLABS_AGENT_ID") ||
      "";

    const checks = {
      registry_present: Boolean(registry),
      registry_approved: registry?.approval_status === "approved",
      registry_automation_allowed: registry?.automated_sending_allowed === true,
      registry_voice_enabled: registry?.voice_enabled === true,
      voice_webhook_correct: settings?.voice_webhook_url === EXPECTED_VOICE_WEBHOOK,
      sms_webhook_correct: settings?.sms_webhook_url === EXPECTED_SMS_WEBHOOK,
      status_callback_correct: settings?.sms_status_callback_url === EXPECTED_STATUS_CALLBACK,
      inbound_voice_enabled: bool(settings?.inbound_voice_enabled),
      elevenlabs_agent_configured: Boolean(receptionistAgentId),
      forwarding_number_configured: Boolean(settings?.voice_forwarding_phone),
      twilio_account_sid_present: Boolean(Deno.env.get("TWILIO_ACCOUNT_SID")),
      twilio_auth_token_present: Boolean(Deno.env.get("TWILIO_AUTH_TOKEN")),
      elevenlabs_api_key_present: Boolean(Deno.env.get("ELEVENLABS_API_KEY")),
    };

    const requiredForAi = [
      "registry_present",
      "registry_approved",
      "registry_automation_allowed",
      "registry_voice_enabled",
      "voice_webhook_correct",
      "inbound_voice_enabled",
      "elevenlabs_agent_configured",
      "twilio_account_sid_present",
      "twilio_auth_token_present",
    ];

    const aiReady = requiredForAi.every((key) => checks[key as keyof typeof checks] === true);
    const missingRequired = requiredForAi.filter((key) => checks[key as keyof typeof checks] !== true);

    return json({
      success: true,
      number: TOLL_FREE_NUMBER,
      ai_receptionist_ready: aiReady,
      missing_required: missingRequired,
      checks,
      expected_routes: {
        voice: EXPECTED_VOICE_WEBHOOK,
        sms: EXPECTED_SMS_WEBHOOK,
        status_callback: EXPECTED_STATUS_CALLBACK,
      },
      behavior: aiReady
        ? "Inbound calls are eligible for ElevenLabs AI handoff."
        : "Inbound calls will use the configured fallback path until all required checks pass.",
      secrets_redacted: true,
    });
  } catch (error) {
    console.error("[auditTollFreeAiReceptionist]", error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
