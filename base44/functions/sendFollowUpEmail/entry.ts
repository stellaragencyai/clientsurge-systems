import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { resendFetch } from "../_shared/resendFetch.js";
import { getApprovedEmailSender, getEmailOutreachGate } from "../_shared/emailDeliverabilityGate.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { automation_job_id, follow_up_type } = await req.json();

    if (!automation_job_id || !follow_up_type) {
      return secureJson({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get automation job
    const job = await base44.entities.AutomationJob.get(automation_job_id);
    if (!job) {
      return secureJson({ error: 'Job not found' }, { status: 404 });
    }

    // Get lead
    const lead = await base44.entities.Lead.get(job.lead_id);
    if (!lead || !lead.email) {
      return secureJson({ error: 'Lead or email not found' }, { status: 404 });
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
      const sendGate = getEmailOutreachGate('direct follow-up email');
      if (!sendGate.ok) {
        await base44.entities.CommunicationEvent.create({
          lead_id: job.lead_id,
          channel: 'email',
          direction: 'outbound',
          event_type: 'email_blocked',
          provider: 'resend',
          status: 'blocked',
          subject,
          message_body: body,
          error_message: sendGate.reason,
          metadata_json: JSON.stringify({
            automation_job_id,
            follow_up_type,
            proof_status: sendGate.proof_status,
            requires_owner_action: true,
          }),
        });

        return secureJson({
          success: false,
          email_sent: false,
          error: 'Follow-up email blocked until deliverability proof is complete.',
          reason: sendGate.reason,
          proof_status: sendGate.proof_status,
        }, { status: 403 });
      }

      const resendEmailResult = await resendFetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: getApprovedEmailSender(adminSettings, { preferLeads: true }),
          to: lead.email,
          subject,
          html: `<p>${body}</p>`,
        }),
      });

      emailResult = await resendEmailResult.json().catch(() => ({}));
      if (!resendEmailResult.ok) {
        emailResult = {
          error: {
            message: emailResult?.message || `Resend error ${resendEmailResult.status}`,
          },
        };
      }
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

    return secureJson({
      success: true,
      email_sent: !!emailResult?.id,
      provider_id: emailResult?.id,
    });
  } catch (error) {
    return secureJson({ error: error.message }, { status: 500 });
  }
});
