import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const MAX_FIELD_LENGTH = 500;
const MAX_MESSAGE_LENGTH = 1500;
const DUPLICATE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const CONTACT_PREFIX = 'Contact form inquiry: ';
const LEAD_SOURCE = 'website';
const INTAKE_TYPE = 'contact_inquiry';

function sanitizeString(value: unknown, maxLength = MAX_FIELD_LENGTH) {
  if (typeof value !== 'string') return '';
  return value.replace(/[<>]/g, '').trim().slice(0, maxLength);
}

function normalizeContactInput(payload: Record<string, unknown>) {
  return {
    full_name: sanitizeString(payload.full_name),
    email: sanitizeString(payload.email).toLowerCase(),
    phone: sanitizeString(payload.phone),
    business_name: sanitizeString(payload.business_name),
    business_type: sanitizeString(payload.business_type) || 'General Inquiry',
    message: sanitizeString(payload.message, MAX_MESSAGE_LENGTH),
  };
}

function validateContactInput(contact: ReturnType<typeof normalizeContactInput>) {
  const errors: string[] = [];

  if (!contact.full_name) errors.push('Full name is required');

  if (!contact.email) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
    errors.push('Email must be valid');
  }

  if (contact.phone && contact.phone.replace(/\D/g, '').length < 10) {
    errors.push('Phone must be valid');
  }

  if (!contact.message) errors.push('Message is required');

  return errors;
}

function buildLeadPayload(contact: ReturnType<typeof normalizeContactInput>, status = 'New') {
  return {
    full_name: contact.full_name,
    business_name: contact.business_name || `${contact.business_type} Inquiry`,
    email: contact.email,
    phone: contact.phone || 'Not provided',
    business_type: contact.business_type,
    problem: `${CONTACT_PREFIX}${contact.message}`.slice(0, MAX_MESSAGE_LENGTH),
    source: LEAD_SOURCE,
    intake_type: INTAKE_TYPE,
    status,
  } as const;
}

async function logCommunicationEvent(
  base44: ReturnType<typeof createClientFromRequest>,
  payload: {
    lead_id: string;
    channel: 'sms' | 'email' | 'webhook' | 'internal';
    direction: 'outbound' | 'inbound' | 'system';
    event_type: 'lead_created' | 'sms_sent' | 'sms_failed' | 'sms_received' | 'sms_delivered' | 'email_sent' | 'email_failed' | 'webhook_sent' | 'workflow_triggered' | 'status_update';
    provider: 'twilio' | 'resend' | 'gmail' | 'zapier' | 'n8n' | 'internal';
    status: 'pending' | 'sent' | 'delivered' | 'failed' | 'received' | 'processed';
    subject?: string;
    message_body?: string;
    provider_message_id?: string;
    error_message?: string;
    metadata?: Record<string, unknown>;
  }
) {
  await base44.asServiceRole.entities.CommunicationEvent.create({
    lead_id: payload.lead_id,
    channel: payload.channel,
    direction: payload.direction,
    event_type: payload.event_type,
    provider: payload.provider,
    status: payload.status,
    subject: payload.subject,
    message_body: payload.message_body,
    provider_message_id: payload.provider_message_id,
    error_message: payload.error_message,
    metadata_json: payload.metadata ? JSON.stringify(payload.metadata) : undefined,
  });
}

function isRecentContactInquiry(existingLead: Record<string, unknown>, contact: ReturnType<typeof normalizeContactInput>) {
  const createdDate = typeof existingLead.created_date === 'string' ? new Date(existingLead.created_date).getTime() : 0;
  const isWithinWindow = createdDate > 0 && Date.now() - createdDate < DUPLICATE_WINDOW_MS;
  const sameName =
    typeof existingLead.full_name === 'string' &&
    existingLead.full_name.trim().toLowerCase() === contact.full_name.toLowerCase();
  const sameInquiryType =
    typeof existingLead.problem === 'string' && existingLead.problem.startsWith(CONTACT_PREFIX);

  return isWithinWindow && sameName && sameInquiryType;
}

