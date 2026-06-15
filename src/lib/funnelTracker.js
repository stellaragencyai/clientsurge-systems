/**
 * Task 41 — Funnel identity tracking audit helper
 * Validates funnel_identity_id persistence through the lead-to-order flow
 */

export function generateFunnelId() {
  return `fid_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function assertFunnelId(entity, entityName = 'entity') {
  if (!entity?.funnel_identity_id) {
    console.warn(`[FunnelTracker] Missing funnel_identity_id on ${entityName}:`, entity?.id);
    return false;
  }
  return true;
}

export function inheritFunnelId(source, target) {
  if (source?.funnel_identity_id && !target?.funnel_identity_id) {
    return { ...target, funnel_identity_id: source.funnel_identity_id };
  }
  return target;
}

export function buildFunnelAuditEntry({ leadId, orderId, funnelId, stage }) {
  return {
    funnel_identity_id: funnelId,
    lead_id: leadId,
    order_id: orderId,
    stage,
    checked_at: new Date().toISOString(),
  };
}