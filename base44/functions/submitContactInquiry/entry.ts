import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { validatePublicFormOrigin } from "../_shared/publicFormOriginGuard.js";
import { resendFetch } from "../_shared/resendFetch.js";
import { twilioFetch } from "../_shared/providerFetch.js";

const MAX_FIELD_LENGTH = 500;
const MAX_MESSAGE_LENGTH = 1500;
const DUPLICATE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const CONTACT_PREFIX = 'Contact form inquiry: ';
const LEAD_SOURCE = 'website';
const INTAKE_TYPE = 'contact_inquiry';

function sanitizeString(value: unknown, maxLength = MAX_FIELD_LENGTH) {
  if (typeof value !== 'string') return '';
  return value.replace(/[<>]/g, '').trim().slice(0, maxLength);
}

function normalizeContactInput(payload: Record<string, unknown>) {
  const realWebsite = sanitizeString(payload.business_website_url || payload.website);
  const honeypot = sanitizeString(payload.website_url || payload.website_hp || payload.website_honeypot || payload.company_website_hp);
  return {
    full_name: sanitizeString(payload.full_name),
    email: sanitizeString(payload.email).toLowerCase(),
    phone: sanitizeString(payload.phone),
    business_name: sanitizeString(payload.business_name),
    business_type: sanitizeString(payload.business_type) || 'General Inquiry',
    message: sanitizeString(payload.message, MAX_MESSAGE_LENGTH),
    website_url: realWebsite,
    honeypot,
    // UTM attribution (note: referrer may be empty on SPA navigation — captured client-side before submit) (note: referrer may be empty on SPA navigation — captured client-side before submit)
    utm_source: sanitizeString(payload.utm_source),
    utm_medium: sanitizeString(payload.utm_medium),
    utm_campaign: sanitizeString(payload.utm_campaign),
    utm_content: sanitizeString(payload.utm_content),
    referrer: sanitizeString(payload.referrer),
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

async function isRateLimited(
  base44: ReturnType<typeof createClientFromRequest>,
  contact: ReturnType<typeof normalizeContactInput>
) {
  const emailMatches = await base44.asServiceRole.entities.Leads.filter({ email: contact.email }, '-created_date', 5);
  const now = Date.now();

  return emailMatches.some((existingLead: Record<string, unknown>) => {
    const createdDate =
      typeof existingLead.created_date === 'string' ? new Date(existingLead.created_date).getTime() : 0;
    const sameContactPattern =
      typeof existingLead.problem === 'string' && existingLead.problem.startsWith(CONTACT_PREFIX);

    return createdDate > 0 && now - createdDate < RATE_LIMIT_WINDOW_MS && sameContactPattern;
  });
}

function buildLeadPayload(contact: ReturnType<typeof normalizeContactInput>, status = 'New') {
  return {
    full_name: contact.full_name,
    business_name: contact.business_name || `${contact.business_type} Inquiry`,
    email: contact.email,
    phone: contact.phone || '',
    business_type: contact.business_type,
    problem: `${CONTACT_PREFIX}${contact.message}`.slice(0, MAX_MESSAGE_LENGTH),
    website: contact.website_url,
    source: LEAD_SOURCE,
    intake_type: INTAKE_TYPE,
    status,
    // UTM attribution (note: referrer may be empty on SPA navigation — captured client-side before submit) (note: referrer may be empty on SPA navigation — captured client-side before submit) fields
    utm_source: contact.utm_source || null,
    utm_medium: contact.utm_medium || null,
    utm_campaign: contact.utm_campaign || null,
    utm_content: contact.utm_content || null,
    referrer: contact.referrer || null,
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

async function sendAdminSMS(contact: ReturnType<typeof normalizeContactInput>) {
  const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
  const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
  const TWILIO_FROM = Deno.env.get('TWILIO_PHONE_NUMBER') || '+16025843227';
  const NOLAN_CELL = '+16025874608'; // (602) 587-4608

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.warn('[submitContactInquiry] Twilio not configured — skipping SMS alert');
    return { sent: false, reason: 'missing_twilio_credentials' };
  }

  const body = `🔥 New Lead — ClientSurge
Name: ${contact.full_name}
Phone: ${contact.phone || 'N/A'}
Email: ${contact.email}
Biz: ${contact.business_type}
Msg: ${contact.message.slice(0, 100)}${contact.message.length > 100 ? '...' : ''}`;

  const params = new URLSearchParams({
    To: NOLAN_CELL,
    From: TWILIO_FROM,
    Body: body,
  });

  const response = await twilioFetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.warn('[submitContactInquiry] SMS alert failed:', err);
    return { sent: false, reason: err };
  }

  console.info('[submitContactInquiry] SMS alert sent to Nolan');
  return { sent: true };
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

  const response = await resendFetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'ClientSurge Systems <system@clientsurgesystems.com>',
      to: ['nolan@clientsurgesystems.com'],
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

async function sendUserThankYouEmail(contact: ReturnType<typeof normalizeContactInput>) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

  if (!RESEND_API_KEY) {
    return { sent: false, reason: 'missing_resend_api_key' };
  }

  const businessTypeGreeting = `for ${contact.business_type}s`;
  const emailBody = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2>Thanks for Reaching Out, ${contact.full_name.split(' ')[0]}!</h2>
      <p style="color:#555;line-height:1.6;">We've received your message and we're excited to learn more about how we can help your business ${businessTypeGreeting}.</p>
      
      <div style="background:#f9f9f9;border-left:4px solid #9a5c2e;padding:16px;margin:24px 0;border-radius:4px;">
        <p style="margin:0;color:#666;font-size:14px;"><strong>What happens next:</strong></p>
        <ul style="margin:8px 0 0 0;padding-left:20px;color:#666;font-size:14px;">
          <li>Our team will review your inquiry</li>
          <li>We'll get back to you within one business day</li>
          <li>If you'd prefer to chat sooner, <a href="https://clientsurgesystems.com/book" style="color:#9a5c2e;text-decoration:none;">book a free 15-minute demo</a></li>
        </ul>
      </div>

      <p style="color:#666;line-height:1.6;">In the meantime, feel free to explore how our automation system works for ${contact.business_type.toLowerCase()}. We're here to help.</p>
      
      <p style="color:#999;font-size:12px;margin-top:32px;border-top:1px solid #eee;padding-top:16px;">
        <strong>ClientSurge Systems</strong><br>
        Phoenix, Arizona<br>
        <a href="mailto:system@clientsurgesystems.com" style="color:#9a5c2e;text-decoration:none;">system@clientsurgesystems.com</a>
      </p>
    </div>
  `;

  const response = await resendFetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'ClientSurge Systems <system@clientsurgesystems.com>',
      to: [contact.email],
      subject: `Thank You for Your Message, ${contact.full_name.split(' ')[0]}!`,
      html: emailBody,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    return { sent: false, reason: details || 'thank_you_email_failed' };
  }

  return { sent: true };
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const originGuard = validatePublicFormOrigin(req);
    if (!originGuard.ok) {
      return Response.json({ error: originGuard.error }, { status: originGuard.status });
    }

    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const contact = normalizeContactInput(payload);

    if (contact.honeypot) {
      return Response.json({ success: true, ignored: true });
    }

    const errors = validateContactInput(contact);

    if (errors.length > 0) {
      return Response.json({ error: errors[0], errors }, { status: 400 });
    }

    if (await isRateLimited(base44, contact)) {
      return Response.json({ error: 'Please wait a moment before submitting again.' }, { status: 429 });
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

      await base44.asServiceRole.entities.Leads.update(existingInquiry.id, {
        status: nextStatus,
        full_name: existingInquiry.full_name || contact.full_name,
        business_name: existingInquiry.business_name || (contact.business_name || `${contact.business_type} Inquiry`),
        email: existingInquiry.email || contact.email,
        phone: existingInquiry.phone || contact.phone || '',
        business_type: existingInquiry.business_type || contact.business_type,
        problem: existingInquiry.problem || `${CONTACT_PREFIX}${contact.message}`.slice(0, MAX_MESSAGE_LENGTH),
        website: existingInquiry.website || contact.website_url,
        source: existingInquiry.source || LEAD_SOURCE,
        intake_type: existingInquiry.intake_type || INTAKE_TYPE,
      });
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
    // Fire SMS to Nolan's cell immediately — non-blocking
    sendAdminSMS(contact).catch((err) =>
      console.warn('[submitContactInquiry] SMS alert error (non-blocking):', err)
    );
    const thankYouEmail = await sendUserThankYouEmail(contact);

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

    await logCommunicationEvent(base44, {
      lead_id: leadId,
      channel: 'email',
      direction: 'outbound',
      event_type: thankYouEmail.sent ? 'email_sent' : 'email_failed',
      provider: 'resend',
      status: thankYouEmail.sent ? 'sent' : 'failed',
      subject: `Thank You for Your Message, ${contact.full_name.split(' ')[0]}!`,
      message_body: 'Automated thank you email',
      error_message: thankYouEmail.sent ? undefined : thankYouEmail.reason,
      metadata: {
        target: 'user_thank_you',
        source: LEAD_SOURCE,
        intake_type: INTAKE_TYPE,
        business_type: contact.business_type,
      },
    });

    // Track contact form completion
    try {
      await base44.asServiceRole.functions.invoke('trackContactFormCompletion', {
        lead_id: leadId,
        contact_info: {
          business_type: contact.business_type,
        },
      });
    } catch {
      // Silently fail tracking if it errors - don't block form submission
    }

    return Response.json({
      success: true,
      lead_id: leadId,
      action,
      notification_sent: notification.sent,
      notification_warning: notification.sent ? null : notification.reason,
      thank_you_sent: thankYouEmail.sent,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit contact inquiry';
    return Response.json({ error: message }, { status: 500 });
  }
});