async function sendAdminNotification(contact: ReturnType<typeof normalizeContactInput>) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

  if (!RESEND_API_KEY) {
    return { sent: false, reason: 'missing_resend_api_key' };
  }

  const emailBody = `
    <h2>New Contact Form Submission</h2>
    <table cellpadding="8" style="border-collapse:collapse;width:100%;max-width:600px;">
      <tr><td style="font-weight:bold;width:160px;">Name</td><td>${contact.full_name}</td></tr>
      <tr style="background:#f9f9f9"><td style="font-weight:bold;">Email</td><td><a href="mailto:${contact.email}">${contact.email}</a></td></tr>
      <tr><td style="font-weight:bold;">Phone</td><td>${contact.phone || 'Not provided'}</td></tr>
      <tr style="background:#f9f9f9"><td style="font-weight:bold;">Business Type</td><td>${contact.business_type}</td></tr>
      <tr><td style="font-weight:bold;vertical-align:top;padding-top:12px;">Message</td><td style="padding-top:12px;">${contact.message}</td></tr>
    </table>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'ClientSurge Systems <onboarding@resend.dev>',
      to: ['system@clientsurgesystems.com'],
      reply_to: contact.email,
      subject: `New Contact: ${contact.full_name} - ${contact.business_type}`,
      html: emailBody,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    return { sent: false, reason: details || 'notification_failed' };
  }

  return { sent: true };
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const contact = normalizeContactInput(payload);
    const errors = validateContactInput(contact);

    if (errors.length > 0) {
      return Response.json({ error: errors[0], errors }, { status: 400 });
    }

    let existingInquiry = null;

    const emailMatches = await base44.asServiceRole.entities.Leads.filter({ email: contact.email }, '-created_date', 10);
    existingInquiry = emailMatches.find((item: Record<string, unknown>) => isRecentContactInquiry(item, contact)) || null;

    if (!existingInquiry && contact.phone) {
      const phoneMatches = await base44.asServiceRole.entities.Leads.filter({ phone: contact.phone }, '-created_date', 10);
      existingInquiry = phoneMatches.find((item: Record<string, unknown>) => isRecentContactInquiry(item, contact)) || null;
    }

    const leadPayload = buildLeadPayload(contact);
    let leadId = '';
    let action = 'created';

    if (existingInquiry) {
      const nextStatus =
        existingInquiry.status === 'Closed'
          ? 'New'
          : typeof existingInquiry.status === 'string' && existingInquiry.status.length > 0
            ? existingInquiry.status
            : 'New';

      await base44.asServiceRole.entities.Leads.update(existingInquiry.id, buildLeadPayload(contact, nextStatus));
      leadId = existingInquiry.id;
      action = 'updated';
    } else {
      const createdLead = await base44.asServiceRole.entities.Leads.create(leadPayload);
      leadId = createdLead.id;
    }

    await logCommunicationEvent(base44, {
      lead_id: leadId,
      channel: 'internal',
      direction: 'system',
      event_type: 'lead_created',
      provider: 'internal',
      status: 'processed',
      subject: action === 'created' ? 'Contact inquiry submitted' : 'Contact inquiry updated',
      message_body: `Contact inquiry ${action} for ${contact.full_name}`,
      metadata: {
        source: LEAD_SOURCE,
        intake_type: INTAKE_TYPE,
        action,
        business_type: contact.business_type,
      },
    });

    const notification = await sendAdminNotification(contact);

    await logCommunicationEvent(base44, {
      lead_id: leadId,
      channel: 'email',
      direction: 'outbound',
      event_type: notification.sent ? 'email_sent' : 'email_failed',
      provider: 'resend',
      status: notification.sent ? 'sent' : 'failed',
      subject: `New Contact: ${contact.full_name} - ${contact.business_type}`,
      message_body: contact.message,
      error_message: notification.sent ? undefined : notification.reason,
      metadata: {
        target: 'admin_notification',
        source: LEAD_SOURCE,
        intake_type: INTAKE_TYPE,
      },
    });

    return Response.json({
      success: true,
      lead_id: leadId,
      action,
      notification_sent: notification.sent,
      notification_warning: notification.sent ? null : notification.reason,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit contact inquiry';
    return Response.json({ error: message }, { status: 500 });
  }
});
