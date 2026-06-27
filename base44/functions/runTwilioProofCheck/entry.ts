/**
 * runTwilioProofCheck — Evidence-based Twilio/Voice launch gate proof runner.
 *
 * Checks ONLY real runtime conditions — never marks proof_passed without evidence.
 * Updates LaunchGate records for twilio_sms_gate and twilio_voice_gate.
 *
 * Voice gate now validates:
 *   a) Twilio credentials present
 *   b) Voice webhook URL configured in AdminSettings
 *   c) TwiML health: GET the webhook URL → 200 + text/xml + <Response> root
 *   d) ElevenLabs agent configured (for AI handoff readiness)
 *   e) Real (non-smoke) voice CommunicationEvent exists (real inbound call proof)
 *   f) Voice webhook last_triggered_at recorded
 *
 * The gate clearly distinguishes: configured, TwiML healthy, real-call proof, AI handoff.
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

function normalizePhoneE164(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits[0] === "1") return `+${digits}`;
  if (digits.length > 11) return `+${digits}`;
  return null;
}

const SELF_NUMBER = "+16025843227";

function isSelfNumber(phone) {
  const norm = normalizePhoneE164(phone);
  if (!norm) return false;
  return norm === normalizePhoneE164(SELF_NUMBER);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return Response.json({ error: "Admin only" }, { status: 403 });
    }

    const now = new Date().toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // ── Credential checks ──
    const hasAccountSid = !!Deno.env.get("TWILIO_ACCOUNT_SID");
    const hasAuthToken = !!Deno.env.get("TWILIO_AUTH_TOKEN");
    const hasFromNumber = !!Deno.env.get("TWILIO_PHONE_NUMBER");
    const hasElevenLabsAgent = !!Deno.env.get("ELEVENLABS_AGENT_ID");
    const twilioCredsOk = hasAccountSid && hasAuthToken && hasFromNumber;

    // ── Load AdminSettings ──
    let settings = null;
    try {
      const [s] = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
      settings = s || null;
    } catch (_) {}

    const voiceWebhookUrl = settings?.voice_webhook_url || settings?.webhook_url || "";
    const inboundVoiceEnabled = settings?.inbound_voice_enabled === true;
    const agentIdFromSettings =
      settings?.elevenlabs_agent_ids?.receptionist ||
      settings?.elevenlabs_agent_ids?.general || null;
    const voiceAgentConfigured = hasElevenLabsAgent || !!agentIdFromSettings;

    // ── SMS CommunicationEvent check ──
    let latestSmsEvent = null;
    try {
      const smsEvents = await base44.asServiceRole.entities.CommunicationEvent.filter(
        { channel: "sms", provider: "twilio" }, "-created_date", 1
      );
      latestSmsEvent = smsEvents?.[0] || null;
    } catch (_) {}

    const smsEventWithin30Days = latestSmsEvent && latestSmsEvent.created_date > thirtyDaysAgo;

    // ── Voice CommunicationEvent check ──
    let latestVoiceEvent = null;
    let voiceEvents = [];
    try {
      voiceEvents = await base44.asServiceRole.entities.CommunicationEvent.filter(
        { channel: "voice", provider: "twilio" }, "-created_date", 5
      );
      latestVoiceEvent = voiceEvents?.[0] || null;
    } catch (_) {}

    const isLatestSmoke = latestVoiceEvent?.provider_message_id?.startsWith("CA_TEST")
      || latestVoiceEvent?.provider_message_id?.startsWith("SMOKE");
    const voiceEventExists = !!latestVoiceEvent;
    const realCallProof = voiceEventExists && !isLatestSmoke;

    // ── WebhookRegistration checks ──
    const SMS_SOURCE_NAME_ALIASES = new Set([
      "twilio_sms", "sms_inbound", "inbound_sms", "missed_call_textback", "missed_call_text_back",
    ]);
    let smsWebhookReg = null;
    let voiceWebhookReg = null;
    try {
      const regs = await base44.asServiceRole.entities.WebhookRegistration.list("-created_date", 50);
      smsWebhookReg = regs?.find(r => SMS_SOURCE_NAME_ALIASES.has(r.source_name)) || null;
      voiceWebhookReg = regs?.find(r => r.source_name === "twilio_voice") || null;
    } catch (_) {}

    const smsWebhookActive = smsWebhookReg?.status === "active";
    const voiceWebhookTriggered = !!voiceWebhookReg?.last_triggered_at;

    // ── TwiML health check: GET the voice webhook URL ──
    let twimlHealth = {
      tested: false,
      http_status: null,
      content_type: null,
      has_response_root: false,
      error: null,
    };
    if (voiceWebhookUrl) {
      try {
        const resp = await fetch(voiceWebhookUrl, {
          method: "GET",
          headers: { "User-Agent": "ClientSurge-ProofCheck/1.0" },
          redirect: "follow",
        });
        const body = await resp.text();
        const ct = resp.headers.get("content-type") || "";
        twimlHealth.tested = true;
        twimlHealth.http_status = resp.status;
        twimlHealth.content_type = ct;
        twimlHealth.has_response_root = /<Response[\s>]/i.test(body);
        if (!ct.includes("text/xml") && !ct.includes("application/xml")) {
          twimlHealth.error = `Content-Type "${ct}" is not text/xml`;
        } else if (!twimlHealth.has_response_root) {
          twimlHealth.error = "No <Response> root in body";
        } else if (resp.status !== 200) {
          twimlHealth.error = `HTTP ${resp.status}, expected 200`;
        }
      } catch (err) {
        twimlHealth.tested = true;
        twimlHealth.error = `Fetch failed: ${err.message}`;
      }
    }
    const twimlHealthy = twimlHealth.tested && !twimlHealth.error;

    // ── Score SMS gate ──
    const smsChecks = [
      { label: "Twilio credentials present", passed: twilioCredsOk },
      { label: "SMS CommunicationEvent within 30 days", passed: !!smsEventWithin30Days },
      { label: "SMS WebhookRegistration active", passed: smsWebhookActive },
    ];
    const smsPassedCount = smsChecks.filter(c => c.passed).length;
    const smsCompletionPct = Math.round((smsPassedCount / smsChecks.length) * 100);
    const smsProofPct = smsEventWithin30Days ? smsCompletionPct : 0;
    const smsGateStatus = smsPassedCount === smsChecks.length ? "ready_for_proof" : "blocked";
    const smsMissingItems = smsChecks.filter(c => !c.passed).map(c => c.label);
    const smsBlocker = smsMissingItems.length > 0
      ? `Missing: ${smsMissingItems.join("; ")}`
      : "All SMS checks passed — awaiting manual approval";

    // ── Score Voice gate (6 checks) ──
    const voiceChecks = [
      { label: "Twilio credentials present", passed: twilioCredsOk },
      { label: "Voice webhook URL configured", passed: !!voiceWebhookUrl },
      { label: "TwiML health (200 + text/xml + <Response>)", passed: twimlHealthy },
      { label: "ElevenLabs agent configured (AI handoff)", passed: voiceAgentConfigured },
      { label: "Real (non-smoke) voice CommunicationEvent", passed: realCallProof },
      { label: "Voice webhook last_triggered_at recorded", passed: voiceWebhookTriggered },
    ];
    const voicePassedCount = voiceChecks.filter(c => c.passed).length;
    const voiceCompletionPct = Math.round((voicePassedCount / voiceChecks.length) * 100);
    const voiceProofPct = (twimlHealthy && realCallProof && voiceWebhookTriggered)
      ? voiceCompletionPct
      : (twimlHealthy ? Math.round(voiceCompletionPct * 0.5) : 0);

    // Gate status: blocked if TwiML not healthy or creds missing; proof_passed only with real call proof
    let voiceGateStatus;
    if (!twilioCredsOk || !voiceWebhookUrl || !twimlHealthy) {
      voiceGateStatus = "blocked";
    } else if (realCallProof && voiceWebhookTriggered) {
      voiceGateStatus = "proof_passed";
    } else {
      voiceGateStatus = "ready_for_proof";
    }

    const voiceMissingItems = voiceChecks.filter(c => !c.passed).map(c => c.label);
    const voiceBlocker = voiceMissingItems.length > 0
      ? `Missing: ${voiceMissingItems.join("; ")}`
      : "All voice checks passed";

    // ── Build evidence summaries ──
    const smsEvidenceSummary = [
      `Twilio credentials: ${twilioCredsOk ? "PRESENT" : "MISSING"}`,
      `Latest SMS CommunicationEvent: ${latestSmsEvent ? latestSmsEvent.created_date : "NONE"}`,
      `SMS WebhookRegistration: ${smsWebhookReg ? smsWebhookReg.status : "NOT FOUND"}`,
    ].join(" | ");

    const voiceEventLabel = latestVoiceEvent
      ? `${latestVoiceEvent.created_date} (sid=${latestVoiceEvent.provider_message_id}, ${isLatestSmoke ? "SMOKE — not real" : "REAL CALL"})`
      : "NONE — webhook never hit";

    const voiceEvidenceSummary = [
      `Twilio credentials: ${twilioCredsOk ? "PRESENT" : "MISSING"}`,
      `Voice webhook URL: ${voiceWebhookUrl || "NOT CONFIGURED"}`,
      `TwiML health: ${twimlHealth.tested ? (twimlHealth.error ? `FAIL — ${twimlHealth.error}` : `OK (HTTP ${twimlHealth.http_status}, ${twimlHealth.content_type})`) : "NOT TESTED"}`,
      `ElevenLabs agent (AI handoff): ${voiceAgentConfigured ? "CONFIGURED" : "MISSING"}`,
      `Latest voice CommunicationEvent: ${voiceEventLabel}`,
      `Voice webhook last_triggered_at: ${voiceWebhookReg?.last_triggered_at || "NEVER"}`,
      `Real live inbound call: ${realCallProof ? "PROVEN" : "NOT YET TESTED"}`,
    ].join(" | ");

    // ── Update LaunchGate records ──
    const launchGates = await base44.asServiceRole.entities.LaunchGate.list("", 50);
    const smsDatabaseGate = launchGates?.find(g => g.gate_key === "twilio_sms_gate");
    const voiceDatabaseGate = launchGates?.find(g => g.gate_key === "twilio_voice_gate");

    if (smsDatabaseGate) {
      await base44.asServiceRole.entities.LaunchGate.update(smsDatabaseGate.id, {
        status: smsGateStatus,
        completion_percent: smsCompletionPct,
        proof_percent: smsProofPct,
        current_blocker: smsBlocker,
        next_action: smsPassedCount === smsChecks.length
          ? "All SMS checks pass — run a live test SMS and request manual approval"
          : smsMissingItems[0],
        evidence_summary: smsEvidenceSummary,
        last_checked_at: now,
        last_verdict: `Proof runner executed ${now} — ${smsPassedCount}/${smsChecks.length} checks passed`,
      });
    }

    if (voiceDatabaseGate) {
      await base44.asServiceRole.entities.LaunchGate.update(voiceDatabaseGate.id, {
        status: voiceGateStatus,
        completion_percent: voiceCompletionPct,
        proof_percent: voiceProofPct,
        current_blocker: voiceBlocker,
        next_action: !twimlHealthy
          ? "Fix voice webhook — it is not returning valid TwiML"
          : !realCallProof
            ? "Place a real call to the Twilio number to create a non-smoke voice CommunicationEvent"
            : !voiceWebhookTriggered
              ? "Trigger the voice webhook to record last_triggered_at"
              : "All checks pass — request manual approval",
        evidence_summary: voiceEvidenceSummary,
        last_checked_at: now,
        last_verdict: `Proof runner executed ${now} — ${voicePassedCount}/${voiceChecks.length} checks passed`,
      });
    } else {
      await base44.asServiceRole.entities.LaunchGate.create({
        gate_key: "twilio_voice_gate",
        gate_name: "Twilio Voice Gate",
        section_label: "Voice",
        status: voiceGateStatus,
        severity: "launch_blocker",
        completion_percent: voiceCompletionPct,
        proof_percent: voiceProofPct,
        required_categories: ["voice"],
        required_tasks: ["verify_twilio_voice_webhook", "verify_twiml_health", "test_inbound_call", "verify_comm_event_voice"],
        required_proofs: ["voice_comm_event_record", "webhook_registration_triggered", "twiml_valid_response"],
        current_blocker: voiceBlocker,
        next_action: voiceMissingItems[0] || "All checks pass",
        evidence_summary: voiceEvidenceSummary,
        approval_required: true,
        last_checked_at: now,
        last_verdict: `Proof runner executed ${now} — ${voicePassedCount}/${voiceChecks.length} checks passed`,
        unlock_condition_summary: "Twilio creds + voice webhook URL configured + TwiML health verified + real voice CommunicationEvent + webhook last_triggered_at",
      });
    }

    // ── Update voice_frontline_gate if it exists ──
    const voiceFrontlineGate = launchGates?.find(g => g.gate_key === "voice_frontline_gate");
    if (voiceFrontlineGate) {
      const frontlineStatus = twimlHealthy
        ? (realCallProof ? "proof_passed" : "ready_for_proof")
        : "blocked";
      await base44.asServiceRole.entities.LaunchGate.update(voiceFrontlineGate.id, {
        status: frontlineStatus,
        completion_percent: twimlHealthy ? (realCallProof ? 100 : 75) : (voiceWebhookUrl ? 25 : 0),
        proof_percent: realCallProof ? 100 : 0,
        current_blocker: !twimlHealthy
          ? "Voice webhook is not returning valid TwiML — callers will hear an application error"
          : !realCallProof
            ? "Webhook is healthy but no real inbound call has been proven yet"
            : null,
        next_action: !twimlHealthy
          ? "Fix /api/receiveInboundVoiceCall to return valid TwiML"
          : !realCallProof
            ? "Place a real call to +16025843227 and confirm a voice CommunicationEvent is created"
            : "Front-line responder is live and proven",
        evidence_summary: voiceEvidenceSummary,
        last_checked_at: now,
        last_verdict: `Proof runner executed ${now} — TwiML:${twimlHealthy ? "HEALTHY" : "UNHEALTHY"} RealCall:${realCallProof ? "PROVEN" : "MISSING"} AI:${voiceAgentConfigured ? "CONFIGURED" : "MISSING"}`,
      });
    }

    return Response.json({
      success: true,
      ran_at: now,
      sms_gate: {
        status: smsGateStatus,
        completion_percent: smsCompletionPct,
        proof_percent: smsProofPct,
        checks: smsChecks,
        blocker: smsBlocker,
        latest_sms_event: latestSmsEvent?.created_date || null,
      },
      voice_gate: {
        status: voiceGateStatus,
        completion_percent: voiceCompletionPct,
        proof_percent: voiceProofPct,
        checks: voiceChecks,
        blocker: voiceBlocker,
        twiml_health: twimlHealth,
        latest_voice_event: latestVoiceEvent?.created_date || null,
        real_call_proof: realCallProof,
        ai_handoff_configured: voiceAgentConfigured,
        webhook_last_triggered: voiceWebhookReg?.last_triggered_at || null,
      },
    });
  } catch (error) {
    console.error("[runTwilioProofCheck] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});