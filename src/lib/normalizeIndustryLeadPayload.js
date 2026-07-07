/**
 * normalizeIndustryLeadPayload
 *
 * Ensures every lead payload submitted from an industry qualification form
 * includes all required fields before submission. Unknown values are set to
 * explicit placeholders ('unknown', 'not_selected', 'not_applicable') rather
 * than omitted.
 *
 * Required fields:
 *   name, phone, email, business_name, industrySlug, leadType, urgency,
 *   serviceRequested, sourcePage, packageTier, notes, consent, consent_source
 *
 * @param {Object} input - Raw form data
 * @returns {Object} Normalized payload ready for submission
 */
export function normalizeIndustryLeadPayload(input = {}) {
  const consent = input.consent_given === true || input.consent === true;

  return {
    name: input.full_name || input.name || 'unknown',
    phone: input.phone || 'unknown',
    email: input.email || 'unknown',
    business_name: input.business_name || 'unknown',
    industrySlug: input.industrySlug || input.industry_slug || 'unknown',
    leadType: input.leadType || input.lead_type || 'not_selected',
    urgency: input.urgency || 'not_selected',
    serviceRequested: input.serviceRequested || input.service_requested || 'not_applicable',
    sourcePage: input.sourcePage || input.source_page || `/${input.industrySlug || 'industry'}`,
    packageTier: input.packageTier || input.package_tier || 'not_selected',
    notes: input.problem || input.notes || 'not_applicable',
    consent: consent,
    consent_source: input.consent_source || `industry_page_${input.industrySlug || 'unknown'}`,
  };
}