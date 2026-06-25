/**
 * Appends standard opt-out language to SMS messages.
 * Required by CTIA/TCPA compliance.
 */

export function appendSmsOptOut(message) {
  if (!message) return "";
  const trimmed = message.trim();
  if (/\bSTOP\b/i.test(trimmed)) return trimmed;
  return `${trimmed}\n\nReply STOP to opt out.`;
}

/**
 * Checks whether a lead record is safe to send SMS to.
 * Returns { canSend: boolean, reason: string }
 */
export function canSendSms(lead) {
  if (!lead) return { canSend: false, reason: "lead_data_missing" };
  
  // FIX #11: SMS opt-out enforced on do_not_contact, email_unsubscribed acting as SMS block, and outreach_status
  if (lead.do_not_contact === true) {
    return { canSend: false, reason: "lead_do_not_contact" };
  }
  if (lead.outreach_status === "do_not_contact" || lead.outreach_status === "bounced") {
    return { canSend: false, reason: `lead_outreach_blocked_${lead.outreach_status}` };
  }
  if (lead.cadence_paused === true) {
    return { canSend: false, reason: "lead_cadence_paused" };
  }
  if (lead.consent_given === false) {
    return { canSend: false, reason: "lead_consent_not_given" };
  }
  if (!lead.phone && !lead.phone_number) {
    return { canSend: false, reason: "lead_phone_missing" };
  }
  return { canSend: true, reason: "" };
}

Deno.serve(() => new Response("OK", { status: 200 }));