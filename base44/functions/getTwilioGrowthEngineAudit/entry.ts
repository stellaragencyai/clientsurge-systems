import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SERVICE_KEYS = [
  'instant_lead_response',
  'missed_call_text_back',
  'nurture_sequence_14d',
  'ai_booking_agent',
  'inbound_sms_assistant',
  'ai_voice_receptionist',
  'review_request',
  'lead_reactivation',
];

const CAPABILITIES = [
  { key: 'ai_voice_receptionist', label: 'AI Receptionist / Voice Agent', service_key: 'ai_voice_receptionist' },
  { key: 'missed_call_text_back', label: 'Missed Call Text-Back', service_key: 'missed_call_text_back' },
  { key: 'instant_lead_response', label: 'Website Speed-to-Lead SMS/Email', service_key: 'instant_lead_response' },
  { key: 'nurture_sequence_14d', label: 'AI Sales Follow-Up / Nurture', service_key: 'nurture_sequence_14d' },
  { key: 'review_request', label: 'Review Request Engine', service_key: 'review_request' },
  { key: 'lead_reactivation', label: 'Referral Engine', service_key: 'lead_reactivation' },
  { key: 'inbound_sms_assistant', label: 'Client SMS Onboarding / Status Updates', service_key: 'inbound_sms_assistant' },
  { key: 'ai_booking_agent', label: 'Live Call Transcription / Summaries', service_key: 'ai_booking_agent' },
  { key: 'voice_broadcasts', label: 'Voice Broadcasts / Promotional Calling', service_key: 'ai_voice_receptionist' },
  { key: 'automation_proof_logs', label: 'Formal Automation Proof Logs', service_key: null },
];

