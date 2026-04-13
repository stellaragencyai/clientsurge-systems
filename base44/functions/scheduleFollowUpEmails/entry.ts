import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id } = await req.json();

    if (!lead_id) {
      return Response.json({ error: 'lead_id required' }, { status: 400 });
    }

    // Get lead data
    const lead = await base44.entities.Lead.get(lead_id);
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Schedule 24h follow-up
    const now = new Date();
    const followUp24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    await base44.entities.AutomationJob.create({
      lead_id,
      job_type: 'email_followup_24h',
      trigger_event: 'lead_created',
      status: 'queued',
      scheduled_for: followUp24h.toISOString(),
      attempts: 0,
    });

    // Schedule 3d follow-up
    const followUp3d = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    await base44.entities.AutomationJob.create({
      lead_id,
      job_type: 'email_followup_3d',
      trigger_event: 'lead_created',
      status: 'queued',
      scheduled_for: followUp3d.toISOString(),
      attempts: 0,
    });

    return Response.json({
      success: true,
      message: 'Follow-up emails scheduled',
      follow_ups: [
        { type: '24h', scheduled_for: followUp24h.toISOString() },
        { type: '3d', scheduled_for: followUp3d.toISOString() },
      ],
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});