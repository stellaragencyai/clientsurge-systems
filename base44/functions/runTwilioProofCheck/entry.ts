/**
 * runTwilioProofCheck — Real evidence-based Twilio/Voice launch gate proof runner
 *
 * Checks ONLY real runtime conditions. Never marks proof_passed unless evidence exists.
 * Updates LaunchGate records for twilio_sms_gate and twilio_voice_gate.
 *
 * Proof criteria:
 *   SMS gate:
 *     a) TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_PHONE_NUMBER present
 *     b) CommunicationEvent with channel=sms, provider=twilio exists within 30 days
 *     c) WebhookRegistration for twilio_sms is active
 *
 *   Voice gate:
 *     a) TWILIO credentials present
 *     b) ELEVENLABS_AGENT_ID present (or AdminSettings has one)
 *     c) CommunicationEvent with channel=voice, provider=twilio exists
 *     d) WebhookRegistration.last_triggered_at exists for twilio_voice
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const now = new Date().toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // ── Credential checks ──
    const hasAccountSid = !!Deno.env.get('TWILIO_ACCOUNT_SID');
    const hasAuthToken = !!Deno.env.get('TWILIO_AUTH_TOKEN');
    const hasFromNumber = !!Deno.env.get('TWILIO_PHONE_NUMBER');
    const hasElevenLabsAgent = !!Deno.env.get('ELEVENLABS_AGENT_ID');
    const twilioCredsOk = hasAccountSid && hasAuthToken && hasFromNumber;

    // Check ElevenLabs agent in AdminSettings as fallback
    let agentIdFromSettings = null;
    try {
      const [settings] = await base44.asServiceRole.entities.AdminSettings.list('-created_date', 1);
      agentIdFromSettings = settings?.elevenlabs_agent_ids?.receptionist
        || settings?.elevenlabs_agent_ids?.general || null;
    } catch (_) {}

    const voiceAgentConfigured = hasElevenLabsAgent || !!agentIdFromSettings;

    // ── SMS CommunicationEvent check ──
    let latestSmsEvent = null;
    try {
      const smsEvents = await base44.asServiceRole.entities.CommunicationEvent.filter(
        { channel: 'sms', provider: 'twilio' }, '-created_date', 1
      );
      latestSmsEvent = smsEvents?.[0] || null;
    } catch (_) {}

    const smsEventWithin30Days = latestSmsEvent
      && latestSmsEvent.created_date > thirtyDaysAgo;

    // ── Voice CommunicationEvent check ──
    let latestVoiceEvent = null;
    try {
      const voiceEvents = await base44.asServiceRole.entities.CommunicationEvent.filter(
        { channel: 'voice', provider: 'twilio' }, '-created_date', 1
      );
      latestVoiceEvent = voiceEvents?.[0] || null;
    } catch (_) {}

    const voiceEventExists = !!latestVoiceEvent;

    // ── WebhookRegistration checks ──
    let smsWebhookReg = null;
    let voiceWebhookReg = null;
    try {
      const regs = await base44.asServiceRole.entities.WebhookRegistration.list('-created_date', 50);
      smsWebhookReg = regs?.find(r => r.source_name === 'twilio_sms' || r.source_name?.includes('sms')) || null;
      voiceWebhookReg = regs?.find(r => r.source_name === 'twilio_voice') || null;
    } catch (_) {}

    const smsWebhookActive = smsWebhookReg?.status === 'active';
    const voiceWebhookTriggered = !!voiceWebhookReg?.last_triggered_at;

    // ── Score gates ──

    // SMS gate scoring
    const smsChecks = [
      { label: 'Twilio credentials present', passed: twilioCredsOk },
      { label: 'SMS CommunicationEvent within 30 days', passed: !!smsEventWithin30Days },
      { label: 'SMS WebhookRegistration active', passed: smsWebhookActive },
    ];
    const smsPassedCount = smsChecks.filter(c => c.passed).length;
    const smsCompletionPct = Math.round((smsPassedCount / smsChecks.length) * 100);
    const smsProofPct = smsEventWithin30Days ? Math.round((smsPassedCount / smsChecks.length) * 100) : 0;
    const smsGateStatus = smsPassedCount === smsChecks.length ? 'ready_for_proof' : 'blocked';

    const smsMissingItems = smsChecks.filter(c => !c.passed).map(c => c.label);
    const smsBlocker = smsMissingItems.length > 0
      ? `Missing: ${smsMissingItems.join('; ')}`
      : 'All SMS checks passed — awaiting manual approval';

    // Voice gate scoring
    const voiceChecks = [
      { label: 'Twilio credentials present', passed: twilioCredsOk },
      { label: 'ElevenLabs agent ID configured', passed: voiceAgentConfigured },
      { label: 'Voice CommunicationEvent exists (real webhook hit)', passed: voiceEventExists },
      { label: 'Voice webhook last_triggered_at recorded', passed: voiceWebhookTriggered },
    ];
    const voicePassedCount = voiceChecks.filter(c => c.passed).length;
    const voiceCompletionPct = Math.round((voicePassedCount / voiceChecks.length) * 100);
    const voiceProofPct = voiceEventExists && voiceWebhookTriggered
      ? Math.round((voicePassedCount / voiceChecks.length) * 100)
      : 0;
    const voiceGateStatus = voicePassedCount === voiceChecks.length ? 'ready_for_proof' : 'blocked';

    const voiceMissingItems = voiceChecks.filter(c => !c.passed).map(c => c.label);
    const voiceBlocker = voiceMissingItems.length > 0
      ? `Missing: ${voiceMissingItems.join('; ')}`
      : 'All voice checks passed — awaiting manual approval';

    // ── Update LaunchGate records ──
    const launchGates = await base44.asServiceRole.entities.LaunchGate.list('', 50);

    const smsDatabaseGate = launchGates?.find(g => g.gate_key === 'twilio_sms_gate');
    const voiceDatabaseGate = launchGates?.find(g => g.gate_key === 'twilio_voice_gate');

    const smsEvidenceSummary = [
      `Twilio credentials: ${twilioCredsOk ? 'PRESENT' : 'MISSING'}`,
      `Latest SMS CommunicationEvent: ${latestSmsEvent ? latestSmsEvent.created_date : 'NONE'}`,
      `SMS WebhookRegistration: ${smsWebhookReg ? smsWebhookReg.status : 'NOT FOUND'}`,
    ].join(' | ');

    const voiceEvidenceSummary = [
      `Twilio credentials: ${twilioCredsOk ? 'PRESENT' : 'MISSING'}`,
      `ElevenLabs agent: ${voiceAgentConfigured ? 'CONFIGURED' : 'MISSING'}`,
      `Latest voice CommunicationEvent: ${latestVoiceEvent ? latestVoiceEvent.created_date : 'NONE — webhook never hit'}`,
      `Voice webhook last_triggered_at: ${voiceWebhookReg?.last_triggered_at || 'NEVER'}`,
    ].join(' | ');

    if (smsDatabaseGate) {
      await base44.asServiceRole.entities.LaunchGate.update(smsDatabaseGate.id, {
        status: smsGateStatus,
        completion_percent: smsCompletionPct,
        proof_percent: smsProofPct,
        current_blocker: smsBlocker,
        next_action: smsPassedCount === smsChecks.length
          ? 'All SMS checks pass — run a live test SMS and request manual approval'
          : smsMissingItems[0],
        evidence_summary: smsEvidenceSummary,
        last_checked_at: now,
        last_verdict: `Proof runner executed ${now} — ${smsPassedCount}/${smsChecks.length} checks passed`,
      });
    }

    // Create/update twilio_voice_gate
    if (voiceDatabaseGate) {
      await base44.asServiceRole.entities.LaunchGate.update(voiceDatabaseGate.id, {
        status: voiceGateStatus,
        completion_percent: voiceCompletionPct,
        proof_percent: voiceProofPct,
        current_blocker: voiceBlocker,
        next_action: voicePassedCount === voiceChecks.length
          ? 'All voice checks pass — request manual approval'
          : voiceMissingItems[0],
        evidence_summary: voiceEvidenceSummary,
        last_checked_at: now,
        last_verdict: `Proof runner executed ${now} — ${voicePassedCount}/${voiceChecks.length} checks passed`,
      });
    } else {
      // Seed the voice gate if it doesn't exist
      await base44.asServiceRole.entities.LaunchGate.create({
        gate_key: 'twilio_voice_gate',
        gate_name: 'Twilio Voice Gate',
        section_label: 'Voice',
        status: voiceGateStatus,
        severity: 'launch_blocker',
        completion_percent: voiceCompletionPct,
        proof_percent: voiceProofPct,
        required_categories: ['voice'],
        required_tasks: ['verify_twilio_voice_webhook', 'test_inbound_call', 'verify_comm_event_voice'],
        required_proofs: ['voice_comm_event_record', 'webhook_registration_triggered'],
        current_blocker: voiceBlocker,
        next_action: voiceMissingItems[0] || 'All checks pass',
        evidence_summary: voiceEvidenceSummary,
        approval_required: true,
        last_checked_at: now,
        last_verdict: `Proof runner executed ${now} — ${voicePassedCount}/${voiceChecks.length} checks passed`,
        unlock_condition_summary: 'Twilio creds present + ElevenLabs agent configured + voice CommunicationEvent exists + webhook last_triggered_at recorded',
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
        latest_voice_event: latestVoiceEvent?.created_date || null,
        webhook_last_triggered: voiceWebhookReg?.last_triggered_at || null,
      },
    });
  } catch (error) {
    console.error('[runTwilioProofCheck] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});