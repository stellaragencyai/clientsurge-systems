/**
 * Task 26 — Backend consent check before outbound communication
 */

export function assertLeadConsent(lead) {
  if (!lead) throw new Error('Lead not found');
  if (lead.consent_given !== true) throw new Error(`Communication blocked: consent_given is false for lead ${lead.id}`);
  if (lead.do_not_contact === true) throw new Error(`Communication blocked: do_not_contact for lead ${lead.id}`);
  if (lead.email_unsubscribed === true) throw new Error(`Communication blocked: unsubscribed lead ${lead.id}`);
}

export function canContactLead(lead) {
  return lead?.consent_given === true && lead?.do_not_contact !== true && lead?.email_unsubscribed !== true;
}

Deno.serve(() => new Response('shared module', { status: 200 }));