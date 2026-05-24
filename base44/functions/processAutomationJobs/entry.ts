/**
 * Process Automation Jobs — Queued SMS/Email Reactivation Sender
 * Scheduled: Every 5 minutes
 * Purpose: Send queued reactivation_sms and reactivation_email jobs
 *
 * Batch-limited to 25 jobs per run (prevents API rate-limits)
 * Idempotent: checks terminal status before processing
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import {
  buildRetrySchedulePatch,
  isAutomationJobDue,
} from "../_shared/automationRetry.js";
import {
  buildClientCheckinEmail,
  CLIENT_CHECKIN_JOB_TYPE,
} from "../_shared/clientCheckinScheduler.js";
import {
  sendCommunicationViaOutbox,
  sendResendEmailProvider,
  sendTwilioSmsProvider,
} from "../_shared/communicationOutbox.js";

const MAX_JOBS_PER_RUN = 25;

// ─────────────────────────────────────────────────────────
// TWILIO SMS SENDER
// ─────────────────────────────────────────────────────────
async function sendTwilioSms(base44, lead, toNumber, messageBody, job, metadata) {
  const result = await sendCommunicationViaOutbox({
    base44,
    channel: "sms",
    provider: "twilio",
    recipient: toNumber,
    body: messageBody,
    lead,
    leadId: lead?.id || job.lead_id,
    source: "processAutomationJobs",
    sourceRecordId: job.id,
    templateKey: job.job_type,
    messageType: job.job_type?.includes("reactivation") ? "marketing" : "transactional",
    consentBasis: lead?.consent_given ? "explicit_sms_consent" : "transactional_relationship",
    metadata: { ...(metadata || {}), job_id: job.id, job_type: job.job_type },
    providerSend: (providerPayload) => sendTwilioSmsProvider({
      ...providerPayload,
      env: (name) => Deno.env.get(name),
      fetchImpl: fetch,
    }),
  });
  if (!result.success) throw new Error(result.reason || result.error || "SMS was not sent");
  return result.provider_message_id;
}

// ─────────────────────────────────────────────────────────
// RESEND EMAIL SENDER
// ─────────────────────────────────────────────────────────
async function sendResendEmail(base44, lead, to, subject, body, fromEmail, job, metadata = {}) {
  const result = await sendCommunicationViaOutbox({
    base44,
    channel: "email",
    provider: "resend",
    recipient: to,
    subject,
    body,
    from: fromEmail,
    lead,
    leadId: lead?.id || job.lead_id,
    source: "processAutomationJobs",
    sourceRecordId: job.id,
    templateKey: job.job_type,
    messageType: job.job_type?.includes("reactivation") ? "marketing" : "transactional",
    consentBasis: "transactional_relationship",
    metadata: { ...metadata, job_id: job.id, job_type: job.job_type },
    providerSend: (providerPayload) => sendResendEmailProvider({
      ...providerPayload,
      env: (name) => Deno.env.get(name),
      fetchImpl: fetch,
    }),
  });
  if (!result.success) throw new Error(result.reason || result.error || "Email was not sent");
  return result.provider_message_id;
}

async function sendResendHtmlEmail(base44, client, to, subject, html, text, fromEmail, job, metadata = {}) {
  const result = await sendCommunicationViaOutbox({
    base44,
    channel: "email",
    provider: "resend",
    recipient: to,
    subject,
    body: text,
    html,
    from: fromEmail,
    clientProjectId: client?.client_project_id,
    source: "processAutomationJobs",
    sourceRecordId: job.id,
    templateKey: job.job_type,
    messageType: "transactional",
    consentBasis: "transactional_relationship",
    metadata: { ...metadata, job_id: job.id, job_type: job.job_type, client_id: client?.id },
    providerSend: (providerPayload) => sendResendEmailProvider({
      ...providerPayload,
      env: (name) => Deno.env.get(name),
      fetchImpl: fetch,
    }),
  });
  if (!result.success) throw new Error(result.reason || result.error || "Email was not sent");
  return result.provider_message_id;
}

// ─────────────────────────────────────────────────────────
// MAIN PROCESSOR
// ─────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled automation (no user) or admin
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (_) {}
    if (user && user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log("[ProcessAutomationJobs] Starting job processor...");

    // ─────────────────────────────────────────────────────────
    // STEP 1: Find queued reactivation jobs (batch limited)
    // ─────────────────────────────────────────────────────────
    const queuedJobs = await base44.asServiceRole.entities.AutomationJob.filter(
      {
        status: "queued",
      },
      "created_date",
      100
    );
    const dueJobs = (queuedJobs || [])
      .filter((job) => isAutomationJobDue(job))
      .slice(0, MAX_JOBS_PER_RUN);

    if (!dueJobs.length) {
      console.log("[ProcessAutomationJobs] No queued jobs found");
      return Response.json({
        success: true,
        jobs_found: queuedJobs?.length || 0,
        jobs_processed: 0,
        jobs_failed: 0,
        message: "No jobs to process",
      });
    }

    console.log(`[ProcessAutomationJobs] Found ${dueJobs.length} due queued jobs`);

    const results = {
      jobs_found: dueJobs.length,
      jobs_processed: 0,
      jobs_failed: 0,
      jobs_requeued: 0,
      jobs_skipped: 0,
    };

    const now = new Date().toISOString();
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@clientsurge.com";

    // ─────────────────────────────────────────────────────────
    // STEP 2: Process each job
    // ─────────────────────────────────────────────────────────
    for (const job of dueJobs) {
      try {
        let metadata = {};
        try {
          metadata = JSON.parse(job.result_metadata || "{}");
        } catch (_) {}

        if (job.job_type === CLIENT_CHECKIN_JOB_TYPE) {
          const client = metadata.client || await base44.asServiceRole.entities.Client.get(
            job.context_id || job.client_id || job.lead_id
          ).catch(() => null);
          if (!client?.email) {
            console.warn(`[ProcessAutomationJobs] Client check-in ${job.id} missing client email`);
            const retryPatch = buildRetrySchedulePatch({
              attempts: job.attempts || 0,
              error: "Client email missing",
              now: new Date(now),
            });
            await base44.asServiceRole.entities.AutomationJob.update(job.id, retryPatch);
            results.jobs_requeued += retryPatch.status === "queued" ? 1 : 0;
            results.jobs_failed += retryPatch.status === "failed" ? 1 : 0;
            continue;
          }

          let messageId = null;
          let error = null;
          try {
            const html = buildClientCheckinEmail({
              client,
              activeSystems: metadata.active_systems,
            });
            messageId = await sendResendHtmlEmail(
              base44,
              client,
              client.email,
              "Your ClientSurge 30-Day Check-In",
              html,
              "Your ClientSurge system has been live for 30 days. Book your check-in at https://calendly.com/nolan-clientsurgesystems",
              fromEmail,
              job,
              metadata
            );
          } catch (err) {
            error = err.message;
            console.error(`[ProcessAutomationJobs] 30-day check-in email failed for job ${job.id}: ${err.message}`);
          }

          const retryPatch = error
            ? buildRetrySchedulePatch({ attempts: job.attempts || 0, error, now: new Date(now) })
            : null;

          await base44.asServiceRole.entities.AutomationJob.update(
            job.id,
            error
              ? retryPatch
              : { status: "completed", processed_at: now, last_error: null }
          );

          await base44.asServiceRole.entities.Client.update(
            job.context_id || job.client_id || job.lead_id,
            error
              ? { checkin_30_day_status: retryPatch?.status === "queued" ? "queued" : "failed" }
              : { checkin_30_day_status: "sent", checkin_30_day_sent_at: now }
          ).catch(() => null);

          await base44.asServiceRole.entities.CommunicationEvent.create({
            client_id: job.context_id || job.client_id || job.lead_id,
            context_type: "Client",
            context_id: job.context_id || job.client_id || job.lead_id,
            channel: "email",
            direction: "outbound",
            event_type: error ? "email_failed" : "email_sent",
            provider: "resend",
            status: error ? "failed" : "sent",
            subject: "Your ClientSurge 30-Day Check-In",
            provider_message_id: messageId,
            error_message: error,
            metadata_json: JSON.stringify({
              job_id: job.id,
              job_type: job.job_type,
              attempt: (job.attempts || 0) + 1,
              requeued: retryPatch?.status === "queued",
              next_retry_at: retryPatch?.scheduled_for || null,
              timestamp: now,
            }),
          }).catch((logErr) => {
            console.warn(`[ProcessAutomationJobs] Failed to log 30-day check-in event: ${logErr.message}`);
          });

          if (error) {
            if (retryPatch?.status === "queued") results.jobs_requeued++;
            else results.jobs_failed++;
          } else {
            results.jobs_processed++;
          }
          continue;
        }

        // Get lead details
        const lead = await base44.asServiceRole.entities.Leads.get(job.lead_id).catch(
          () => null
        );
        if (!lead) {
          console.warn(`[ProcessAutomationJobs] Lead ${job.lead_id} not found — skipping`);
          results.jobs_skipped++;
          continue;
        }

        let sent = false;
        let messageId = null;
        let error = null;

        // ─────────────────────────────────────────────────────────
        // SEND SMS JOB
        // ─────────────────────────────────────────────────────────
        const isSmsJob = ["reactivation_sms", "instant_sms"].includes(job.job_type);
        const isEmailJob = ["reactivation_email", "confirmation_email"].includes(job.job_type);

        if (isSmsJob) {
          if (!lead.phone) {
            console.warn(
              `[ProcessAutomationJobs] Lead ${job.lead_id} missing phone — skipping SMS`
            );
            results.jobs_skipped++;
            continue;
          }

          try {
            const smsBody = metadata.message || "Hello! We'd love to reconnect.";
            messageId = await sendTwilioSms(base44, lead, lead.phone, smsBody, job, metadata);
            sent = true;
            console.log(
              `[ProcessAutomationJobs] SMS sent to ${lead.phone} (SID: ${messageId})`
            );
          } catch (err) {
            error = err.message;
            console.error(
              `[ProcessAutomationJobs] SMS send failed for job ${job.id}: ${err.message}`
            );
          }
        }

        // ─────────────────────────────────────────────────────────
        // SEND EMAIL JOB
        // ─────────────────────────────────────────────────────────
        if (isEmailJob) {
          if (!lead.email) {
            console.warn(
              `[ProcessAutomationJobs] Lead ${job.lead_id} missing email — skipping email`
            );
            results.jobs_skipped++;
            continue;
          }

          try {
            const emailSubject = metadata.subject || "We miss you!";
            const emailBody =
              metadata.body || "We'd love to work with you again. Get in touch!";
            messageId = await sendResendEmail(base44, lead, lead.email, emailSubject, emailBody, fromEmail, job, metadata);
            sent = true;
            console.log(`[ProcessAutomationJobs] Email sent to ${lead.email} (ID: ${messageId})`);
          } catch (err) {
            error = err.message;
            console.error(
              `[ProcessAutomationJobs] Email send failed for job ${job.id}: ${err.message}`
            );
          }
        }

        // ─────────────────────────────────────────────────────────
        // UPDATE JOB STATUS
        // ─────────────────────────────────────────────────────────
        try {
          const retryPatch = buildRetrySchedulePatch({
            attempts: job.attempts || 0,
            error,
            now: new Date(now),
          });
          await base44.asServiceRole.entities.AutomationJob.update(
            job.id,
            sent ? { status: "completed", processed_at: now, last_error: null } : retryPatch
          );

          if (sent) {
            results.jobs_processed++;
          } else if (retryPatch.status === "queued") {
            results.jobs_requeued++;
          } else {
            results.jobs_failed++;
          }
        } catch (updateErr) {
          console.error(`[ProcessAutomationJobs] Failed to update job ${job.id}: ${updateErr.message}`);
        }

        // ─────────────────────────────────────────────────────────
        // LOG COMMUNICATION EVENT
        // ─────────────────────────────────────────────────────────
        try {
          const retryPatchForLog = !sent
            ? buildRetrySchedulePatch({ attempts: job.attempts || 0, error, now: new Date(now) })
            : null;
          await base44.asServiceRole.entities.CommunicationEvent.create({
            lead_id: job.lead_id,
            channel: isSmsJob ? "sms" : "email",
            direction: "outbound",
            event_type: sent
              ? (isSmsJob ? "sms_sent" : "email_sent")
              : (isSmsJob ? "sms_failed" : "email_failed"),
            provider: isSmsJob ? "twilio" : "resend",
            status: sent ? "sent" : "failed",
            subject: job.job_type === "reactivation_email" ? metadata.subject : undefined,
            message_body:
              isSmsJob
                ? metadata.message
                : metadata.body,
            provider_message_id: messageId || null,
            error_message: error || null,
            metadata_json: JSON.stringify({
              job_id: job.id,
              job_type: job.job_type,
              attempt: (job.attempts || 0) + 1,
              requeued: retryPatchForLog?.status === "queued",
              next_retry_at: retryPatchForLog?.scheduled_for || null,
              reactivation_id: metadata.reactivation_id,
              timestamp: now,
            }),
          });
        } catch (logErr) {
          console.warn(
            `[ProcessAutomationJobs] Failed to log event for job ${job.id}: ${logErr.message}`
          );
        }
      } catch (jobErr) {
        console.error(
          `[ProcessAutomationJobs] Job ${job.id} error: ${jobErr.message}`
        );
        results.jobs_failed++;
      }
    }

    console.log(`[ProcessAutomationJobs] Complete — processed: ${results.jobs_processed}, failed: ${results.jobs_failed}, skipped: ${results.jobs_skipped}`);

    return Response.json({ success: true, ...results });
  } catch (error) {
    console.error("[ProcessAutomationJobs] Fatal error:", error.message);
    return Response.json(
      { error: error.message || "Failed to process automation jobs" },
      { status: 500 }
    );
  }
});