function isTestLead(lead) {
  const email = (lead.email || '').toLowerCase();
  const source = (lead.source || '').toLowerCase();
  const importSource = (lead.import_source || '').toLowerCase();
  const testEmailPatterns = ['clientsurge-install.internal', 'clientsurge.test', 'test+', 'smoke', '@example.com', '@test.'];
  const testSourcePatterns = ['smoke', 'test', 'internal'];
  return (
    testEmailPatterns.some(p => email.includes(p)) ||
    testSourcePatterns.some(p => source.includes(p)) ||
    testSourcePatterns.some(p => importSource.includes(p)) ||
    (lead.quality_reason_codes || []).some(c => ['internal_test', 'smoke_test', 'example_email'].includes(c))
  );
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    // ── Parallel data fetch ──
    const [
      proofLogs,
      smsLogs,
      communicationEvents,
      adminSettings,
      automationChecklists,
      websiteLeads,
    ] = await Promise.all([
      base44.asServiceRole.entities.AutomationProofLog.list('-tested_at', 500).catch(() => []),
      base44.asServiceRole.entities.CommunicationLog.filter({ channel: 'sms' }, '-created_date', 500).catch(() => []),
      base44.asServiceRole.entities.CommunicationEvent.filter({ channel: 'sms' }, '-created_date', 500).catch(() => []),
      base44.asServiceRole.entities.AdminSettings.list('-created_date', 5).catch(() => []),
      base44.asServiceRole.entities.AutomationChecklist.list('-created_date', 200).catch(() => []),
      base44.asServiceRole.entities.WebsiteLead.list('-created_date', 100).catch(() => []),
    ]);

    const settings = (adminSettings || [])[0] || {};
    const proofLogList = proofLogs || [];
    const smsLogList = smsLogs || [];
    const eventList = communicationEvents || [];
    const checklistList = automationChecklists || [];
    const websiteLeadList = websiteLeads || [];

    // ── Strict SMS delivery stats ──
    // delivered = trusted delivery proof
    // sent/queued = sent attempt only, NOT delivered proof
    // failed/skipped = not delivered
    const deliveryStats = {
      total: smsLogList.length,
      delivered: 0,
      sent_only: 0,
      queued: 0,
      failed: 0,
      skipped: 0,
      unknown: 0,
      with_provider_message_id: 0,
      without_provider_message_id: 0,
      weak_proof_count: 0, // provider_message_id=null + status=sent
    };

    for (const log of smsLogList) {
      const ds = log.delivery_status || 'unknown';
      if (ds === 'delivered') deliveryStats.delivered++;
      else if (ds === 'sent') deliveryStats.sent_only++;
      else if (ds === 'queued') deliveryStats.queued++;
      else if (ds === 'failed') deliveryStats.failed++;
      else if (ds === 'skipped') deliveryStats.skipped++;
      else deliveryStats.unknown++;

      if (log.provider_message_id) deliveryStats.with_provider_message_id++;
      else deliveryStats.without_provider_message_id++;

      // Weak proof: provider_message_id=null + status=sent
      if (!log.provider_message_id && (ds === 'sent' || ds === 'queued')) {
        deliveryStats.weak_proof_count++;
      }
    }

    // ── CommunicationEvent provider_message_id validation ──
    const eventStats = {
      total: eventList.length,
      with_provider_message_id: 0,
      without_provider_message_id: 0,
      weak_outbound_proof: 0,
      twilio_400_errors: 0,
      failed_events: 0,
    };

    for (const ev of eventList) {
      if (ev.provider_message_id) eventStats.with_provider_message_id++;
      else eventStats.without_provider_message_id++;

      if (ev.direction === 'outbound' && !ev.provider_message_id && ev.status === 'sent') {
        eventStats.weak_outbound_proof++;
      }

      const errMsg = (ev.error_message || '').toLowerCase();
      if (errMsg.includes('400') || errMsg.includes('bad request')) {
        eventStats.twilio_400_errors++;
      }
      if (ev.status === 'failed') eventStats.failed_events++;
    }

    // ── Test data quarantine ──
    let excludedLeadsCount = 0;
    let productionLeadsCount = 0;
    // We don't fetch all leads here (too many), but we report the quarantine rules
    // and count from website leads as a sample
    for (const wl of websiteLeadList) {
      const email = (wl.email || '').toLowerCase();
      const source = (wl.source || '').toLowerCase();
      const isTest = ['clientsurge-install.internal', 'clientsurge.test', 'test+', 'smoke'].some(p => email.includes(p))
        || ['smoke', 'test', 'internal'].some(p => source.includes(p));
      if (isTest) excludedLeadsCount++;
      else productionLeadsCount++;
    }

    // ── Missed-call recovery reliability ──
    const missedCallLogs = smsLogList.filter(l =>
      (l.trigger_name || '').includes('missed_call')
    );
    const missedCallEvents = eventList.filter(e =>
      (e.event_type || '').includes('missed_call') ||
      (e.metadata_json || '').includes('missed_call')
    );

    // Check for 404/405 in webhook test results
    const webhookTestResult = (settings.last_webhook_test_result || '').toLowerCase();
    const has404 = webhookTestResult.includes('404');
    const has405 = webhookTestResult.includes('405');
    const missedCallWebhookStatus = has404 || has405 ? 'blocked' : (settings.missed_call_webhook_url ? 'configured' : 'not_set');

    const missedCallStats = {
      webhook_url: settings.missed_call_webhook_url || null,
      webhook_status: missedCallWebhookStatus,
      has_404: has404,
      has_405: has405,
      last_webhook_test_result: settings.last_webhook_test_result || null,
      last_webhook_test_at: settings.last_webhook_test_at || null,
      sms_attempts: missedCallLogs.length,
      successful_sends: missedCallLogs.filter(l => l.delivery_status === 'delivered' || l.delivery_status === 'sent').length,
      failures: missedCallLogs.filter(l => l.delivery_status === 'failed').length,
      last_error: missedCallLogs.find(l => l.error_message)?.error_message || null,
    };

    // ── AI voice readiness ──
    const elevenlabsAgentIds = settings.elevenlabs_agent_ids || {};
    const elevenlabsPhoneIds = settings.elevenlabs_phone_number_ids || {};
    const hasAgentIds = Object.values(elevenlabsAgentIds).some(v => v);
    const hasPhoneIds = Object.values(elevenlabsPhoneIds).some(v => v);
    const hasTranscriptProof = websiteLeadList.some(wl => wl.transcript);

    const voiceReadiness = {
      inbound_voice_enabled: settings.inbound_voice_enabled || false,
      voice_calls_enabled: settings.voice_calls_enabled || false,
      voice_webhook_url: settings.voice_webhook_url || null,
      voice_forwarding_phone: settings.voice_forwarding_phone || null,
      has_elevenlabs_agent_ids: hasAgentIds,
      has_elevenlabs_phone_number_ids: hasPhoneIds,
      has_transcript_proof: hasTranscriptProof,
      blockers: [],
    };

    if (!hasAgentIds) voiceReadiness.blockers.push('Missing ElevenLabs agent IDs');
    if (!hasTranscriptProof) voiceReadiness.blockers.push('No live call transcript proof');
    if (!settings.inbound_voice_enabled) voiceReadiness.blockers.push('inbound_voice_enabled is false');

    // ── Capability matrix ──
    const proofByService = {};
    for (const sk of SERVICE_KEYS) {
      const proofs = proofLogList.filter(p => p.service_key === sk);
      proofByService[sk] = {
        total: proofs.length,
        passed: proofs.filter(p => p.status === 'pass').length,
        failed: proofs.filter(p => p.status === 'fail').length,
        pending: proofs.filter(p => p.status === 'pending').length,
      };
    }

    const capabilities = CAPABILITIES.map(cap => {
      const proof = cap.service_key ? proofByService[cap.service_key] : { total: proofLogList.length, passed: proofLogList.filter(p => p.status === 'pass').length, failed: 0, pending: 0 };
      const hasProof = proof.passed > 0;
      const hasPartial = proof.total > 0 && proof.passed === 0;

      let status, blockers = [], nextAction = '';
      const evidenceSources = [];

      if (hasProof) {
        evidenceSources.push(`AutomationProofLog (${proof.passed} passed)`);
      } else {
        evidenceSources.push('AutomationProofLog: 0 passed');
      }

      // Check CommunicationLog evidence for SMS-based services
      if (cap.service_key && ['instant_lead_response', 'missed_call_text_back', 'inbound_sms_assistant', 'review_request', 'lead_reactivation'].includes(cap.service_key)) {
        const serviceLogs = smsLogList.filter(l =>
          (l.trigger_name || '').includes(cap.service_key) ||
          (l.trigger_name || '').includes(cap.service_key.replace(/_/g, ' '))
        );
        const deliveredCount = serviceLogs.filter(l => l.delivery_status === 'delivered').length;
        if (deliveredCount > 0) evidenceSources.push(`CommunicationLog (${deliveredCount} delivered)`);
        else if (serviceLogs.length > 0) evidenceSources.push(`CommunicationLog (${serviceLogs.length} attempts, 0 delivered)`);
      }

      // Determine status
      if (cap.key === 'ai_voice_receptionist') {
        if (hasProof && voiceReadiness.inbound_voice_enabled && hasAgentIds && hasTranscriptProof) {
          status = 'green';
          nextAction = 'Maintain voice agent monitoring.';
        } else {
          status = voiceReadiness.inbound_voice_enabled || hasAgentIds ? 'yellow' : 'red';
          if (!hasAgentIds) { blockers.push('Missing ElevenLabs agent IDs'); nextAction = 'Configure ElevenLabs agent IDs and enable inbound_voice_enabled only after a real call test passes.'; }
          if (!hasTranscriptProof) { blockers.push('No live call transcript proof'); if (!nextAction) nextAction = 'Run a real inbound call test to generate transcript proof.'; }
          if (!hasProof) { blockers.push('No AutomationProofLog pass'); if (!nextAction) nextAction = 'Create and pass AutomationProofLog for ai_voice_receptionist.'; }
        }
      } else if (cap.key === 'missed_call_text_back') {
        if (hasProof && missedCallStats.sms_attempts > 0 && missedCallStats.webhook_status !== 'blocked') {
          status = 'green';
          nextAction = 'Maintain missed-call webhook monitoring.';
        } else {
          status = hasProof || missedCallStats.sms_attempts > 0 ? 'yellow' : 'red';
          if (missedCallStats.has_404 || missedCallStats.has_405) { blockers.push(`Webhook returning ${missedCallStats.has_404 ? '404' : '405'}`); nextAction = 'Repair missed_call webhook so Twilio no longer gets 404; retest with real inbound call.'; }
          if (!hasProof) { blockers.push('No AutomationProofLog pass'); if (!nextAction) nextAction = 'Create and pass AutomationProofLog for missed_call_text_back.'; }
          if (missedCallStats.sms_attempts === 0) { blockers.push('No missed-call SMS attempts logged'); if (!nextAction) nextAction = 'Trigger a test missed call to generate SMS attempt logs.'; }
        }
      } else if (cap.key === 'instant_lead_response') {
        if (hasProof && deliveryStats.delivered > 0) {
          status = 'green';
          nextAction = 'Maintain speed-to-lead SMS monitoring.';
        } else {
          status = hasProof || deliveryStats.delivered > 0 ? 'yellow' : 'red';
          if (deliveryStats.delivered === 0) { blockers.push('No delivered Twilio SMS proof'); nextAction = 'Confirm delivered Twilio status callback on new non-test lead.'; }
          if (!hasProof) { blockers.push('No AutomationProofLog pass'); if (!nextAction) nextAction = 'Create and pass AutomationProofLog for instant_lead_response.'; }
        }
      } else if (cap.key === 'nurture_sequence_14d') {
        if (hasProof && deliveryStats.with_provider_message_id > 0) {
          status = 'green';
          nextAction = 'Maintain nurture sequence monitoring.';
        } else {
          status = hasProof || deliveryStats.with_provider_message_id > 0 ? 'yellow' : 'red';
          blockers.push('Missing provider IDs or valid lead IDs or stop-on-reply proof');
          nextAction = 'Require provider IDs, valid lead IDs, and stop-on-reply behavior proof.';
        }
      } else if (cap.key === 'review_request') {
        if (hasProof) {
          status = 'green';
          nextAction = 'Maintain review request monitoring.';
        } else {
          status = 'red';
          blockers.push('No AutomationProofLog pass for review_request');
          nextAction = 'Create and pass AutomationProofLog for review_request.';
        }
      } else if (cap.key === 'lead_reactivation') {
        if (hasProof) {
          status = 'green';
          nextAction = 'Maintain reactivation flow monitoring.';
        } else {
          status = 'red';
          blockers.push('No real referral/reactivation flow or automation');
          nextAction = 'Create a real referral flow/entity or automation before showing it as active.';
        }
      } else if (cap.key === 'inbound_sms_assistant') {
        if (hasProof) {
          status = 'green';
          nextAction = 'Maintain SMS onboarding monitoring.';
        } else {
          status = hasProof ? 'yellow' : 'red';
          blockers.push('No AutomationProofLog pass');
          nextAction = 'Create and pass AutomationProofLog for inbound_sms_assistant.';
        }
      } else if (cap.key === 'ai_booking_agent') {
        // Live Call Transcription / Summaries — depends on WebsiteLead transcripts
        if (hasTranscriptProof && hasProof) {
          status = 'green';
          nextAction = 'Maintain call transcription monitoring.';
        } else {
          status = hasTranscriptProof ? 'yellow' : 'red';
          if (!hasTranscriptProof) { blockers.push('No live call transcript proof'); nextAction = 'Run a real inbound call to generate transcript proof on WebsiteLead.'; }
          if (!hasProof) { blockers.push('No AutomationProofLog pass'); if (!nextAction) nextAction = 'Create and pass AutomationProofLog for ai_booking_agent.'; }
        }
      } else if (cap.key === 'voice_broadcasts') {
        if (hasProof && voiceReadiness.voice_calls_enabled) {
          status = 'green';
          nextAction = 'Maintain voice broadcast monitoring.';
        } else {
          status = voiceReadiness.voice_calls_enabled ? 'yellow' : 'red';
          if (!voiceReadiness.voice_calls_enabled) { blockers.push('voice_calls_enabled is false'); nextAction = 'Enable voice_calls_enabled after configuring ElevenLabs.'; }
          if (!hasProof) { blockers.push('No AutomationProofLog pass'); if (!nextAction) nextAction = 'Create and pass AutomationProofLog for voice broadcasts.'; }
        }
      } else if (cap.key === 'automation_proof_logs') {
        if (proofLogList.length > 0 && proof.passed > 0) {
          status = 'green';
          nextAction = 'Continue maintaining proof logs for all automations.';
        } else if (proofLogList.length > 0) {
          status = 'yellow';
          blockers.push('Proof logs exist but none passed');
          nextAction = 'Review pending/failed proof logs and resolve blockers.';
        } else {
          status = 'red';
          blockers.push('AutomationProofLog is empty — no go-live proof evidence exists');
          nextAction = 'Create AutomationProofLog records for each automation service before claiming go-live.';
        }
      } else {
        status = 'red';
        blockers.push('Not configured');
        nextAction = 'Configure this capability.';
      }

      return {
        key: cap.key,
        label: cap.label,
        service_key: cap.service_key,
        status,
        evidence_sources: evidenceSources,
        blockers,
        next_action: nextAction,
        proof: proof,
      };
    });

    // ── QA Checklist view (per AutomationChecklist) ──
    const qaChecklists = checklistList.map(cl => ({
      id: cl.id,
      business_name: cl.business_name,
      service_key: cl.service_key,
      status: cl.status,
      twilio_configured: cl.twilio_configured,
      resend_configured: cl.resend_configured,
      booking_link_set: cl.booking_link_set,
      review_link_set: cl.review_link_set,
      lead_form_connected: cl.lead_form_connected,
      communication_event_logging_verified: cl.communication_event_logging_verified,
      test_lead_sent: cl.test_lead_sent,
      test_response_received: cl.test_response_received,
      client_approved: cl.client_approved,
      last_tested_at: cl.last_tested_at,
      went_live_at: cl.went_live_at,
      all_false: !cl.twilio_configured && !cl.resend_configured && !cl.booking_link_set && !cl.review_link_set && !cl.lead_form_connected && !cl.communication_event_logging_verified && !cl.test_lead_sent && !cl.test_response_received && !cl.client_approved,
    }));

    // ── Readiness Scorecard (7 categories, admin-only) ──
    const SERVICE_LABELS_MAP = {
      instant_lead_response: 'Instant Lead Response',
      missed_call_text_back: 'Missed Call Text-Back',
      nurture_sequence_14d: 'Nurture Sequence (14-Day)',
      ai_booking_agent: 'AI Booking Agent',
      inbound_sms_assistant: 'Inbound SMS Assistant',
      ai_voice_receptionist: 'AI Voice Receptionist',
      review_request: 'Review Request',
      lead_reactivation: 'Lead Reactivation',
    };

    const readinessScorecard = [];

    // 1. Provider configuration readiness
    {
      const evidence = [];
      const blockers = [];
      const hasTwilio = settings.twilio_enabled && settings.twilio_from_number;
      const hasTwilioCreds = settings.twilio_account_sid_present && settings.twilio_auth_token_present;
      const hasResend = settings.resend_enabled && settings.resend_from_email;
      const hasElevenLabs = hasAgentIds;
      if (hasTwilio) evidence.push('AdminSettings.twilio_enabled=true, from_number set');
      else blockers.push('Twilio not enabled or missing from number');
      if (hasTwilioCreds) evidence.push('Twilio Account SID + Auth Token present');
      else blockers.push('Twilio credentials missing');
      if (hasResend) evidence.push('Resend email configured');
      else blockers.push('Resend email not configured');
      if (hasElevenLabs) evidence.push('ElevenLabs agent IDs configured');
      else blockers.push('ElevenLabs agent IDs missing');
      const allSet = hasTwilio && hasTwilioCreds && hasResend && hasElevenLabs;
      const partial = hasTwilio || hasResend;
      readinessScorecard.push({
        category: 'Provider Configuration Readiness',
        status: allSet ? 'complete' : partial ? 'partial' : 'missing',
        evidence_checked: evidence,
        blocking_issue: blockers[0] || null,
        next_admin_action: allSet ? 'No action — all providers configured.' : 'Complete provider configuration in AdminSettings.',
      });
    }

    // 2. Route/configuration readiness
    {
      const evidence = [];
      const blockers = [];
      if (settings.missed_call_webhook_url) evidence.push('missed_call_webhook_url set');
      else blockers.push('missed_call_webhook_url not set');
      if (settings.sms_webhook_url) evidence.push('sms_webhook_url set');
      else blockers.push('sms_webhook_url not set');
      if (settings.voice_webhook_url) evidence.push('voice_webhook_url set');
      else blockers.push('voice_webhook_url not set');
      if (missedCallStats.has_404) blockers.push('Missed-call webhook returning 404');
      if (missedCallStats.has_405) blockers.push('Missed-call webhook returning 405');
      const allRoutes = settings.missed_call_webhook_url && settings.sms_webhook_url && settings.voice_webhook_url && !missedCallStats.has_404 && !missedCallStats.has_405;
      const partial = settings.missed_call_webhook_url || settings.sms_webhook_url;
      readinessScorecard.push({
        category: 'Route Configuration Readiness',
        status: allRoutes ? 'complete' : partial ? 'partial' : 'missing',
        evidence_checked: evidence,
        blocking_issue: blockers[0] || null,
        next_admin_action: allRoutes ? 'No action — all routes configured.' : 'Set webhook URLs in AdminSettings and verify no 404/405 errors.',
      });
    }

    // 3. Evidence/logging readiness
    {
      const evidence = [];
      const blockers = [];
      if (deliveryStats.delivered > 0) evidence.push(`CommunicationLog: ${deliveryStats.delivered} delivered SMS`);
      else blockers.push('No delivered SMS in CommunicationLog');
      if (deliveryStats.with_provider_message_id > 0) evidence.push(`${deliveryStats.with_provider_message_id} logs with provider_message_id`);
      else blockers.push('No provider_message_id in CommunicationLog');
      if (eventList.length > 0) evidence.push(`CommunicationEvent: ${eventList.length} events`);
      else blockers.push('No CommunicationEvent records');
      const complete = deliveryStats.delivered > 0 && deliveryStats.with_provider_message_id > 0 && eventList.length > 0;
      const partial = deliveryStats.total > 0 || eventList.length > 0;
      readinessScorecard.push({
        category: 'Evidence & Logging Readiness',
        status: complete ? 'complete' : partial ? 'partial' : 'missing',
        evidence_checked: evidence,
        blocking_issue: blockers[0] || null,
        next_admin_action: complete ? 'No action — delivery evidence exists.' : 'Generate real delivered SMS events with provider_message_id.',
      });
    }

    // 4. Automation checklist readiness
    {
      const evidence = [];
      const blockers = [];
      const activeChecklists = checklistList.filter(cl => cl.status === 'active');
      const withFlags = checklistList.filter(cl => cl.twilio_configured || cl.resend_configured || cl.lead_form_connected);
      const clientApproved = checklistList.filter(cl => cl.client_approved);
      if (activeChecklists.length > 0) evidence.push(`${activeChecklists.length} active AutomationChecklist records`);
      else blockers.push('No active AutomationChecklist records');
      if (withFlags.length > 0) evidence.push(`${withFlags.length} checklists with configuration flags set`);
      else blockers.push('No checklists have configuration flags set');
      if (clientApproved.length > 0) evidence.push(`${clientApproved.length} client-approved checklists`);
      else blockers.push('No client-approved checklists');
      const complete = activeChecklists.length > 0 && withFlags.length > 0 && clientApproved.length > 0;
      const partial = checklistList.length > 0;
      readinessScorecard.push({
        category: 'Automation Checklist Readiness',
        status: complete ? 'complete' : partial ? 'partial' : 'missing',
        evidence_checked: evidence,
        blocking_issue: blockers[0] || null,
        next_admin_action: complete ? 'No action — checklists are active and approved.' : 'Complete checklist configuration flags and obtain client sign-off.',
      });
    }

    // 5. Voice assistant readiness
    {
      const evidence = [];
      const blockers = [];
      if (hasAgentIds) evidence.push('ElevenLabs agent IDs configured');
      else blockers.push('ElevenLabs agent IDs missing');
      if (hasPhoneIds) evidence.push('ElevenLabs phone number IDs configured');
      else blockers.push('ElevenLabs phone number IDs missing');
      if (settings.inbound_voice_enabled) evidence.push('inbound_voice_enabled=true');
      else blockers.push('inbound_voice_enabled is false');
      if (hasTranscriptProof) evidence.push('Call transcript proof exists');
      else blockers.push('No call transcript proof');
      const complete = hasAgentIds && hasPhoneIds && settings.inbound_voice_enabled && hasTranscriptProof;
      const partial = hasAgentIds || settings.inbound_voice_enabled;
      readinessScorecard.push({
        category: 'Voice Assistant Readiness',
        status: complete ? 'complete' : partial ? 'partial' : 'missing',
        evidence_checked: evidence,
        blocking_issue: blockers[0] || null,
        next_admin_action: complete ? 'No action — voice assistant is ready.' : 'Configure ElevenLabs agent IDs, phone numbers, and run a real call test.',
      });
    }

    // 6. Production data cleanliness
    {
      const evidence = [];
      const blockers = [];
      if (productionLeadsCount > 0) evidence.push(`${productionLeadsCount} production leads (sample)`);
      if (excludedLeadsCount > 0) { evidence.push(`${excludedLeadsCount} test/smoke leads excluded from metrics`); blockers.push(`${excludedLeadsCount} test records still in database`); }
      else evidence.push('No test data detected in sample');
      if (deliveryStats.weak_proof_count > 0) blockers.push(`${deliveryStats.weak_proof_count} weak proof records (null provider_message_id + sent status)`);
      if (eventStats.twilio_400_errors > 0) blockers.push(`${eventStats.twilio_400_errors} Twilio 400 errors in CommunicationEvent`);
      const clean = excludedLeadsCount === 0 && deliveryStats.weak_proof_count === 0 && eventStats.twilio_400_errors === 0;
      const partial = productionLeadsCount > 0;
      readinessScorecard.push({
        category: 'Production Data Cleanliness',
        status: clean && productionLeadsCount > 0 ? 'complete' : partial ? 'partial' : 'missing',
        evidence_checked: evidence,
        blocking_issue: blockers[0] || null,
        next_admin_action: clean ? 'No action — production data is clean.' : 'Quarantine test records, fix weak proof records, and resolve provider errors.',
      });
    }

    // 7. Client-facing trust readiness
    {
      const evidence = [];
      const blockers = [];
      const passedProofs = proofLogList.filter(p => p.status === 'pass');
      if (passedProofs.length > 0) evidence.push(`${passedProofs.length} passed AutomationProofLog records`);
      else blockers.push('No passed AutomationProofLog records — cannot claim client-facing trust');
      const servicesWithProof = SERVICE_KEYS.filter(sk => proofByService[sk]?.passed > 0);
      if (servicesWithProof.length > 0) evidence.push(`${servicesWithProof.length}/${SERVICE_KEYS.length} services have passed proof`);
      else blockers.push('No service has passed proof');
      const complete = passedProofs.length > 0 && servicesWithProof.length === SERVICE_KEYS.length;
      const partial = passedProofs.length > 0;
      readinessScorecard.push({
        category: 'Client-Facing Trust Readiness',
        status: complete ? 'complete' : partial ? 'partial' : 'missing',
        evidence_checked: evidence,
        blocking_issue: blockers[0] || null,
        next_admin_action: complete ? 'No action — all services have passed proof.' : 'Create and pass AutomationProofLog records for every service key.',
      });
    }

    // ── Repair Queue (admin-only, computed from current data) ──
    const repairQueue = [];

    // Missing proof records
    for (const sk of SERVICE_KEYS) {
      const proof = proofByService[sk] || { passed: 0, total: 0 };
      if (proof.passed === 0) {
        repairQueue.push({
          repair_type: 'Missing proof record',
          affected_capability: SERVICE_LABELS_MAP[sk] || sk,
          evidence_source: `AutomationProofLog (${proof.total} total, ${proof.passed} passed for ${sk})`,
          severity: proof.total === 0 ? 'critical' : 'high',
          why_it_matters: `No passed proof record exists for ${sk}. This capability cannot be marked trusted without proof.`,
          recommended_next_admin_action: `Create and pass an AutomationProofLog record for ${sk}.`,
          safe_to_mark_complete: false,
        });
      }
    }

    // Incomplete automation checklists
    for (const cl of checklistList) {
      const hasFlags = cl.twilio_configured || cl.resend_configured || cl.lead_form_connected;
      if (!hasFlags) {
        repairQueue.push({
          repair_type: 'Incomplete automation checklist',
          affected_capability: cl.business_name || 'Unknown',
          evidence_source: `AutomationChecklist ${cl.id} (${cl.service_key})`,
          severity: 'high',
          why_it_matters: `Checklist for ${cl.business_name} has no configuration flags set — the client is not ready for go-live.`,
          recommended_next_admin_action: `Configure Twilio, Resend, booking link, and lead form for ${cl.business_name}.`,
          safe_to_mark_complete: false,
        });
      }
    }

    // Provider errors in logs
    if (eventStats.twilio_400_errors > 0) {
      repairQueue.push({
        repair_type: 'Provider error present in logs',
        affected_capability: 'SMS / Twilio',
        evidence_source: `CommunicationEvent (${eventStats.twilio_400_errors} events with 400 errors)`,
        severity: 'high',
        why_it_matters: 'Twilio is returning 400 errors — request payloads or sender permissions may be misconfigured.',
        recommended_next_admin_action: 'Inspect 400 error events in CommunicationEvent, check request payloads and Twilio sender permissions.',
        safe_to_mark_complete: false,
      });
    }
    if (eventStats.failed_events > 0) {
      repairQueue.push({
        repair_type: 'Provider error present in logs',
        affected_capability: 'SMS / CommunicationEvent',
        evidence_source: `CommunicationEvent (${eventStats.failed_events} failed events)`,
        severity: 'medium',
        why_it_matters: 'Failed communication events indicate delivery or processing failures.',
        recommended_next_admin_action: 'Review failed CommunicationEvent records and resolve underlying errors.',
        safe_to_mark_complete: false,
      });
    }

    // Weak evidence records
    if (deliveryStats.weak_proof_count > 0) {
      repairQueue.push({
        repair_type: 'Weak evidence record',
        affected_capability: 'SMS Delivery Proof',
        evidence_source: `CommunicationLog (${deliveryStats.weak_proof_count} records with null provider_message_id + sent status)`,
        severity: 'medium',
        why_it_matters: 'SMS logs without provider_message_id cannot be verified as truly delivered.',
        recommended_next_admin_action: 'Ensure Twilio status callbacks populate provider_message_id on all CommunicationLog records.',
        safe_to_mark_complete: false,
      });
    }

    // Missing voice assistant prerequisites
    if (!hasAgentIds) {
      repairQueue.push({
        repair_type: 'Missing voice assistant prerequisite',
        affected_capability: 'AI Voice Receptionist',
        evidence_source: 'AdminSettings.elevenlabs_agent_ids (empty)',
        severity: 'high',
        why_it_matters: 'AI voice receptionist cannot function without ElevenLabs agent IDs.',
        recommended_next_admin_action: 'Configure ElevenLabs agent IDs in AdminSettings.',
        safe_to_mark_complete: false,
      });
    }
    if (!hasTranscriptProof) {
      repairQueue.push({
        repair_type: 'Missing voice assistant prerequisite',
        affected_capability: 'Call Transcription / Summaries',
        evidence_source: 'WebsiteLead (no records with transcript field)',
        severity: 'medium',
        why_it_matters: 'No call transcript proof exists — live call transcription cannot be marked trusted.',
        recommended_next_admin_action: 'Run a real inbound call to generate transcript proof on WebsiteLead.',
        safe_to_mark_complete: false,
      });
    }

    // Internal/test data in production view
    if (excludedLeadsCount > 0) {
      repairQueue.push({
        repair_type: 'Internal/test data included in production view',
        affected_capability: 'Production Data Cleanliness',
        evidence_source: `WebsiteLead sample (${excludedLeadsCount} excluded test/smoke/internal leads)`,
        severity: 'low',
        why_it_matters: 'Test data in the database can inflate production metrics if not properly excluded.',
        recommended_next_admin_action: 'Verify test records are properly tagged with quality_reason_codes and excluded from production dashboards.',
        safe_to_mark_complete: false,
      });
    }

    // Missing client-facing trust evidence
    if (proofLogList.length === 0) {
      repairQueue.push({
        repair_type: 'Missing client-facing trust evidence',
        affected_capability: 'All Services',
        evidence_source: 'AutomationProofLog (empty — 0 records)',
        severity: 'critical',
        why_it_matters: 'No proof logs exist at all. No automation can be claimed as production-trusted.',
        recommended_next_admin_action: 'Create AutomationProofLog records for every service key before claiming go-live.',
        safe_to_mark_complete: false,
      });
    }

    // ── Capability Details (per capability, admin-only) ──
    const capabilityDetails = {};
    for (const cap of CAPABILITIES) {
      const capData = capabilities.find(c => c.key === cap.key);
      const latestProof = cap.service_key
        ? proofLogList.find(p => p.service_key === cap.service_key)
        : proofLogList[0] || null;
      const latestChecklist = cap.service_key
        ? checklistList.find(cl => cl.service_key === cap.service_key)
        : null;
      const latestComm = cap.service_key
        ? smsLogList.find(l => (l.trigger_name || '').includes(cap.service_key) || (l.trigger_name || '').includes(cap.service_key.replace(/_/g, ' ')))
        : null;

      const incompleteFields = [];
      if (cap.key === 'ai_voice_receptionist' || cap.key === 'voice_broadcasts') {
        if (!hasAgentIds) incompleteFields.push('elevenlabs_agent_ids');
        if (!hasPhoneIds) incompleteFields.push('elevenlabs_phone_number_ids');
        if (!settings.inbound_voice_enabled) incompleteFields.push('inbound_voice_enabled');
        if (!settings.voice_webhook_url) incompleteFields.push('voice_webhook_url');
      }
      if (cap.key === 'missed_call_text_back') {
        if (!settings.missed_call_webhook_url) incompleteFields.push('missed_call_webhook_url');
      }
      if (cap.key === 'instant_lead_response') {
        if (!settings.sms_webhook_url) incompleteFields.push('sms_webhook_url');
      }

      capabilityDetails[cap.key] = {
        capability_name: cap.label,
        current_status: capData?.status || 'red',
        entities_used: cap.service_key
          ? ['AdminSettings', 'AutomationProofLog', 'AutomationChecklist', 'CommunicationLog', 'CommunicationEvent']
          : ['AdminSettings', 'AutomationProofLog'],
        evidence_summary: capData?.evidence_sources?.join('; ') || 'No evidence checked',
        blockers: capData?.blockers || [],
        incomplete_setup_fields: incompleteFields,
        latest_checklist: latestChecklist ? {
          id: latestChecklist.id,
          business_name: latestChecklist.business_name,
          service_key: latestChecklist.service_key,
          status: latestChecklist.status,
          client_approved: latestChecklist.client_approved,
        } : null,
        latest_proof: latestProof ? {
          id: latestProof.id,
          service_key: latestProof.service_key,
          status: latestProof.status,
          tested_at: latestProof.tested_at,
        } : null,
        latest_communication: latestComm ? {
          id: latestComm.id,
          channel: latestComm.channel,
          delivery_status: latestComm.delivery_status,
          provider_message_id: latestComm.provider_message_id,
          created_date: latestComm.created_date,
        } : null,
        next_admin_action: capData?.next_action || 'Configure this capability.',
      };
    }

    return Response.json({
      capabilities,
      readiness_scorecard: readinessScorecard,
      repair_queue: repairQueue,
      capability_details: capabilityDetails,
      delivery_stats: deliveryStats,
      event_stats: eventStats,
      missed_call_stats: missedCallStats,
      voice_readiness: voiceReadiness,
      proof_by_service: proofByService,
      qa_checklists: qaChecklists,
      quarantine: {
        excluded_leads_count: excludedLeadsCount,
        production_leads_count: productionLeadsCount,
        rules: ['email contains: clientsurge-install.internal, clientsurge.test, test+, smoke', 'source contains: smoke, test, internal', 'quality_reason_codes: internal_test, smoke_test, example_email'],
      },
      settings_summary: {
        twilio_enabled: settings.twilio_enabled,
        twilio_from_number: settings.twilio_from_number,
        twilio_account_sid_present: settings.twilio_account_sid_present || false,
        twilio_auth_token_present: settings.twilio_auth_token_present || false,
        missed_call_webhook_url: settings.missed_call_webhook_url,
        sms_webhook_url: settings.sms_webhook_url,
        voice_webhook_url: settings.voice_webhook_url,
        sms_status_callback_url: settings.sms_status_callback_url,
        inbound_voice_enabled: settings.inbound_voice_enabled,
        voice_calls_enabled: settings.voice_calls_enabled,
        voice_forwarding_phone: settings.voice_forwarding_phone,
        resend_enabled: settings.resend_enabled,
        resend_from_email: settings.resend_from_email,
        booking_link_default: settings.booking_link_default,
        has_elevenlabs_agent_ids: hasAgentIds,
        has_elevenlabs_phone_number_ids: hasPhoneIds,
      },
      proof_logs_empty: proofLogList.length === 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});