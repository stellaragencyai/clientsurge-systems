import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import {
  normalizePhoneE164,
  resolveTwilioSender,
  classifyInboundNumber,
} from '../_shared/twilioSenderConfig/entry.ts';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

function appendSmsOptOut(message) {
  const trimmed = String(message || '').trim();
  if (!trimmed) return '';
  if (/\breply\s+stop\b/i.test(trimmed) || /\bstop\s+to\s+(unsubscribe|opt\s*out)\b/i.test(trimmed)) return trimmed;
  return `${trimmed}\n\nReply STOP to opt out.`;
}

const SMS_BLOCK_STATUSES = new Set(['opted_out', 'unsubscribed', 'stopped', 'blocked', 'do_not_contact']);
const cleanStatus = (value) => String(value || '').trim().toLowerCase();

function getLeadSmsBlockReason(lead = {}) {
  if (!lead) return 'lead_missing';
  if (lead.do_not_contact === true) return 'do_not_contact';
  if (lead.sms_opted_out === true) return 'sms_opted_out';
  if (lead.sms_permission === false) return 'sms_permission_false';
  if (SMS_BLOCK_STATUSES.has(cleanStatus(lead.sms_opt_out_status))) return `sms_opt_out_status:${cleanStatus(lead.sms_opt_out_status)}`;
  if (SMS_BLOCK_STATUSES.has(cleanStatus(lead.sms_status))) return `sms_status:${cleanStatus(lead.sms_status)}`;
  if (SMS_BLOCK_STATUSES.has(cleanStatus(lead.outreach_status))) return `outreach_status:${cleanStatus(lead.outreach_status)}`;
  if (lead.consent_given === false || lead.sms_consent === false) return 'consent_not_given';
  return '';
}

function getPhoneFromMessage(record = {}) {
  return normalizePhoneE164(record.from_address || record.from_number || record.from_phone || record.lead_phone || record.to_address || '');
}

async function logEvent(base44, data) {
  try { await base44.asServiceRole.entities.CommunicationEvent.create(data); } catch (_) {}
}

async function findConversationAffinity(base44, leadId) {
  if (!leadId) return null;
  try {
    const messages = await base44.asServiceRole.entities.Messages.filter(
      { lead_id: leadId, channel: 'sms', provider_from_number: { $exists: true } },
      '-created_date',
      1
    );
    return normalizePhoneE164(messages?.[0]?.provider_from_number);
  } catch (_) {
    return null;
  }
}

