/**
 * Seasonal ROI Multipliers
 * Fixes Audit Issue #12: ROI calculator ignores seasonal fluctuations
 *
 * Provides industry-specific seasonal multipliers for ticket value
 * and inquiry volume based on the current month.
 */

// Month index: 0=Jan, 1=Feb, ..., 11=Dec
const SEASONAL_MULTIPLIERS = {
  roofing: {
    // Peak: storm season (Jun-Sep), low: winter (Dec-Feb)
    ticket:  [0.7, 0.7, 0.8, 0.9, 1.1, 1.3, 1.4, 1.4, 1.2, 1.0, 0.8, 0.7],
    inquiry: [0.5, 0.6, 0.8, 1.0, 1.2, 1.5, 1.6, 1.5, 1.3, 1.0, 0.7, 0.5],
  },
  hvac: {
    // Peak: summer cooling (Jun-Aug), winter heating (Dec-Feb)
    ticket:  [1.2, 1.2, 1.0, 0.9, 1.0, 1.3, 1.4, 1.4, 1.1, 0.9, 1.0, 1.2],
    inquiry: [1.3, 1.2, 0.9, 0.8, 0.9, 1.4, 1.6, 1.5, 1.0, 0.8, 0.9, 1.3],
  },
  dental: {
    // Fairly consistent, slight peak at year-end (insurance deadline)
    ticket:  [0.9, 0.9, 1.0, 1.0, 1.0, 1.0, 0.95, 0.95, 1.0, 1.05, 1.1, 1.15],
    inquiry: [0.9, 0.9, 1.0, 1.0, 1.0, 0.95, 0.9, 0.9, 1.0, 1.05, 1.15, 1.2],
  },
  plumbing: {
    // Peak: winter pipe issues (Dec-Feb)
    ticket:  [1.3, 1.3, 1.1, 0.9, 0.9, 0.9, 0.9, 0.9, 0.95, 1.0, 1.1, 1.3],
    inquiry: [1.4, 1.3, 1.1, 0.9, 0.85, 0.85, 0.85, 0.85, 0.9, 1.0, 1.15, 1.4],
  },
  med_spa: {
    // Peak: pre-summer (Mar-May) and pre-holiday (Oct-Nov)
    ticket:  [0.9, 0.95, 1.1, 1.2, 1.2, 1.1, 1.0, 0.95, 1.0, 1.15, 1.2, 1.1],
    inquiry: [0.85, 0.9, 1.1, 1.25, 1.2, 1.05, 0.95, 0.9, 1.0, 1.2, 1.25, 1.1],
  },
  chiropractic: {
    // Peak: post-holiday (Jan) and summer activity (Jul-Aug)
    ticket:  [1.1, 1.0, 0.95, 0.9, 0.95, 1.0, 1.1, 1.1, 1.0, 0.95, 0.95, 1.0],
    inquiry: [1.3, 1.1, 0.95, 0.9, 0.95, 1.0, 1.15, 1.1, 1.0, 0.95, 1.0, 1.1],
  },
  contractors: {
    // Peak: summer construction (May-Sep)
    ticket:  [0.7, 0.75, 0.85, 0.95, 1.1, 1.2, 1.25, 1.25, 1.15, 1.0, 0.85, 0.7],
    inquiry: [0.6, 0.7, 0.85, 1.0, 1.2, 1.35, 1.4, 1.35, 1.2, 1.0, 0.8, 0.65],
  },
  default: {
    ticket:  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    inquiry: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  },
};

/**
 * Get the seasonal multiplier for an industry.
 * @param {string} industrySlug - Industry identifier (e.g., "roofing", "hvac")
 * @param {"ticket"|"inquiry"} type - Which multiplier to get
 * @returns {number} - Multiplier (1.0 = average)
 */
export function getSeasonalMultiplier(industrySlug, type = "ticket") {
  const key = (industrySlug || "default").replace(/[-\s]/g, "_").toLowerCase();
  const multipliers = SEASONAL_MULTIPLIERS[key] || SEASONAL_MULTIPLIERS.default;
  const month = new Date().getMonth();
  return multipliers[type]?.[month] || 1;
}

/**
 * Apply seasonal adjustment to ROI calculation.
 * @param {number} baseTicketValue
 * @param {number} baseInquiries
 * @param {string} industrySlug
 * @returns {{ adjustedTicket: number, adjustedInquiries: number }}
 */
export function applySeasonalAdjustment(baseTicketValue, baseInquiries, industrySlug) {
  return {
    adjustedTicket: Math.round(baseTicketValue * getSeasonalMultiplier(industrySlug, "ticket")),
    adjustedInquiries: Math.round(baseInquiries * getSeasonalMultiplier(industrySlug, "inquiry")),
  };
}