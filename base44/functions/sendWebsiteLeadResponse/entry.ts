import { secureJson } from "../_shared/response.ts";
/**
 * Website Lead Immediate Response
 * Sends instant SMS + email to new website form submissions
 * Reuses patterns from processMissedCallFollowUps for consistency
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { buildFailedSendRetryJob } from "../_shared/automationRetry.js";
import { resendFetch } from "../_shared/resendFetch.js";
import { appendSmsOptOut } from "../_shared/smsOptOut.js";
import { twilioFetch } from "../_shared/providerFetch.js";

async function sendSMS(base44, lead, messageBody, fromNumber) {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const statusCallbackUrl = Deno.env.get("TWILIO_SMS_STATUS_CALLBACK_URL");

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error("Twilio credentials missing");
  }

  const res = await twilioFetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: lead.phone_number,
        From: fromNumber,
        Body: appendSmsOptOut(messageBody),
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

async function sendEmail(base44, lead, subject, body, fromEmail, replyToEmail) {
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
      from: fromEmail || "support@clientsurgesystems.com",
      reply_to: replyToEmail || "nolan@clientsurgesystems.com",
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

function getIndustryKey(lead) {
  const tags = Array.isArray(lead.industry_tags) ? lead.industry_tags : [];
  const values = [lead.industry_slug, lead.business_type, lead.service_interest, ...tags]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
  if (values.some((value) => value.includes("roof"))) return "roofing";
  if (values.some((value) => value.includes("hvac") || value.includes("heating") || value.includes("air_condition"))) return "hvac";
  if (values.some((value) => value.includes("plumb") || value.includes("drain") || value.includes("water_heater"))) return "plumbing";
  if (values.some((value) => value.includes("dental") || value.includes("orthodont"))) return "dental";
  if (values.some((value) => value.includes("med_spa") || value.includes("med-spa") || value.includes("aesthetic"))) return "med_spa";
  return "general";
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
      return secureJson(
        { error: "lead_id required" },
        { status: 400 }
      );
    }

    // Load lead
    const lead = await base44.asServiceRole.entities.WebsiteLead.get(leadId);
    if (!lead) {
      return secureJson(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // Check automation enabled
    if (!lead.automation_enabled) {
      console.log(
        `[sendWebsiteLeadResponse] Automation disabled for lead ${lead.id}`
      );
      return secureJson({
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
      Deno.env.get("RESEND_FROM_LEADS") ||
      settings.resend_from_email ||
      Deno.env.get("SUPPORT_EMAIL") ||
      "support@clientsurgesystems.com";
    const replyToEmail =
      Deno.env.get("RESEND_REPLY_TO_LEADS") ||
      Deno.env.get("ADMIN_EMAIL") ||
      "nolan@clientsurgesystems.com";
    const bookingLink = settings.booking_link_default || "";

    const industryTemplates = {
      roofing: {
        sms: `Hey {first_name}, we got your roofing automation audit request. We'll review missed calls, storm and quote requests, follow-up gaps, and estimate booking. Want the fastest next step? Book here: ${bookingLink}`,
        email_subject: "Your roofing automation audit request is in",
        email_body: `Hey {first_name},

Thanks for requesting a roofing automation audit.

We will review the places roofing companies usually lose booked jobs: missed calls during storms, slow quote-request response, estimate follow-up gaps, and booking friction.

The fastest way to move forward is to book a quick call here:
${bookingLink}

Or reply to this email with your current lead sources and estimate booking process.

- ClientSurge Systems`,
      },
      hvac: {
        sms: `Hey {first_name}, we got your HVAC automation audit request. We'll review missed emergency calls, service booking, quote follow-up, and seasonal demand gaps. Fastest next step: ${bookingLink}`,
        email_subject: "Your HVAC automation audit request is in",
        email_body: `Hey {first_name},

Thanks for requesting an HVAC automation audit.

We will review where HVAC teams typically lose jobs: missed emergency calls, slow tune-up follow-up, estimate delays, and booking friction during busy weather windows.

The fastest way to move forward is to book a quick call here:
${bookingLink}

Or reply to this email with your current call volume, service area, and follow-up process.

- ClientSurge Systems`,
      },
      dental: {
        sms: `Hey {first_name}, we got your dental automation audit request. We'll review new-patient inquiries, missed calls, consult booking, and treatment-plan follow-up. Fastest next step: ${bookingLink}`,
        email_subject: "Your dental automation audit request is in",
        email_body: `Hey {first_name},

Thanks for requesting a dental automation audit.

We will review where dental practices typically lose new-patient opportunities: missed calls, slow front-desk callbacks, consult booking gaps, and treatment-plan follow-up.

The fastest way to move forward is to book a quick call here:
${bookingLink}

Or reply to this email with your current new-patient intake and follow-up process.

- ClientSurge Systems`,
      },
      med_spa: {
        sms: `Hey {first_name}, we got your med spa automation audit request. We'll review consult requests, aesthetic treatment inquiries, missed DMs/calls, booking handoff, and nurture gaps. Fastest next step: ${bookingLink}`,
        email_subject: "Your med spa automation audit request is in",
        email_body: `Hey {first_name},

Thanks for requesting a med spa automation audit.

We will review where aesthetic clinics typically lose bookings: missed consult requests, slow treatment-inquiry response, DM/call handoff gaps, and nurture before the appointment.

The fastest way to move forward is to book a quick call here:
${bookingLink}

Or reply to this email with your current lead sources, services, and booking handoff process.

- ClientSurge Systems`,
      },
      plumbing: {
        sms: `Hey {first_name}, we got your plumbing automation audit request. We'll review emergency leak calls, drain and water heater inquiries, missed-call recovery, after-hours capture, and dispatch handoff. Fastest next step: ${bookingLink}`,
        email_subject: "Your plumbing automation audit request is in",
        email_body: `Hey {first_name},

Thanks for requesting a plumbing automation audit.

We will review where plumbing companies typically lose urgent jobs: missed emergency calls, slow drain or water heater follow-up, after-hours capture gaps, and dispatch handoff friction.

The fastest way to move forward is to book a quick call here:
${bookingLink}

Or reply to this email with your current service area, dispatch process, and highest-priority plumbing calls.

- ClientSurge Systems`,
      },
      general: {
        sms: `Hey {first_name}, thanks for reaching out about {service_interest}. We got your message and will be in touch shortly. Need help faster? Book a time: ${bookingLink}`,
        email_subject: "Got your request - here's the next step",
        email_body: `Hey {first_name},

Thanks for reaching out to {business_name} about {service_interest}.

We got your request and want to help you find the right solution.

The fastest way to move forward is to book a quick call here:
${bookingLink}

Or just reply to this email with any questions.

– {business_name}`,
      },
    };
    const templates = industryTemplates[getIndustryKey(lead)] || industryTemplates.general;

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
          const outboundSmsBody = appendSmsOptOut(messageBody);
          const smsResult = await sendSMS(
            base44,
            lead,
            outboundSmsBody,
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
            message_body: outboundSmsBody,
            provider_message_id: smsResult.messageId,
            metadata_json: JSON.stringify({
              step: 0,
              website_lead_response: true,
              timestamp: new Date().toISOString(),
            }),
          });

          results.sms_sent = true;
          console.log(
            `[sendWebsiteLeadResponse] SMS sent for lead ${lead.id}`
          );
          base44.asServiceRole.functions.invoke('logCommunication', {
            related_entity_type: "WebsiteLead", related_entity_id: lead.id,
            lead_email: lead.email, lead_phone: lead.phone_number, lead_name: lead.full_name,
            channel: "sms", provider: "twilio", direction: "outbound",
            trigger_name: "initial_response", to_address: lead.phone_number,
            from_address: fromNumber, body_preview: outboundSmsBody.slice(0, 200),
            provider_message_id: smsResult.messageId, provider_status: "queued",
            delivery_status: "sent", skip_lead_update: true,
          }).catch(() => {});
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
        base44.asServiceRole.functions.invoke('logCommunication', {
          related_entity_type: "WebsiteLead", related_entity_id: lead.id,
          lead_phone: lead.phone_number, lead_name: lead.full_name,
          channel: "sms", provider: "twilio", direction: "outbound",
          trigger_name: "initial_response", to_address: lead.phone_number,
          delivery_status: "failed", error_message: err.message, skip_lead_update: true,
        }).catch(() => {});
      }
    } else {
      console.log(`[sendWebsiteLeadResponse] No phone for lead ${lead.id}`);
      base44.asServiceRole.functions.invoke('logCommunication', {
        related_entity_type: "WebsiteLead", related_entity_id: lead.id,
        channel: "sms", provider: "twilio", direction: "outbound",
        trigger_name: "initial_response", delivery_status: "skipped",
        error_message: "No phone number on lead", skip_lead_update: true,
      }).catch(() => {});
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
            fromEmail,
            replyToEmail
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
            `[sendWebsiteLeadResponse] Email sent for lead ${lead.id}`
          );
          base44.asServiceRole.functions.invoke('logCommunication', {
            related_entity_type: "WebsiteLead", related_entity_id: lead.id,
            lead_email: lead.email, lead_name: lead.full_name,
            channel: "email", provider: "resend", direction: "outbound",
            trigger_name: "initial_response", to_address: lead.email,
            from_address: fromEmail, subject: subject, body_preview: body.slice(0, 200),
            provider_message_id: emailResult.messageId, provider_status: "sent",
            delivery_status: "sent", skip_lead_update: true,
          }).catch(() => {});
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
        base44.asServiceRole.functions.invoke('logCommunication', {
          related_entity_type: "WebsiteLead", related_entity_id: lead.id,
          lead_email: lead.email, lead_name: lead.full_name,
          channel: "email", provider: "resend", direction: "outbound",
          trigger_name: "initial_response", to_address: lead.email,
          delivery_status: "failed", error_message: err.message, skip_lead_update: true,
        }).catch(() => {});
      }
    } else {
      console.log(`[sendWebsiteLeadResponse] No email for lead ${lead.id}`);
      base44.asServiceRole.functions.invoke('logCommunication', {
        related_entity_type: "WebsiteLead", related_entity_id: lead.id,
        channel: "email", provider: "resend", direction: "outbound",
        trigger_name: "initial_response", delivery_status: "skipped",
        error_message: "No email address on lead", skip_lead_update: true,
      }).catch(() => {});
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
      const now = new Date().toISOString();
      const updateData = {
        lead_status: "contacted",
        initial_response_sent_at: now,
        follow_up_step: 0,
        next_follow_up_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        last_message_sent: now,
        last_engagement_at: now,
      };
      if (results.sms_sent) {
        updateData.sms_attempt_count = (lead.sms_attempt_count || 0) + 1;
        updateData.last_engagement_type = "sms";
      }
      if (results.email_sent) {
        updateData.email_attempt_count = (lead.email_attempt_count || 0) + 1;
        if (!results.sms_sent) {
          updateData.last_engagement_type = "email";
        }
      }
      await base44.asServiceRole.entities.WebsiteLead.update(lead.id, updateData);
    }

    return secureJson({
      success: true,
      lead_id: lead.id,
      ...results,
    });
  } catch (error) {
    console.error("[sendWebsiteLeadResponse] Fatal error:", error.message);
    return secureJson(
      { error: error.message || "Failed to send response" },
      { status: 500 }
    );
  }
});