import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { automation_job_id, follow_up_type } = await req.json();

    if (!automation_job_id || !follow_up_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get automation job
    const job = await base44.entities.AutomationJob.get(automation_job_id);
    if (!job) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    // Get lead
    const lead = await base44.entities.Lead.get(job.lead_id);
    if (!lead || !lead.email) {
      return Response.json({ error: 'Lead or email not found' }, { status: 404 });
    }

    // Get admin settings for template
    const settings = await base44.entities.AdminSettings.list();
    const adminSettings = settings[0] || {};

    // Select template based on follow_up_type
    let subject, body;
    if (follow_up_type === 'email_followup_24h') {
      subject = 'Just checking in — still interested?';
      body = 'Hi ' + (lead.name || 'there') + ', we wanted to follow up on your inquiry. Are you still interested in learning more? Let us know!';
    } else if (follow_up_type === 'email_followup_3d') {
      subject = 'Want help getting started?';
      body = 'Hi ' + (lead.name || 'there') + ', we haven\'t heard back from you. We\'d love to help you move forward. Reply to this email or book a time that works for you.';
    }

    // Send via Resend if configured
    let emailResult = null;
    if (adminSettings.resend_enabled && Deno.env.get('RESEND_API_KEY')) {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: adminSettings.resend_from_email || 'noreply@resend.dev',
          to: lead.email,
          subject,
          html: `<p>${body}</p>`,
        }),
      });

      emailResult = await resendResponse.json();
    }

    // Create communication event
    await base44.entities.CommunicationEvent.create({
      lead_id: job.lead_id,
      channel: 'email',
      direction: 'outbound',
      event_type: 'email_sent',
      provider: 'resend',
      status: emailResult?.id ? 'sent' : 'failed',
      subject,
      message_body: body,
      provider_message_id: emailResult?.id || null,
      error_message: emailResult?.error?.message || null,
    });

    // Update job status
    await base44.entities.AutomationJob.update(automation_job_id, {
      status: 'completed',
      processed_at: new Date().toISOString(),
      result_metadata: JSON.stringify(emailResult),
    });

    return Response.json({
      success: true,
      email_sent: !!emailResult?.id,
      provider_id: emailResult?.id,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});