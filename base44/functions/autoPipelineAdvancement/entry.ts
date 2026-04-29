/**
 * Automatic Pipeline Stage Advancement
 * Moves leads through stages based on actual behavior
 * Zero manual status updates
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id } = await req.json();

    if (!lead_id) {
      return Response.json({ error: "lead_id required" }, { status: 400 });
    }

    console.log(`[PipelineAdvance] Evaluating stage for ${lead_id}`);

    // 1. Get lead
    const lead = await base44.asServiceRole.entities.Leads.get(lead_id);
    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    // 2. Get events
    const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
      { lead_id },
      "-created_date",
      50
    );

    // 3. Determine next stage based on signals
    let nextStage = lead.status;
    const signals = {
      has_outbound: false,
      has_inbound: false,
      has_email_open: false,
      has_link_click: false,
      has_booking_link_click: false,
    };

    if (events && events.length > 0) {
      signals.has_outbound = events.some((e) => e.direction === "outbound");
      signals.has_inbound = events.some((e) => e.direction === "inbound");
      signals.has_email_open = events.some((e) => e.status === "opened");
      signals.has_link_click = events.some((e) => e.status === "clicked");
      signals.has_booking_link_click = events.some(
        (e) => e.event_type === "booking_link_deployed" && e.status === "clicked"
      );
    }

    // 4. Stage progression logic
    if (signals.has_booking_link_click) {
      nextStage = "Booking Prompt Sent";
    } else if (signals.has_link_click) {
      nextStage = "Qualified";
    } else if (signals.has_email_open || signals.has_inbound) {
      nextStage = "Replied";
    } else if (signals.has_outbound) {
      nextStage = "Contacted";
    }

    // 5. Update if changed
    const stageChanged = nextStage !== lead.status;
    if (stageChanged) {
      await base44.asServiceRole.entities.Leads.update(lead_id, {
        status: nextStage,
      });

      console.log(`[PipelineAdvance] Updated ${lead_id}: ${lead.status} → ${nextStage}`);
    }

    return Response.json({
      success: true,
      lead_id,
      previous_stage: lead.status,
      current_stage: nextStage,
      stage_changed: stageChanged,
      signals,
      reason: stageChanged
        ? `Automatic progression based on ${Object.keys(signals).filter((k) => signals[k]).join(", ")}`
        : "No stage change detected",
    });
  } catch (error) {
    console.error("[PipelineAdvance] Error:", error.message);
    return Response.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});