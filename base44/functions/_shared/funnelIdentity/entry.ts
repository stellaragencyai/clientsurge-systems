/**
 * UNIFIED FUNNEL IDENTITY SYSTEM - Shared Helpers
 * Core module for managing customer journey tracking across all touchpoints.
 */

/**
 * Generate a new unique funnel identity ID
 * Format: fid_<timestamp>_<random>
 */
export function generateFunnelIdentityId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `fid_${timestamp}_${random}`;
}

/**
 * Ensure funnel identity is attached to payload
 */
export function ensureFunnelIdentityInPayload(payload, funnelIdentityId) {
  return {
    ...payload,
    funnel_identity_id: funnelIdentityId || generateFunnelIdentityId(),
  };
}

/**
 * Extract funnel identity from lead
 */
export function getFunnelIdentityFromLead(lead) {
  if (!lead) return null;
  return lead.funnel_identity_id || generateFunnelIdentityId();
}

export default {
  generateFunnelIdentityId,
  ensureFunnelIdentityInPayload,
  getFunnelIdentityFromLead,
};