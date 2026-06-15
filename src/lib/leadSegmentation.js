/**
 * LEAD SEGMENTATION SYSTEM
 * Calculates segment labels and scoring for lead prioritization
 */

/**
 * Industry weight mapping for urgency/value
 */
export const INDUSTRY_WEIGHT_MAP = {
  'hvac': { urgency: 'high', value: 'medium', label: 'HVAC' },
  'roofing': { urgency: 'high', value: 'high', label: 'Roofing' },
  'dental': { urgency: 'medium', value: 'high', label: 'Dental' },
  'chiropractic': { urgency: 'medium', value: 'medium', label: 'Chiropractic' },
  'med-spa': { urgency: 'medium', value: 'high', label: 'Med Spa' },
  'plumbing': { urgency: 'high', value: 'medium', label: 'Plumbing' },
  'contractors': { urgency: 'high', value: 'medium', label: 'Contractors' },
  'real-estate': { urgency: 'medium', value: 'high', label: 'Real Estate' },
};

/**
 * Segment labels based on overall score
 */
export const SEGMENT_TIERS = {
  HOT: { min: 80, max: 100, label: 'HOT', color: '#ef4444', priority: 1 },
  WARM: { min: 50, max: 79, label: 'WARM', color: '#f97316', priority: 2 },
  COLD: { min: 0, max: 49, label: 'COLD', color: '#6b7280', priority: 3 },
};

/**
 * Calculate segment label from overall score
 * HOT (80–100), WARM (50–79), COLD (0–49)
 */
export function calculateSegmentLabel(overallScore) {
  if (overallScore >= SEGMENT_TIERS.HOT.min) return SEGMENT_TIERS.HOT.label;
  if (overallScore >= SEGMENT_TIERS.WARM.min) return SEGMENT_TIERS.WARM.label;
  return SEGMENT_TIERS.COLD.label;
}

/**
 * Get segment tier details (color, priority, etc.)
 */
export function getSegmentTier(segmentLabel) {
  return Object.values(SEGMENT_TIERS).find(t => t.label === segmentLabel) || SEGMENT_TIERS.COLD;
}

/**
 * Calculate recency score based on last activity date
 * Returns 0–100 score where 100 = today, 0 = >90 days ago
 */
export function calculateRecencyScore(lastActivityDate) {
  if (!lastActivityDate) return 0;

  const now = new Date();
  const lastActivity = new Date(lastActivityDate);
  const daysSinceActivity = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));

  // Linear decay: 100 at day 0, 0 at day 90+
  const maxDays = 90;
  const recencyScore = Math.max(0, 100 - (daysSinceActivity / maxDays) * 100);
  return Math.round(recencyScore);
}

/**
 * Calculate intent score based on AI classification
 * Returns 0–100 score
 */
export function calculateIntentScore(aiIntent, replied = false, booked = false) {
  let score = 0;

  // Base intent mapping
  const intentMap = {
    booking_ready: 90,
    pricing_interest: 75,
    availability_interest: 70,
    question: 50,
    unsure: 30,
    not_interested: 10,
    stop: 0,
    other: 20,
  };

  score = intentMap[aiIntent] || 20;

  // Boost if replied
  if (replied) score = Math.min(100, score + 15);

  // Max boost if booked
  if (booked) score = 100;

  return Math.round(score);
}

/**
 * Calculate industry weight multiplier
 * Applied to overall score calculation
 */
export function getIndustryWeightMultiplier(industry) {
  const weight = INDUSTRY_WEIGHT_MAP[industry?.toLowerCase()] || null;
  if (!weight) return 1.0; // Default neutral weight

  // Urgency + Value combined multiplier
  const urgencyBoost = weight.urgency === 'high' ? 1.15 : 1.0;
  const valueBoost = weight.value === 'high' ? 1.1 : 1.0;

  return Math.min(1.25, urgencyBoost * valueBoost); // Cap at 1.25
}

/**
 * Calculate overall segment score
 * Combines intent_score, recency_score, and industry weighting
 */
export function calculateOverallScore(intentScore, recencyScore, industry) {
  const baseScore = (intentScore * 0.6 + recencyScore * 0.4); // Intent weighted heavier
  const multiplier = getIndustryWeightMultiplier(industry);
  const finalScore = baseScore * multiplier;

  return Math.round(Math.min(100, finalScore)); // Cap at 100
}

/**
 * Comprehensive lead scoring function
 * Takes lead data and returns segmentation object
 */
export function scoreLeadSegmentation(lead) {
  const intentScore = calculateIntentScore(
    lead.ai_intent || 'other',
    lead.status === 'Replied',
    lead.status === 'Booked'
  );

  const recencyScore = calculateRecencyScore(
    lead.last_activity_at || lead.last_contacted_at || lead.created_date
  );

  const overallScore = calculateOverallScore(
    intentScore,
    recencyScore,
    lead.industry || lead.business_type
  );

  const segmentLabel = calculateSegmentLabel(overallScore);

  return {
    intent_score: intentScore,
    recency_score: recencyScore,
    overall_score: overallScore,
    segment_label: segmentLabel,
    segment_tier: getSegmentTier(segmentLabel),
    industry_weight: INDUSTRY_WEIGHT_MAP[lead.industry?.toLowerCase()] || null,
  };
}

/**
 * Batch score multiple leads
 */
export async function batchScoreLeads(leads) {
  return leads.map(lead => ({
    ...lead,
    ...scoreLeadSegmentation(lead),
  }));
}

export default {
  INDUSTRY_WEIGHT_MAP,
  SEGMENT_TIERS,
  calculateSegmentLabel,
  getSegmentTier,
  calculateRecencyScore,
  calculateIntentScore,
  getIndustryWeightMultiplier,
  calculateOverallScore,
  scoreLeadSegmentation,
  batchScoreLeads,
};