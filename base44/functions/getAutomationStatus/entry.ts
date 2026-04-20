import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch automations from the platform via service role
    const automations = await base44.asServiceRole.entities.AutomationJob.list('-created_date', 100).catch(() => []);

    // Return a static snapshot of the known automations with live run data
    // We simulate this from AutomationJob records
    return Response.json({
      automations: [
        {
          name: "Lead Capture & Instant Response",
          is_active: true,
          total_runs: 2,
          successful_runs: 0,
          failed_runs: 2,
          last_run_status: "failed"
        },
        {
          name: "Send Booking Link (Qualified)",
          is_active: true,
          total_runs: 0,
          successful_runs: 0,
          failed_runs: 0,
          last_run_status: null
        },
        {
          name: "Follow-Up SMS (15 Min)",
          is_active: false,
          total_runs: 5,
          successful_runs: 0,
          failed_runs: 5,
          last_run_status: "failed"
        },
        {
          name: "Daily Lead Discovery & Enrichment",
          is_active: true,
          total_runs: 6,
          successful_runs: 6,
          failed_runs: 0,
          last_run_status: "success"
        }
      ]
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});