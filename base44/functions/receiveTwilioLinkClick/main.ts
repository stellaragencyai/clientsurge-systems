import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const LINK_CLICK_EVENT_TYPE = 'sms_link_clicked';
const LINK_PREVIEW_EVENT_TYPE = 'sms_link_previewed';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function normalizePhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return String(phone).trim();
}

function phoneDigits(phone) {
  return String(phone || '').replace(/\D/g, '');
}

async function parsePayload(req) {
  const contentType = req.headers.get('content-type') || '';
  const rawBody = await req.text();

  if (!rawBody) {
    return { rawBody, payload: {} };
  }

  if (contentType.includes('application/json')) {
    try {
      return { rawBody, payload: JSON.parse(rawBody) };
    } catch {
      return { rawBody, payload: { rawBody } };
    }
  }

  const params = new URLSearchParams(rawBody);
  const payload = {};
  for (const [key, value] of params.entries()) {
    payload[key] = value;
  }
  return { rawBody, payload };
}

function flattenPayload(input, prefix = '', out = {}) {
  if (!input || typeof input !== 'object') return out;

  for (const [key, value] of Object.entries(input)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    out[fullKey.toLowerCase()] = value;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenPayload(value, fullKey, out);
    }
  }

  return out;
}

function getAny(payload, keys) {
  const flat = flattenPayload(payload);
  for (const key of keys) {
    const direct = payload?.[key];
    if (direct !== undefined && direct !== null && direct !== '') return direct;
    const lowered = String(key).toLowerCase();
    if (flat[lowered] !== undefined && flat[lowered] !== null && flat[lowered] !== '') return flat[lowered];
  }
  return null;
}

function looksLikePreview(payload) {
  const raw = JSON.stringify(payload || {}).toLowerCase();
  return raw.includes('preview') || raw.includes('prefetch') || raw.includes('unfurl');
}

function clampScore(value, delta, max = 100) {
  const n = Number(value || 0);
  return Math.min(max, Math.max(0, n + delta));
}

async function findMatchingLead({ base44, recipientPhone, messageSid }) {
  if (messageSid) {
    const events = await base44.asServiceRole.entities.CommunicationEvent.filter({
      provider: 'twilio',
      provider_message_id: messageSid,
    }).catch(() => []);

    const outboundEvent = (events || []).find((event) => event?.lead_id || event?.context_id) || events?.[0];
    if (outboundEvent?.lead_id) {
      return {
        entityName: 'WebsiteLead',
        id: outboundEvent.lead_id,
        lead: null,
        matchedBy: 'communication_event.lead_id',
      };
    }
    if (outboundEvent?.context_type === 'website_lead' && outboundEvent?.context_id) {
      return {
        entityName: 'WebsiteLead',
        id: outboundEvent.context_id,
        lead: null,
        matchedBy: 'communication_event.context_id',
      };
    }
    if (outboundEvent?.context_type === 'lead' && outboundEvent?.context_id) {
      return {
        entityName: 'Leads',
        id: outboundEvent.context_id,
        lead: null,
        matchedBy: 'communication_event.context_id',
      };
    }
  }

  const normalized = normalizePhone(recipientPhone);
  const digits = phoneDigits(normalized);
  if (!digits) return null;

  const websiteLeads = await base44.asServiceRole.entities.WebsiteLead.list('-created_date', 1000).catch(() => []);
  const websiteLead = (websiteLeads || []).find((lead) => phoneDigits(lead.phone_number) === digits);
  if (websiteLead?.id) {
    return {
      entityName: 'WebsiteLead',
      id: websiteLead.id,
      lead: websiteLead,
      matchedBy: 'website_lead.phone_number',
    };
  }

  const crmLeads = await base44.asServiceRole.entities.Leads.list('-created_date', 1000).catch(() => []);
  const crmLead = (crmLeads || []).find((lead) => {
    return phoneDigits(lead.phone || lead.normalized_phone || lead.canonical_phone) === digits;
  });

  if (crmLead?.id) {
    return {
      entityName: 'Leads',
      id: crmLead.id,
      lead: crmLead,
      matchedBy: 'leads.phone',
    };
  }

  return null;
}

