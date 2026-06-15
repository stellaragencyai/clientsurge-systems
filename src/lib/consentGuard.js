/**
 * Task 26 — Consent guard
 * Prevents outbound communication if lead consent_given is false
 */

export function isConsentGiven(lead) {
  return lead?.consent_given === true;
}

export function assertConsent(lead) {
  if (!isConsentGiven(lead)) {
    throw new Error(`Outbound communication blocked: consent not given for lead ${lead?.id || 'unknown'}`);
  }
}

export function filterConsentedLeads(leads = []) {
  return leads.filter((lead) => isConsentGiven(lead));
}