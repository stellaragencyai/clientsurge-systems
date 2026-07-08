/**
 * smsCompliance.js — outbound SMS compliance utilities.
 * Validates outbound SMS before Twilio send paths.
 */

const BUSINESS_HOURS = { start: 8, end: 20 }; // 8am–8pm local

const OPT_OUT_KEYWORDS = ['stop', 'stopall', 'unsubscribe', 'cancel', 'end', 'quit', 'optout', 'opt out'];
const OPT_IN_KEYWORDS  = ['start', 'yes', 'unstop'];
const SMS_BLOCK_STATUSES = new Set(['opted_out', 'unsubscribed', 'stopped', 'blocked', 'do_not_contact']);

function cleanStatus(value) {
  return String(value || '').trim().toLowerCase();
}

/**
 * Check if current time is within business hours (Mountain Time)
 */
function isBusinessHours() {
  const now = new Date();
  const mt = new Date(now.toLocaleString('en-US', { timeZone: 'America/Phoenix' }));
  const hour = mt.getHours();
  return hour >= BUSINESS_HOURS.start && hour < BUSINESS_HOURS.end;
}

function getSmsBlockReason(lead = {}) {
  if (!lead) return 'lead_missing';
  if (lead.do_not_contact === true) return 'do_not_contact';
  if (lead.sms_opted_out === true) return 'sms_opted_out';
  if (lead.sms_permission === false) return 'sms_permission_false';
  if (SMS_BLOCK_STATUSES.has(cleanStatus(lead.sms_opt_out_status))) return `sms_opt_out_status:${cleanStatus(lead.sms_opt_out_status)}`;
  if (SMS_BLOCK_STATUSES.has(cleanStatus(lead.sms_status))) return `sms_status:${cleanStatus(lead.sms_status)}`;
  if (SMS_BLOCK_STATUSES.has(cleanStatus(lead.outreach_status))) return `outreach_status:${cleanStatus(lead.outreach_status)}`;
  if (SMS_BLOCK_STATUSES.has(cleanStatus(lead.status))) return `lead_status:${cleanStatus(lead.status)}`;
  if (lead.consent_given === false || lead.sms_consent === false) return 'consent_not_given';
  return '';
}

/**
 * Main compliance gate — call before every Twilio SMS send.
 * @param {object} lead - lead/contact record
 * @param {string} message - The SMS body to send
 * @param {object} options - { force_send: bool, skip_hours_check: bool }
 * @returns {{ allowed: boolean, reason: string }}
 */
function checkSMSCompliance(lead, message, options = {}) {
  const { force_send = false, skip_hours_check = false } = options;

  const smsBlockReason = getSmsBlockReason(lead);
  if (smsBlockReason) {
    return { allowed: false, reason: smsBlockReason };
  }

  if (!lead.phone && !lead.phone_number) {
    return { allowed: false, reason: 'phone_missing' };
  }

  if (!skip_hours_check && !force_send && !isBusinessHours()) {
    return { allowed: false, reason: 'outside_business_hours' };
  }

  if (!message || message.trim().length === 0) {
    return { allowed: false, reason: 'empty_message_body' };
  }
  if (message.length > 1600) {
    return { allowed: false, reason: `message_too_long:${message.length}` };
  }

  return { allowed: true, reason: 'passed' };
}

/**
 * Handle inbound opt-out/opt-in reply from lead.
 * Call this when Twilio receives an inbound SMS.
 * Returns the action taken.
 */
function handleInboundReply(body = '', lead_id = '') {
  const keyword = body.trim().toLowerCase();

  if (OPT_OUT_KEYWORDS.includes(keyword)) {
    return {
      action: 'opt_out',
      lead_id,
      keyword,
      update: {
        sms_opted_out: true,
        sms_opt_out_status: 'opted_out',
        sms_permission: false,
        do_not_contact: true,
        outreach_status: 'do_not_contact',
        status: 'opted_out',
      },
    };
  }

  if (OPT_IN_KEYWORDS.includes(keyword)) {
    return { action: 'opt_in', lead_id, keyword, update: { sms_opted_out: false, sms_opt_out_status: 'opted_in', sms_permission: true } };
  }

  return { action: 'none', lead_id, keyword };
}

/**
 * Append opt-out footer if not already present.
 */
function appendOptOutFooter(message) {
  const body = String(message || '').trim();
  const footer = 'Reply STOP to opt out.';
  if (!body) return footer;
  const normalized = body.toLowerCase();
  if (normalized.includes('reply stop') || normalized.includes('text stop') || normalized.includes('stop to unsubscribe') || normalized.includes('stop to opt out')) {
    return body;
  }
  return `${body}\n\n${footer}`;
}

export { checkSMSCompliance, handleInboundReply, appendOptOutFooter, isBusinessHours, getSmsBlockReason };
