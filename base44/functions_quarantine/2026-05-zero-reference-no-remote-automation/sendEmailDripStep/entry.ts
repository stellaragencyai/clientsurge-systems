/**
 * Send Email Drip Step
 * Called by automation job when email is due
 * Uses Resend API for reliable delivery
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, campaign_id, step_number } = await req.json();

    if (!lead_id || !campaign_id || step_number === undefined) {
      return Response.json(
        { error: "lead_id, campaign_id, step_number required" },
        { status: 400 }
      );
    }

    console.log(
      `[SendEmailDrip] Sending step ${step_number} for campaign ${campaign_id}`
    );

    // 1. Get campaign
    const campaign = await base44.asServiceRole.entities.EmailDripCampaign.get(
      campaign_id
    );
    if (!campaign || campaign.status !== "active") {
      console.log(`[SendEmailDrip] Campaign not active, skipping`);
      return Response.json({ success: false, message: "Campaign not active" });
    }

    // 2. Get step data
    const step = campaign.steps[step_number - 1];
    if (!step) {
      return Response.json(
        { error: `Step ${step_number} not found` },
        { status: 404 }
      );
    }

    // 3. Get lead email
    const lead = await base44.asServiceRole.entities.Leads.get(lead_id);
    if (!lead?.email) {
      return Response.json({ error: "Lead email not found" }, { status: 400 });
    }

    // 4. Send via Resend
    const emailResult = await base44.asServiceRole.integrations.Core.SendEmail({
      to: lead.email,
      subject: step.subject,
      body: step.body,
      from_name: "ClientSurge Systems",
    });

    // 5. Update campaign step status
    const updatedSteps = campaign.steps.map((s, i) => {
      if (i === step_number - 1) {
        return {
          ...s,
          status: "sent",
          sent_at: new Date().toISOString(),
        };
      }
      return s;
    });

    await base44.asServiceRole.entities.EmailDripCampaign.update(campaign_id, {
      steps: updatedSteps,
    });

    // 6. Log as communication event
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id,
      channel: "email",
      direction: "outbound",
      event_type: "email_sent",
      provider: "resend",
      status: "sent",
      subject: step.subject,
      message_body: step.body.substring(0, 500),
      metadata_json: JSON.stringify({
        campaign_id,
        step_number,
        campaign_type: campaign.campaign_type,
      }),
    });

    console.log(
      `[SendEmailDrip] Step ${step_number} sent to ${lead.email}`
    );

    // 7. Check if campaign complete
    const allSent = updatedSteps.every((s) => s.status === "sent");
    if (allSent) {
      await base44.asServiceRole.entities.EmailDripCampaign.update(
        campaign_id,
        {
          status: "completed",
          completed_at: new Date().toISOString(),
        }
      );
      console.log(`[SendEmailDrip] Campaign ${campaign_id} completed`);
    }

    return Response.json({
      success: true,
      lead_id,
      step_number,
      email_sent: lead.email,
    });
  } catch (error) {
    console.error("[SendEmailDrip] Error:", error.message);
    return Response.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});