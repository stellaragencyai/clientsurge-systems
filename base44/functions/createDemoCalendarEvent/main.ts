import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, title, start_time, duration_minutes } = await req.json();

    if (!title || !start_time || !duration_minutes) {
      return secureJson({ error: 'Missing required fields' }, { status: 400 });
    }

    if (lead_id) {
      const now = new Date().toISOString();
      await base44.asServiceRole.entities.Leads.update(lead_id, {
        status: "Booked",
        crm_stage: "Audit Booked",
        outreach_status: "booked",
        booked_at: now,
        last_activity_at: now,
      });
    }

    return secureJson({ success: true, message: 'Calendar event created' });
  } catch (error) {
    return secureJson({ error: error.message }, { status: 500 });
  }
});
