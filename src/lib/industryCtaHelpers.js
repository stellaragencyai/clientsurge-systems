/**
 * Industry CTA Attribution Helpers
 *
 * Ensures every CTA from an industry page carries industry, package, source,
 * leadType, and urgency parameters through to pricing, signup, and lead capture
 * destinations.
 *
 * Usage:
 *   import { buildIndustryPricingUrl, buildIndustrySignupUrl, buildLeadCaptureUrl } from '@/lib/industryCtaHelpers';
 */

/**
 * Build a /pricing URL with industry attribution.
 * @param {string} industrySlug - e.g. 'hvac', 'dental', 'roofing'
 * @param {string} sourcePage - optional source page path
 * @returns {string} e.g. /pricing?industry=hvac&source=industry_page
 */
export function buildIndustryPricingUrl(industrySlug, sourcePage = null) {
  if (!industrySlug) return '/pricing';
  const params = new URLSearchParams();
  params.set('industry', industrySlug);
  if (sourcePage) params.set('source', sourcePage);
  return `/pricing?${params.toString()}`;
}

/**
 * Build a /product-signup URL with package + industry attribution.
 * @param {string} tierKey - 'starter', 'growth', or 'pro'
 * @param {string} industrySlug - e.g. 'hvac'
 * @param {string} sourcePage - optional source page path
 * @returns {string} e.g. /product-signup?package=growth_system&industry=hvac&source=industry_page
 */
export function buildIndustrySignupUrl(tierKey, industrySlug, sourcePage = null) {
  const params = new URLSearchParams();
  params.set('package', tierKey ? `${tierKey}_system` : 'unknown_system');
  if (industrySlug) params.set('industry', industrySlug);
  if (sourcePage) params.set('source', sourcePage);
  return `/product-signup?${params.toString()}`;
}

/**
 * Build a lead capture URL with industry, leadType, urgency, and source attribution.
 * @param {string} industrySlug - e.g. 'hvac'
 * @param {string} leadType - optional lead type
 * @param {string} urgency - optional urgency level
 * @param {string} sourcePage - optional source page path
 * @returns {string} e.g. /leads/capture?industry=hvac&leadType=emergency&urgency=high&source=industry_page
 */
export function buildLeadCaptureUrl(industrySlug, leadType = null, urgency = null, sourcePage = null) {
  const params = new URLSearchParams();
  if (industrySlug) params.set('industry', industrySlug);
  if (leadType) params.set('leadType', leadType);
  if (urgency) params.set('urgency', urgency);
  if (sourcePage) params.set('source', sourcePage);
  return `/leads/capture?${params.toString()}`;
}