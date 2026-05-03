import { buildCommunicationEvent } from "./installPipeline.js";

const SKIP_STATUSES = ["Qualified", "Booking Prompt Sent", "Booked", "Closed"];

export async function enrollLeadInDripCampaign({
  base44,
  lead,
  order = null,
  now = new Date().toISOString(),
  enrollmentSource = "system",
}) {
  if (!lead?.id) {
    throw new Error("lead.id is required");
  }

  if (SKIP_STATUSES.includes(lead.status)) {
    return {
      success: true,
      skipped: true,
      reason: `Lead status is ${lead.status}`,
    };
  }

  const existing = await base44.asServiceRole.entities.DripCampaign.filter({ lead_id: lead.id }, "-created_date", 10);
  const blockingCampaign = (existing || []).find((campaign) => campaign.status === "active" || campaign.status === "paused");
  if (blockingCampaign) {
    const stateLabel = blockingCampaign.status === "paused" ? "Paused" : "Active";
    return {
      success: true,
      skipped: true,
      reason: `${stateLabel} drip campaign already exists for this lead.`,
      campaign_id: blockingCampaign.id,
      campaign_status: blockingCampaign.status,
    };
  }

  const campaign = await base44.asServiceRole.entities.DripCampaign.create({
    lead_id: lead.id,
    lead_name: lead.full_name || "",
    lead_email: lead.email || "",
    lead_phone: lead.phone || "",
    status: "active",
    enrolled_at: now,
    day1_status: "pending",
    day3_status: "pending",
    day7_status: "pending",
  });

  const event = order
    ? buildCommunicationEvent({
        order,
        lead_id: lead.id,
        channel: "internal",
        direction: "system",
        event_type: "workflow_triggered",
        provider: "internal",
        status: "processed",
        subject: "Drip campaign enrolled",
        message_body: `Lead enrolled in 3-step drip campaign (Day 1 / Day 3 / Day 7). Campaign ID: ${campaign.id}`,
        service_key: "nurture_sequence_14d",
        context_type: "customer_lead_automation",
        context_id: `${lead.id}:nurture_sequence_14d`,
        metadata: {
          lead_id: lead.id,
          campaign_id: campaign.id,
          enrollment_source: enrollmentSource,
        },
      })
    : {
        lead_id: lead.id,
        channel: "internal",
        direction: "system",
        event_type: "workflow_triggered",
        provider: "internal",
        status: "processed",
        subject: "Drip campaign enrolled",
        message_body: `Lead enrolled in 3-step drip campaign (Day 1 / Day 3 / Day 7). Campaign ID: ${campaign.id}`,
        metadata_json: JSON.stringify({
          lead_id: lead.id,
          campaign_id: campaign.id,
          enrollment_source: enrollmentSource,
        }),
      };

  await base44.asServiceRole.entities.CommunicationEvent.create(event);

  return {
    success: true,
    campaign_id: campaign.id,
    lead_id: lead.id,
    skipped: false,
  };
}
