import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';
import { validatePublicFormOrigin } from '../_shared/publicFormOriginGuard.js';

const MAX_FIELD_LENGTH = 500;
const MAX_MESSAGE_LENGTH = 1500;
const DUPLICATE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const CONTACT_PREFIX = 'Contact form inquiry: ';
const CONTACT_SOURCE = 'contact_page';
const CONTACT_SOURCE_PAGE = '/contact';
const INTAKE_TYPE = 'contact_inquiry';

function secureJson(data: Record<string, unknown> = {}, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Frame-Options': 'DENY',
      ...(init.headers || {}),
    },
  });
}

function sanitizeString(value: unknown, maxLength = MAX_FIELD_LENGTH) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, maxLength);
}

function normalizePhone(value: string) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits.length >= 10 ? `+${digits}` : '';
}

function normalizeWebsiteUrl(value: unknown) {
  const raw = sanitizeString(value, 300);
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeContactInput(payload: Record<string, unknown>) {
  const fullName = sanitizeString(payload.full_name);
  const firstName = sanitizeString(payload.first_name) || fullName.split(/\s+/)[0] || '';
  const realWebsite = payload.business_website_url || payload.website || payload.business_website || payload.url;

  return {
    full_name: fullName,
    first_name: firstName,
    email: sanitizeString(payload.email).toLowerCase(),
    phone: sanitizeString(payload.phone || payload.phone_number),
    normalized_phone: normalizePhone(sanitizeString(payload.phone || payload.phone_number)),
    business_name: sanitizeString(payload.business_name),
    business_type: sanitizeString(payload.business_type || payload.industry) || 'General Inquiry',
    message: sanitizeString(payload.message || payload.problem, MAX_MESSAGE_LENGTH),
    business_website_url: normalizeWebsiteUrl(realWebsite),
    honeypot: sanitizeString(payload.website_url || payload.website_hp || payload.website_honeypot || payload.company_website_hp),
    consent_given: payload.consent_given === true || payload.consent_given === 'true',
    consent_source: sanitizeString(payload.consent_source) || 'contact_page_form',
    consent_text_version: sanitizeString(payload.consent_text_version) || 'contact_form_explicit_consent_v1',
    source_page: sanitizeString(payload.source_page || CONTACT_SOURCE_PAGE) || CONTACT_SOURCE_PAGE,
    utm_source: sanitizeString(payload.utm_source),
    utm_medium: sanitizeString(payload.utm_medium),
    utm_campaign: sanitizeString(payload.utm_campaign),
    utm_content: sanitizeString(payload.utm_content),
    utm_term: sanitizeString(payload.utm_term),
    referrer: sanitizeString(payload.referrer, 1000),
  };
}

function validateContactInput(contact: ReturnType<typeof normalizeContactInput>) {
  const errors: string[] = [];
  if (!contact.full_name) errors.push('Full name is required');
  if (!contact.business_name) errors.push('Business name is required');
  if (!contact.email) errors.push('Email is required');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) errors.push('Email must be valid');
  if (!contact.phone) errors.push('Phone is required');
  else if (!/^[\d\s()+.-]+$/.test(contact.phone) || !contact.normalized_phone) errors.push('Phone must be valid');
  if (!contact.business_type) errors.push('Business type is required');
  if (!contact.message) errors.push('Message is required');
  if (!contact.consent_given) errors.push('Consent is required so we can respond to your inquiry');
  return errors;
}

function problemFor(contact: ReturnType<typeof normalizeContactInput>) {
  return `${CONTACT_PREFIX}${contact.message}`.slice(0, MAX_MESSAGE_LENGTH);
}

function buildWebsiteLeadPayload(contact: ReturnType<typeof normalizeContactInput>, requestId: string, ipAddress: string, status = 'new') {
  const nowIso = new Date().toISOString();
  return {
    full_name: contact.full_name,
    first_name: contact.first_name,
    business_name: contact.business_name,
    email: contact.email,
    phone_number: contact.normalized_phone,
    business_type: contact.business_type,
    business_website_url: contact.business_website_url,
    website_url: contact.business_website_url,
    message: contact.message,
    problem: problemFor(contact),
    source: CONTACT_SOURCE,
    source_page: contact.source_page || CONTACT_SOURCE_PAGE,
    utm_source: contact.utm_source || null,
    utm_medium: contact.utm_medium || null,
    utm_campaign: contact.utm_campaign || null,
    utm_content: contact.utm_content || null,
    utm_term: contact.utm_term || null,
    referrer: contact.referrer || null,
    current_lead_source: CONTACT_SOURCE,
    lead_status: status,
    reply_status: 'none',
    booking_status: 'none',
    follow_up_step: 0,
    automation_enabled: true,
    cadence_mode: 'auto',
    cadence_paused: false,
    email_attempt_count: 0,
    sms_attempt_count: 0,
    last_engagement_type: 'none',
    archived: false,
    consent_given: contact.consent_given,
    consent_given_at: nowIso,
    consent_ip: ipAddress,
    consent_source: contact.consent_source,
    consent_text_version: contact.consent_text_version,
    dedup_key: `${contact.email}|${contact.normalized_phone}|contact_page`,
    request_id: requestId,
  };
}

