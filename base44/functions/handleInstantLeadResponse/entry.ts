import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * INSTANT LEAD RESPONSE ORCHESTRATOR
 * Triggered on WebsiteLead or Leads creation.
 * Creates AutomationJob records for instant_sms and confirmation_email if automation_enabled.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, lead_type, client_id, client_project_id } = await req.json();

    if (!lead_id || !lead_type) {
      return Response.json({ error: 'Missing lead_id or lead_type' }, { status: 400 });
    }

    // 1. Fetch the lead record
    const lead = await (lead_type === 'WebsiteLead'
      ? base44.asServiceRole.entities.WebsiteLead.get(lead_id)
      : base44.asServiceRole.entities.Leads.get(lead_id)
    );

    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Check automation_enabled (defaults to true if not set)
    if (lead.automation_enabled === false) {
      console.log(`[handleInstantLeadResponse] Automation disabled for lead ${lead_id}`);
      return Response.json({ skipped: true, reason: 'automation_disabled' });
    }

    // 2. Log workflow_triggered
    const workflowEvent = await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id,
      client_id: client_id || lead.client_id,
      client_project_id: client_project_id || lead.client_project_id,
      channel: 'internal',
      direction: 'system',
      event_type: 'workflow_triggered',
      provider: 'internal',
      status: 'processed',
      subject: `Instant lead response workflow triggered for ${lead_type} ${lead_id}`,
      message_body: JSON.stringify({ lead_id, lead_type, email: lead.email, phone: lead.phone_number }),
      environment: getEnvironment(),
    });

    // 3. Get admin settings for enabled channels
    const settings = await base44.asServiceRole.entities.AdminSettings.list().then(s => s?.[0]);
    const smsEnabled = settings?.sms_enabled || settings?.twilio_enabled;
    const emailEnabled = settings?.email_confirmation_template && settings?.resend_enabled;

    const jobs = [];

    // 4. Create instant_sms job if SMS is enabled and lead has phone
    if (smsEnabled && lead.phone_number) {
      const smsJob = await base44.asServiceRole.entities.AutomationJob.create({
        lead_id,
        lead_type,
        client_id: client_id || lead.client_id,
        client_project_id: client_project_id || lead.client_project_id,
        job_type: 'instant_sms',
        status: 'queued',
        channel: 'sms',
        recipient_phone: lead.phone_number,
        recipient_email: null,
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
    }

    // 5. Create confirmation_email job if email is enabled and lead has email
    if (emailEnabled && lead.email) {
      const emailJob = await base44.asServiceRole.entities.AutomationJob.create({
        lead_id,
        lead_type,
        client_id: client_id || lead.client_id,
        client_project_id: client_project_id || lead.client_project_id,
        job_type: 'confirmation_email',
        status: 'queued',
        channel: 'email',
        recipient_phone: null,
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
    }

    // 6. Add jobs to EventQueue for processing
    for (const job of jobs) {
      await base44.asServiceRole.entities.EventQueue.create({
        lead_id,
        event_type: 'automation_job_created',
        status: 'pending',
        source: 'instant_lead_response',
        payload_json: JSON.stringify({ job_id: job.id, job_type: job.job_type }),
        created_at: new Date().toISOString(),
      });
    }

    return Response.json({
      success: true,
      lead_id,
      lead_type,
      jobs_created: jobs.length,
      sms_job: jobs.find(j => j.job_type === 'instant_sms')?.id,
      email_job: jobs.find(j => j.job_type === 'confirmation_email')?.id,
      workflow_event_id: workflowEvent.id,
    });
  } catch (error) {
    console.error('[handleInstantLeadResponse]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getEnvironment() {
  const hostname = Deno.env.get('DENO_ENVIRONMENT') || 'production';
  if (hostname?.includes('smoke') || hostname?.includes('test')) return 'smoke';
  if (hostname?.includes('staging')) return 'qa';
  return 'production';
}