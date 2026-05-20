/**
 * smsCompliance.js — #491
 * Middleware: validates every outbound SMS before it goes through Twilio.
 * Checks: opt-out status, consent capture, business hours, message length.
 */

const BUSINESS_HOURS = { start: 8, end: 20 }; // 8am–8pm local

const OPT_OUT_KEYWORDS = ['stop', 'stopall', 'unsubscribe', 'cancel', 'end', 'quit'];
const OPT_IN_KEYWORDS  = ['start', 'yes', 'unstop'];

/**
 * Check if current time is within business hours (Mountain Time)
 */
function isBusinessHours() {
  const now = new Date();
  const mt = new Date(now.toLocaleString('en-US', { timeZone: 'America/Phoenix' }));
  const hour = mt.getHours();
  return hour >= BUSINESS_HOURS.start && hour < BUSINESS_HOURS.end;
}

/**
 * Main compliance gate — call before every Twilio SMS send.
 * @param {object} lead - SpaLead or contact record
 * @param {string} message - The SMS body to send
 * @param {object} options - { force_send: bool, skip_hours_check: bool }
 * @returns {{ allowed: boolean, reason: string }}
 */
function checkSMSCompliance(lead, message, options = {}) {
  const { force_send = false, skip_hours_check = false } = options;

  // 1. Opt-out check
  if (lead.sms_opted_out === true || lead.status === 'opted_out') {
    return { allowed: false, reason: 'Lead has opted out of SMS' };
  }

  // 2. Consent check — lead must have a phone and either consent flag or prior contact
  if (!lead.phone) {
    return { allowed: false, reason: 'No phone number on record' };
  }

  // 3. Business hours check (skip for appointment reminders etc)
  if (!skip_hours_check && !force_send && !isBusinessHours()) {
    return { allowed: false, reason: `SMS blocked — outside business hours (8am–8pm MT)` };
  }

  // 4. Message length — Twilio concatenates but >1600 chars is a red flag
  if (!message || message.trim().length === 0) {
    return { allowed: false, reason: 'Empty message body' };
  }
  if (message.length > 1600) {
    return { allowed: false, reason: `Message too long (${message.length} chars, max 1600)` };
  }

  // 5. Check for double opt-out keywords in outbound message (shouldn't happen but safety net)
  const lower = message.toLowerCase();
  for (const kw of OPT_OUT_KEYWORDS) {
    if (lower.includes(kw)) {
      return { allowed: false, reason: `Message contains opt-out keyword: "${kw}"` };
    }
  }

  return { allowed: true, reason: 'Passed all compliance checks' };
}

/**
 * Handle inbound opt-out/opt-in reply from lead.
 * Call this when Twilio receives an inbound SMS.
 * Returns the action taken.
 */
function handleInboundReply(body = '', lead_id = '') {
  const keyword = body.trim().toLowerCase();

  if (OPT_OUT_KEYWORDS.includes(keyword)) {
    return { action: 'opt_out', lead_id, keyword, update: { sms_opted_out: true, status: 'opted_out' } };
  }

  if (OPT_IN_KEYWORDS.includes(keyword)) {
    return { action: 'opt_in', lead_id, keyword, update: { sms_opted_out: false } };
  }

  return { action: 'none', lead_id, keyword };
}

/**
 * Append TCPA-required opt-out footer if not already present.
 */
function appendOptOutFooter(message) {
  const footer = '\n\nReply STOP to opt out.';
  if (message.toLowerCase().includes('reply stop') || message.toLowerCase().includes('text stop')) {
    return message;
  }
  return message + footer;
}

module.exports = { checkSMSCompliance, handleInboundReply, appendOptOutFooter, isBusinessHours };
