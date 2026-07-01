import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

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

const MAX_FIELD_LENGTH = 500;
const MAX_MESSAGE_LENGTH = 1500;
const DUPLICATE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const CONTACT_PREFIX = 'Contact form inquiry: ';
const CONTACT_SOURCE = 'contact_page';
const CONTACT_SOURCE_PAGE = '/contact';
const INTAKE_TYPE = 'contact_inquiry';

const CS = {
  electric: '#00AEEF',
  electricDeep: '#0088CC',
  electricNavy: '#005691',
  text: '#000000',
  muted: '#262626',
  softText: '#4B5563',
  surface: '#FFFFFF',
  page: '#F7FBFE',
  blueSoft: '#EEF9FF',
  border: '#C9E7FB',
  gold: '#D4AF37',
  success: '#10B981',
};

function sanitizeString(value: unknown, maxLength = MAX_FIELD_LENGTH) {
  if (typeof value !== 'string') return '';
  return value.replace(/[<>]/g, '').trim().slice(0, maxLength);
}

function normalizePhoneForTel(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits ? `+${digits}` : '';
}

function normalizeWebsiteUrl(value: string) {
  const raw = sanitizeString(value, 300);
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function escapeHtml(value: unknown) {
  return sanitizeString(String(value ?? ''), 3000)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeContactInput(payload: Record<string, unknown>) {
  const realWebsite = sanitizeString(payload.business_website_url || payload.website || payload.business_website || payload.url);
  const honeypot = sanitizeString(payload.website_url || payload.website_hp || payload.website_honeypot || payload.company_website_hp);

  return {
    full_name: sanitizeString(payload.full_name),
    first_name: sanitizeString(payload.first_name) || sanitizeString(payload.full_name).split(/\s+/)[0] || '',
    email: sanitizeString(payload.email).toLowerCase(),
    phone: sanitizeString(payload.phone || payload.phone_number),
    business_name: sanitizeString(payload.business_name),
    business_type: sanitizeString(payload.business_type || payload.industry) || 'General Inquiry',
    message: sanitizeString(payload.message || payload.problem, MAX_MESSAGE_LENGTH),
    business_website_url: normalizeWebsiteUrl(realWebsite),
    honeypot,
    utm_source: sanitizeString(payload.utm_source),
    utm_medium: sanitizeString(payload.utm_medium),
    utm_campaign: sanitizeString(payload.utm_campaign),
    utm_content: sanitizeString(payload.utm_content),
    utm_term: sanitizeString(payload.utm_term),
    referrer: sanitizeString(payload.referrer),
  };
}

function validateContactInput(contact: ReturnType<typeof normalizeContactInput>) {
  const errors: string[] = [];
  if (!contact.full_name) errors.push('Full name is required');
  if (!contact.email) errors.push('Email is required');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) errors.push('Email must be valid');
  if (contact.phone) {
    const digits = contact.phone.replace(/\D/g, '');
    if (!/^[\d\s()+.-]+$/.test(contact.phone) || digits.length < 10) errors.push('Phone must be valid');
  }
  if (!contact.message) errors.push('Message is required');
  return errors;
}

function validatePublicFormOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin) return { ok: true };

  try {
    const host = new URL(origin).hostname.toLowerCase();
    const configured = Deno.env.get('CLIENTSURGE_WEBSITE_URL') || 'https://clientsurgesystems.com';
    const configuredHost = new URL(configured).hostname.toLowerCase();
    const allowedHosts = new Set([configuredHost, 'clientsurgesystems.com', 'www.clientsurgesystems.com', 'app.base44.com', 'localhost', '127.0.0.1']);
    const allowed = allowedHosts.has(host) || host.endsWith('.base44.app') || host.endsWith('.base44.com') || host.endsWith('.clientsurgesystems.com');
    if (allowed) return { ok: true };
  } catch {
    return { ok: false, status: 403, error: 'Invalid origin' };
  }

  return { ok: false, status: 403, error: 'Invalid origin' };
}

