/**
 * UNIFIED FUNNEL IDENTITY SYSTEM - Client-Side Helpers
 * Core utilities for managing customer journey tracking
 */

export function generateFunnelIdentityId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `fid_${timestamp}_${random}`;
}

export function ensureFunnelIdentityInPayload(payload, funnelIdentityId) {
  return {
    ...payload,
    funnel_identity_id: funnelIdentityId || generateFunnelIdentityId(),
  };
}

export function getFunnelIdentityFromLead(lead) {
  if (!lead) return null;
  return lead.funnel_identity_id || generateFunnelIdentityId();
}

export async function reconstructFunnelJourney(base44, funnelIdentityId, clientProjectId) {
  const journey = {
    funnel_identity_id: funnelIdentityId,
    milestones: [],
    summary: {
      total_messages: 0,
      total_events: 0,
      has_order: false,
    },
  };

  try {
    // Fetch leads with this funnel identity
    const leads = await base44.entities.Leads.filter({ funnel_identity_id: funnelIdentityId });

    if (leads.length > 0) {
      const lead = leads[0];
      journey.milestones.push({
        timestamp: lead.created_date,
        type: 'lead_created',
        data: { lead_id: lead.id, source: lead.source, source_page: lead.source_page },
      });

      // Fetch messages
      const messages = await base44.entities.Messages.filter({ funnel_identity_id: funnelIdentityId });
      journey.summary.total_messages = messages.length;
      messages.forEach(msg => {
        journey.milestones.push({
          timestamp: msg.created_date,
          type: 'message',
          data: { direction: msg.direction, channel: msg.channel, status: msg.status },
        });
      });

      // Fetch orders
      const orders = await base44.entities.Order.filter({ funnel_identity_id: funnelIdentityId });
      if (orders.length > 0) {
        journey.summary.has_order = true;
        const order = orders[0];
        journey.milestones.push({
          timestamp: order.created_date,
          type: 'order_created',
          data: { order_id: order.id, total_setup: order.total_setup, payment_status: order.payment_status },
        });
      }
    }

    // Sort milestones chronologically
    journey.milestones.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    return journey;
  } catch (error) {
    console.error('Failed to reconstruct funnel journey:', error);
    return journey;
  }
}

export async function getAttributionSummary(base44, funnelIdentityId) {
  try {
    const leads = await base44.entities.Leads.filter({ funnel_identity_id: funnelIdentityId });
    if (leads.length === 0) return null;

    const lead = leads[0];
    const orders = await base44.entities.Order.filter({ funnel_identity_id: funnelIdentityId });

    return {
      funnel_identity_id: funnelIdentityId,
      lead_id: lead.id,
      first_touch: {
        source: lead.source,
        source_page: lead.source_page,
        utm_source: lead.utm_source,
        created_at: lead.created_date,
      },
      conversion: orders.length > 0 ? {
        order_id: orders[0].id,
        converted_at: orders[0].created_date,
        total_revenue: (orders[0].total_setup || 0) + (orders[0].total_monthly || 0),
      } : null,
      journey_days: orders.length > 0
        ? Math.floor((new Date(orders[0].created_date) - new Date(lead.created_date)) / (1000 * 60 * 60 * 24))
        : null,
    };
  } catch (error) {
    console.error('Failed to get attribution summary:', error);
    return null;
  }
}

export default {
  generateFunnelIdentityId,
  ensureFunnelIdentityInPayload,
  getFunnelIdentityFromLead,
  reconstructFunnelJourney,
  getAttributionSummary,
};