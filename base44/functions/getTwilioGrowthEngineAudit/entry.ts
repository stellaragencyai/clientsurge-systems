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

    return Response.json({
      capabilities,
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