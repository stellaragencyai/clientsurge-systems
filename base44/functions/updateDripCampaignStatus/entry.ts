import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";

const ALLOWED_ACTIONS = {
  pause: { nextStatus: "paused", stopReason: "manual_pause", subject: "Drip campaign paused" },
  resume: { nextStatus: "active", stopReason: null, subject: "Drip campaign resumed" },
};

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await requireAdminUser(base44);
    const body = await req.json().catch(() => ({}));
    const campaignId = body?.campaign_id ?? null;
    const action = body?.action ?? null;

    if (!campaignId) {
      return Response.json({ error: "campaign_id is required" }, { status: 400 });
    }

    if (!ALLOWED_ACTIONS[action]) {
      return Response.json({ error: "action must be pause or resume" }, { status: 400 });
    }

    const campaign = await base44.asServiceRole.entities.DripCampaign.get(campaignId);
    if (!campaign) {
      return Response.json({ error: "Campaign not found" }, { status: 404 });
    }

    const target = ALLOWED_ACTIONS[action];

    if (campaign.status === target.nextStatus && campaign.stop_reason === target.stopReason) {
      return Response.json({ success: true, campaign });
    }

    const updated = await base44.asServiceRole.entities.DripCampaign.update(campaignId, {
      status: target.nextStatus,
      stop_reason: target.stopReason,
    });

    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: campaign.lead_id,
      channel: "internal",
      direction: "system",
      event_type: "workflow_triggered",
      provider: "internal",
      status: "processed",
      subject: target.subject,
      message_body: `${target.subject} by ${user.email}.`,
      metadata_json: JSON.stringify({
        entry_kind: "drip_campaign_status_update",
        action,
        campaign_id: campaignId,
        updated_by: user.email,
      }),
    });

    return Response.json({ success: true, campaign: updated });
  } catch (error) {
    console.error("updateDripCampaignStatus error:", error);
    if (error instanceof AuthGuardError) {
      return Response.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return Response.json({ error: error.message || "Failed to update drip campaign" }, { status: 500 });
  }
});
