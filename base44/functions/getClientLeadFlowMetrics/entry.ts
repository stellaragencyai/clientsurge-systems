import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { resolveClientPortalAccess } from "../_shared/portalOwnership.js";

const MAX_LEADS = 5000;
const MAX_EVENTS = 5000;

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    let access = null;

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      access = await resolveClientPortalAccess({
        base44,
        userEmail: user.email,
      });
      if (access.status !== 'resolved') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Fetch all leads created by or assigned to this user
    const leads = await base44.asServiceRole.entities.Leads.list('-created_date', MAX_LEADS);

    if (!leads) {
      return Response.json({ active_leads: 0, appointments_booked: 0, missed_calls_recovered: 0 });
    }

    // Filter leads - for now, show all leads (not filtered by user since we don't have user assignment)
    const activeLeads = leads.filter(
      (lead) => !['Booked', 'Closed'].includes(lead.status)
    );

    const appointmentsBooked = leads.filter(
      (lead) => lead.status === 'Booked'
    );

    const missedCallEvents = await base44.asServiceRole.entities.CommunicationEvent.filter(
      { service_key: 'missed_call_text_back', event_type: 'provider_send_succeeded' },
      '-created_date',
      MAX_EVENTS
    );
    const sevenDaysAgo = Date.now() - 7 * 86400000;
    const missedCallsRecovered = (missedCallEvents || []).filter((event) => {
      const createdAt = new Date(event.created_date || 0).getTime();
      if (!Number.isFinite(createdAt) || createdAt < sevenDaysAgo) {
        return false;
      }
      if (user.role === 'admin') {
        return true;
      }
      return !!(access?.order?.id && event.order_id === access.order.id);
    }).length;

    return Response.json({
      active_leads: activeLeads.length,
      appointments_booked: appointmentsBooked.length,
      missed_calls_recovered: missedCallsRecovered,
      last_updated: new Date().toISOString(),
      data_window: {
        lead_limit: MAX_LEADS,
        event_limit: MAX_EVENTS,
        leads_truncated: leads.length >= MAX_LEADS,
        missed_call_events_truncated: (missedCallEvents || []).length >= MAX_EVENTS,
      },
    });
  } catch (error) {
    console.error('[getClientLeadFlowMetrics] Error fetching metrics:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
