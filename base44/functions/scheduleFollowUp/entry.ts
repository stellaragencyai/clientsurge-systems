/**
 * scheduleFollowUp — self-contained (no _shared imports)
 * Updates a lead's next_follow_up_at timestamp.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Support both lead_id and leadId param names
    const leadId = body?.lead_id || body?.leadId || body?.event?.entity_id || body?.data?.id;
    const hoursDelay = body?.hoursDelay ?? body?.hours_delay ?? 24;

    if (!leadId) return json({ error: "lead_id required" }, 400);

    const nextFollowUp = new Date(Date.now() + hoursDelay * 60 * 60 * 1000).toISOString();

    await base44.asServiceRole.entities.Leads.update(leadId, {
      next_follow_up_at: nextFollowUp,
    });

    console.log(`[scheduleFollowUp] Lead ${leadId} — next follow-up in ${hoursDelay}h at ${nextFollowUp}`);
    return json({ success: true, lead_id: leadId, next_follow_up_at: nextFollowUp, hours_delay: hoursDelay });
  } catch (error) {
    console.error("[scheduleFollowUp] error:", error.message);
    return json({ error: error.message }, 500);
  }
});