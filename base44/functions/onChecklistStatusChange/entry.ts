import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { getAppUrl } from '../_shared/appUrl.js';

const SERVICE_LABELS = {
  instant_lead_response: 'Instant Lead Response',
  missed_call_text_back: 'Missed Call Text-Back',
  nurture_sequence_14d: '14-Day Nurture Sequence',
  ai_booking_agent: 'AI Booking Agent',
  lead_reactivation: 'Old Lead Reactivation',
  review_request: 'Review Request Automation',
};

const SERVICE_DESCRIPTIONS = {
  instant_lead_response: 'Your system will now automatically respond to new leads within 90 seconds via SMS.',
  missed_call_text_back: 'Missed calls to your business number will now trigger an automatic text-back to the caller.',
  nurture_sequence_14d: 'New leads will now receive a smart follow-up sequence over 14 days via SMS and email.',
  ai_booking_agent: 'Qualified leads will now automatically receive your booking link and confirmation messages.',
  lead_reactivation: 'Your old lead reactivation campaign is now configured and ready to run.',
  review_request: 'Your review request automation is now active and ready to send review requests after jobs.',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data, old_data } = payload;

    // Only fire when status changes TO "active"
    if (data?.status !== 'active' || old_data?.status === 'active') {
      return Response.json({ skipped: true, reason: 'Status did not transition to active' });
    }

    const checklist = data;
    const clientEmail = checklist.client_email;
    const businessName = checklist.business_name || 'Your Business';
    const serviceKey = checklist.service_key;
    const serviceLabel = SERVICE_LABELS[serviceKey] || serviceKey;
    const serviceDescription = SERVICE_DESCRIPTIONS[serviceKey] || 'Your automation service is now live.';
    const appUrl = getAppUrl();
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@clientsurgesystems.com';

    if (!clientEmail) {
      console.log('No client email on checklist, skipping notification');
      return Response.json({ skipped: true, reason: 'No client_email on checklist' });
    }

    // Send email via Resend
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      console.error('RESEND_API_KEY not set');
      return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const emailBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0088CC 0%, #003B8F 100%); padding: 40px 40px 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">
        🚀 Your System Is Live!
      </h1>
      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 15px;">
        ${businessName}
      </p>
    </div>

    <!-- Body -->
    <div style="padding: 40px;">
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; margin-bottom: 28px; text-align: center;">
        <div style="font-size: 40px; margin-bottom: 8px;">✅</div>
        <h2 style="color: #15803d; margin: 0 0 8px; font-size: 20px; font-weight: 700;">
          ${serviceLabel}
        </h2>
        <p style="color: #166534; margin: 0; font-size: 14px;">
          ${serviceDescription}
        </p>
      </div>

      <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
        Great news! Our team has finished configuring and testing your <strong>${serviceLabel}</strong> automation. This service is now fully live and working for <strong>${businessName}</strong>.
      </p>

      <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">
        You can log into your client portal anytime to monitor your system's performance, view lead activity, and track progress updates.
      </p>

      <!-- CTA -->
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${appUrl}/client-portal" 
           style="display: inline-block; background: linear-gradient(135deg, #0088CC 0%, #003B8F 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 700; font-size: 15px;">
          View My Dashboard →
        </a>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
        <p style="color: #9ca3af; font-size: 13px; margin: 0;">
          Questions? Reply to this email or visit your portal's support chat.<br>
          <strong style="color: #6b7280;">ClientSurge Systems</strong>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `ClientSurge Systems <${fromEmail}>`,
        to: [clientEmail],
        subject: `✅ Your ${serviceLabel} is now live — ${businessName}`,
        html: emailBody,
      }),
    });

    const emailResult = await emailRes.json();

    if (!emailRes.ok) {
      console.error('Resend error:', emailResult);
      return Response.json({ error: 'Failed to send email', details: emailResult }, { status: 500 });
    }

    // Log the communication event
    await base44.asServiceRole.entities.CommunicationEvent.create({
      channel: 'email',
      direction: 'outbound',
      event_type: 'service_status_changed',
      provider: 'resend',
      status: 'sent',
      subject: `${serviceLabel} now live — ${businessName}`,
      message_body: `Automated progress update sent to ${clientEmail} when checklist status changed to active.`,
      context_type: 'automation_checklist',
      context_id: checklist.id,
      provider_message_id: emailResult.id || null,
      metadata_json: JSON.stringify({ service_key: serviceKey, checklist_id: checklist.id }),
    });

    console.log(`Progress email sent to ${clientEmail} for service: ${serviceLabel}`);
    return Response.json({ success: true, email_id: emailResult.id, sent_to: clientEmail });

  } catch (error) {
    console.error('onChecklistStatusChange error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