function buildWebsiteLeadPayload(contact: ReturnType<typeof normalizeContactInput>) {
  const problem = `${CONTACT_PREFIX}${contact.message}`.slice(0, MAX_MESSAGE_LENGTH);
  return {
    full_name: contact.full_name,
    first_name: contact.first_name,
    business_name: contact.business_name || `${contact.business_type} Inquiry`,
    email: contact.email,
    phone_number: contact.phone || '',
    business_type: contact.business_type,
    business_website_url: contact.business_website_url,
    website_url: contact.business_website_url,
    message: contact.message,
    problem,
    source: CONTACT_SOURCE,
    source_page: CONTACT_SOURCE_PAGE,
    utm_source: contact.utm_source || null,
    utm_medium: contact.utm_medium || null,
    utm_campaign: contact.utm_campaign || null,
    utm_content: contact.utm_content || null,
    utm_term: contact.utm_term || null,
    current_lead_source: CONTACT_SOURCE,
    lead_status: 'new',
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
    consent_given: false,
    dedup_key: `${contact.email}|${contact.full_name.toLowerCase()}|contact_page`,
  };
}

function buildCanonicalLeadPayload(contact: ReturnType<typeof normalizeContactInput>, websiteLeadId: string, status = 'New') {
  return {
    full_name: contact.full_name,
    business_name: contact.business_name || `${contact.business_type} Inquiry`,
    email: contact.email,
    phone: contact.phone || '',
    business_type: contact.business_type,
    problem: `${CONTACT_PREFIX}${contact.message}`.slice(0, MAX_MESSAGE_LENGTH),
    website: contact.business_website_url,
    source: 'website',
    source_page: CONTACT_SOURCE_PAGE,
    intake_type: INTAKE_TYPE,
    website_lead_id: websiteLeadId,
    status,
    utm_source: contact.utm_source || null,
    utm_medium: contact.utm_medium || null,
    utm_campaign: contact.utm_campaign || null,
    utm_content: contact.utm_content || null,
    utm_term: contact.utm_term || null,
    referrer: contact.referrer || null,
  };
}

