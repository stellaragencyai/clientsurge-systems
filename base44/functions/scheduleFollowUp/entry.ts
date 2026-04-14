import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { leadId, hoursDelay = 24 } = await req.json();

    if (!leadId) {
      return Response.json({ error: 'Lead ID required' }, { status: 400 });
    }

    // Calculate next follow-up time
    const now = new Date();
    const nextFollowUp = new Date(now.getTime() + hoursDelay * 60 * 60 * 1000);

    // Update lead with follow-up timestamp
    await base44.entities.Leads.update(leadId, {
      next_follow_up_at: nextFollowUp.toISOString(),
    });

    return Response.json({ success: true, nextFollowUp });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});