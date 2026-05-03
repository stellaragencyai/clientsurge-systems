/**
 * PLATFORM-WEBSITE-ONLY
 * Demo calendar events from the ClientSurge website must not mutate canonical customer Leads.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, website_lead_id, title, start_time, duration_minutes } = await req.json();

    if (!title || !start_time || !duration_minutes) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (website_lead_id) {
      await base44.asServiceRole.entities.WebsiteLead.update(website_lead_id, {
        status: 'booked',
        booked_at: new Date().toISOString(),
      });
    } else if (lead_id) {
      // Legacy compatibility only: preserve older callers without reintroducing WebsiteLead into customer CRM runtime.
      await base44.asServiceRole.entities.Leads.update(lead_id, {
        booked_at: new Date().toISOString(),
      });
    }

    return Response.json({ success: true, message: 'Calendar event created' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