async function findPersistedOptOut(base44, normalizedPhone) {
  try {
    const records = await base44.asServiceRole.entities.Messages.filter(
      { direction: 'inbound', channel: 'sms', message_text: { $regex: /STOP|UNSUBSCRIBE|CANCEL|END|QUIT|OPT.?OUT/i } },
      '-created_date',
      250
    );
    return (records || []).some((record) => getPhoneFromMessage(record) === normalizedPhone);
  } catch (_) {
    return false;
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    const payload = await req.json();
    const { phone, message, leadId } = payload;
    const purpose = payload.purpose || payload.messagePurpose || 'customer_service';
    if (!phone || !message) return json({ error: 'Phone and message required' }, 400);

    const normalizedPhone = normalizePhoneE164(phone);
    if (!normalizedPhone) return json({ error: 'Invalid phone number', sms_sent: false, reason: 'invalid_phone_number' }, 400);

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    if (!accountSid || !authToken) return json({ error: 'Twilio credentials not configured' }, 500);

    const base44 = createClientFromRequest(req);
    let lead = null;
    if (leadId) {
      try { lead = await base44.asServiceRole.entities.Leads.get(leadId); } catch (_) {}
    }

    const clientId = lead?.client_id || payload.clientId || null;
    const clientProjectId = lead?.client_project_id || payload.clientProjectId || null;
    if (!clientId) {
      await logEvent(base44, {
        lead_id: leadId || undefined,
        channel: 'sms', direction: 'outbound', event_type: 'tenant_scope_blocked',
        provider: 'twilio', status: 'failed', error_message: 'missing_client_id_tenant_scope',
        metadata_json: JSON.stringify({ purpose, normalized_phone: normalizedPhone }),
      });
      return json({ error: 'Outbound SMS blocked: missing client_id tenant scope', sms_sent: false, reason: 'missing_client_id_tenant_scope' }, 200);
    }

    const blockReason = getLeadSmsBlockReason(lead);
    if (blockReason) {
      await logEvent(base44, {
        lead_id: leadId || undefined, client_id: clientId, client_project_id: clientProjectId || undefined,
        channel: 'sms', direction: 'outbound', event_type: 'sms_blocked',
        provider: 'internal_compliance_guard', status: 'blocked', error_message: blockReason,
        message_body: String(message), metadata_json: JSON.stringify({ purpose, normalized_phone: normalizedPhone }),
      });
      return json({ error: 'Outbound SMS blocked by compliance guard', sms_sent: false, reason: blockReason }, 200);
    }

    if (await findPersistedOptOut(base44, normalizedPhone)) {
      return json({ error: 'Phone number has opted out of SMS', sms_sent: false, reason: 'sms_opt_out' }, 200);
    }

    const conversationFromNumber = payload.conversationFromNumber || await findConversationAffinity(base44, leadId);
    const clientAssignedNumber = payload.clientAssignedNumber || payload.providerFromNumber || null;
    const fromNumber = await resolveTwilioSender(base44, {
      purpose,
      conversationFromNumber,
      clientAssignedNumber,
    });

    const statusCallbackUrl = Deno.env.get('TWILIO_SMS_STATUS_CALLBACK_URL');
    const outboundBody = appendSmsOptOut(message);
    const auth = btoa(`${accountSid}:${authToken}`);
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        From: fromNumber,
        To: normalizedPhone,
        Body: outboundBody,
        ...(statusCallbackUrl && { StatusCallback: statusCallbackUrl }),
      }).toString(),
    });

    let providerData = null;
    try { providerData = await response.json(); } catch (_) {}

    if (!response.ok) {
      await logEvent(base44, {
        lead_id: leadId || undefined, client_id: clientId, client_project_id: clientProjectId || undefined,
        tenant_scope_status: 'scoped', channel: 'sms', direction: 'outbound', event_type: 'sms_failed',
        provider: 'twilio', provider_from_number: fromNumber, status: 'failed', message_body: outboundBody,
        error_message: providerData?.message || `Twilio error ${response.status}`,
        metadata_json: JSON.stringify({ purpose, sender_role: classifyInboundNumber(fromNumber), normalized_phone: normalizedPhone }),
      });
      return json({ error: 'Failed to send SMS', details: providerData, sender: fromNumber }, 500);
    }

    await logEvent(base44, {
      lead_id: leadId || undefined, client_id: clientId, client_project_id: clientProjectId || undefined,
      tenant_scope_status: 'scoped', channel: 'sms', direction: 'outbound', event_type: 'sms_sent',
      provider: 'twilio', provider_from_number: fromNumber, status: 'sent', message_body: outboundBody,
      provider_message_id: providerData?.sid || null,
      metadata_json: JSON.stringify({ purpose, sender_role: classifyInboundNumber(fromNumber), normalized_phone: normalizedPhone, conversation_affinity_used: Boolean(conversationFromNumber) }),
    });

    try {
      await base44.asServiceRole.entities.Messages.create({
        lead_id: leadId || undefined, client_id: clientId, client_project_id: clientProjectId || undefined,
        tenant_scope_status: 'scoped', direction: 'outbound', channel: 'sms', message_text: outboundBody,
        status: 'sent', provider: 'twilio', provider_message_id: providerData?.sid || undefined,
        provider_from_number: fromNumber, from_number: fromNumber, to_address: normalizedPhone,
        metadata_json: JSON.stringify({ purpose, sender_role: classifyInboundNumber(fromNumber) }),
      });
    } catch (_) {}

    return json({ success: true, messageSid: providerData?.sid, normalized_phone: normalizedPhone, sender_from: fromNumber, sender_role: classifyInboundNumber(fromNumber), purpose });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
});