async function updateLeadEngagement({ base44, match, clickedAt, originalUrl }) {
  if (!match?.id) return;

  const url = String(originalUrl || '').toLowerCase();
  const looksBookingRelated = /(book|booking|calendar|calendly|schedule|audit|free-audit|contact|pricing|checkout)/.test(url);

  if (match.entityName === 'WebsiteLead') {
    const existing = match.lead || await base44.asServiceRole.entities.WebsiteLead.get(match.id).catch(() => null);
    await base44.asServiceRole.entities.WebsiteLead.update(match.id, {
      last_engagement_type: 'sms',
      last_engagement_at: clickedAt,
      lead_status: existing?.lead_status === 'new' ? 'hot' : existing?.lead_status,
      booking_status: looksBookingRelated ? 'clicked' : existing?.booking_status,
      engagement_score: clampScore(existing?.engagement_score, 15),
    }).catch(() => {});
    return;
  }

  if (match.entityName === 'Leads') {
    const existing = match.lead || await base44.asServiceRole.entities.Leads.get(match.id).catch(() => null);
    await base44.asServiceRole.entities.Leads.update(match.id, {
      crm_stage: 'Opened / Clicked',
      lead_state: 'ENGAGED',
      outreach_status: existing?.outreach_status === 'not_contacted' ? 'contacted' : existing?.outreach_status,
      last_activity_at: clickedAt,
      engagement_score: clampScore(existing?.engagement_score, 15),
      lead_score: clampScore(existing?.lead_score, 10),
    }).catch(() => {});
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const url = new URL(req.url);
    const configuredKey = Deno.env.get('TWILIO_WEBHOOK_KEY') || Deno.env.get('TWILIO_LINK_CLICK_WEBHOOK_KEY');
    const suppliedKey = url.searchParams.get('twilio_webhook_key') || url.searchParams.get('key');

    if (!configuredKey) {
      return json({ error: 'Twilio webhook key is not configured' }, 500);
    }

    if (suppliedKey !== configuredKey) {
      return json({ error: 'Unauthorized' }, 403);
    }

    const base44 = createClientFromRequest(req);
    const { rawBody, payload } = await parsePayload(req);

    const eventSid = getAny(payload, ['EventSid', 'ClickSid', 'LinkClickSid', 'LinkSid', 'id', 'sid']);
    const messageSid = getAny(payload, ['MessageSid', 'SmsSid', 'message_sid', 'message.sid', 'messageSid']);
    const recipientPhone = normalizePhone(getAny(payload, ['To', 'Recipient', 'RecipientAddress', 'to', 'recipient', 'recipient_address']));
    const originalUrl = getAny(payload, ['OriginalUrl', 'OriginalURL', 'LongUrl', 'LongURL', 'DestinationUrl', 'DestinationURL', 'Url', 'url', 'original_url', 'destination_url', 'link.original_url']);
    const shortenedUrl = getAny(payload, ['ShortUrl', 'ShortURL', 'ShortenedUrl', 'ShortenedURL', 'short_url', 'shortened_url', 'link.short_url']);
    const clickedAt = getAny(payload, ['ClickedAt', 'Timestamp', 'timestamp', 'created_at', 'click_time']) || new Date().toISOString();
    const userAgent = getAny(payload, ['UserAgent', 'user_agent', 'headers.user-agent']);
    const ipAddress = getAny(payload, ['IpAddress', 'IPAddress', 'ip_address', 'ip']);
    const preview = looksLikePreview(payload);
    const eventType = preview ? LINK_PREVIEW_EVENT_TYPE : LINK_CLICK_EVENT_TYPE;

    if (eventSid) {
      const duplicateEvents = await base44.asServiceRole.entities.CommunicationEvent.filter({
        provider: 'twilio',
        provider_message_id: String(eventSid),
      }).catch(() => []);

      if ((duplicateEvents || []).length > 0) {
        return json({ success: true, duplicate: true, event_id: duplicateEvents[0].id });
      }
    }

    const match = await findMatchingLead({ base44, recipientPhone, messageSid });
    await updateLeadEngagement({ base44, match, clickedAt, originalUrl });

    const metadata = {
      message_sid: messageSid || null,
      event_sid: eventSid || null,
      recipient_phone: recipientPhone || null,
      original_url: originalUrl || null,
      shortened_url: shortenedUrl || null,
      clicked_at: clickedAt,
      user_agent: userAgent || null,
      ip_address: ipAddress || null,
      matched: Boolean(match?.id),
      matched_entity: match?.entityName || null,
      matched_by: match?.matchedBy || null,
      preview,
      raw_payload: payload,
      raw_body: rawBody,
    };

    const communicationEvent = await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: match?.entityName === 'WebsiteLead' ? match.id : undefined,
      context_type: match?.entityName === 'Leads' ? 'lead' : (match?.entityName === 'WebsiteLead' ? 'website_lead' : 'twilio_link_click_unmatched'),
      context_id: match?.id || null,
      channel: 'sms',
      direction: 'inbound',
      event_type: eventType,
      provider: 'twilio',
      status: preview ? 'processed' : 'clicked',
      subject: preview ? 'SMS link previewed' : 'SMS link clicked',
      message_body: `${recipientPhone || 'Unknown recipient'} ${preview ? 'previewed' : 'clicked'} ${originalUrl || shortenedUrl || 'a Twilio shortened SMS link'}`,
      provider_message_id: eventSid || messageSid || null,
      metadata_json: JSON.stringify(metadata),
      dashboard_truth_status: match?.id ? 'trusted' : 'warning',
      dashboard_truth_notes: match?.id
        ? `Matched click to ${match.entityName} via ${match.matchedBy}.`
        : 'Twilio click received but no matching lead was found by message SID or recipient phone.',
    });

    return json({
      success: true,
      event_id: communicationEvent.id,
      event_type: eventType,
      matched: Boolean(match?.id),
      matched_entity: match?.entityName || null,
      matched_id: match?.id || null,
    });
  } catch (error) {
    console.error('[INTERNAL_ERROR] receiveTwilioLinkClick:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    return json({ error: 'An error occurred processing the Twilio link click callback.' }, 500);
  }
});