function isRecentWebsiteLead(existingLead: Record<string, unknown>, contact: ReturnType<typeof normalizeContactInput>) {
  const createdDate = typeof existingLead.created_date === 'string' ? new Date(existingLead.created_date).getTime() : 0;
  const isWithinWindow = createdDate > 0 && Date.now() - createdDate < DUPLICATE_WINDOW_MS;
  const sameName = typeof existingLead.full_name === 'string' && existingLead.full_name.trim().toLowerCase() === contact.full_name.toLowerCase();
  return isWithinWindow && sameName;
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
  if (!existing && contact.phone) {
    const phoneMatches = await safeFilter(base44.asServiceRole.entities.WebsiteLead, { phone_number: contact.phone }, '-created_date', 10);
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

async function sendAdminSMS(contact: ReturnType<typeof normalizeContactInput>, fromNumber: string | null) {
  const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
  const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
  const NOLAN_CELL = '+16025874608';
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return { sent: false, reason: 'missing_twilio_credentials' };
  if (!fromNumber) return { sent: false, reason: 'from_number_not_configured' };
  const body = `New Lead — ClientSurge\nName: ${contact.full_name}\nPhone: ${contact.phone || 'N/A'}\nEmail: ${contact.email}\nBiz: ${contact.business_type}\nMsg: ${contact.message.slice(0, 100)}${contact.message.length > 100 ? '...' : ''}`;
  const params = new URLSearchParams({ To: NOLAN_CELL, From: fromNumber, Body: body });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!response.ok) return { sent: false, reason: await response.text() };
  return { sent: true };
}

function emailShell(params: { preview: string; badge: string; title: string; subtitle: string; body: string; footer?: string }) {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><meta name="color-scheme" content="light" /><meta name="supported-color-schemes" content="light" /><title>${escapeHtml(params.title)}</title></head>
<body style="margin:0;padding:0;background:${CS.page};color:${CS.text};font-family:Inter,Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;line-height:1px;font-size:1px;">${escapeHtml(params.preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:${CS.page};border-collapse:collapse;"><tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;width:100%;background:${CS.surface};border:1px solid ${CS.border};border-radius:18px;overflow:hidden;box-shadow:0 18px 48px rgba(0,136,204,0.13);">
<tr><td style="padding:0;background:linear-gradient(90deg,${CS.electricDeep} 0%,${CS.electricNavy} 100%);height:6px;font-size:1px;line-height:1px;">&nbsp;</td></tr>
<tr><td style="padding:26px 30px 22px 30px;border-bottom:1px solid ${CS.border};background:#ffffff;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>
<td style="vertical-align:top;"><div style="font-family:Montserrat,Arial,sans-serif;font-size:23px;line-height:29px;font-weight:900;letter-spacing:-0.03em;color:#000000;">ClientSurge <span style="color:${CS.electric};">Systems</span></div><div style="margin-top:7px;color:${CS.softText};font-size:12px;line-height:17px;font-weight:700;">AI lead-response and booking automation</div></td>
<td align="right" style="vertical-align:top;"><span style="display:inline-block;background:${CS.blueSoft};color:${CS.electricNavy};border:1px solid ${CS.border};border-radius:999px;padding:8px 12px;font-size:11px;line-height:14px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;">${escapeHtml(params.badge)}</span></td>
</tr></table>
</td></tr>
<tr><td style="padding:30px;">
<h1 style="margin:0;color:#000000;font-family:Montserrat,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:900;letter-spacing:-0.04em;">${escapeHtml(params.title)}</h1>
<p style="margin:12px 0 0 0;color:${CS.muted};font-size:16px;line-height:25px;font-weight:500;">${escapeHtml(params.subtitle)}</p>
${params.body}
</td></tr>
<tr><td style="padding:0 30px 30px 30px;">
<div style="background:#000000;border-radius:16px;padding:18px 20px;color:#ffffff;box-shadow:0 10px 28px rgba(0,0,0,0.14);">
<p style="margin:0;color:#ffffff;font-size:14px;line-height:21px;font-weight:900;">ClientSurge Systems</p>
<p style="margin:6px 0 0 0;color:#DFF6FF;font-size:12px;line-height:18px;">${params.footer || 'Automated system email · system@clientsurgesystems.com · Phoenix, Arizona'}</p>
</div>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function adminEmailHtml(contact: ReturnType<typeof normalizeContactInput>) {
  const website = contact.business_website_url;
  const phoneTel = normalizePhoneForTel(contact.phone);
  const body = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;border-collapse:separate;border-spacing:0;background:#ffffff;border:1px solid ${CS.border};border-radius:16px;overflow:hidden;">
<tr><td style="padding:20px 22px;background:${CS.blueSoft};border-bottom:1px solid ${CS.border};">
<div style="color:${CS.electricDeep};font-size:11px;line-height:15px;font-weight:900;text-transform:uppercase;letter-spacing:0.09em;">Primary lead details</div>
<div style="margin-top:7px;color:#000000;font-family:Montserrat,Arial,sans-serif;font-size:24px;line-height:30px;font-weight:900;letter-spacing:-0.03em;">${escapeHtml(contact.full_name)}</div>
<div style="margin-top:3px;color:${CS.softText};font-size:15px;line-height:21px;font-weight:800;">${escapeHtml(contact.business_name || contact.business_type)}</div>
</td></tr>
<tr><td style="padding:18px 22px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
<tr><td style="padding:11px 0;border-bottom:1px solid ${CS.border};width:34%;color:${CS.softText};font-size:13px;font-weight:800;">Phone</td><td style="padding:11px 0;border-bottom:1px solid ${CS.border};color:#000000;font-size:15px;font-weight:900;"><a href="tel:${escapeHtml(phoneTel)}" style="color:${CS.electricNavy};text-decoration:none;font-weight:900;">${escapeHtml(contact.phone || 'Not provided')}</a></td></tr>
<tr><td style="padding:11px 0;border-bottom:1px solid ${CS.border};color:${CS.softText};font-size:13px;font-weight:800;">Email</td><td style="padding:11px 0;border-bottom:1px solid ${CS.border};color:#000000;font-size:15px;font-weight:900;"><a href="mailto:${escapeHtml(contact.email)}" style="color:${CS.electricNavy};text-decoration:none;font-weight:900;">${escapeHtml(contact.email)}</a></td></tr>
<tr><td style="padding:11px 0;color:${CS.softText};font-size:13px;font-weight:800;">Website</td><td style="padding:11px 0;color:#000000;font-size:15px;font-weight:900;">${website ? `<a href="${escapeHtml(website)}" style="color:${CS.electricNavy};text-decoration:none;font-weight:900;">${escapeHtml(website)}</a>` : 'Not provided'}</td></tr>
</table>
</td></tr>
</table>
<div style="margin-top:18px;background:#ffffff;border:1px solid ${CS.border};border-left:6px solid ${CS.electric};border-radius:16px;padding:18px 20px;">
<div style="color:${CS.electricDeep};font-size:11px;line-height:15px;font-weight:900;text-transform:uppercase;letter-spacing:0.09em;">Problem / notes</div>
<p style="margin:8px 0 0 0;color:#000000;font-size:15px;line-height:24px;font-weight:650;">${escapeHtml(contact.message)}</p>
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;border-collapse:collapse;"><tr>
<td style="width:50%;padding:0 7px 0 0;"><div style="background:${CS.blueSoft};border:1px solid ${CS.border};border-radius:14px;padding:15px 16px;"><div style="color:${CS.softText};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;">Source</div><div style="margin-top:5px;color:#000;font-size:14px;font-weight:900;">/contact</div></div></td>
<td style="width:50%;padding:0 0 0 7px;"><div style="background:${CS.blueSoft};border:1px solid ${CS.border};border-radius:14px;padding:15px 16px;"><div style="color:${CS.softText};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;">Industry</div><div style="margin-top:5px;color:#000;font-size:14px;font-weight:900;">${escapeHtml(contact.business_type)}</div></div></td>
</tr></table>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0 0;"><tr><td bgcolor="${CS.electricDeep}" style="border-radius:999px;background:linear-gradient(90deg,${CS.electricDeep},${CS.electricNavy});box-shadow:0 7px 22px rgba(0,121,193,0.34);"><a href="https://clientsurgesystems.com/admin" style="display:inline-block;padding:15px 22px;color:#ffffff;text-decoration:none;font-size:15px;line-height:20px;font-weight:900;border-radius:999px;">View Lead in Dashboard →</a></td></tr></table>`;
  return emailShell({ preview: `New ClientSurge lead from ${contact.business_name || contact.full_name}`, badge: 'Action Required', title: 'New lead submitted', subtitle: 'A contact-form lead just entered the ClientSurge system. Follow up fast while intent is still warm.', body, footer: 'Automated lead alert · system@clientsurgesystems.com · Source: contact_page' });
}

async function sendAdminNotification(contact: ReturnType<typeof normalizeContactInput>) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) return { sent: false, reason: 'missing_resend_api_key' };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'ClientSurge Systems <system@clientsurgesystems.com>',
      to: ['nolan@clientsurgesystems.com'],
      reply_to: contact.email,
      subject: `New Contact: ${contact.full_name} - ${contact.business_type}`,
      html: adminEmailHtml(contact),
    }),
  });

  if (!response.ok) return { sent: false, reason: await response.text() || 'notification_failed' };
  return { sent: true };
}

