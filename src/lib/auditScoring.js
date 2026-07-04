/**
 * Audit Scoring Module
 * Reusable scoring system for audit sections. Each section scores out of 100
 * using six weighted components. Scores are calculated dynamically from evidence.
 * If evidence is missing, that component scores conservatively (0 or low).
 *
 * Components (total 100):
 *  - Strategic clarity:     15
 *  - User journey quality:  15
 *  - Data integrity:        20
 *  - Integration reliability: 20
 *  - Proof level:           15
 *  - Launch readiness:      15
 */

export const SCORING_COMPONENTS = [
  { key: 'strategic_clarity', label: 'Strategic Clarity', maxPoints: 15 },
  { key: 'user_journey', label: 'User Journey Quality', maxPoints: 15 },
  { key: 'data_integrity', label: 'Data Integrity', maxPoints: 20 },
  { key: 'integration_reliability', label: 'Integration Reliability', maxPoints: 20 },
  { key: 'proof_level', label: 'Proof Level', maxPoints: 15 },
  { key: 'launch_readiness', label: 'Launch Readiness', maxPoints: 15 },
];

export const TARGET_SCORE = 85;

/**
 * Calculate a single component score conservatively.
 * @param {number} rawRatio - 0..1 ratio of how much evidence exists
 * @param {number} maxPoints - max points for this component
 * @returns {number} - integer score 0..maxPoints
 */
export function scoreComponent(rawRatio, maxPoints) {
  if (typeof rawRatio !== 'number' || isNaN(rawRatio)) return 0;
  const clamped = Math.max(0, Math.min(1, rawRatio));
  return Math.round(clamped * maxPoints);
}

/**
 * Build a full section score result from evidence ratios.
 * @param {Object} ratios - { strategic_clarity, user_journey, data_integrity, integration_reliability, proof_level, launch_readiness }
 * @returns {{ total: number, grade: string, components: Array, status: string }}
 */
export function calculateSectionScore(ratios) {
  const components = SCORING_COMPONENTS.map((comp) => {
    const ratio = ratios[comp.key] ?? 0;
    const points = scoreComponent(ratio, comp.maxPoints);
    return {
      key: comp.key,
      label: comp.label,
      maxPoints: comp.maxPoints,
      points,
      ratio: ratio,
    };
  });

  const total = components.reduce((sum, c) => sum + c.points, 0);
  const grade = scoreToGrade(total);
  const status = scoreToStatus(total);

  return { total, grade, status, components };
}

export function scoreToGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export function scoreToStatus(score) {
  if (score >= TARGET_SCORE) return 'Trusted';
  if (score >= 50) return 'Needs Proof';
  return 'Blocked';
}

/**
 * Determine Go / Conditional Go / No Go from section scores.
 * @param {Array<{status: string, total: number}>} sections
 */
export function calculateGoNoGo(sections) {
  const allTrusted = sections.every((s) => s.status === 'Trusted');
  const anyBlocked = sections.some((s) => s.status === 'Blocked');
  const avgScore = sections.length > 0
    ? sections.reduce((sum, s) => sum + s.total, 0) / sections.length
    : 0;

  if (allTrusted && avgScore >= TARGET_SCORE) return 'go';
  if (anyBlocked) return 'no_go';
  return 'conditional_go';
}

/**
 * Section definitions for the 3 audited areas.
 */
export const AUDIT_SECTIONS = {
  homepage_conversion: {
    key: 'homepage_conversion',
    label: 'Homepage Conversion Path',
    gateKey: 'website_cta_gate',
    description: 'Hero CTAs, routing, event tracking, form submission, and thank-you state.',
  },
  analytics_tracking: {
    key: 'analytics_tracking',
    label: 'Analytics / Tracking / Proof Infrastructure',
    gateKey: 'analytics_gate',
    description: 'ConversionTrackingEvent coverage, page_key coverage, LandingPageAnalytics rebuild, GA4 status.',
  },
  admin_dashboard_truth: {
    key: 'admin_dashboard_truth',
    label: 'Admin Dashboard / Command Center + Dashboard Truth Layer',
    gateKey: 'admin_dashboard_gate',
    description: 'Launch readiness, DashboardTruthCheck visibility, environment filters, remediation actions.',
  },
  offer_pricing_architecture: {
    key: 'offer_pricing_architecture',
    label: 'Offer / Pricing / Package Architecture',
    gateKey: 'offer_pricing_gate',
    description: 'Package consistency, pricing_summary, discount math, funnel_identity, plan mapping.',
  },
  checkout_revenue_flow: {
    key: 'checkout_revenue_flow',
    label: 'Checkout / Revenue Flow',
    gateKey: 'checkout_revenue_gate',
    description: 'Checkout click proof, paid orders, identifiers, subscription links, client links, onboarding handoff.',
  },
  client_onboarding_flow: {
    key: 'client_onboarding_flow',
    label: 'Client Onboarding Flow',
    gateKey: 'onboarding_flow_gate',
    description: 'Onboarding chain validation: SetupAuth, WebsiteScan, Blueprint, Profile, Access, Simulation, Install OS.',
  },
  industry_landing_pages: {
    key: 'industry_landing_pages',
    label: 'Industry Landing Pages',
    gateKey: 'industry_pages_gate',
    description: 'Route, content, CTA, page_view, cta_click, form_submit, LandingPageAnalytics per industry page.',
  },
  brand_positioning: {
    key: 'brand_positioning',
    label: 'Brand Positioning & Offer Clarity',
    gateKey: 'brand_positioning_gate',
    description: 'Homepage headline, subheadline, CTA, target audience clarity, offer clarity, problem clarity, outcome clarity, proof/trust language, unsupported claims, generic AI wording.',
  },
  core_website_pages: {
    key: 'core_website_pages',
    label: 'Core Website Pages',
    gateKey: 'core_website_pages_gate',
    description: 'Route existence, non-blank rendering, primary CTA, tracking events, form proof, thank-you state, legal pages, portal safe entry, error boundary coverage.',
  },
  technical_reliability: {
    key: 'technical_reliability',
    label: 'Technical Reliability / Security / Release Control',
    gateKey: 'technical_reliability_gate',
    description: 'LaunchGate summary, LaunchReadinessState, DashboardTruthCheck, ReconciliationRun, EventQueue health, DeadLetterLog, CommunicationEvent failures, environment/truth unknown counts, route auth, release proof.',
  },
};