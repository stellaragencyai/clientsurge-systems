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

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await resolveClientPortalAccess({
      base44,
      userEmail: user.email,
    });
    if (access.status === 'ambiguous') {
      return Response.json({ error: 'Multiple client portal projects matched this account.' }, { status: 409 });
    }
    if (access.status !== 'resolved' || !access.project) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const leads = await base44.asServiceRole.entities.Leads.filter(
      { client_project_id: access.project.id },
      '-created_date',
      MAX_LEADS
    );

    if (!leads) {
      return Response.json({ active_leads: 0, appointments_booked: 0, missed_calls_recovered: 0 });
    }

    const activeLeads = leads.filter(
      (lead) => !['Booked', 'Closed'].includes(lead.status)
    );

    const appointmentsBooked = leads.filter(
      (lead) => lead.status === 'Booked'
    );

    const missedCallEventQuery = access.order?.id
      ? { order_id: access.order.id, service_key: 'missed_call_text_back', event_type: 'provider_send_succeeded' }
      : { client_project_id: access.project.id, service_key: 'missed_call_text_back', event_type: 'provider_send_succeeded' };
    const missedCallEvents = await base44.asServiceRole.entities.CommunicationEvent.filter(
      missedCallEventQuery,
      '-created_date',
      MAX_EVENTS
    );
    const sevenDaysAgo = Date.now() - 7 * 86400000;
    const missedCallsRecovered = (missedCallEvents || []).filter((event) => {
      const createdAt = new Date(event.created_date || 0).getTime();
      if (!Number.isFinite(createdAt) || createdAt < sevenDaysAgo) {
        return false;
      }
      if (access.order?.id) {
        return event.order_id === access.order.id;
      }
      return event.client_project_id === access.project.id;
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
    console.error('Error fetching metrics:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
