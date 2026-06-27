/**
 * testVoiceWebhookHealth — Admin health-check for the Twilio Voice webhook.
 *
 * Verifies that /api/receiveInboundVoiceCall:
 *   1. Returns HTTP 200
 *   2. Has Content-Type: text/xml
 *   3. Contains a root <Response> element
 *
 * Also checks internal config: inbound_voice_enabled, ElevenLabs agent, forwarding phone.
 * Does NOT place a real phone call — use a real Twilio call for end-to-end proof.
 *
 * Usage: invoke from admin dashboard or mission control.
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...(init.headers || {}),
    },
  });
}

function normalizePhoneE164(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits[0] === "1") return `+${digits}`;
  if (digits.length > 11) return `+${digits}`;
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return secureJson({ error: "Admin only" }, { status: 403 });
    }

    const now = new Date().toISOString();

    // ── Load AdminSettings ──
    let settings = null;
    try {
      const list = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
      settings = list?.[0] || null;
    } catch (err) {
      return secureJson({
        success: false,
        error: `Failed to load AdminSettings: ${err.message}`,
        checked_at: now,
      }, { status: 500 });
    }

    const voiceWebhookUrl = settings?.voice_webhook_url || settings?.webhook_url || "";
    const inboundVoiceEnabled = settings?.inbound_voice_enabled === true;
    const elevenLabsAgentId =
      settings?.elevenlabs_agent_ids?.receptionist ||
      settings?.elevenlabs_agent_ids?.general ||
      Deno.env.get("ELEVENLABS_AGENT_ID") ||
      "";
    const envForwarding = Deno.env.get("ADMIN_NOTIFICATION_PHONE") || "";
    const forwardingPhone = normalizePhoneE164(settings?.voice_forwarding_phone || envForwarding);
    const twilioFromNumber = settings?.twilio_from_number || Deno.env.get("TWILIO_PHONE_NUMBER") || "";

    // ── Config checks ──
    const configChecks = {
      voice_webhook_url_configured: !!voiceWebhookUrl,
      inbound_voice_enabled: inboundVoiceEnabled,
      elevenlabs_agent_configured: !!elevenLabsAgentId,
      forwarding_phone_configured: !!forwardingPhone,
      twilio_from_number_configured: !!twilioFromNumber,
    };

    // ── TwiML health check: GET the webhook URL ──
    let twimlHealth = {
      tested: false,
      http_status: null,
      content_type: null,
      has_response_root: false,
      body_preview: null,
      error: null,
    };

    if (voiceWebhookUrl) {
      try {
        const resp = await fetch(voiceWebhookUrl, {
          method: "GET",
          headers: { "User-Agent": "ClientSurge-VoiceHealthCheck/1.0" },
          redirect: "follow",
        });

        const body = await resp.text();
        const ct = resp.headers.get("content-type") || "";

        twimlHealth.tested = true;
        twimlHealth.http_status = resp.status;
        twimlHealth.content_type = ct;
        twimlHealth.body_preview = body.substring(0, 500);
        twimlHealth.has_response_root = /<Response[\s>]/i.test(body);

        if (!ct.includes("text/xml") && !ct.includes("application/xml")) {
          twimlHealth.error = `Content-Type is "${ct}", expected text/xml`;
        } else if (!twimlHealth.has_response_root) {
          twimlHealth.error = "Response body does not contain a <Response> root element";
        } else if (resp.status !== 200) {
          twimlHealth.error = `HTTP status ${resp.status}, expected 200`;
        }
      } catch (err) {
        twimlHealth.tested = true;
        twimlHealth.error = `Fetch failed: ${err.message}`;
      }
    }

    // ── Check for real (non-smoke) voice CommunicationEvent ──
    let voiceProof = {
      has_voice_event: false,
      has_real_call_event: false,
      latest_event_date: null,
      latest_event_sid: null,
    };
    try {
      const voiceEvents = await base44.asServiceRole.entities.CommunicationEvent.filter(
        { channel: "voice", provider: "twilio" },
        "-created_date",
        5
      );
      if (voiceEvents?.length > 0) {
        const latest = voiceEvents[0];
        const isSmoke =
          latest.provider_message_id?.startsWith("CA_TEST") ||
          latest.provider_message_id?.startsWith("SMOKE");
        voiceProof.has_voice_event = true;
        voiceProof.has_real_call_event = !isSmoke;
        voiceProof.latest_event_date = latest.created_date;
        voiceProof.latest_event_sid = latest.provider_message_id;
      }
    } catch (_) {}

    // ── Overall verdict ──
    const twimlHealthy = twimlHealth.tested && !twimlHealth.error;
    const realCallProof = voiceProof.has_real_call_event;
    const aiHandoffReady = inboundVoiceEnabled && !!elevenLabsAgentId;

    const overallHealthy = configChecks.voice_webhook_url_configured && twimlHealthy;
    const fullyReady = overallHealthy && realCallProof;

    return secureJson({
      success: true,
      checked_at: now,
      webhook_url: voiceWebhookUrl,
      config: configChecks,
      twiml_health: twimlHealth,
      voice_proof: voiceProof,
      ai_handoff: {
        inbound_voice_enabled: inboundVoiceEnabled,
        elevenlabs_agent_id: elevenLabsAgentId ? "[SET]" : null,
        ready: aiHandoffReady,
      },
      forwarding_phone: forwardingPhone ? "[SET]" : null,
      verdict: {
        webhook_configured: configChecks.voice_webhook_url_configured,
        twiml_healthy: twimlHealthy,
        real_call_proof: realCallProof,
        ai_handoff_configured: aiHandoffReady,
        overall: fullyReady ? "READY" : overallHealthy ? "CONFIGURED — awaiting real call proof" : "NOT HEALTHY",
      },
    });
  } catch (error) {
    console.error("[testVoiceWebhookHealth] Error:", error.message);
    return secureJson({ success: false, error: error.message }, { status: 500 });
  }
});