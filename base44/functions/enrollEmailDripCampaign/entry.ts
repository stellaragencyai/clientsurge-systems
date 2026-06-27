import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...(init.headers || {}) },
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, trigger_intent, campaign_type, project_id } =
      await req.json();

    if (!lead_id || !trigger_intent) {
      return secureJson(
        { error: "lead_id and trigger_intent required" },
        { status: 400 }
      );
    }

    console.log(
      `[EmailDrip] Enrolling ${lead_id} in ${campaign_type} campaign (${trigger_intent})`
    );

    // 1. Get lead & template
    const lead = await base44.asServiceRole.entities.EmailDripCampaign.list(
      "-created_date",
      1
    );
    const existingCampaign = lead?.find(
      (c) =>
        c.lead_id === lead_id && ["active", "paused"].includes(c.status)
    );

    // Prevent duplicate enrollments
    if (existingCampaign) {
      console.log(`[EmailDrip] ${lead_id} already enrolled, skipping`);
      return secureJson(
        {
          success: false,
          message: "Lead already in active campaign",
        },
        { status: 409 }
      );
    }

    // 2. Find matching template
    const templates = await base44.asServiceRole.entities.EmailCampaignTemplate.filter(
      {
        campaign_type: campaign_type || "case_study",
        for_intent: trigger_intent,
        status: "active",
      },
      "-created_date",
      1
    );

    if (!templates?.length) {
      console.log(
        `[EmailDrip] No template found for ${campaign_type}/${trigger_intent}`
      );
      return secureJson(
        {
          success: false,
          error: "No matching email template found",
        },
        { status: 404 }
      );
    }

    const template = templates[0];
    const leadData = await base44.asServiceRole.entities.Leads.get(lead_id);

    // 3. Create campaign record
    const campaign = await base44.asServiceRole.entities.EmailDripCampaign.create({
      lead_id,
      campaign_type,
      trigger_intent,
      status: "active",
      enrolled_at: new Date().toISOString(),
      steps: template.steps.map((step) => ({
        ...step,
        status: "pending",
        subject: step.subject_template
          .replace("{{name}}", leadData.full_name)
          .replace("{{business}}", leadData.business_name),
        body: step.body_template
          .replace("{{name}}", leadData.full_name)
          .replace("{{business}}", leadData.business_name),
      })),
    });

    // 4. Queue first email immediately
    const firstStep = template.steps[0];
    if (firstStep) {
      await base44.asServiceRole.entities.AutomationJob.create({
        lead_id,
        job_type: "email_drip",
        trigger_event: "campaign_enrolled",
        status: "queued",
        scheduled_for: new Date().toISOString(),
        result_metadata: JSON.stringify({
          campaign_id: campaign.id,
          step_number: 1,
          email_subject: firstStep.subject_template,
        }),
      });

      console.log(`[EmailDrip] Queued step 1 for ${lead_id}`);
    }

    // 5. Queue remaining emails with delays
    for (let i = 1; i < template.steps.length; i++) {
      const step = template.steps[i];
      const delayMs = (step.delay_hours || 24) * 60 * 60 * 1000;
      const scheduledTime = new Date(Date.now() + delayMs);

      await base44.asServiceRole.entities.AutomationJob.create({
        lead_id,
        job_type: "email_drip",
        trigger_event: "campaign_step",
        status: "scheduled",
        scheduled_for: scheduledTime.toISOString(),
        result_metadata: JSON.stringify({
          campaign_id: campaign.id,
          step_number: i + 1,
          email_subject: step.subject_template,
        }),
      });
    }

    console.log(`[EmailDrip] Campaign ${campaign.id} enrolled for ${lead_id}`);

    return secureJson({
      success: true,
      campaign_id: campaign.id,
      template_name: template.name,
      steps_scheduled: template.steps.length,
    });
  } catch (error) {
    console.error("[EmailDrip] Error:", error.message);
    return secureJson(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});