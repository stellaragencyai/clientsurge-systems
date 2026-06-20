import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * INSTANT LEAD RESPONSE ORCHESTRATOR
 * Triggered on WebsiteLead creation via entity automation.
 * Also callable directly with { lead_id, lead_type }.
 * Creates AutomationJob records for instant_sms and confirmation_email.
 * Idempotent — skips if jobs already exist for this lead.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Support both entity automation format (event.entity_id) and direct call format
    const isEntityAutomation = body?.event?.type === 'create';
    const lead_id = isEntityAutomation ? body.event.entity_id : body.lead_id;
    const lead_type = isEntityAutomation ? (body.event.entity_name || 'WebsiteLead') : (body.lead_type || 'WebsiteLead');

    if (!lead_id) {
      return Response.json({ error: 'No lead_id found in payload' }, { status: 400 });
    }

    // 1. Idempotency check — don't double-create jobs for same lead
    const existingJobs = await base44.asServiceRole.entities.AutomationJob.filter(
      { lead_id },
      '-created_at',
      5
    ).catch(() => []);

    if (existingJobs?.length > 0) {
      const existingTypes = new Set(existingJobs.map(j => j.job_type));
      console.log(`[handleInstantLeadResponse] Jobs already exist for lead ${lead_id}:`, [...existingTypes]);
    }

    // 2. Fetch the lead record
    const lead = await (lead_type === 'WebsiteLead'
      ? base44.asServiceRole.entities.WebsiteLead.get(lead_id)
      : base44.asServiceRole.entities.Leads.get(lead_id)
    );

    if (!lead) {
      return Response.json({ error: 'Lead not found', lead_id }, { status: 404 });
    }

    // Skip if automation disabled
    if (lead.automation_enabled === false) {
      return Response.json({ skipped: true, reason: 'automation_disabled', lead_id });
    }

    // Skip smoke/QA data — check for test markers
    if (isTestLead(lead)) {
      console.log(`[handleInstantLeadResponse] Skipping test/smoke lead ${lead_id}`);
      return Response.json({ skipped: true, reason: 'test_lead', lead_id });
    }

    // 3. Log workflow_triggered
    const workflowEvent = await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id,
      client_id: lead.client_id,
      client_project_id: lead.client_project_id,
      channel: 'internal',
      direction: 'system',
      event_type: 'workflow_triggered',
      provider: 'internal',
      status: 'processed',
      subject: `Instant lead response workflow triggered`,
      message_body: JSON.stringify({ lead_id, lead_type, email: lead.email, phone: lead.phone_number }),
      environment: 'production',
      dashboard_excluded: false,
      dashboard_truth_status: 'trusted',
    }).catch(err => {
      console.warn('[handleInstantLeadResponse] Failed to log workflow event:', err.message);
      return null;
    });

    // 4. Get admin settings
    const settings = await base44.asServiceRole.entities.AdminSettings.list().then(s => s?.[0]).catch(() => null);

    const jobs = [];
    const existing = new Set((existingJobs || []).map(j => j.job_type));

    // 5. Create instant_sms job if not already created
    if (!existing.has('instant_sms') && settings?.twilio_enabled && lead.phone_number) {
      const smsJob = await base44.asServiceRole.entities.AutomationJob.create({
        lead_id,
        lead_type,
        client_id: lead.client_id,
        client_project_id: lead.client_project_id,
        job_type: 'instant_sms',
        status: 'queued',
        channel: 'sms',
        recipient_phone: lead.phone_number,
        template_key: 'instant_lead_response',
        retry_count: 0,
        max_retries: 3,
        created_at: new Date().toISOString(),
        queued_at: new Date().toISOString(),
        context_json: JSON.stringify({
          first_name: lead.first_name || 'there',
          business_name: lead.business_name,
          lead_type,
        }),
      });
      jobs.push(smsJob);
    } else if (!settings?.twilio_enabled) {
      console.warn('[handleInstantLeadResponse] Twilio not enabled — skipping SMS job');
    } else if (!lead.phone_number) {
      console.warn('[handleInstantLeadResponse] No phone number on lead — skipping SMS job');
    }

    // 6. Create confirmation_email job if not already created
    if (!existing.has('confirmation_email') && settings?.resend_enabled && lead.email) {
      const emailJob = await base44.asServiceRole.entities.AutomationJob.create({
        lead_id,
        lead_type,
        client_id: lead.client_id,
        client_project_id: lead.client_project_id,
        job_type: 'confirmation_email',
        status: 'queued',
        channel: 'email',
        recipient_email: lead.email,
        template_key: 'confirmation_email',
        retry_count: 0,
        max_retries: 3,
        created_at: new Date().toISOString(),
        queued_at: new Date().toISOString(),
        context_json: JSON.stringify({
          first_name: lead.first_name || 'there',
          business_name: lead.business_name,
          lead_type,
        }),
      });
      jobs.push(emailJob);
    } else if (!settings?.resend_enabled) {
      console.warn('[handleInstantLeadResponse] Resend not enabled — skipping email job');
    } else if (!lead.email) {
      console.warn('[handleInstantLeadResponse] No email on lead — skipping email job');
    }

    // 7. Queue each job in EventQueue
    for (const job of jobs) {
      await base44.asServiceRole.entities.EventQueue.create({
        lead_id,
        event_type: 'automation_job_created',
        status: 'pending',
        source: 'instant_lead_response',
        payload_json: JSON.stringify({ job_id: job.id, job_type: job.job_type }),
        created_at: new Date().toISOString(),
      }).catch(err => console.warn('EventQueue create failed:', err.message));
    }

    return Response.json({
      success: true,
      lead_id,
      lead_type,
      jobs_created: jobs.length,
      sms_job_id: jobs.find(j => j.job_type === 'instant_sms')?.id,
      email_job_id: jobs.find(j => j.job_type === 'confirmation_email')?.id,
      workflow_event_id: workflowEvent?.id,
      skipped_existing: [...existing],
    });
  } catch (error) {
    console.error('[handleInstantLeadResponse]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function isTestLead(lead) {
  const testMarkers = ['test', 'smoke', 'qa', 'demo', 'staging'];
  const emailDomain = (lead.email || '').split('@')[1] || '';
  const businessName = (lead.business_name || '').toLowerCase();
  return testMarkers.some(m =>
    emailDomain.includes(m) || businessName.includes(m)
  );
}