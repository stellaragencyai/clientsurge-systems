/**
 * TENANT QUERY HELPERS
 * 
 * Utilities for filtering entities by tenant context.
 * All entity queries should use these helpers to ensure proper isolation.
 * 
 * System of Truth: client_id + client_project_id = tenant boundary
 */

import { base44 } from '@/api/base44Client';

/**
 * Filter Leads by tenant context
 * @param {Object} tenantFilter - { client_id?, client_project_id? }
 * @param {string} sortBy - e.g., '-created_date'
 * @param {number} limit - max results
 */
export async function getTenantLeads(tenantFilter, sortBy = '-created_date', limit = 100) {
  try {
    if (Object.keys(tenantFilter).length === 0) {
      // No tenant filter = admin global view
      return await base44.entities.Leads.list(sortBy, limit);
    }
    return await base44.entities.Leads.filter(tenantFilter, sortBy, limit);
  } catch (err) {
    console.error('getTenantLeads error:', err);
    return [];
  }
}

/**
 * Filter CommunicationEvent by tenant context
 */
export async function getTenantCommunicationEvents(tenantFilter, sortBy = '-created_date', limit = 100) {
  try {
    if (Object.keys(tenantFilter).length === 0) {
      return await base44.entities.CommunicationEvent.list(sortBy, limit);
    }
    return await base44.entities.CommunicationEvent.filter(tenantFilter, sortBy, limit);
  } catch (err) {
    console.error('getTenantCommunicationEvents error:', err);
    return [];
  }
}

/**
 * Filter Messages by tenant context
 */
export async function getTenantMessages(tenantFilter, sortBy = '-created_date', limit = 100) {
  try {
    if (Object.keys(tenantFilter).length === 0) {
      return await base44.entities.Messages.list(sortBy, limit);
    }
    return await base44.entities.Messages.filter(tenantFilter, sortBy, limit);
  } catch (err) {
    console.error('getTenantMessages error:', err);
    return [];
  }
}

/**
 * Filter ConversationThread by tenant context
 */
export async function getTenantConversationThreads(tenantFilter, sortBy = '-last_message_at', limit = 100) {
  try {
    if (Object.keys(tenantFilter).length === 0) {
      return await base44.entities.ConversationThread.list(sortBy, limit);
    }
    return await base44.entities.ConversationThread.filter(tenantFilter, sortBy, limit);
  } catch (err) {
    console.error('getTenantConversationThreads error:', err);
    return [];
  }
}

/**
 * Filter Orders by tenant context
 */
export async function getTenantOrders(tenantFilter, sortBy = '-created_date', limit = 100) {
  try {
    if (Object.keys(tenantFilter).length === 0) {
      return await base44.entities.Order.list(sortBy, limit);
    }
    return await base44.entities.Order.filter(tenantFilter, sortBy, limit);
  } catch (err) {
    console.error('getTenantOrders error:', err);
    return [];
  }
}

/**
 * Get aggregated metrics for a tenant
 */
export async function getTenantMetrics(tenantFilter) {
  try {
    const [leads, events, orders] = await Promise.all([
      getTenantLeads(tenantFilter, '-created_date', 500),
      getTenantCommunicationEvents(tenantFilter, '-created_date', 500),
      getTenantOrders(tenantFilter, '-created_date', 100),
    ]);

    return {
      totalLeads: leads?.length || 0,
      totalEvents: events?.length || 0,
      totalOrders: orders?.length || 0,
      respondedLeads: leads?.filter(l => l.outreach_status === 'replied')?.length || 0,
      bookedLeads: leads?.filter(l => l.outreach_status === 'booked')?.length || 0,
      totalOrderValue: orders?.reduce((sum, o) => sum + (o.total_setup || 0) + (o.total_monthly || 0), 0) || 0,
    };
  } catch (err) {
    console.error('getTenantMetrics error:', err);
    return {};
  }
}

/**
 * Get ClientProject with full context
 */
export async function getTenantProject(projectId) {
  try {
    return await base44.entities.ClientProject.get(projectId);
  } catch (err) {
    console.error('getTenantProject error:', err);
    return null;
  }
}

/**
 * Get Client with full context
 */
export async function getTenantClient(clientId) {
  try {
    return await base44.entities.Client.get(clientId);
  } catch (err) {
    console.error('getTenantClient error:', err);
    return null;
  }
}