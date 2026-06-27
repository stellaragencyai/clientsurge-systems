import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

/**
 * scheduleFollowUpEmails — legacy endpoint, redirects to scheduleFollowUp.
 * Maintained for backward compatibility with existing automations.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, follow_up_date } = await req.json().catch(() => ({}));

    if (!lead_id) {
      return Response.json({ error: "lead_id required" }, { status: 400 });
    }

    const updateData = {};
    if (follow_up_date) {
      updateData.next_follow_up_at = follow_up_date;
      updateData.follow_up_date = follow_up_date;
    } else {
      const now = new Date();
      now.setHours(now.getHours() + 24);
      updateData.next_follow_up_at = now.toISOString();
      updateData.follow_up_date = now.toISOString();
    }

    await base44.asServiceRole.entities.Leads.update(lead_id, updateData).catch(() => {});

    return Response.json({
      success: true,
      lead_id,
      next_follow_up_at: updateData.next_follow_up_at,
      message: "Follow-up scheduled (legacy endpoint — use scheduleFollowUp for new automations)",
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});