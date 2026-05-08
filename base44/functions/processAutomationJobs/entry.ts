/**
 * Process Automation Jobs — Queued SMS/Email Reactivation Sender
 * Scheduled: Every 5 minutes
 * Purpose: Send queued reactivation_sms and reactivation_email jobs
 *
 * Batch-limited to 25 jobs per run (prevents API rate-limits)
 * Idempotent: checks terminal status before processing
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

// #114: Resend with retry on 429/5xx
async function resendWithRetry(payload, apiKey, retries = 1) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) return res.json();
    if ((res.status === 429 || res.status >= 500) && attempt < retries) {
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(`Resend ${res.status}: ${err?.message || "unknown"}`);
  }
}

// #123: exponential backoff retry wrapper for jobs
const MAX_RETRIES_JOB = 3;
async function withRetry(fn, label = "job") {
  for (let attempt = 1; attempt <= MAX_RETRIES_JOB; attempt++) {
    try { return await fn(); }
    catch (err) {
      const delay = Math.pow(2, attempt - 1) * 1000;
      console.warn(`[AutomationJobs] ${label} attempt ${attempt}/${MAX_RETRIES_JOB} failed: ${err.message}${attempt < MAX_RETRIES_JOB ? `, retrying in ${delay}ms` : " — giving up"}`);
      if (attempt === MAX_RETRIES_JOB) throw err;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}



const MAX_JOBS_PER_RUN = 25;
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_FROM_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");
const TWILIO_API_URL = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// ─────────────────────────────────────────────────────────
// TWILIO SMS SENDER
// ─────────────────────────────────────────────────────────
async function sendTwilioSms(toNumber, messageBody) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    throw new Error("Twilio credentials missing");
  }

  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
  const statusCallbackUrl = Deno.env.get("TWILIO_SMS_STATUS_CALLBACK_URL");

  const params = { From: TWILIO_FROM_NUMBER, To: toNumber, Body: messageBody };
  if (statusCallbackUrl) params.StatusCallback = statusCallbackUrl;

  const response = await fetch(TWILIO_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twilio error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.sid;
}

// ─────────────────────────────────────────────────────────
// RESEND EMAIL SENDER
// ─────────────────────────────────────────────────────────
async function sendResendEmail(to, subject, body, fromEmail) {
  if (!RESEND_API_KEY) {
    throw new Error("Resend API key missing");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail || "noreply@clientsurge.com",
      to,
      subject,
      text: body,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Resend error: ${error?.message || response.status}`);
  }

  const data = await response.json();
  return data.id;
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
        job_type: { $in: ["reactivation_sms", "reactivation_email"] },
      },
      "created_date",
      MAX_JOBS_PER_RUN
    );

    if (!queuedJobs || queuedJobs.length === 0) {
      console.log("[ProcessAutomationJobs] No queued jobs found");
      return Response.json({
        success: true,
        jobs_found: 0,
        jobs_processed: 0,
        jobs_failed: 0,
        message: "No jobs to process",
      });
    }

    console.log(`[ProcessAutomationJobs] Found ${queuedJobs.length} queued jobs`);

    const results = {
      jobs_found: queuedJobs.length,
      jobs_processed: 0,
      jobs_failed: 0,
      jobs_skipped: 0,
    };

    const now = new Date().toISOString();
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@clientsurge.com";

    // ─────────────────────────────────────────────────────────
    // STEP 2: Process each job
    // ─────────────────────────────────────────────────────────
    for (const job of queuedJobs) {
      try {
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

        // Parse metadata
        let metadata = {};
        try {
          metadata = JSON.parse(job.result_metadata || "{}");
        } catch (_) {}

        // ─────────────────────────────────────────────────────────
        // SEND SMS JOB
        // ─────────────────────────────────────────────────────────
        if (job.job_type === "reactivation_sms") {
          if (!lead.phone) {
            console.warn(
              `[ProcessAutomationJobs] Lead ${job.lead_id} missing phone — skipping SMS`
            );
            results.jobs_skipped++;
            continue;
          }

          try {
            const smsBody = metadata.message || "Hello! We'd love to reconnect.";
            messageId = await sendTwilioSms(lead.phone, smsBody);
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
        if (job.job_type === "reactivation_email") {
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
            messageId = await sendResendEmail(lead.email, emailSubject, emailBody, fromEmail);
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
          await base44.asServiceRole.entities.AutomationJob.update(job.id, {
            status: sent ? "completed" : "failed",
            processed_at: now,
            error_message: error || null,
          });

          if (sent) {
            results.jobs_processed++;
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
          await base44.asServiceRole.entities.CommunicationEvent.create({
            lead_id: job.lead_id,
            channel: job.job_type === "reactivation_sms" ? "sms" : "email",
            direction: "outbound",
            event_type: sent
              ? (job.job_type === "reactivation_sms" ? "sms_sent" : "email_sent")
              : (job.job_type === "reactivation_sms" ? "sms_failed" : "email_failed"),
            provider: job.job_type === "reactivation_sms" ? "twilio" : "resend",
            status: sent ? "sent" : "failed",
            subject: job.job_type === "reactivation_email" ? metadata.subject : undefined,
            message_body:
              job.job_type === "reactivation_sms"
                ? metadata.message
                : metadata.body,
            provider_message_id: messageId || null,
            error_message: error || null,
            metadata_json: JSON.stringify({
              job_id: job.id,
              job_type: job.job_type,
              attempt: metadata.attempt || 1,
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