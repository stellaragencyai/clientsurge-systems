/**
 * Website Lead Immediate Response
 * Sends instant SMS + email to new website form submissions
 * Reuses patterns from processMissedCallFollowUps for consistency
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { buildFailedSendRetryJob } from "../_shared/automationRetry.js";
import { resendFetch } from "../_shared/resendFetch.js";

async function sendSMS(base44, lead, messageBody, fromNumber) {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const statusCallbackUrl = Deno.env.get("TWILIO_SMS_STATUS_CALLBACK_URL");

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error("Twilio credentials missing");
  }

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: lead.phone_number,
        From: fromNumber,
        Body: messageBody,
        ...(statusCallbackUrl ? { StatusCallback: statusCallbackUrl } : {}),
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Twilio error: ${err?.message || res.status}`);
  }

  const result = await res.json();
  return { success: true, messageId: result.sid };
}

async function sendEmail(base44, lead, subject, body, fromEmail) {
  const resendKey = Deno.env.get("RESEND_API_KEY");

  if (!resendKey) {
    throw new Error("Resend API key missing");
  }

  const idempotencyKey = `website-lead/${lead.id}/initial-email`;

  const res = await resendFetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      from: fromEmail || "noreply@clientsurgesystems.com",
      to: lead.email,
      subject,
      text: body,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Resend error: ${err?.message || res.status}`);
  }

  const result = await res.json();
  return { success: true, messageId: result.id };
}

function renderTemplate(template, lead) {
  if (!template) return "";
  return template
    .replace(/{first_name}/g, lead.first_name || lead.full_name || "there")
    .replace(/{full_name}/g, lead.full_name || "there")
    .replace(/{service_interest}/g, lead.service_interest || "our services")
    .replace(/{business_name}/g, Deno.env.get("DEFAULT_BUSINESS_NAME") || "us");
}

async function checkAlreadySent(base44, leadId, messageType) {
  const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
    {
      context_id: leadId,
      context_type: "website_lead",
      event_type: messageType === "sms" ? "sms_sent" : "email_sent",
      metadata_json: { $regex: `website_lead_response` },
    },
    "-created_date",
    1
  ).catch(() => []);
  return events?.length > 0;
}

async function queueFailedSendRetry(base44, payload) {
  return base44.asServiceRole.entities.AutomationJob.create(
    buildFailedSendRetryJob(payload)
  ).catch((error) => {
    console.warn("[sendWebsiteLeadResponse] Failed to queue retry job:", error.message);
    return null;
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    // Handle both direct calls (lead_id) and entity automation (data.id)
    const leadId = payload.lead_id || payload.id || payload.data?.id;

    if (!leadId) {
      return Response.json(
        { error: "lead_id required" },
        { status: 400 }
      );
    }

    // Load lead
    const lead = await base44.asServiceRole.entities.WebsiteLead.get(leadId);
    if (!lead) {
      return Response.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // Check automation enabled
    if (!lead.automation_enabled) {
      console.log(
        `[sendWebsiteLeadResponse] Automation disabled for lead ${lead.id}`
      );
      return Response.json({
        success: true,
        skipped: true,
        reason: "automation_disabled",
      });
    }

    // Load settings
    const settingsRecords =
      await base44.asServiceRole.entities.AdminSettings.list(
        "-created_date",
        1
      );
    const settings = settingsRecords?.[0] || {};

    const fromNumber =
      settings.twilio_from_number || Deno.env.get("TWILIO_PHONE_NUMBER");
    const fromEmail =
      settings.resend_from_email || Deno.env.get("RESEND_FROM_EMAIL") ||
      "noreply@clientsurgesystems.com";
    const bookingLink = settings.booking_link_default || "";

    const templates = {
      sms: `Hey {first_name}, thanks for reaching out about {service_interest}. We got your message and will be in touch shortly. Need help faster? Book a time: ${bookingLink}`,
      email_subject: "Got your request — here's the next step",
      email_body: `Hey {first_name},

Thanks for reaching out to {business_name} about {service_interest}.

We got your request and want to help you find the right solution.

The fastest way to move forward is to book a quick call here:
${bookingLink}

Or just reply to this email with any questions.

– {business_name}`,
    };

    const results = {
      sms_sent: false,
      email_sent: false,
      errors: [],
    };

    // Send immediate SMS if phone exists
    if (lead.phone_number) {
      try {
        const alreadySentSMS = await checkAlreadySent(base44, lead.id, "sms");
        if (!alreadySentSMS) {
          const messageBody = renderTemplate(templates.sms, lead);
          const smsResult = await sendSMS(
            base44,
            lead,
            messageBody,
            fromNumber
          );

          await base44.asServiceRole.entities.CommunicationEvent.create({
            context_id: lead.id,
            context_type: "website_lead",
            channel: "sms",
            direction: "outbound",
            event_type: "sms_sent",
            provider: "twilio",
            status: "sent",
            subject: "Website lead immediate SMS",
            message_body: messageBody,
            provider_message_id: smsResult.messageId,
            metadata_json: JSON.stringify({
              step: 0,
              website_lead_response: true,
              timestamp: new Date().toISOString(),
            }),
          });

          results.sms_sent = true;
          console.log(
            `[sendWebsiteLeadResponse] SMS sent to ${lead.id}: ${lead.phone_number}`
          );
        } else {
          console.log(
            `[sendWebsiteLeadResponse] SMS already sent for lead ${lead.id}`
          );
        }
      } catch (err) {
        results.errors.push(`SMS failed: ${err.message}`);
        console.error(
          `[sendWebsiteLeadResponse] SMS error for lead ${lead.id}:`,
          err.message
        );

        await base44.asServiceRole.entities.CommunicationEvent.create({
          context_id: lead.id,
          context_type: "website_lead",
          channel: "sms",
          direction: "outbound",
          event_type: "sms_failed",
          provider: "twilio",
          status: "failed",
          subject: "Website lead immediate SMS failed",
          message_body: err.message,
          error_message: err.message,
          metadata_json: JSON.stringify({
            step: 0,
            website_lead_response: true,
          }),
        });
        await queueFailedSendRetry(base44, {
          lead,
          channel: "sms",
          message: renderTemplate(templates.sms, lead),
          source: "website_lead_response",
          step: 0,
          stepKey: "initial_sms",
        });
      }
    } else {
      console.log(`[sendWebsiteLeadResponse] No phone for lead ${lead.id}`);
      await base44.asServiceRole.entities.CommunicationEvent.create({
        context_id: lead.id,
        context_type: "website_lead",
        channel: "sms",
        direction: "outbound",
        event_type: "sms_skipped",
        provider: "twilio",
        status: "skipped",
        subject: "Website lead SMS skipped",
        message_body: "No phone number on lead",
        metadata_json: JSON.stringify({
          step: 0,
          reason: "no_phone",
        }),
      });
    }

    // Send immediate email if email exists
    if (lead.email) {
      try {
        const alreadySentEmail = await checkAlreadySent(
          base44,
          lead.id,
          "email"
        );
        if (!alreadySentEmail) {
          const subject = renderTemplate(templates.email_subject, lead);
          const body = renderTemplate(templates.email_body, lead);
          const emailResult = await sendEmail(
            base44,
            lead,
            subject,
            body,
            fromEmail
          );

          await base44.asServiceRole.entities.CommunicationEvent.create({
            context_id: lead.id,
            context_type: "website_lead",
            channel: "email",
            direction: "outbound",
            event_type: "email_sent",
            provider: "resend",
            status: "sent",
            subject: "Website lead immediate email",
            message_body: body,
            provider_message_id: emailResult.messageId,
            metadata_json: JSON.stringify({
              step: 0,
              website_lead_response: true,
              timestamp: new Date().toISOString(),
            }),
          });

          results.email_sent = true;
          console.log(
            `[sendWebsiteLeadResponse] Email sent to ${lead.id}: ${lead.email}`
          );
        } else {
          console.log(
            `[sendWebsiteLeadResponse] Email already sent for lead ${lead.id}`
          );
        }
      } catch (err) {
        results.errors.push(`Email failed: ${err.message}`);
        console.error(
          `[sendWebsiteLeadResponse] Email error for lead ${lead.id}:`,
          err.message
        );

        await base44.asServiceRole.entities.CommunicationEvent.create({
          context_id: lead.id,
          context_type: "website_lead",
          channel: "email",
          direction: "outbound",
          event_type: "email_failed",
          provider: "resend",
          status: "failed",
          subject: "Website lead immediate email failed",
          message_body: err.message,
          error_message: err.message,
          metadata_json: JSON.stringify({
            step: 0,
            website_lead_response: true,
          }),
        });
        await queueFailedSendRetry(base44, {
          lead,
          channel: "email",
          subject: renderTemplate(templates.email_subject, lead),
          message: renderTemplate(templates.email_body, lead),
          source: "website_lead_response",
          step: 0,
          stepKey: "initial_email",
        });
      }
    } else {
      console.log(`[sendWebsiteLeadResponse] No email for lead ${lead.id}`);
      await base44.asServiceRole.entities.CommunicationEvent.create({
        context_id: lead.id,
        context_type: "website_lead",
        channel: "email",
        direction: "outbound",
        event_type: "email_skipped",
        provider: "resend",
        status: "skipped",
        subject: "Website lead email skipped",
        message_body: "No email address on lead",
        metadata_json: JSON.stringify({
          step: 0,
          reason: "no_email",
        }),
      });
    }

    // Update lead
    const sentAny = results.sms_sent || results.email_sent;
    if (sentAny) {
      await base44.asServiceRole.entities.WebsiteLead.update(lead.id, {
        lead_status: "contacted",
        initial_response_sent_at: new Date().toISOString(),
        follow_up_step: 0,
        next_follow_up_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        last_message_sent: new Date().toISOString(),
      });
    }

    return Response.json({
      success: true,
      lead_id: lead.id,
      ...results,
    });
  } catch (error) {
    console.error("[sendWebsiteLeadResponse] Fatal error:", error.message);
    return Response.json(
      { error: error.message || "Failed to send response" },
      { status: 500 }
    );
  }
});