async function sendUserThankYouEmail(contact: ReturnType<typeof normalizeContactInput>) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) return { sent: false, reason: 'missing_resend_api_key' };

  const firstName = contact.first_name || 'there';
  const body = `
<div style="margin-top:24px;background:${CS.blueSoft};border:1px solid ${CS.border};border-radius:16px;padding:20px 22px;">
<div style="color:${CS.electricDeep};font-size:11px;line-height:15px;font-weight:900;text-transform:uppercase;letter-spacing:0.09em;">What happens next</div>
<p style="margin:9px 0 0 0;color:#000000;font-size:15px;line-height:24px;font-weight:650;">We review your message, check the best automation fit, and reply from a monitored ClientSurge inbox. No brown legacy theme. No generic filler. Just a clean next step.</p>
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;border-collapse:collapse;"><tr>
<td style="padding:0 7px 0 0;"><div style="background:#ffffff;border:1px solid ${CS.border};border-radius:14px;padding:15px 16px;"><div style="color:${CS.softText};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;">Received</div><div style="margin-top:5px;color:#000;font-size:14px;font-weight:900;">Your message</div></div></td>
<td style="padding:0 0 0 7px;"><div style="background:#ffffff;border:1px solid ${CS.border};border-radius:14px;padding:15px 16px;"><div style="color:${CS.softText};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;">Response</div><div style="margin-top:5px;color:#000;font-size:14px;font-weight:900;">Within 1 business day</div></div></td>
</tr></table>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0 0;"><tr><td bgcolor="${CS.electricDeep}" style="border-radius:999px;background:linear-gradient(90deg,${CS.electricDeep},${CS.electricNavy});box-shadow:0 7px 22px rgba(0,121,193,0.34);"><a href="https://clientsurgesystems.com/book" style="display:inline-block;padding:15px 22px;color:#ffffff;text-decoration:none;font-size:15px;line-height:20px;font-weight:900;border-radius:999px;">Book a quick call →</a></td></tr></table>`;

  const emailBody = emailShell({ preview: 'Your ClientSurge Systems message was received.', badge: 'Message Received', title: `Thanks for reaching out, ${firstName}.`, subtitle: 'We received your message and will follow up with the next best step for your business.', body, footer: 'ClientSurge Systems · Phoenix, Arizona · system@clientsurgesystems.com' });

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'ClientSurge Systems <system@clientsurgesystems.com>',
      to: [contact.email],
      subject: `Message received — ClientSurge Systems`,
      html: emailBody,
    }),
  });

  if (!response.ok) return { sent: false, reason: await response.text() || 'thank_you_email_failed' };
  return { sent: true };
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

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return secureJson({ error: 'Method not allowed' }, { status: 405 });
    const originGuard = validatePublicFormOrigin(req);
    if (!originGuard.ok) return secureJson({ error: originGuard.error }, { status: originGuard.status });
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const contact = normalizeContactInput(payload as Record<string, unknown>);
    if (contact.honeypot) return secureJson({ success: true, ignored: true });
    const errors = validateContactInput(contact);
    if (errors.length > 0) return secureJson({ error: errors[0], errors }, { status: 400 });
    if (await isRateLimited(base44, contact)) return secureJson({ error: 'Please wait a moment before submitting again.' }, { status: 429 });

    const existingWebsiteLead = await findExistingWebsiteLead(base44, contact);
    let websiteLeadId = '';
    let action = 'created';
    if (existingWebsiteLead?.id) {
      await base44.asServiceRole.entities.WebsiteLead.update(existingWebsiteLead.id, { ...buildWebsiteLeadPayload(contact), lead_status: existingWebsiteLead.lead_status || 'new' });
      websiteLeadId = String(existingWebsiteLead.id);
      action = 'updated';
    } else {
      const createdWebsiteLead = await base44.asServiceRole.entities.WebsiteLead.create(buildWebsiteLeadPayload(contact));
      websiteLeadId = createdWebsiteLead.id;
    }

    let canonicalLeadId = '';
    try {
      const createdLead = await base44.asServiceRole.entities.Leads.create(buildCanonicalLeadPayload(contact, websiteLeadId));
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
      metadata_json: JSON.stringify({ source: CONTACT_SOURCE, source_page: CONTACT_SOURCE_PAGE, intake_type: INTAKE_TYPE, action, business_type: contact.business_type, website_lead_id: websiteLeadId, canonical_lead_id: canonicalLeadId || null }),
    });

    const notification = await sendAdminNotification(contact).catch((error) => ({ sent: false, reason: error instanceof Error ? error.message : String(error) }));
    const fromNumber = await resolveTwilioFromNumber(base44);
    sendAdminSMS(contact, fromNumber).catch((error) => console.warn('[submitContactInquiry] SMS alert error:', error));
    const thankYouEmail = await sendUserThankYouEmail(contact).catch((error) => ({ sent: false, reason: error instanceof Error ? error.message : String(error) }));

    await safeLogCommunicationEvent(base44, { lead_id: leadIdForLogs, channel: 'email', direction: 'outbound', event_type: notification.sent ? 'email_sent' : 'email_failed', provider: 'resend', status: notification.sent ? 'sent' : 'failed', subject: `New Contact: ${contact.full_name} - ${contact.business_type}`, message_body: contact.message, error_message: notification.sent ? undefined : notification.reason, metadata_json: JSON.stringify({ target: 'admin_notification', source: CONTACT_SOURCE, source_page: CONTACT_SOURCE_PAGE, intake_type: INTAKE_TYPE }) });
    await safeLogCommunicationEvent(base44, { lead_id: leadIdForLogs, channel: 'email', direction: 'outbound', event_type: thankYouEmail.sent ? 'email_sent' : 'email_failed', provider: 'resend', status: thankYouEmail.sent ? 'sent' : 'failed', subject: 'Message received — ClientSurge Systems', message_body: 'Automated thank you email', error_message: thankYouEmail.sent ? undefined : thankYouEmail.reason, metadata_json: JSON.stringify({ target: 'user_thank_you', source: CONTACT_SOURCE, source_page: CONTACT_SOURCE_PAGE, intake_type: INTAKE_TYPE, business_type: contact.business_type }) });

    try {
      await base44.asServiceRole.functions.invoke('trackContactFormCompletion', { lead_id: leadIdForLogs, website_lead_id: websiteLeadId, contact_info: { business_type: contact.business_type } });
    } catch {
      // Analytics must never block a public lead submission.
    }

    return secureJson({ success: true, lead_id: leadIdForLogs, website_lead_id: websiteLeadId, canonical_lead_id: canonicalLeadId || null, action, notification_sent: notification.sent, notification_warning: notification.sent ? null : notification.reason, thank_you_sent: thankYouEmail.sent });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit contact inquiry';
    console.error('[submitContactInquiry] Error:', message, error instanceof Error ? error.stack : '');
    return secureJson({ error: 'Contact form submission failed. Please email support@clientsurgesystems.com directly.', detail: message }, { status: 500 });
  }
});
