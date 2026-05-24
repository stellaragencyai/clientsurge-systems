import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import {
  buildClientCheckinJob,
  buildOperatorReminderEmail,
  formatDateLabel,
} from "../_shared/clientCheckinScheduler.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const { entity_id, data: client = {}, old_data = {} } = payload;

    const plan = buildClientCheckinJob({
      entityId: entity_id || client.id,
      client,
      oldClient: old_data,
      now: new Date(),
    });

    if (plan.skipped) {
      return Response.json(
        { skipped: true, reason: plan.reason },
        { status: plan.status || 200 }
      );
    }

    const existingJobs = await base44.asServiceRole.entities.AutomationJob.filter(
      {
        job_type: plan.job.job_type,
        context_type: "Client",
        context_id: plan.job.context_id,
        status: "queued",
      },
      "-created_date",
      1
    ).catch(() => []);

    let job = existingJobs?.[0] || null;
    if (job) {
      job = await base44.asServiceRole.entities.AutomationJob.update(job.id, {
        scheduled_for: plan.job.scheduled_for,
        result_metadata: plan.job.result_metadata,
        trigger_event: plan.job.trigger_event,
      });
    } else {
      job = await base44.asServiceRole.entities.AutomationJob.create(plan.job);
    }

    if (plan.job.context_id && plan.clientPatch) {
      await base44.asServiceRole.entities.Client.update(plan.job.context_id, plan.clientPatch)
        .catch((error) => {
          console.warn("[autoSchedule30DayCheckin] Could not update Client schedule fields:", error.message);
        });
    }

    const operatorEmail = buildOperatorReminderEmail({
      client,
      schedule: plan.schedule,
      activeSystems: plan.activeSystems,
    });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || "nolan@clientsurgesystems.com",
      from_name: "ClientSurge Systems",
      subject: `30-Day Check-In Scheduled - ${client.business_name || "Client"} (${formatDateLabel(plan.schedule.scheduled_for)})`,
      body: operatorEmail,
    }).catch((error) => {
      console.warn("[autoSchedule30DayCheckin] Operator reminder email failed:", error.message);
    });

    await base44.asServiceRole.entities.CommunicationEvent.create({
      client_id: plan.job.context_id,
      context_type: "Client",
      context_id: plan.job.context_id,
      channel: "internal",
      direction: "system",
      event_type: "workflow_triggered",
      provider: "internal",
      status: "pending",
      subject: "30-day check-in queued",
      message_body: `Client check-in email queued for ${formatDateLabel(plan.schedule.scheduled_for)}.`,
      metadata_json: JSON.stringify({
        automation_job_id: job.id,
        job_type: plan.job.job_type,
        scheduled_for: plan.schedule.scheduled_for,
        operator_reminder_at: plan.schedule.operator_reminder_at,
      }),
    }).catch((error) => {
      console.warn("[autoSchedule30DayCheckin] CommunicationEvent log failed:", error.message);
    });

    return Response.json({
      success: true,
      queued: true,
      job_id: job.id,
      checkin_date: plan.schedule.scheduled_for,
      reminder_date: plan.schedule.operator_reminder_at,
    });
  } catch (error) {
    console.error("[autoSchedule30DayCheckin] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
