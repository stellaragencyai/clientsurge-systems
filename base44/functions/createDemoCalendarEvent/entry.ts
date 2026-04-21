import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, title, start_time, duration_minutes } = await req.json();

    if (!title || !start_time || !duration_minutes) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (lead_id) {
      await base44.asServiceRole.entities.Leads.update(lead_id, {
        booked_at: new Date().toISOString(),
      });
    }

    return Response.json({ success: true, message: 'Calendar event created' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
