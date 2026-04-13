import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { full_name, business_name, email, phone, niche, monthly_leads, biggest_problem, contact_method, source } = payload;

    if (!full_name || !business_name || !email || !phone) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Create Lead record
    const lead = await base44.entities.Lead.create({
      name: full_name,
      business_name,
      email,
      phone,
      niche,
      monthly_leads,
      status: 'new',
      notes: `Problem: ${biggest_problem}\nPreferred contact: ${contact_method}`,
      source: source || 'web_form',
    });

    // 2. Create lead_created CommunicationEvent
    await base44.entities.CommunicationEvent.create({
      lead_id: lead.id,
      channel: 'internal',
      direction: 'system',
      event_type: 'lead_created',
      provider: 'internal',
      status: 'processed',
      message_body: `Lead created: ${full_name} from ${business_name}`,
    });

    // 3. Create AutomationJob records for downstream actions
    const jobs = [
      { job_type: 'instant_sms', trigger_event: 'lead_created' },
      { job_type: 'confirmation_email', trigger_event: 'lead_created' },
      { job_type: 'admin_notification', trigger_event: 'lead_created' },
      { job_type: 'webhook_dispatch', trigger_event: 'lead_created' },
    ];

    for (const job of jobs) {
      await base44.entities.AutomationJob.create({
        lead_id: lead.id,
        job_type: job.job_type,
        trigger_event: job.trigger_event,
        status: 'queued',
        attempts: 0,
      });
    }

    // 4. Create ConversationThread (will track SMS/email exchanges)
    await base44.entities.ConversationThread.create({
      lead_id: lead.id,
      primary_channel: contact_method?.toLowerCase() === 'text message' ? 'sms' : 'email',
      thread_status: 'open',
      message_count: 0,
    });

    // 5. Trigger downstream actions (non-blocking)
    try {
      await base44.functions.invoke('sendLeadConfirmationEmail', { lead_id: lead.id });
    } catch (err) {
      console.log('Email send failed (non-blocking):', err.message);
    }

    try {
      await base44.functions.invoke('sendAdminLeadNotification', { lead_id: lead.id });
    } catch (err) {
      console.log('Admin notification failed (non-blocking):', err.message);
    }

    try {
      await base44.functions.invoke('dispatchLeadWebhook', { lead_id: lead.id });
    } catch (err) {
      console.log('Webhook dispatch failed (non-blocking):', err.message);
    }

    try {
      await base44.functions.invoke('scheduleFollowUpEmails', { lead_id: lead.id });
    } catch (err) {
      console.log('Follow-up email scheduling failed (non-blocking):', err.message);
    }

    return Response.json({
      success: true,
      lead_id: lead.id,
      message: 'Lead created successfully',
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});