function buildCanonicalLeadPayload(contact: ReturnType<typeof normalizeContactInput>, websiteLeadId: string, requestId: string, status = 'New') {
  return {
    full_name: contact.full_name,
    business_name: contact.business_name,
    email: contact.email,
    phone: contact.normalized_phone,
    business_type: contact.business_type,
    problem: problemFor(contact),
    website: contact.business_website_url,
    source: 'website',
    source_page: contact.source_page || CONTACT_SOURCE_PAGE,
    intake_type: INTAKE_TYPE,
    website_lead_id: websiteLeadId,
    status,
    utm_source: contact.utm_source || null,
    utm_medium: contact.utm_medium || null,
    utm_campaign: contact.utm_campaign || null,
    utm_content: contact.utm_content || null,
    utm_term: contact.utm_term || null,
    referrer: contact.referrer || null,
    request_id: requestId,
  };
}

function isRecentWebsiteLead(existingLead: Record<string, unknown>, contact: ReturnType<typeof normalizeContactInput>) {
  const createdDate = typeof existingLead.created_date === 'string' ? new Date(existingLead.created_date).getTime() : 0;
  const isWithinWindow = createdDate > 0 && Date.now() - createdDate < DUPLICATE_WINDOW_MS;
  const sameEmail = typeof existingLead.email === 'string' && existingLead.email.toLowerCase() === contact.email;
  const samePhone = typeof existingLead.phone_number === 'string' && existingLead.phone_number === contact.normalized_phone;
  return isWithinWindow && (sameEmail || samePhone);
}

async function safeFilter(entity: unknown, filter: Record<string, unknown>, sort = '-created_date', limit = 10) {
  try {
    const typed = entity as { filter?: (query: Record<string, unknown>, sort?: string, limit?: number) => Promise<Record<string, unknown>[]> };
    if (!typed?.filter) return [];
    return await typed.filter(filter, sort, limit);
  } catch (error) {
    console.warn('[submitContactInquiry] optional filter failed:', error instanceof Error ? error.message : error);
    return [];
  }
}

async function isRateLimited(base44: ReturnType<typeof createClientFromRequest>, contact: ReturnType<typeof normalizeContactInput>) {
  const matches = await safeFilter(base44.asServiceRole.entities.WebsiteLead, { email: contact.email }, '-created_date', 5);
  const now = Date.now();
  return matches.some((existingLead: Record<string, unknown>) => {
    const createdDate = typeof existingLead.created_date === 'string' ? new Date(existingLead.created_date).getTime() : 0;
    return createdDate > 0 && now - createdDate < RATE_LIMIT_WINDOW_MS;
  });
}

async function findExistingWebsiteLead(base44: ReturnType<typeof createClientFromRequest>, contact: ReturnType<typeof normalizeContactInput>) {
  const emailMatches = await safeFilter(base44.asServiceRole.entities.WebsiteLead, { email: contact.email }, '-created_date', 10);
  let existing = emailMatches.find((item) => isRecentWebsiteLead(item, contact)) || null;
  if (!existing && contact.normalized_phone) {
    const phoneMatches = await safeFilter(base44.asServiceRole.entities.WebsiteLead, { phone_number: contact.normalized_phone }, '-created_date', 10);
    existing = phoneMatches.find((item) => isRecentWebsiteLead(item, contact)) || null;
  }
  return existing;
}

async function safeLogCommunicationEvent(base44: ReturnType<typeof createClientFromRequest>, payload: Record<string, unknown>) {
  try {
    await base44.asServiceRole.entities.CommunicationEvent.create(payload);
  } catch (error) {
    console.warn('[submitContactInquiry] communication log skipped:', error instanceof Error ? error.message : error);
  }
}

function getRequestIp(req: Request) {
  const forwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return req.headers.get('cf-connecting-ip') || forwardedFor || req.headers.get('x-real-ip') || 'unknown';
}

function normalizePhoneForTel(value: string) {
  return normalizePhone(value);
}

