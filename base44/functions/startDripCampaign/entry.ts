/**
 * startDripCampaign — enrolls a lead into the drip campaign.
 *
 * Called automatically by entity automation when a lead's status
 * changes to "Contacted", or manually by admin.
 *
 * Payload (automation): { event, data, old_data }
 * Payload (direct):     { lead_id }
 *
 * Guards:
 *  - Won't enroll if lead is already Qualified, Booked, or Closed
 *  - Won't create a duplicate active campaign for the same lead
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const SKIP_STATUSES = ["Qualified", "Booking Prompt Sent", "Booked", "Closed"];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Support automation payload shape AND direct call
    const leadId = body?.lead_id ?? body?.event?.entity_id ?? body?.data?.id ?? null;
    const leadData = body?.data ?? null; // may be pre-loaded from automation

    if (!leadId) {
      return Response.json({ error: "lead_id is required" }, { status: 400 });
    }

    // Load lead (use pre-loaded data if available to save a call)
    const lead = leadData?.id === leadId ? leadData : await base44.asServiceRole.entities.Leads.get(leadId);
    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    // Guard: skip if already at a terminal/qualified status
    if (SKIP_STATUSES.includes(lead.status)) {
      console.log(`[startDripCampaign] startDripCampaign: Lead ${leadId} is ${lead.status} — skipping enrollment.`);
      return Response.json({ success: true, skipped: true, reason: `Lead status is ${lead.status}` });
    }

    // Guard: check for existing active campaign
    const existing = await base44.asServiceRole.entities.DripCampaign.filter({ lead_id: leadId, status: "active" }, "-created_date", 1);
    if (existing?.length > 0) {
      return Response.json({ success: true, skipped: true, reason: "Active drip campaign already exists for this lead." });
    }

    // Create campaign record
    const campaign = await base44.asServiceRole.entities.DripCampaign.create({
      lead_id: leadId,
      lead_name: lead.full_name || "",
      lead_email: lead.email || "",
      lead_phone: lead.phone || "",
      status: "active",
      enrolled_at: new Date().toISOString(),
      day1_status: "pending",
      day3_status: "pending",
      day7_status: "pending",
    });

    // Log event
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: leadId,
      channel: "internal",
      direction: "system",
      event_type: "workflow_triggered",
      provider: "internal",
      status: "processed",
      subject: "Drip campaign enrolled",
      message_body: `Lead enrolled in 3-step drip campaign (Day 1 / Day 3 / Day 7). Campaign ID: ${campaign.id}`,
    });

    return Response.json({ success: true, campaign_id: campaign.id, lead_id: leadId });

  } catch (error) {
    console.error("[startDripCampaign] startDripCampaign error:", error);
    return Response.json({ error: error.message || "Failed to start drip campaign" }, { status: 500 });
  }
});