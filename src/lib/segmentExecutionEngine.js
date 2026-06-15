/**
 * SEGMENT-BASED REVENUE EXECUTION ENGINE
 * Routes leads into automated pipelines based on HOT/WARM/COLD classification
 */

import { scoreLeadSegmentation, SEGMENT_TIERS } from './leadSegmentation.js';

/**
 * HOT lead execution parameters (80–100 intent)
 * High-urgency, immediate revenue focus
 */
export const HOT_EXECUTION_CONFIG = {
  segment: 'HOT',
  revenue_priority: 'highest',
  priority_score_base: 85,
  actions: [
    {
      type: 'instant_sms',
      timing: 'immediate', // Send within 2 minutes
      template: 'hot_lead_booking_prompt',
      content_type: 'high_intent_cta',
    },
    {
      type: 'booking_link_sms',
      timing: 'immediate', // Send within 5 minutes
      template: 'hot_lead_booking_link',
      content_type: 'direct_action',
    },
    {
      type: 'followup_sms',
      timing: 'same_day', // 2–4 hours later
      template: 'hot_lead_followup_value',
      content_type: 'social_proof',
    },
    {
      type: 'email_followup',
      timing: 'next_morning', // 6–8 AM next day
      template: 'hot_lead_email_proposal',
      content_type: 'detailed_offer',
    },
  ],
  frequency_cap: 'high', // Up to 2–3 messages per day
  automation_cadence: 'aggressive', // Fast-track through automation
  escalation_enabled: true,
  ai_agent_routing: 'priority_agent',
};

/**
 * WARM lead execution parameters (50–79 intent)
 * Moderate nurture, engagement-driven
 */
export const WARM_EXECUTION_CONFIG = {
  segment: 'WARM',
  revenue_priority: 'moderate',
  priority_score_base: 65,
  actions: [
    {
      type: 'welcome_sms',
      timing: '2_hours', // 2 hours after capture
      template: 'warm_lead_welcome',
      content_type: 'relationship_building',
    },
    {
      type: 'value_email',
      timing: '6_hours', // 6 hours after capture
      template: 'warm_lead_educational',
      content_type: 'thought_leadership',
    },
    {
      type: 'engagement_sms',
      timing: 'day_2', // Day 2
      template: 'warm_lead_engagement_check',
      content_type: 'engagement_signal',
    },
    {
      type: 'booking_prompt_sms',
      timing: 'day_3', // Day 3, after engagement
      template: 'warm_lead_booking_gentle',
      content_type: 'soft_cta',
    },
    {
      type: 'nurture_email_sequence',
      timing: 'days_4_7', // Days 4–7
      template: 'warm_lead_nurture_series',
      content_type: 'multi_part_education',
    },
  ],
  frequency_cap: 'moderate', // Max 1 message per day
  automation_cadence: 'standard', // Normal processing speed
  escalation_enabled: false,
  ai_agent_routing: 'standard_agent',
};

/**
 * COLD lead execution parameters (0–49 intent)
 * Long-term reactivation, low-frequency
 */
export const COLD_EXECUTION_CONFIG = {
  segment: 'COLD',
  revenue_priority: 'low',
  priority_score_base: 30,
  actions: [
    {
      type: 'delay_then_sms',
      timing: 'day_7', // Delayed 7 days
      template: 'cold_lead_reactivation_sms',
      content_type: 'value_proposition',
    },
    {
      type: 'educational_email',
      timing: 'day_10', // Day 10
      template: 'cold_lead_educational_email',
      content_type: 'case_study',
    },
    {
      type: 're_engagement_sms',
      timing: 'day_14', // Day 14
      template: 'cold_lead_soft_reengagement',
      content_type: 'interest_check',
    },
    {
      type: 'win_back_email',
      timing: 'day_21', // Day 21
      template: 'cold_lead_special_offer',
      content_type: 'limited_time_incentive',
    },
  ],
  frequency_cap: 'low', // Max 1 message per week
  automation_cadence: 'low_priority', // Batch processing during off-peak
  escalation_enabled: false,
  ai_agent_routing: 'none', // Standard CRM rules only
};

/**
 * Get execution config by segment
 */
export function getExecutionConfig(segmentLabel) {
  switch (segmentLabel) {
    case 'HOT':
      return HOT_EXECUTION_CONFIG;
    case 'WARM':
      return WARM_EXECUTION_CONFIG;
    case 'COLD':
      return COLD_EXECUTION_CONFIG;
    default:
      return WARM_EXECUTION_CONFIG; // Default to WARM
  }
}

