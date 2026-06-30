/**
 * runTwilioProofCheck — Evidence-based Twilio/Voice launch gate proof runner.
 *
 * Checks ONLY real runtime conditions — never marks proof_passed without evidence.
 * Updates LaunchGate records for twilio_sms_gate and twilio_voice_gate.
 *
 * Track D SMS hardening:
 *   SMS proof now requires a real outbound Twilio CommunicationLog with:
 *     - provider_message_id starting with SM
 *     - delivery_status=delivered
 *     - delivered_at present
 *     - failed_at absent
 *   Queued/sent SMS records are NOT delivery proof.
 *
 * Voice gate validates:
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

function isRealTwilioMessageSid(value) {
  return typeof value === "string" && /^SM[a-zA-Z0-9]+$/.test(value);
}

function isValidDeliveredSmsProof(log, twilioFromNumber) {
  if (!log) return false;
  if (log.channel !== "sms") return false;
  if (log.provider !== "twilio") return false;
  if (log.direction !== "outbound") return false;
  if (log.environment !== "production") return false;
  if (log.dashboard_excluded === true) return false;
  if (!isRealTwilioMessageSid(log.provider_message_id)) return false;
  if (log.delivery_status !== "delivered") return false;
  if (!log.delivered_at) return false;
  if (log.failed_at) return false;
  if (log.provider_status && log.provider_status !== "delivered") return false;

  const expectedFrom = normalizePhoneE164(twilioFromNumber);
  const actualFrom = normalizePhoneE164(log.from_address);
  if (expectedFrom && actualFrom && actualFrom !== expectedFrom) return false;

  return true;
}

function buildSmsEvidenceSummary({ deliveredProof, latestSmsLog, twilioCredsOk, smsWebhookReg }) {
  if (deliveredProof) {
    const to = deliveredProof.to_address || deliveredProof.canonical_to_address || "MISSING_TO";
    return [
      "Delivered Twilio SMS proof found",
      `CommunicationLog ID: ${deliveredProof.id}`,
      `Provider ID: ${deliveredProof.provider_message_id}`,
      "delivery_status=delivered",
      `provider_status=${deliveredProof.provider_status || "delivered"}`,
      `delivered_at=${deliveredProof.delivered_at}`,
      `from=${deliveredProof.from_address || "MISSING_FROM"}`,
      `to=${to}`,
      "AutomationProofLog pass still required before final proof",
    ].join(" | ");
  }

  if (latestSmsLog) {
    return [
      `Twilio credentials: ${twilioCredsOk ? "PRESENT" : "MISSING"}`,
      `SMS WebhookRegistration: ${smsWebhookReg ? smsWebhookReg.status : "NOT FOUND"}`,
      `Latest outbound SMS CommunicationLog ID: ${latestSmsLog.id}`,
      `Provider ID: ${latestSmsLog.provider_message_id || "MISSING"}`,
      `delivery_status=${latestSmsLog.delivery_status || "unknown"}`,
      `provider_status=${latestSmsLog.provider_status || "unknown"}`,
      "Queued or sent SMS is not delivery proof",
    ].join(" | ");
  }

  return [
    `Twilio credentials: ${twilioCredsOk ? "PRESENT" : "MISSING"}`,
    `SMS WebhookRegistration: ${smsWebhookReg ? smsWebhookReg.status : "NOT FOUND"}`,
    "No outbound Twilio SMS CommunicationLog found",
    "No delivered callback proof is attached to this gate",
  ].join(" | ");
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return Response.json({ error: "Admin only" }, { status: 403 });
    }

    const now = new Date().toISOString();

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

    const twilioFromNumber = settings?.twilio_from_number || Deno.env.get("TWILIO_PHONE_NUMBER") || null;
    const voiceWebhookUrl = settings?.voice_webhook_url || settings?.webhook_url || "";
    const agentIdFromSettings =
      settings?.elevenlabs_agent_ids?.receptionist ||
      settings?.elevenlabs_agent_ids?.general || null;
    const voiceAgentConfigured = hasElevenLabsAgent || !!agentIdFromSettings;

    // ── SMS CommunicationLog check: provider delivery proof only ──
    let latestSmsLog = null;
    let deliveredSmsProof = null;
    let smsLogs = [];
    try {
      smsLogs = await base44.asServiceRole.entities.CommunicationLog.filter(
        {
          channel: "sms",
          provider: "twilio",
          direction: "outbound",
          environment: "production",
        },
        "-created_date",
        250,
      );
      latestSmsLog = smsLogs?.[0] || null;
      deliveredSmsProof = smsLogs?.find((log) => isValidDeliveredSmsProof(log, twilioFromNumber)) || null;
    } catch (_) {}

    const deliveredSmsProofExists = !!deliveredSmsProof;

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
      { label: "Delivered Twilio SMS callback proof", passed: deliveredSmsProofExists },
      { label: "SMS WebhookRegistration active", passed: smsWebhookActive },
    ];
    const smsPassedCount = smsChecks.filter(c => c.passed).length;
    const smsCompletionPct = Math.round((smsPassedCount / smsChecks.length) * 100);
    const smsProofPct = deliveredSmsProofExists ? 50 : 0;
    const smsGateStatus = twilioCredsOk ? "ready_for_proof" : "blocked";
    const smsMissingItems = smsChecks.filter(c => !c.passed).map(c => c.label);
    const smsBlocker = !twilioCredsOk
      ? "Missing: Twilio credentials present"
      : deliveredSmsProofExists
        ? "AutomationProofLog pass still required before final proof."
        : "No Twilio delivered callback proof is attached to this gate.";
    const smsNextAction = deliveredSmsProofExists
      ? "Review delivered Twilio callback evidence, then create AutomationProofLog pass only if this is a real production proof test."
      : "Send one real outbound SMS and wait for a Twilio delivered status callback.";
    const smsLastVerdict = deliveredSmsProofExists
      ? "Provider delivery proof found — admin approval still required"
      : "Not proven — queued SMS is not delivery proof";

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
    const smsEvidenceSummary = buildSmsEvidenceSummary({
      deliveredProof: deliveredSmsProof,
      latestSmsLog,
      twilioCredsOk,
      smsWebhookReg,
    });

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
        next_action: smsNextAction,
        evidence_summary: smsEvidenceSummary,
        last_checked_at: now,
        last_verdict: smsLastVerdict,
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
        latest_sms_log: latestSmsLog ? {
          id: latestSmsLog.id,
          provider_message_id: latestSmsLog.provider_message_id || null,
          delivery_status: latestSmsLog.delivery_status || null,
          provider_status: latestSmsLog.provider_status || null,
          delivered_at: latestSmsLog.delivered_at || null,
          failed_at: latestSmsLog.failed_at || null,
        } : null,
        delivered_sms_proof: deliveredSmsProof ? {
          id: deliveredSmsProof.id,
          provider_message_id: deliveredSmsProof.provider_message_id,
          delivered_at: deliveredSmsProof.delivered_at,
        } : null,
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
