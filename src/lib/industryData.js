/**
 * Industry Data Bridge — Static JS ↔ DB Config
 *
 * TEMPORARY BRIDGE: This module maps route slugs to IndustryConfig DB slugs
 * and provides a unified accessor that merges static marketing content with
 * operational config fetched from the IndustryConfig entity.
 *
 * SOURCE OF TRUTH:
 *   - DB (IndustryConfig entity) = operational/deployment authority.
 *     Contains AI config, lead CRM config, booking rules, branding config.
 *   - Static JS (industryMarketingConfig.js, industryContent.js, industryPremiumContent.js)
 *     = temporary marketing content only. Will be migrated to DB in a future phase.
 *
 * DO NOT create a third source of truth. When DB config is available, it takes
 * precedence for operational fields. Static JS is used for marketing copy only.
 */

import { getIndustryBySlug } from '@/data/industryMarketingConfig';
import { getMergedIndustryData } from '@/data/industryContent';
import { getPremiumContent } from '@/data/industryPremiumContent';

/**
 * Route slug → IndustryConfig DB slug mapping.
 * Route slugs are short (e.g. 'hvac'); DB slugs include '-ai-growth-system' suffix.
 */
export const ROUTE_TO_DB_SLUG = {
  'hvac': 'hvac-ai-growth-system',
  'dental': 'dental-ai-growth-system',
  'roofing': 'roofing-ai-growth-system',
  'med-spa': 'med-spa-ai-growth-system',
  'plumbing': 'plumbing-ai-growth-system',
  'chiropractic': 'chiropractic-ai-growth-system',
  'contractors': 'contractors-ai-growth-system',
  'real-estate': 'real-estate-ai-growth-system',
  'personal-injury': 'personal-injury-ai-growth-system',
  'law-firm': 'law-firm-ai-growth-system',
};

/**
 * Reverse mapping: DB slug → route slug.
 */
export const DB_TO_ROUTE_SLUG = Object.entries(ROUTE_TO_DB_SLUG).reduce((acc, [route, db]) => {
  acc[db] = route;
  return acc;
}, {});

/**
 * Get the DB slug for a route slug.
 * @param {string} routeSlug - e.g. 'hvac'
 * @returns {string|null} e.g. 'hvac-ai-growth-system'
 */
export function getDbSlug(routeSlug) {
  return ROUTE_TO_DB_SLUG[routeSlug] || null;
}

/**
 * Get the route slug for a DB slug.
 * @param {string} dbSlug - e.g. 'hvac-ai-growth-system'
 * @returns {string|null} e.g. 'hvac'
 */
export function getRouteSlug(dbSlug) {
  return DB_TO_ROUTE_SLUG[dbSlug] || null;
}

/**
 * Fetch merged industry data: static marketing content + optional DB operational config.
 *
 * NOTE: DB config (IndustryConfig entity) is the operational authority. Static JS
 * is temporary marketing content. This function does NOT fetch from DB at runtime
 * — that should be done via a backend function when operational config is needed.
 * This bridge only provides the slug mapping for future DB lookups.
 *
 * @param {string} routeSlug - e.g. 'hvac'
 * @returns {Object|null} Merged industry data with routeSlug and dbSlug fields
 */
export function getIndustryData(routeSlug) {
  const marketingData = getIndustryBySlug(routeSlug);
  if (!marketingData) return null;

  const merged = getMergedIndustryData(routeSlug, marketingData);
  const premium = getPremiumContent(routeSlug);
  const dbSlug = getDbSlug(routeSlug);

  return {
    ...merged,
    routeSlug,
    dbSlug,
    premium,
    // Flag: operational config must be fetched from DB for deployment-level decisions.
    // Static JS marketing content is NOT sufficient for automation execution.
    _dataSource: 'static_js_marketing_only',
    _dbSlugForOperationalConfig: dbSlug,
  };
}

/**
 * Get all valid route slugs.
 */
export function getAllRouteSlugs() {
  return Object.keys(ROUTE_TO_DB_SLUG);
}

/**
 * Check if a route slug is valid.
 */
export function isValidRouteSlug(slug) {
  return Boolean(ROUTE_TO_DB_SLUG[slug]);
}