/**
 * stampFollowUpAt — sets next_follow_up_at on a lead when status changes.
 *
 * Triggered by entity automation on Leads update:
 *   - Status → "Qualified"  → next_follow_up_at = now + 24h
 *   - Status → "Replied"    → next_follow_up_at = now + 48h
 *
 * Automation payload: { event, data, old_data, changed_fields }
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const leadId = body?.lead_id ?? body?.event?.entity_id ?? body?.data?.id ?? null;
    const leadData = body?.data ?? null;

    if (!leadId) {
      return Response.json({ error: "lead_id is required" }, { status: 400 });
    }

    const lead = leadData?.id === leadId
      ? leadData
      : await base44.asServiceRole.entities.Leads.get(leadId);

    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    let hoursToAdd = null;
    if (lead.status === "Qualified") hoursToAdd = 24;
    else if (lead.status === "Replied") hoursToAdd = 48;

    if (!hoursToAdd) {
      return Response.json({ success: true, skipped: true, reason: `Status ${lead.status} not handled by this function` });
    }

    const followUpAt = new Date(Date.now() + hoursToAdd * 3600000).toISOString();

    await base44.asServiceRole.entities.Leads.update(leadId, {
      next_follow_up_at: followUpAt,
    });

    console.log(`stampFollowUpAt: Lead ${leadId} (${lead.status}) → next_follow_up_at = ${followUpAt}`);

    return Response.json({ success: true, lead_id: leadId, status: lead.status, next_follow_up_at: followUpAt });

  } catch (error) {
    console.error("stampFollowUpAt error:", error);
    return Response.json({ error: error.message || "Failed to stamp follow-up" }, { status: 500 });
  }
});