async function resolveTwilioFromNumber(base44: ReturnType<typeof createClientFromRequest>) {
  try {
    const settings = await base44.asServiceRole.entities.AdminSettings.list('-created_date', 1);
    const raw = settings?.[0]?.twilio_from_number || Deno.env.get('TWILIO_FROM_NUMBER') || Deno.env.get('TWILIO_PHONE_NUMBER') || '';
    const normalized = normalizePhoneForTel(String(raw));
    if (normalized === '+18778123630') return null;
    return normalized || null;
  } catch {
    const normalized = normalizePhoneForTel(Deno.env.get('TWILIO_FROM_NUMBER') || Deno.env.get('TWILIO_PHONE_NUMBER') || '');
    return normalized || null;
  }
}

async function sendAdminSMS(contact: ReturnType<typeof normalizeContactInput>, fromNumber: string | null) {
  const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
  const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
  const NOLAN_CELL = '+16025874608';
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return { sent: false, reason: 'missing_twilio_credentials' };
  if (!fromNumber) return { sent: false, reason: 'from_number_not_configured' };
  const body = `New Lead — ClientSurge\nName: ${contact.full_name}\nPhone: ${contact.normalized_phone || 'N/A'}\nEmail: ${contact.email}\nBiz: ${contact.business_type}\nMsg: ${contact.message.slice(0, 100)}${contact.message.length > 100 ? '...' : ''}`;
  const params = new URLSearchParams({ To: NOLAN_CELL, From: fromNumber, Body: body });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!response.ok) return { sent: false, reason: await response.text() };
  return { sent: true };
}

