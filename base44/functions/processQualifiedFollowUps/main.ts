import { secureJson } from "../_shared/response.ts";
/**
 * processQualifiedFollowUps — redeployed 2026-05-02
 * Scheduled: Every hour
 * Purpose:
 *   1. Qualified leads with no progress after 24h → send booking prompt SMS + email
 *   2. Replied leads with no action after 48h → email assigned rep
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resendFetch } from "../_shared/resendFetch.js";
import { appendSmsOptOut } from "../_shared/smsOptOut.js";
import { twilioFetch } from "../_shared/providerFetch.js";

function hoursSince(isoDate) {
  if (!isoDate) return 0;
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60);
}

function clean(value) {
  return String(value || "").trim().toLowerCase();
}

function digits(value) {
  return String(value || "").replace(/\D/g, "");
}

function includesAny(text, patterns) {
  return patterns.some((pattern) => text.includes(pattern));
}

const TEST_EMAIL_PATTERNS = ["clientsurge.test", "clientsurge-install.internal", "@clientsurge.test", ".internal", "test@example.com", "backfill-test"];
const TEST_SOURCE_PATTERNS = ["crm_live_smoke_test", "smoke", "install_test", "post_patch_verification", "runaibraininstallerbackfill", "admin_test_lead", "testwebsiteleadautomation", "launch audit", "backfill", "qa_lead_proof_generator"];
const TEST_NAME_PATTERNS = ["clientsurge smoke qa", "clientsurge crm smoke", "client surge smoke", "sarah smoke test", "admin test lead", "install test", "test owner", "crm smoke", "backfill test", "test hvac co", "qa duplicate", "qa raw import"];
const HELD_QUALITY_STATUSES = new Set(["quarantine_candidate", "quarantined", "duplicate_candidate"]);
const HELD_DEDUPE_STATUSES = new Set(["duplicate_candidate", "merged_duplicate"]);

function getLeadOutboundHold(lead = {}) {
  const reasons = [];
  const emailText = clean(lead.email || lead.normalized_email || lead.canonical_email);
  const sourceText = [lead.source, lead.import_source, lead.consent_source, lead.source_page, lead.page_submitted_from, lead.quality_reason, ...(lead.quality_reason_codes || [])].map(clean).join(" ");
  const nameText = [lead.business_name, lead.full_name, lead.owner_contact_name].map(clean).join(" ");
  const phoneDigits = digits(lead.phone || lead.normalized_phone || lead.canonical_phone);
  const qualityStatus = clean(lead.quality_review_status);
  const dedupeStatus = clean(lead.dedupe_status);

  if (!lead || !lead.id) reasons.push("missing_lead");
  if (lead.do_not_contact === true) reasons.push("do_not_contact");
  if (clean(lead.sms_opt_out_status) === "opted_out") reasons.push("sms_opt_out");
  if (clean(lead.email_opt_out_status) === "opted_out") reasons.push("email_opt_out");
  if (HELD_QUALITY_STATUSES.has(qualityStatus)) reasons.push(`quality_status:${qualityStatus}`);
  if (HELD_DEDUPE_STATUSES.has(dedupeStatus)) reasons.push(`dedupe_status:${dedupeStatus}`);
  if (lead.dedupe_duplicate_of) reasons.push("duplicate_keeper_linked");
  if (includesAny(emailText, TEST_EMAIL_PATTERNS)) reasons.push("test_email_marker");
  if (includesAny(sourceText, TEST_SOURCE_PATTERNS)) reasons.push("test_source_marker");
  if (includesAny(nameText, TEST_NAME_PATTERNS)) reasons.push("test_name_marker");
  if (phoneDigits.length >= 7 && phoneDigits.includes("555")) reasons.push("reserved_phone_pattern");
  if (clean(lead.business_type) === "test") reasons.push("test_business_type");

  return { held: reasons.length > 0, reasons: [...new Set(reasons)] };
}

async function logLeadOutboundHold(base44, lead, source, channel, reasons, stepKey) {
  await base44.asServiceRole.entities.CommunicationEvent.create({
    lead_id: lead.id,
    context_id: lead.id,
    context_type: "lead",
    channel,
    direction: "outbound",
    event_type: "outbound_hold",
    provider: "internal_guardrail",
    status: "skipped",
    subject: `Outbound held by ${source}`,
    message_body: reasons.join(", "),
    metadata_json: JSON.stringify({ step_key: stepKey, reason: "lead_outbound_hold", reasons, timestamp: new Date().toISOString() }),
  }).catch(() => null);
}

async function checkAlreadySent(base44, leadId, stepKey) {
  const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
    {
      lead_id: leadId,
      metadata_json: { $regex: `"step_key":"${stepKey}"` },
      event_type: { $in: ["sms_sent", "email_sent"] },
    },
    "-created_date",
    1
  ).catch(() => []);
  return events?.length > 0;
}

async function sendSMS(toNumber, messageBody) {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
  const statusCallbackUrl = Deno.env.get("TWILIO_SMS_STATUS_CALLBACK_URL");

  if (!accountSid || !authToken || !fromNumber) throw new Error("Twilio credentials missing");

  const params = { To: toNumber, From: fromNumber, Body: appendSmsOptOut(messageBody) };
  if (statusCallbackUrl) params.StatusCallback = statusCallbackUrl;

  const res = await twilioFetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(params),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Twilio error: ${err?.message || res.status}`);
  }
  const data = await res.json();
  return data.sid;
}

async function sendEmail(toEmail, subject, body) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@clientsurgesystems.com";

  if (!resendKey) throw new Error("RESEND_API_KEY missing");

  const res = await resendFetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: fromEmail, to: toEmail, subject, text: body }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Resend error: ${err?.message || res.status}`);
  }
  const data = await res.json();
  return data.id;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled automation (no user) or admin
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (user && user.role !== "admin") {
      return secureJson({ error: "Forbidden" }, { status: 403 });
    }

    // Load settings once
    const settingsRecords = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
    const settings = settingsRecords?.[0] || {};
    const bookingLink = settings.booking_link_default || "";
    const bookingSmsTemplate = settings.follow_up_booking_prompt_sms ||
      "Hi {name}, just checking in — are you still interested in booking? Here's the link: {booking_link}";
    const bookingEmailTemplate = settings.follow_up_booking_prompt_email ||
      "Hi {name},\n\nWe wanted to follow up and see if you're still interested in booking.\n\nYou can book here: {booking_link}\n\nLet us know if you have any questions!";

    const results = { qualified_sms: 0, qualified_email: 0, rep_notified: 0, skipped: 0, held: 0, failed: 0 };

    // ─── 1. QUALIFIED leads: no progress after 24h → booking prompt SMS + email ───
    const qualifiedLeads = await base44.asServiceRole.entities.Leads.filter(
      {
        status: "Qualified",
        last_contacted_at: { $exists: true },
      },
      "-last_contacted_at",
      500
    ).catch(() => []);

    for (const lead of qualifiedLeads || []) {
      try {
        if (hoursSince(lead.last_contacted_at) < 24) { results.skipped++; continue; }

        const stepKey = `qualified_booking_prompt_24h`;
        const alreadySent = await checkAlreadySent(base44, lead.id, stepKey);
        if (alreadySent) { results.skipped++; continue; }

        const hold = getLeadOutboundHold(lead);
        if (hold.held) {
          await logLeadOutboundHold(base44, lead, "processQualifiedFollowUps", "internal", hold.reasons, stepKey);
          results.held++;
          continue;
        }

        const renderMsg = (tmpl) =>
          tmpl
            .replace(/{name}/g, lead.full_name || "there")
            .replace(/{booking_link}/g, bookingLink);

        // SMS
        if (lead.phone) {
          try {
            const smsBody = appendSmsOptOut(renderMsg(bookingSmsTemplate));
            const sid = await sendSMS(lead.phone, smsBody);
            await base44.asServiceRole.entities.CommunicationEvent.create({
              lead_id: lead.id,
              channel: "sms",
              direction: "outbound",
              event_type: "sms_sent",
              provider: "twilio",
              status: "sent",
              subject: "Qualified booking prompt SMS (24h)",
              message_body: smsBody,
              provider_message_id: sid,
              metadata_json: JSON.stringify({ step_key: stepKey, timestamp: new Date().toISOString() }),
            });
            results.qualified_sms++;
          } catch (smsErr) {
            console.error(`[processQualifiedFollowUps] SMS failed for lead ${lead.id}: ${smsErr.message}`);
            results.failed++;
          }
        }

        // Email
        if (lead.email) {
          try {
            const emailId = await sendEmail(
              lead.email,
              "Still interested in booking?",
              renderMsg(bookingEmailTemplate)
            );
            await base44.asServiceRole.entities.CommunicationEvent.create({
              lead_id: lead.id,
              channel: "email",
              direction: "outbound",
              event_type: "email_sent",
              provider: "resend",
              status: "sent",
              subject: "Qualified booking prompt email (24h)",
              provider_message_id: emailId,
              metadata_json: JSON.stringify({ step_key: stepKey, timestamp: new Date().toISOString() }),
            });
            results.qualified_email++;
          } catch (emailErr) {
            console.error(`[processQualifiedFollowUps] Email failed for lead ${lead.id}: ${emailErr.message}`);
            results.failed++;
          }
        }

        // Update lead status to "Booking Prompt Sent"
        await base44.asServiceRole.entities.Leads.update(lead.id, {
          status: "Booking Prompt Sent",
          booking_link_sent_at: new Date().toISOString(),
        }).catch(() => {});

      } catch (err) {
        console.error(`[processQualifiedFollowUps] Qualified lead ${lead.id} error: ${err.message}`);
        results.failed++;
      }
    }

    // ─── 2. REPLIED leads: no action after 48h → email assigned rep ───
    const repliedLeads = await base44.asServiceRole.entities.Leads.filter(
      {
        status: "Replied",
        last_contacted_at: { $exists: true },
      },
      "-last_contacted_at",
      500
    ).catch(() => []);

    const adminEmail = settings.lead_notification_email || Deno.env.get("ADMIN_NOTIFICATION_EMAIL");

    for (const lead of repliedLeads || []) {
      try {
        if (hoursSince(lead.last_contacted_at) < 48) { results.skipped++; continue; }

        const stepKey = `replied_rep_alert_48h`;
        const alreadySent = await checkAlreadySent(base44, lead.id, stepKey);
        if (alreadySent) { results.skipped++; continue; }

        const hold = getLeadOutboundHold(lead);
        if (hold.held) {
          await logLeadOutboundHold(base44, lead, "processQualifiedFollowUps", "internal", hold.reasons, stepKey);
          results.held++;
          continue;
        }

        const repEmail = lead.assigned_to || adminEmail;
        if (!repEmail) { results.skipped++; continue; }

        const subject = `Follow-up needed: ${lead.full_name} replied 48h+ ago`;
        const body = `Hi,\n\n${lead.full_name} (${lead.business_name || "unknown business"}) replied to your outreach over 48 hours ago and hasn't been followed up with yet.\n\nPhone: ${lead.phone || "—"}\nEmail: ${lead.email || "—"}\nStatus: ${lead.status}\n\nPlease reach out as soon as possible.\n\n– ClientSurge Automation`;

        try {
          const emailId = await sendEmail(repEmail, subject, body);
          await base44.asServiceRole.entities.CommunicationEvent.create({
            lead_id: lead.id,
            channel: "email",
            direction: "outbound",
            event_type: "email_sent",
            provider: "resend",
            status: "sent",
            subject: `Rep alert: ${lead.full_name} needs follow-up`,
            provider_message_id: emailId,
            metadata_json: JSON.stringify({ step_key: stepKey, target: repEmail, timestamp: new Date().toISOString() }),
          });
          results.rep_notified++;
        } catch (alertErr) {
          console.error(`[processQualifiedFollowUps] Rep alert failed for lead ${lead.id}: ${alertErr.message}`);
          results.failed++;
        }

      } catch (err) {
        console.error(`[processQualifiedFollowUps] Replied lead ${lead.id} error: ${err.message}`);
        results.failed++;
      }
    }

    console.log(`[processQualifiedFollowUps] Done:`, results);
    return secureJson({ success: true, ...results });

  } catch (error) {
    console.error("[processQualifiedFollowUps] Fatal error:", error.message);
    return secureJson({ error: error.message }, { status: 500 });
  }
});
