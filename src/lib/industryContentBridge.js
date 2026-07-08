/**
 * Industry Content Bridge — Static JS ↔ DB Config resolver
 *
 * TEMPORARY BRIDGE: Resolves industry content from static JS first (legacy),
 * then falls back to DB (IndustryConfig entity) for new verticals.
 *
 * SOURCE OF TRUTH:
 *   - DB (IndustryConfig entity) = operational + content authority for new industries.
 *   - Static JS (industryMarketingConfig.js, industryContent.js, industryPremiumContent.js)
 *     = LEGACY fallback for HVAC/Dental/Roofing/med-spa/plumbing/etc. only.
 *
 * New industries created via IndustryConfig DB records render WITHOUT editing
 * any static JS file or App.jsx.
 *
 * Resolution order:
 *   1. Static JS (getIndustryBySlug) — fast, no API call, for legacy industries
 *   2. DB lookup (getIndustryConfigBySlug function) — for new industries
 *   3. Null — slug not found anywhere
 */

import { getIndustryBySlug } from '@/data/industryMarketingConfig';
import { getMergedIndustryData } from '@/data/industryContent';
import { getPremiumContent } from '@/data/industryPremiumContent';
import { base44 } from '@/api/base44Client';

export const INDUSTRY_RESOLUTION_STATUS = {
  LOADING: 'loading',
  FOUND_STATIC: 'found_static',
  FOUND_DB: 'found_db',
  DRAFT: 'draft',
  ARCHIVED: 'archived',
  NOT_FOUND: 'not_found',
};

function deriveIndustryName(displayName = '', slug = '') {
  const clean = displayName
    .replace(/\s+AI\s+Growth\s+System$/i, '')
    .replace(/\s+Growth\s+System$/i, '')
    .trim();

  if (clean) return clean;

  return slug
    .replace(/-ai-growth-system$/i, '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Maps DB IndustryConfig.website_content to the shape IndustryPageTemplate expects.
 */
function mapDbConfigToContent(slug, dbConfig) {
  const wc = dbConfig.website_content || {};
  const hero = wc.hero_config || {};
  const branding = dbConfig.branding_config || {};
  const industryName = deriveIndustryName(dbConfig.display_name, slug);

  return {
    slug,
    industry_name: industryName,
    display_name: dbConfig.display_name || `${industryName} AI Growth System`,
    hero_headline: hero.headline || `${dbConfig.display_name || industryName} AI Growth System`,
    hero_subheadline: hero.subheadline || '',
    hero_description: hero.description || hero.cta_text || '',
    hero_image: branding.asset_map?.hero_image || null,
    primary_cta: hero.cta_text || 'Compare Packages',
    secondary_cta: 'View Automation Stack',
    pain_points: (wc.pain_points || []).map(p => ({ title: p.title, desc: p.description })),
    use_cases: (wc.use_cases || []).map(u => ({
      title: u.title,
      description: u.description,
      icon: u.icon || 'Zap',
      metrics: u.metrics || '',
    })),
    roi_metrics: {
      response_speed: 'Faster replies',
      follow_up_quality: 'Cleaner follow-up',
      booking_path: 'Clearer booking handoff',
      launch_proof: 'Tested before launch',
    },
    testimonials: [],
    recommended_plan: 'growth_system',
    key_features: (wc.services || []).map(s => s.name),
    faq: wc.faq || [],
    services: wc.services || [],
    ai_config: dbConfig.ai_config || null,
    lead_crm_config: dbConfig.lead_crm_config || null,
    _source: 'db',
    seo: wc.seo_config || null,
  };
}

/**
 * Resolves industry content for a given slug.
 * Tries static JS first, then DB.
 *
 * @param {string} slug
 * @returns {Promise<{ status: string, data: object|null, premium: object|null }>}
 */
export async function resolveIndustryContent(slug) {
  // 1. Try static JS (legacy)
  const staticData = getIndustryBySlug(slug);
  if (staticData) {
    const merged = getMergedIndustryData(slug, staticData);
    const premium = getPremiumContent(slug);
    return { status: INDUSTRY_RESOLUTION_STATUS.FOUND_STATIC, data: merged, premium };
  }

  // 2. Try DB lookup
  try {
    const res = await base44.functions.invoke('getIndustryConfigBySlug', { slug });
    const result = res.data || res;

    if (!result.found) {
      return { status: INDUSTRY_RESOLUTION_STATUS.NOT_FOUND, data: null, premium: null };
    }

    if (result.status === 'published' && result.config) {
      const mapped = mapDbConfigToContent(slug, result.config);
      return { status: INDUSTRY_RESOLUTION_STATUS.FOUND_DB, data: mapped, premium: null };
    }

    if (result.status === 'draft') {
      return { status: INDUSTRY_RESOLUTION_STATUS.DRAFT, data: null, premium: null };
    }

    if (result.status === 'archived') {
      return { status: INDUSTRY_RESOLUTION_STATUS.ARCHIVED, data: null, premium: null };
    }

    return { status: INDUSTRY_RESOLUTION_STATUS.NOT_FOUND, data: null, premium: null };
  } catch (error) {
    console.warn('[industryContentBridge] DB lookup failed:', error.message);
    return { status: INDUSTRY_RESOLUTION_STATUS.NOT_FOUND, data: null, premium: null };
  }
}
