import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import {
  RESEND_TEMPLATE_ALIASES,
  clean,
  commonTemplateVariables,
  firstNameFrom,
  getFromEmail,
  logEmailEvent,
  renderMasterFallbackHtml,
  renderMasterFallbackText,
  sendClientSurgeResendTemplateEmail,
} from '../_shared/clientSurgeResendTemplates.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const { lead_id } = await req.json();

    if (!lead_id) {
      return secureJson({ error: 'lead_id required' }, { status: 400 });
    }

    const lead = await base44.entities.Lead.get(lead_id).catch(() => null);
    if (!lead) {
      return secureJson({ error: 'Lead not found' }, { status: 404 });
    }

    const settings = await svc.entities.AdminSettings.list();
    const adminSettings = settings.length > 0 ? settings[0] : null;

    const recipientEmail = clean(lead.email || lead.email_address);
    if (!recipientEmail) {
      return secureJson({ error: 'Lead has no email' }, { status: 400 });
    }

    const fullName = clean(lead.full_name || lead.name || lead.first_name || lead.business_name || 'there');
    const firstName = firstNameFrom(fullName);
    const businessName = clean(lead.business_name || lead.business || 'your business');
    const bookingLink = clean(adminSettings?.booking_link_default || 'https://calendly.com/nolan-clientsurge');
    const messageSummary = clean(lead.problem || lead.message || lead.description || 'Your message was received.');
    const subject = 'We received your message — ClientSurge Systems';

    const rows = [
      ['Business', businessName],
      ['Message', messageSummary],
      ['Reference', lead_id],
    ];

    const fallbackHtml = renderMasterFallbackHtml({
      badge: 'Message Received',
      headline: `${firstName}, we received your message.`,
      intro: 'Thanks for reaching out. The ClientSurge team will review your note and reply from a monitored inbox.',
      rows,
      bullets: ['Review request', 'Route to the right team', 'Reply with next step'],
      senderName: 'ClientSurge Support Team',
      senderTitle: 'Support Team',
      referenceId: lead_id,
    });
    const fallbackText = renderMasterFallbackText({
      headline: `${firstName}, we received your message.`,
      intro: 'Thanks for reaching out. The ClientSurge team will review your note and reply from a monitored inbox.',
      rows,
      referenceId: lead_id,
    });

    const sendResult = await sendClientSurgeResendTemplateEmail({
      to: recipientEmail,
      fromEmail: getFromEmail(adminSettings?.resend_from_email || 'system@clientsurgesystems.com'),
      fromName: 'ClientSurge Systems',
      replyTo: 'support@clientsurgesystems.com',
      subject,
      templateAlias: RESEND_TEMPLATE_ALIASES.contactFormReceived,
      variables: commonTemplateVariables({
        RECIPIENT_NAME: firstName,
        BUSINESS_NAME: businessName,
        REFERENCE_ID: lead_id,
        MESSAGE_SUMMARY: messageSummary,
        CALENDAR_URL: bookingLink,
        SENDER_NAME: 'ClientSurge Support Team',
        SENDER_TITLE: 'Support Team',
      }),
      fallbackHtml,
      fallbackText,
      tags: [
        { name: 'category', value: 'lead_confirmation' },
        { name: 'template', value: RESEND_TEMPLATE_ALIASES.contactFormReceived },
      ],
      idempotencyKey: `lead-confirmation-${lead_id}`,
    });

    await logEmailEvent(svc, {
      leadId: lead_id,
      relatedEntityType: 'Lead',
      relatedEntityId: lead_id,
      eventType: sendResult.ok ? 'email_sent' : 'email_failed',
      status: sendResult.ok ? 'sent' : 'failed',
      subject,
      bodyPreview: sendResult.ok
        ? `Lead confirmation sent to ${recipientEmail}. Template used: ${sendResult.templateUsed}. Fallback used: ${sendResult.fallbackUsed}.`
        : `Lead confirmation failed for ${recipientEmail}: ${sendResult.error}`,
      templateAlias: RESEND_TEMPLATE_ALIASES.contactFormReceived,
      providerMessageId: sendResult.ok ? sendResult.providerMessageId : null,
      recipient: recipientEmail,
      templateUsed: sendResult.ok ? sendResult.templateUsed : false,
      fallbackUsed: sendResult.ok ? sendResult.fallbackUsed : true,
    });

    if (!sendResult.ok) {
      return secureJson({ error: 'Email send failed', detail: sendResult.error }, { status: 500 });
    }

    return secureJson({
      success: true,
      provider_message_id: sendResult.providerMessageId,
      template_alias: RESEND_TEMPLATE_ALIASES.contactFormReceived,
      template_used: sendResult.templateUsed,
      fallback_used: sendResult.fallbackUsed,
    });
  } catch (error) {
    console.error('[sendLeadConfirmationEmail] Error:', error);
    return secureJson({ error: error.message }, { status: 500 });
  }
});
