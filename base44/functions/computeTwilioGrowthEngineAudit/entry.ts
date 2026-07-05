import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const INTERNAL_EVIDENCE_PATTERNS = /clientsurge-install\.internal|clientsurge\.test|test\+|test-|^test\b|smoke|\bqa\b|internal|backfill|example\.com/i;
const OWNER_EVIDENCE_PATTERNS = /nolanf|nolan\./i;

function classifyEvidenceQuality(proofLog) {
  if (!proofLog) return "unknown";
  const email = (proofLog.client_email || "").toLowerCase();
  const businessName = (proofLog.business_name || "").toLowerCase();
  if (OWNER_EVIDENCE_PATTERNS.test(email) || OWNER_EVIDENCE_PATTERNS.test(businessName)) return "owner";
  if (INTERNAL_EVIDENCE_PATTERNS.test(email) || INTERNAL_EVIDENCE_PATTERNS.test(businessName)) return "internal_test";
  return "production_customer";
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    // ── Fetch all data sources in parallel ──
    const [adminSettings, proofLogs, checklists, twLogs, twEvents, wsLeads] = await Promise.all([
      base44.asServiceRole.entities.AdminSettings.list('-updated_date', 1).catch(() => []),
      base44.asServiceRole.entities.AutomationProofLog.list('-created_date', 500).catch(() => []),
      base44.asServiceRole.entities.AutomationChecklist.list('-created_date', 500).catch(() => []),
      base44.asServiceRole.entities.CommunicationLog.filter({ provider: 'twilio' }, '-created_date', 200).catch(() => []),
      base44.asServiceRole.entities.CommunicationEvent.filter({ provider: 'twilio' }, '-created_date', 200).catch(() => []),
      base44.asServiceRole.entities.WebsiteLead.list('-created_date', 200).catch(() => []),
    ]);

    const settings = (adminSettings && adminSettings[0]) || {};
    const proofLogList = proofLogs || [];
    const checklistList = checklists || [];
    const twLogList = twLogs || [];
    const twEventList = twEvents || [];
    const wsLeadList = wsLeads || [];

    // ── Proof log counts per service key ──
    const proofByService = {};
    for (const log of proofLogList) {
      const key = log.service_key;
      if (!key) continue;
      if (!proofByService[key]) proofByService[key] = { pass: 0, fail: 0, pending: 0, total: 0 };
      proofByService[key].total++;
      if (log.status === 'pass') proofByService[key].pass++;
      else if (log.status === 'fail') proofByService[key].fail++;
      else proofByService[key].pending++;
    }

    // ── Evidence quality per service key (for passing proof logs) ──
    const evidenceQualityByService = {};
    for (const log of proofLogList) {
      if (!log.service_key || log.status !== "pass") continue;
      if (!evidenceQualityByService[log.service_key]) {
        evidenceQualityByService[log.service_key] = classifyEvidenceQuality(log);
      }
    }

    // ── SMS delivery proof health ──
    const smsStats = {
      delivered: 0,
      sentNotDelivered: 0,
      failed: 0,
      skipped: 0,
      twilio400Errors: 0,
      nullProviderMessageId: 0,
      totalLogs: twLogList.length,
    };
    for (const log of twLogList) {
      if (log.delivery_status === 'delivered') smsStats.delivered++;
      else if (log.delivery_status === 'sent' || log.delivery_status === 'queued') smsStats.sentNotDelivered++;
      else if (log.delivery_status === 'failed') smsStats.failed++;
      else if (log.delivery_status === 'skipped') smsStats.skipped++;
      if (log.error_code && String(log.error_code).includes('400')) smsStats.twilio400Errors++;
      if (log.error_message && /400|bad request/i.test(log.error_message)) smsStats.twilio400Errors++;
    }
    for (const ev of twEventList) {
      if (ev.direction === 'outbound' && ev.channel === 'sms' && !ev.provider_message_id && ev.status === 'sent') {
        smsStats.nullProviderMessageId++;
      }
    }

    // ── Webhook readiness ──
    const webhookFields = ['voice_webhook_url', 'sms_webhook_url', 'missed_call_webhook_url', 'sms_status_callback_url'];
    const webhookStatus = {};
    for (const field of webhookFields) {
      webhookStatus[field] = {
        present: !!settings[field],
        value: settings[field] || null,
      };
    }
    const lastTestResult = settings.last_webhook_test_result || '';
    const lastTestAt = settings.last_webhook_test_at || null;
    const webhookTestHasError = /404|405|failed|error|missing/i.test(lastTestResult);

    // ── AI voice readiness ──
    const voiceSettings = {
      inbound_voice_enabled: settings.inbound_voice_enabled || false,
      voice_calls_enabled: settings.voice_calls_enabled || false,
      voice_webhook_url: settings.voice_webhook_url || null,
      voice_forwarding_phone: settings.voice_forwarding_phone || null,
      elevenlabs_agent_ids: settings.elevenlabs_agent_ids || null,
      elevenlabs_phone_number_ids: settings.elevenlabs_phone_number_ids || null,
    };
    const hasAgentIds = voiceSettings.elevenlabs_agent_ids && Object.values(voiceSettings.elevenlabs_agent_ids).some(v => v);
    const hasPhoneIds = voiceSettings.elevenlabs_phone_number_ids && Object.values(voiceSettings.elevenlabs_phone_number_ids).some(v => v);

    const voiceEvents = twEventList.filter(e => e.channel === 'voice' || (e.event_type && e.event_type.startsWith('voice_call')));
    const websiteLeadsWithCallSid = wsLeadList.filter(l => l.call_sid);
    const websiteLeadsWithTranscript = wsLeadList.filter(l => l.transcript && l.transcript.trim().length > 0);

    // ── Test data exclusion ──
    const testPatterns = /clientsurge-install\.internal|clientsurge\.test|test\+|smoke|test|internal|backfill/i;
    const excludedLeads = wsLeadList.filter(l =>
      testPatterns.test(l.email || '') ||
      testPatterns.test(l.source || '') ||
      testPatterns.test(l.business_name || '')
    );

    // ── QA Checklist per service key ──
    const qaServiceKeys = [
      'instant_lead_response', 'missed_call_text_back', 'nurture_sequence_14d',
      'ai_booking_agent', 'inbound_sms_assistant', 'ai_voice_receptionist',
      'review_request', 'lead_reactivation'
    ];
    const checklistByService = {};
    for (const cl of checklistList) {
      if (cl.service_key && !checklistByService[cl.service_key]) {
        checklistByService[cl.service_key] = cl;
      }
    }
    const qaChecklist = qaServiceKeys.map(key => {
      const cl = checklistByService[key] || {};
      const flags = {
        twilio_configured: cl.twilio_configured || false,
        resend_configured: cl.resend_configured || false,
        booking_link_set: cl.booking_link_set || false,
        review_link_set: cl.review_link_set || false,
        lead_form_connected: cl.lead_form_connected || false,
        communication_event_logging_verified: cl.communication_event_logging_verified || false,
        test_lead_sent: cl.test_lead_sent || false,
        test_response_received: cl.test_response_received || false,
        client_approved: cl.client_approved || false,
        last_tested_at: cl.last_tested_at || null,
        went_live_at: cl.went_live_at || null,
      };
      const trueCount = Object.values(flags).filter(v => v === true).length;
      let status = 'red';
      if (trueCount >= 7 && flags.client_approved) status = 'green';
      else if (trueCount >= 3) status = 'yellow';
      return { service_key: key, flags, status, true_count: trueCount };
    });

    // ── Compute capabilities ──
    const capabilities = [];

    // 1. AI Receptionist / Voice Agent
    {
      const evidence = ['AdminSettings', 'CommunicationEvent', 'WebsiteLead', 'AutomationProofLog'];
      const blockers = [];
      const hasInfra = voiceSettings.inbound_voice_enabled || voiceSettings.voice_webhook_url;
      const hasProof = (proofByService['ai_voice_receptionist']?.pass || 0) > 0;
      const hasCallRecords = voiceEvents.length > 0 || websiteLeadsWithCallSid.length > 0;
      const hasTranscripts = websiteLeadsWithTranscript.length > 0;

      if (!hasAgentIds) blockers.push('Missing ElevenLabs agent IDs');
      if (!hasPhoneIds) blockers.push('Missing ElevenLabs phone number IDs');
      if (!voiceSettings.voice_forwarding_phone) blockers.push('Missing voice forwarding phone');
      if (hasCallRecords && !hasTranscripts) blockers.push('Calls are being received but not transcribed/summarized enough to prove AI receptionist quality');

      let status = 'red';
      if (hasProof && hasCallRecords && hasTranscripts) status = 'green';
      else if (hasInfra || hasCallRecords) status = 'yellow';

      capabilities.push({
        capability_key: 'ai_receptionist_voice_agent',
        capability_name: 'AI Receptionist / Voice Agent',
        status_color: status,
        evidence_entities_checked: evidence,
        evidence_summary: `Inbound voice enabled: ${voiceSettings.inbound_voice_enabled}. Voice events: ${voiceEvents.length}. Call SIDs on leads: ${websiteLeadsWithCallSid.length}. Transcripts: ${websiteLeadsWithTranscript.length}. Proof passes: ${proofByService['ai_voice_receptionist']?.pass || 0}.`,
        blockers,
        next_required_action: status === 'green' ? 'Monitor ongoing voice quality and transcript coverage.'
          : 'Configure ElevenLabs agent IDs and enable inbound_voice_enabled only after a real call test passes.',
      });
    }

    // 2. Missed Call Text-Back
    {
      const evidence = ['AdminSettings', 'CommunicationLog', 'CommunicationEvent', 'AutomationProofLog'];
      const blockers = [];
      const missedCallUrl = settings.missed_call_webhook_url;
      const hasUrl = !!missedCallUrl;
      const hasProof = (proofByService['missed_call_text_back']?.pass || 0) > 0;
      const missedCallLogs = twLogList.filter(l => l.trigger_name && l.trigger_name.includes('missed_call'));
      const hasSmsRecords = missedCallLogs.length > 0;

      if (!hasUrl) blockers.push('Missing missed_call_webhook_url in AdminSettings');
      if (webhookTestHasError && /missed/i.test(lastTestResult)) blockers.push(`Webhook test failed: ${lastTestResult}`);
      if (hasSmsRecords && missedCallLogs.every(l => l.delivery_status !== 'delivered')) blockers.push('Missed-call SMS attempts exist but none delivered');

      let status = 'red';
      if (hasProof && hasSmsRecords && missedCallLogs.some(l => l.delivery_status === 'delivered')) status = 'green';
      else if (hasUrl || hasSmsRecords) status = 'yellow';

      const mctbEvidenceQuality = evidenceQualityByService['missed_call_text_back'] || 'unknown';
      const mctbQaProofPassed = hasProof && mctbEvidenceQuality !== 'production_customer';
      capabilities.push({
        capability_key: 'missed_call_text_back',
        capability_name: 'Missed Call Text-Back',
        status_color: status,
        evidence_entities_checked: evidence,
        evidence_summary: `Webhook URL present: ${hasUrl}. Missed-call SMS logs: ${missedCallLogs.length}. Delivered: ${missedCallLogs.filter(l => l.delivery_status === 'delivered').length}. Proof passes: ${proofByService['missed_call_text_back']?.pass || 0}. Evidence quality: ${mctbEvidenceQuality}.`,
        blockers,
        next_required_action: webhookTestHasError && /missed/i.test(lastTestResult)
          ? 'Repair Twilio missed-call webhook URL — Twilio is getting 404. Fix the Base44 function route, then retest with a real inbound call.'
          : mctbQaProofPassed
            ? 'QA proof passed but evidence is internal/test/owner — re-run with production customer missed call or admin-approve for internal launch'
            : 'Run a real missed-call test and record AutomationProofLog for missed_call_text_back.',
        evidence_quality: mctbEvidenceQuality,
        qa_proof_passed: mctbQaProofPassed,
      });
    }

    // 3. Website Speed-to-Lead SMS/Email
    {
      const evidence = ['WebsiteLead', 'CommunicationLog', 'CommunicationEvent', 'AutomationProofLog'];
      const blockers = [];
      const hasProof = (proofByService['instant_lead_response']?.pass || 0) > 0;
      const speedLeads = wsLeadList.filter(l => l.initial_response_sent_at);
      const deliveredSpeedLogs = twLogList.filter(l => l.trigger_name && l.trigger_name.includes('initial') && l.delivery_status === 'delivered');

      if (speedLeads.length === 0) blockers.push('No WebsiteLead records with initial_response_sent_at');
      if (deliveredSpeedLogs.length === 0) blockers.push('No delivered speed-to-lead SMS logs');

      let status = 'red';
      if (hasProof && deliveredSpeedLogs.length > 0) status = 'green';
      else if (speedLeads.length > 0 || twLogList.some(l => l.trigger_name && l.trigger_name.includes('initial'))) status = 'yellow';

      const ilrEvidenceQuality = evidenceQualityByService['instant_lead_response'] || 'unknown';
      const ilrQaProofPassed = hasProof && ilrEvidenceQuality !== 'production_customer';
      capabilities.push({
        capability_key: 'website_speed_to_lead',
        capability_name: 'Website Speed-to-Lead SMS/Email',
        status_color: status,
        evidence_entities_checked: evidence,
        evidence_summary: `WebsiteLeads with initial response: ${speedLeads.length}. Delivered speed-to-lead SMS: ${deliveredSpeedLogs.length}. Proof passes: ${proofByService['instant_lead_response']?.pass || 0}. Evidence quality: ${ilrEvidenceQuality}.`,
        blockers,
        next_required_action: ilrQaProofPassed
          ? 'QA proof passed but evidence is internal/test/owner — re-run with production customer lead or admin-approve for internal launch'
          : 'Confirm delivered Twilio status callback on a new non-test lead. Record AutomationProofLog for instant_lead_response.',
        evidence_quality: ilrEvidenceQuality,
        qa_proof_passed: ilrQaProofPassed,
      });
    }

    // 4. AI Sales Follow-Up / Nurture
    {
      const evidence = ['CommunicationLog', 'CommunicationEvent', 'AutomationProofLog', 'AutomationChecklist'];
      const blockers = [];
      const hasProof = (proofByService['nurture_sequence_14d']?.pass || 0) > 0;
      const nurtureLogs = twLogList.filter(l => l.trigger_name && /nurture|follow_up/i.test(l.trigger_name));
      const nurtureEvents = twEventList.filter(e => e.event_type && /nurture|follow_up/i.test(e.event_type));
      const hasProviderIds = nurtureEvents.some(e => e.provider_message_id);

      if (nurtureLogs.length === 0) blockers.push('No nurture/follow-up SMS logs found');
      if (!hasProviderIds) blockers.push('No nurture events with provider_message_id — weak proof');

      let status = 'red';
      if (hasProof && hasProviderIds) status = 'green';
      else if (nurtureLogs.length > 0 || nurtureEvents.length > 0) status = 'yellow';

      capabilities.push({
        capability_key: 'ai_sales_followup_nurture',
        capability_name: 'AI Sales Follow-Up / Nurture',
        status_color: status,
        evidence_entities_checked: evidence,
        evidence_summary: `Nurture SMS logs: ${nurtureLogs.length}. Nurture events: ${nurtureEvents.length}. Events with provider IDs: ${nurtureEvents.filter(e => e.provider_message_id).length}. Proof passes: ${proofByService['nurture_sequence_14d']?.pass || 0}.`,
        blockers,
        next_required_action: 'Require provider IDs, valid lead IDs, and stop-on-reply behavior proof. Record AutomationProofLog for nurture_sequence_14d.',
      });
    }

    // 5. Review Request Engine
    {
      const evidence = ['CommunicationLog', 'CommunicationEvent', 'AutomationProofLog', 'AutomationChecklist'];
      const blockers = [];
      const hasProof = (proofByService['review_request']?.pass || 0) > 0;
      const reviewEvents = twEventList.filter(e => e.event_type && /review/i.test(e.event_type));
      const reviewLogs = twLogList.filter(l => l.trigger_name && /review/i.test(l.trigger_name));
      const checklistReview = checklistByService['review_request'];

      if (!checklistReview?.review_link_set) blockers.push('review_link_set not configured in AutomationChecklist');
      if (reviewEvents.length === 0 && reviewLogs.length === 0) blockers.push('No review request communication records');

      let status = 'red';
      if (hasProof && reviewEvents.length > 0) status = 'green';
      else if (reviewEvents.length > 0 || reviewLogs.length > 0 || checklistReview) status = 'yellow';

      capabilities.push({
        capability_key: 'review_request_engine',
        capability_name: 'Review Request Engine',
        status_color: status,
        evidence_entities_checked: evidence,
        evidence_summary: `Review events: ${reviewEvents.length}. Review SMS logs: ${reviewLogs.length}. Checklist review_link_set: ${checklistReview?.review_link_set || false}. Proof passes: ${proofByService['review_request']?.pass || 0}.`,
        blockers,
        next_required_action: 'Create and pass AutomationProofLog for review_request. Confirm review_link is set and a real review request was sent.',
      });
    }

    // 6. Referral Engine
    {
      const evidence = ['AutomationChecklist', 'AutomationProofLog'];
      const blockers = [];
      // Check if any referral entity or automation exists
      const hasReferralEntity = false; // No dedicated referral entity yet
      const hasProof = (proofByService['lead_reactivation']?.pass || 0) > 0;

      blockers.push('No dedicated referral entity or automation flow exists yet');

      let status = 'red';
      if (hasProof && hasReferralEntity) status = 'green';
      else if (hasReferralEntity) status = 'yellow';

      capabilities.push({
        capability_key: 'referral_engine',
        capability_name: 'Referral Engine',
        status_color: status,
        evidence_entities_checked: evidence,
        evidence_summary: `Referral entity exists: ${hasReferralEntity}. No referral automation proof logs found.`,
        blockers,
        next_required_action: 'Create a real referral flow/entity or automation before showing it as active.',
      });
    }

    // 7. Client SMS Onboarding / Status Updates
    {
      const evidence = ['CommunicationLog', 'CommunicationEvent', 'OnboardingClient', 'AutomationChecklist'];
      const blockers = [];
      const onboardingLogs = twLogList.filter(l => l.trigger_name && /onboard|status|welcome/i.test(l.trigger_name));
      const onboardingEvents = twEventList.filter(e => e.event_type && /onboard|status_update|welcome/i.test(e.event_type));

      if (onboardingLogs.length === 0 && onboardingEvents.length === 0) blockers.push('No onboarding/status SMS communication records');

      let status = 'red';
      if (onboardingLogs.some(l => l.delivery_status === 'delivered') && onboardingEvents.length > 0) status = 'green';
      else if (onboardingLogs.length > 0 || onboardingEvents.length > 0) status = 'yellow';

      capabilities.push({
        capability_key: 'client_sms_onboarding_status_updates',
        capability_name: 'Client SMS Onboarding / Status Updates',
        status_color: status,
        evidence_entities_checked: evidence,
        evidence_summary: `Onboarding SMS logs: ${onboardingLogs.length}. Onboarding events: ${onboardingEvents.length}. Delivered: ${onboardingLogs.filter(l => l.delivery_status === 'delivered').length}.`,
        blockers,
        next_required_action: 'Send and confirm delivery of onboarding/status SMS to a real client. Log as CommunicationEvent.',
      });
    }

    // 8. Live Call Transcription / Summaries
    {
      const evidence = ['WebsiteLead', 'CommunicationEvent'];
      const blockers = [];
      const hasCallSids = websiteLeadsWithCallSid.length > 0;
      const hasTranscripts = websiteLeadsWithTranscript.length > 0;

      if (hasCallSids && !hasTranscripts) blockers.push('Calls are being received but not transcribed/summarized enough to prove AI receptionist quality');
      if (!hasCallSids) blockers.push('No WebsiteLead records with call_sid');

      let status = 'red';
      if (hasCallSids && hasTranscripts) status = 'green';
      else if (hasCallSids) status = 'yellow';

      capabilities.push({
        capability_key: 'live_call_transcription_summaries',
        capability_name: 'Live Call Transcription / Summaries',
        status_color: status,
        evidence_entities_checked: evidence,
        evidence_summary: `WebsiteLeads with call_sid: ${websiteLeadsWithCallSid.length}. WebsiteLeads with transcript: ${websiteLeadsWithTranscript.length}.`,
        blockers,
        next_required_action: hasCallSids && !hasTranscripts
          ? 'Wire ElevenLabs post-call webhook to populate transcript + call_summary on WebsiteLead records.'
          : 'Process a real inbound call through the voice webhook and verify transcript is stored.',
      });
    }

    // 9. Voice Broadcasts / Promotional Calling
    {
      const evidence = ['AdminSettings', 'CommunicationEvent'];
      const blockers = [];
      const broadcastEnabled = settings.voice_briefing_enabled || false;
      const broadcastEvents = twEventList.filter(e => e.event_type === 'voice_call_initiated' && e.direction === 'outbound');

      if (!broadcastEnabled) blockers.push('voice_briefing_enabled is false in AdminSettings');
      if (broadcastEvents.length === 0) blockers.push('No outbound voice call events found');

      let status = 'red';
      if (broadcastEnabled && broadcastEvents.length > 0) status = 'green';
      else if (broadcastEnabled || broadcastEvents.length > 0) status = 'yellow';

      capabilities.push({
        capability_key: 'voice_broadcasts_promotional_calling',
        capability_name: 'Voice Broadcasts / Promotional Calling',
        status_color: status,
        evidence_entities_checked: evidence,
        evidence_summary: `Voice briefing enabled: ${broadcastEnabled}. Outbound voice call events: ${broadcastEvents.length}.`,
        blockers,
        next_required_action: 'Enable voice_briefing_enabled and run a real outbound voice broadcast test. Log as CommunicationEvent.',
      });
    }

    // 10. Formal Automation Proof Logs
    {
      const evidence = ['AutomationProofLog'];
      const blockers = [];
      const totalProofs = proofLogList.length;
      const passedProofs = proofLogList.filter(l => l.status === 'pass').length;

      if (totalProofs === 0) blockers.push('No AutomationProofLog records exist — no automation is production-trusted yet');

      let status = 'red';
      if (passedProofs >= 4 && totalProofs > 0) status = 'green';
      else if (totalProofs > 0) status = 'yellow';

      capabilities.push({
        capability_key: 'formal_automation_proof_logs',
        capability_name: 'Formal Automation Proof Logs',
        status_color: status,
        evidence_entities_checked: evidence,
        evidence_summary: `Total proof logs: ${totalProofs}. Passed: ${passedProofs}. Failed: ${proofLogList.filter(l => l.status === 'fail').length}. Pending: ${proofLogList.filter(l => l.status === 'pending').length}.`,
        blockers,
        next_required_action: totalProofs === 0
          ? 'Create proof tests for instant_lead_response and missed_call_text_back first.'
          : 'Run remaining proof tests for all 8 service keys until all pass.',
      });
    }

    // ── Generate action plan ──
    const actionPlan = [];
    if (proofLogList.length === 0) {
      actionPlan.push('Create proof tests for instant_lead_response and missed_call_text_back.');
    }
    if (webhookTestHasError && /missed/i.test(lastTestResult)) {
      actionPlan.push('Repair Twilio missed-call webhook URL in Twilio console/Base44 function route.');
    }
    if (smsStats.twilio400Errors > 0) {
      actionPlan.push(`Inspect request payload and Twilio credentials/sender permissions — ${smsStats.twilio400Errors} Twilio 400 error(s) detected.`);
    }
    if (!hasAgentIds) {
      actionPlan.push('Connect ElevenLabs agent and phone number IDs in AdminSettings.');
    }
    if (excludedLeads.length > 0) {
      actionPlan.push(`Exclude ${excludedLeads.length} smoke/internal/test records from production KPIs.`);
    }
    if (websiteLeadsWithCallSid.length > 0 && websiteLeadsWithTranscript.length === 0) {
      actionPlan.push('Wire post-call webhook to populate transcripts — calls are received but not transcribed.');
    }
    if (smsStats.nullProviderMessageId > 0) {
      actionPlan.push(`${smsStats.nullProviderMessageId} outbound SMS events have null provider_message_id — treat as weak proof.`);
    }

    // ── Persist to TwilioCapabilityAudit ──
    const auditRunId = `audit_${Date.now()}`;
    const now = new Date().toISOString();
    try {
      // Delete old records for this capability set (replace approach — keep latest run)
      await base44.asServiceRole.entities.TwilioCapabilityAudit.deleteMany({}).catch(() => {});
      // Bulk create new audit records
      const records = capabilities.map(cap => ({
        ...cap,
        evidence_quality: cap.evidence_quality || 'unknown',
        qa_proof_passed: cap.qa_proof_passed || false,
        last_checked_at: now,
        computed_by: user.email || 'admin',
        safe_to_show_public: false,
        audit_run_id: auditRunId,
      }));
      await base44.asServiceRole.entities.TwilioCapabilityAudit.bulkCreate(records);
    } catch (persistErr) {
      // Non-fatal — return computed data even if persistence fails
      console.error('Failed to persist audit:', persistErr?.message || persistErr);
    }

    return Response.json({
      capabilities,
      smsStats,
      webhookStatus,
      webhookTestHasError,
      lastTestResult,
      lastTestAt,
      voiceSettings,
      voiceEvents: { count: voiceEvents.length, with_call_sid: websiteLeadsWithCallSid.length, with_transcript: websiteLeadsWithTranscript.length },
      proofByService,
      proofLogTotal: proofLogList.length,
      qaChecklist,
      excludedCount: excludedLeads.length,
      actionPlan,
      auditRunId,
      computedAt: now,
    });
  } catch (error) {
    console.error('computeTwilioGrowthEngineAudit error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});