// Revenue Impact Priority labels for Twilio Growth Engine capabilities.
// Admin-only. Used in capability matrix, repair queue, roadmap, and next-action panel.

export const REVENUE_IMPACT = {
  instant_lead_response: { level: "critical", label: "Critical Revenue Impact", color: "#DC2626", bg: "rgba(220,38,38,0.06)", border: "rgba(220,38,38,0.2)" },
  missed_call_text_back: { level: "critical", label: "Critical Revenue Impact", color: "#DC2626", bg: "rgba(220,38,38,0.06)", border: "rgba(220,38,38,0.2)" },
  ai_voice_receptionist: { level: "high", label: "High Revenue Impact", color: "#EA580C", bg: "rgba(234,88,12,0.06)", border: "rgba(234,88,12,0.2)" },
  nurture_sequence_14d: { level: "high", label: "High Revenue Impact", color: "#EA580C", bg: "rgba(234,88,12,0.06)", border: "rgba(234,88,12,0.2)" },
  inbound_sms_assistant: { level: "medium", label: "Medium Revenue Impact", color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)" },
  review_request: { level: "medium", label: "Medium Revenue Impact", color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)" },
  lead_reactivation: { level: "low", label: "Low Until Proven", color: "#6B7280", bg: "rgba(107,114,128,0.06)", border: "rgba(107,114,128,0.2)" },
  voice_broadcasts: { level: "low", label: "Low Until Proven", color: "#6B7280", bg: "rgba(107,114,128,0.06)", border: "rgba(107,114,128,0.2)" },
  ai_booking_agent: { level: "high", label: "High Revenue Impact", color: "#EA580C", bg: "rgba(234,88,12,0.06)", border: "rgba(234,88,12,0.2)" },
  automation_proof_logs: { level: "critical", label: "Critical Revenue Impact", color: "#DC2626", bg: "rgba(220,38,38,0.06)", border: "rgba(220,38,38,0.2)" },
};

const DEFAULT_IMPACT = { level: "low", label: "Low Until Proven", color: "#6B7280", bg: "rgba(107,114,128,0.06)", border: "rgba(107,114,128,0.2)" };

/**
 * Returns revenue impact for a capability key, adjusted by evidence/blockers.
 * If a "low until proven" capability has proof records, it can be elevated to medium.
 * If a "critical" capability is fully blocked with no evidence, it stays critical.
 */
export function getRevenueImpact(capabilityKey, capability) {
  const base = REVENUE_IMPACT[capabilityKey] || DEFAULT_IMPACT;

  // Adjust: if "low until proven" and has proof passes, elevate to medium
  if (base.level === "low" && capability?.proof?.passed > 0) {
    return { ...base, level: "medium", label: "Medium Revenue Impact", color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)" };
  }

  // Adjust: if "medium" and fully proven green, elevate to high
  if (base.level === "medium" && capability?.status === "green") {
    return { ...base, level: "high", label: "High Revenue Impact", color: "#EA580C", bg: "rgba(234,88,12,0.06)", border: "rgba(234,88,12,0.2)" };
  }

  return base;
}