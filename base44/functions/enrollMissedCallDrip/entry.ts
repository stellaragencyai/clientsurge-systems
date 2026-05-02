/**
 * Enroll Missed-Call Leads into Follow-Up Drip Campaign
 * Triggered: When initial SMS is sent to a missed-call lead
 * Purpose: Create and enroll a DripCampaign for the 4-step missed-call follow-up sequence
 * (2min SMS #2, 10min email, 1hour SMS #3, 24h email final)
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data } = payload;

    // Only process when initial SMS is sent to a missed-call lead
    if (event?.type !== "create") {
      return Response.json({ status: "skipped", reason: "not a create event" });
    }

    // Check if this is the initial missed-call SMS
    const isMissedCallSMS =
      data?.channel === "sms" &&
      data?.direction === "outbound" &&
      data?.event_type === "sms_sent" &&
      data?.subject?.includes("missed");

    if (!isMissedCallSMS || !data?.lead_id) {
      return Response.json({ status: "skipped", reason: "not a missed-call sms" });
    }

    const leadId = data.lead_id;

    console.log(`[enrollMissedCallDrip] Processing missed-call SMS for lead ${leadId}`);

    // ─────────────────────────────────────────────────────
    // STEP 1: Fetch lead and check if already enrolled
    // ─────────────────────────────────────────────────────
    const lead = await base44.asServiceRole.entities.Leads.get(leadId);
    if (!lead) {
      console.warn("[enrollMissedCallDrip] Lead not found:", leadId);
      return Response.json({ status: "failed", reason: "lead_not_found" });
    }

    // Skip if lead already replied, booked, or closed
    if (["Replied", "Booking Prompt Sent", "Booked", "Closed"].includes(lead.status)) {
      console.log("[enrollMissedCallDrip] Skipping — lead already progressed:", lead.status);
      return Response.json({ status: "skipped", reason: "lead_already_progressed" });
    }

    // Check if this lead already has an active missed-call drip
    const existingCampaigns = await base44.asServiceRole.entities.DripCampaign.filter(
      { lead_id: leadId, status: "active" },
      "-enrolled_at",
      1
    );

    if (existingCampaigns?.length > 0) {
      console.log("[enrollMissedCallDrip] Lead already has active drip campaign");
      return Response.json({ status: "skipped", reason: "already_enrolled" });
    }

    // ─────────────────────────────────────────────────────
    // STEP 2: Create DripCampaign enrollment
    // ─────────────────────────────────────────────────────
    const campaign = await base44.asServiceRole.entities.DripCampaign.create({
      lead_id: leadId,
      lead_name: lead.full_name,
      lead_email: lead.email,
      lead_phone: lead.phone,
      status: "active",
      enrolled_at: new Date().toISOString(),
      // Start with all steps pending — processDripCampaigns will handle timing
      day1_status: "pending",
      day3_status: "pending",
      day7_status: "pending",
      notes: `Auto-enrolled after missed-call initial SMS sent at ${new Date().toISOString()}`,
    });

    console.log("[enrollMissedCallDrip] Created DripCampaign:", campaign.id);

    // ─────────────────────────────────────────────────────
    // STEP 3: Log enrollment event
    // ─────────────────────────────────────────────────────
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: leadId,
      channel: "internal",
      direction: "system",
      event_type: "workflow_triggered",
      provider: "internal",
      status: "completed",
      subject: "Missed-call follow-up sequence enrolled",
      message_body: `Lead enrolled in 4-step follow-up drip: 2min SMS, 10min email, 1hr SMS, 24hr email.`,
      metadata_json: JSON.stringify({
        campaign_id: campaign.id,
        trigger: "initial_missed_call_sms",
        timestamp: new Date().toISOString(),
      }),
    });

    return Response.json({
      status: "success",
      lead_id: leadId,
      campaign_id: campaign.id,
    });
  } catch (error) {
    console.error("[enrollMissedCallDrip] Error:", error.message);
    return Response.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
});