/**
 * Calculate revenue execution priority score
 * Used for job queue ordering across all systems
 * Range: 0–100, where 100 = highest priority
 */
export function calculateRevenueExecutionPriorityScore(lead) {
  const segmentation = scoreLeadSegmentation(lead);
  const baseScore = getExecutionConfig(segmentation.segment_label).priority_score_base;

  // Boost for engagement signals
  let engagement_boost = 0;
  if (lead.status === 'Replied') engagement_boost = 10;
  if (lead.status === 'Booked') engagement_boost = 20;

  // Boost for high-value industries
  const highValueIndustries = ['dental', 'real-estate', 'med-spa'];
  let industry_boost = 0;
  if (highValueIndustries.includes(lead.industry?.toLowerCase())) {
    industry_boost = 8;
  }

  // Recency bonus (recent interactions prioritized)
  let recency_boost = 0;
  if (segmentation.recency_score > 80) recency_boost = 5;
  if (segmentation.recency_score > 60) recency_boost = 3;

  const finalScore = Math.min(100, baseScore + engagement_boost + industry_boost + recency_boost);
  return Math.round(finalScore);
}

/**
 * Determine next immediate action for a lead
 * Returns the first action to execute based on segment
 */
export function getNextExecutionAction(lead) {
  const segmentation = scoreLeadSegmentation(lead);
  const config = getExecutionConfig(segmentation.segment_label);

  // Return first action in the sequence
  if (config.actions.length === 0) return null;

  return {
    segment: segmentation.segment_label,
    lead_id: lead.id,
    action: config.actions[0],
    priority_score: calculateRevenueExecutionPriorityScore(lead),
    revenue_priority: config.revenue_priority,
    ai_routing: config.ai_agent_routing,
  };
}

/**
 * Determine all actions needed for a lead (full automation sequence)
 */
export function getFullExecutionSequence(lead) {
  const segmentation = scoreLeadSegmentation(lead);
  const config = getExecutionConfig(segmentation.segment_label);

  return {
    lead_id: lead.id,
    segment_label: segmentation.segment_label,
    priority_score: calculateRevenueExecutionPriorityScore(lead),
    revenue_priority: config.revenue_priority,
    frequency_cap: config.frequency_cap,
    automation_cadence: config.automation_cadence,
    actions_sequence: config.actions.map((action, index) => ({
      step: index + 1,
      ...action,
      lead_id: lead.id,
    })),
    escalation_enabled: config.escalation_enabled,
    ai_agent_routing: config.ai_agent_routing,
  };
}

/**
 * Automation Job priority queue comparator
 * Used to sort jobs: HOT > WARM > COLD
 */
export function compareAutomationJobPriority(jobA, jobB) {
  // Primary: by revenue_execution_priority_score (descending)
  if (jobA.priority_score !== jobB.priority_score) {
    return jobB.priority_score - jobA.priority_score;
  }

  // Secondary: by segment tier
  const segmentOrder = { HOT: 1, WARM: 2, COLD: 3 };
  const segmentPriorityA = segmentOrder[jobA.segment_label] || 999;
  const segmentPriorityB = segmentOrder[jobB.segment_label] || 999;
  if (segmentPriorityA !== segmentPriorityB) {
    return segmentPriorityA - segmentPriorityB;
  }

  // Tertiary: by creation time (older jobs first)
  return new Date(jobA.created_at) - new Date(jobB.created_at);
}

/**
 * Filter leads by segment for batch processing
 */
export function filterLeadsBySegment(leads, segment) {
  return leads.filter(lead => {
    const segmentation = scoreLeadSegmentation(lead);
    return segmentation.segment_label === segment;
  });
}

/**
 * Get execution cadence settings per segment
 */
export function getExecutionCadenceSettings(segment) {
  const config = getExecutionConfig(segment);

  return {
    segment,
    frequency_cap: config.frequency_cap,
    cadence: config.automation_cadence,
    max_messages_per_day: {
      HOT: 3,
      WARM: 1,
      COLD: 1,
    }[segment],
    batch_processing_schedule: {
      HOT: 'real-time',
      WARM: 'every_2_hours',
      COLD: 'daily_off_peak',
    }[segment],
  };
}

export default {
  HOT_EXECUTION_CONFIG,
  WARM_EXECUTION_CONFIG,
  COLD_EXECUTION_CONFIG,
  getExecutionConfig,
  calculateRevenueExecutionPriorityScore,
  getNextExecutionAction,
  getFullExecutionSequence,
  compareAutomationJobPriority,
  filterLeadsBySegment,
  getExecutionCadenceSettings,
};