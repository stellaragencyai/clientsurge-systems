import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all leads created by or assigned to this user
    const leads = await base44.entities.Leads.list('-created_date', 1000);

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

    // Count missed calls recovered - proxy: leads with status "Contacted" or "Replied" that are recent
    const missedCallsRecovered = leads.filter(
      (lead) =>
        (lead.status === 'Contacted' || lead.status === 'Replied') &&
        lead.last_contacted_at &&
        (Date.now() - new Date(lead.last_contacted_at).getTime()) < 7 * 86400000 // last 7 days
    ).length;

    return Response.json({
      active_leads: activeLeads.length,
      appointments_booked: appointmentsBooked.length,
      missed_calls_recovered: missedCallsRecovered,
      last_updated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});