async function sendAdminNotification(contact: ReturnType<typeof normalizeContactInput>, requestId: string) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) return { sent: false, reason: 'missing_resend_api_key' };

  const html = `
    <h2>New ClientSurge Contact Inquiry</h2>
    <p><strong>Request ID:</strong> ${escapeHtml(requestId)}</p>
    <p><strong>Name:</strong> ${escapeHtml(contact.full_name)}</p>
    <p><strong>Business:</strong> ${escapeHtml(contact.business_name)}</p>
    <p><strong>Industry:</strong> ${escapeHtml(contact.business_type)}</p>
    <p><strong>Email:</strong> <a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a></p>
    <p><strong>Phone:</strong> ${escapeHtml(contact.normalized_phone || contact.phone)}</p>
    <p><strong>Website:</strong> ${contact.business_website_url ? `<a href="${escapeHtml(contact.business_website_url)}">${escapeHtml(contact.business_website_url)}</a>` : 'Not provided'}</p>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(contact.message)}</p>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'ClientSurge Systems <system@clientsurgesystems.com>',
      to: ['nolan@clientsurgesystems.com'],
      reply_to: contact.email,
      subject: `New Contact: ${contact.full_name} - ${contact.business_type}`,
      html,
    }),
  });

  if (!response.ok) return { sent: false, reason: await response.text() || 'notification_failed' };
  return { sent: true };
}

async function sendUserThankYouEmail(contact: ReturnType<typeof normalizeContactInput>, requestId: string) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) return { sent: false, reason: 'missing_resend_api_key' };

  const firstName = contact.first_name || 'there';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;line-height:1.6;color:#0f172a;">
      <h2>Thanks for reaching out, ${escapeHtml(firstName)}.</h2>
      <p>We received your message and will follow up with the next best step for your business.</p>
      <p><strong>Reference:</strong> ${escapeHtml(requestId)}</p>
      <p>If you need to add anything, reply to this email or contact support@clientsurgesystems.com.</p>
      <p style="font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;margin-top:24px;padding-top:16px;">ClientSurge Systems · Phoenix, Arizona</p>
    </div>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'ClientSurge Systems <system@clientsurgesystems.com>',
      to: [contact.email],
      subject: 'Message received — ClientSurge Systems',
      html,
    }),
  });

  if (!response.ok) return { sent: false, reason: await response.text() || 'thank_you_email_failed' };
  return { sent: true };
}

Deno.serve(async (req) => {
  const requestId = `contact_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    if (req.method !== 'POST') {
      return secureJson(
        { error: 'Method not allowed', code: 'method_not_allowed', request_id: requestId },
        { status: 405, headers: { Allow: 'POST' } }
      );
    }

    const originGuard = validatePublicFormOrigin(req);
    if (!originGuard.ok) {
      return secureJson({ error: originGuard.error, code: 'invalid_origin', request_id: requestId }, { status: originGuard.status });
    }

    const payload = await req.json().catch(() => null);
    if (!payload || typeof payload !== 'object') {
      return secureJson({ error: 'Invalid JSON body', code: 'invalid_json', request_id: requestId }, { status: 400 });
    }

    const contact = normalizeContactInput(payload as Record<string, unknown>);
    if (contact.honeypot) return secureJson({ success: true, ignored: true, request_id: requestId });

    const errors = validateContactInput(contact);
    if (errors.length > 0) return secureJson({ error: errors[0], errors, code: 'validation_failed', request_id: requestId }, { status: 400 });

    const base44 = createClientFromRequest(req);
    if (await isRateLimited(base44, contact)) return secureJson({ error: 'Please wait a moment before submitting again.', code: 'rate_limited', request_id: requestId }, { status: 429 });

    const ipAddress = getRequestIp(req);
    const existingWebsiteLead = await findExistingWebsiteLead(base44, contact);
    let websiteLeadId = '';
    let action = 'created';

    if (existingWebsiteLead?.id) {
      await base44.asServiceRole.entities.WebsiteLead.update(existingWebsiteLead.id, {
        ...buildWebsiteLeadPayload(contact, requestId, ipAddress, String(existingWebsiteLead.lead_status || 'new')),
      });
      websiteLeadId = String(existingWebsiteLead.id);
      action = 'updated';
    } else {
      const createdWebsiteLead = await base44.asServiceRole.entities.WebsiteLead.create(buildWebsiteLeadPayload(contact, requestId, ipAddress));
      websiteLeadId = createdWebsiteLead.id;
    }

    let canonicalLeadId = '';
    try {
      const createdLead = await base44.asServiceRole.entities.Leads.create(buildCanonicalLeadPayload(contact, websiteLeadId, requestId));
      canonicalLeadId = createdLead.id;
    } catch (error) {
      console.warn('[submitContactInquiry] optional canonical Leads create skipped:', error instanceof Error ? error.message : error);
    }

    const leadIdForLogs = canonicalLeadId || websiteLeadId;
    await safeLogCommunicationEvent(base44, {
      lead_id: leadIdForLogs,
      channel: 'internal',
      direction: 'system',
      event_type: 'lead_created',
      provider: 'internal',
      status: 'processed',
      subject: action === 'created' ? 'Contact inquiry submitted' : 'Contact inquiry updated',
      message_body: `Contact inquiry ${action} for ${contact.full_name}`,
      metadata_json: JSON.stringify({ source: CONTACT_SOURCE, source_page: contact.source_page, intake_type: INTAKE_TYPE, action, business_type: contact.business_type, website_lead_id: websiteLeadId, canonical_lead_id: canonicalLeadId || null, request_id: requestId }),
    });

    const notification = await sendAdminNotification(contact, requestId).catch((error) => ({ sent: false, reason: error instanceof Error ? error.message : String(error) }));
    const fromNumber = await resolveTwilioFromNumber(base44);
    sendAdminSMS(contact, fromNumber).catch((error) => console.warn('[submitContactInquiry] SMS alert error:', error));
    const thankYouEmail = await sendUserThankYouEmail(contact, requestId).catch((error) => ({ sent: false, reason: error instanceof Error ? error.message : String(error) }));

    await safeLogCommunicationEvent(base44, { lead_id: leadIdForLogs, channel: 'email', direction: 'outbound', event_type: notification.sent ? 'email_sent' : 'email_failed', provider: 'resend', status: notification.sent ? 'sent' : 'failed', subject: `New Contact: ${contact.full_name} - ${contact.business_type}`, message_body: contact.message, error_message: notification.sent ? undefined : notification.reason, metadata_json: JSON.stringify({ target: 'admin_notification', source: CONTACT_SOURCE, source_page: contact.source_page, intake_type: INTAKE_TYPE, request_id: requestId }) });
    await safeLogCommunicationEvent(base44, { lead_id: leadIdForLogs, channel: 'email', direction: 'outbound', event_type: thankYouEmail.sent ? 'email_sent' : 'email_failed', provider: 'resend', status: thankYouEmail.sent ? 'sent' : 'failed', subject: 'Message received — ClientSurge Systems', message_body: 'Automated thank you email', error_message: thankYouEmail.sent ? undefined : thankYouEmail.reason, metadata_json: JSON.stringify({ target: 'user_thank_you', source: CONTACT_SOURCE, source_page: contact.source_page, intake_type: INTAKE_TYPE, business_type: contact.business_type, request_id: requestId }) });

    try {
      await base44.asServiceRole.functions.invoke('trackContactFormCompletion', { lead_id: leadIdForLogs, website_lead_id: websiteLeadId, request_id: requestId, contact_info: { business_type: contact.business_type } });
    } catch {
      // Analytics must never block a public lead submission.
    }

    return secureJson({ success: true, lead_id: leadIdForLogs, website_lead_id: websiteLeadId, canonical_lead_id: canonicalLeadId || null, action, request_id: requestId, notification_sent: notification.sent, notification_warning: notification.sent ? null : notification.reason, thank_you_sent: thankYouEmail.sent });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit contact inquiry';
    console.error('[submitContactInquiry] Error:', message, error instanceof Error ? error.stack : '');
    return secureJson({ error: 'Contact form submission failed. Please email support@clientsurgesystems.com directly.', detail: message, request_id: requestId }, { status: 500 });
  }
});
