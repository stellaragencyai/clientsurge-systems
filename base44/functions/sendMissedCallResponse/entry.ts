/**
 * Missed Call Response Handler
 * Triggered: When a Leads record has event_type = "call_missed"
 * 
 * Sends:
 * 1. SMS #1 (IMMEDIATE) - via Twilio
 * 2. EMAIL #1 (IMMEDIATE if email exists) - via Resend
 * 
 * Features:
 * - Idempotent: checks if SMS/email already sent for this lead
 * - Respects admin settings (smsEnabled, emailEnabled)
 * - Uses customizable templates from AdminSettings
 * - Logs all attempts (success/failure/skipped)
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data } = payload;

    // ─────────────────────────────────────────────────────
    // VALIDATION: Only trigger on missed call events
    // ─────────────────────────────────────────────────────
    if (!data?.id || data.status !== "Contacted") {
      console.log("[sendMissedCallResponse] Skipping - not a missed call trigger");
      return Response.json({ status: "skipped", reason: "not_missed_call" });
    }

    const leadId = data.id;
    const leadPhone = data.phone;
    const leadEmail = data.email;
    const leadName = data.full_name || "Caller";

    console.log(`[sendMissedCallResponse] Processing lead ${leadId}: ${leadName}`);

    // ─────────────────────────────────────────────────────
    // FETCH SETTINGS & TEMPLATES
    // ─────────────────────────────────────────────────────
    const settings = await base44.asServiceRole.entities.AdminSettings.list();
    const adminSettings = settings?.length > 0 ? settings[0] : {};

    const businessName = adminSettings.business_name ||
      Deno.env.get("DEFAULT_BUSINESS_NAME") ||
      "Our Team";
    const bookingLink = adminSettings.booking_link_default || "";
    const twilioNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
    const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL");

    console.log("[sendMissedCallResponse] Config loaded:", {
      businessName,
      hasBookingLink: !!bookingLink,
      hasTwilioNumber: !!twilioNumber,
      hasResendEmail: !!resendFromEmail,
    });

    // ─────────────────────────────────────────────────────
    // SMS #1: Check if already sent (idempotency)
    // ─────────────────────────────────────────────────────
    const existingSms = await base44.asServiceRole.entities.CommunicationEvent.filter(
      {
        lead_id: leadId,
        channel: "sms",
        event_type: "sms_sent",
        subject: { $regex: "missed" },
      },
      "-created_date",
      1
    );

    let smsSent = false;
    let smsResult = { status: "skipped", reason: "unknown" };

    if (existingSms?.length > 0) {
      console.log("[sendMissedCallResponse] SMS already sent for this lead - skipping");
      smsResult = { status: "skipped", reason: "already_sent" };
    } else if (!leadPhone) {
      console.log("[sendMissedCallResponse] No phone number - skipping SMS");
      smsResult = { status: "skipped", reason: "no_phone" };
      await logEvent(base44, leadId, "sms", "skipped", "no_phone");
    } else if (!twilioNumber) {
      console.warn("[sendMissedCallResponse] Twilio not configured - skipping SMS");
      smsResult = { status: "skipped", reason: "twilio_not_configured" };
      await logEvent(base44, leadId, "sms", "skipped", "twilio_not_configured");
    } else {
      // Send SMS
      const smsTemplate =
        adminSettings.missed_call_sms_template ||
        `Hey ${leadName}, this is ${businessName} — sorry we missed your call.\n\nWhat were you looking to get help with?`;

      const smsMessage = smsTemplate
        .replace(/\[Business Name\]/g, businessName)
        .replace(/\[Booking Link\]/g, bookingLink);

      try {
        const smsResponse = await sendTwilioSMS(base44, {
          phone: leadPhone,
          message: smsMessage,
          leadId,
        });

        if (smsResponse.success) {
          smsSent = true;
          smsResult = {
            status: "sent",
            messageSid: smsResponse.messageSid,
          };
          await logEvent(base44, leadId, "sms", "sent", null, smsResponse.messageSid);
          console.log("[sendMissedCallResponse] SMS sent successfully");
        } else {
          smsResult = { status: "failed", error: smsResponse.error };
          await logEvent(base44, leadId, "sms", "failed", smsResponse.error);
          console.warn("[sendMissedCallResponse] SMS send failed:", smsResponse.error);
        }
      } catch (error) {
        smsResult = { status: "failed", error: error.message };
        await logEvent(base44, leadId, "sms", "failed", error.message);
        console.error("[sendMissedCallResponse] SMS exception:", error.message);
      }
    }

    // ─────────────────────────────────────────────────────
    // EMAIL #1: Check if already sent (idempotency)
    // ─────────────────────────────────────────────────────
    const existingEmail = await base44.asServiceRole.entities.CommunicationEvent.filter(
      {
        lead_id: leadId,
        channel: "email",
        event_type: "email_sent",
        subject: { $regex: "missed" },
      },
      "-created_date",
      1
    );

    let emailSent = false;
    let emailResult = { status: "skipped", reason: "unknown" };

    if (existingEmail?.length > 0) {
      console.log("[sendMissedCallResponse] Email already sent for this lead - skipping");
      emailResult = { status: "skipped", reason: "already_sent" };
    } else if (!leadEmail) {
      console.log("[sendMissedCallResponse] No email address - skipping email");
      emailResult = { status: "skipped", reason: "no_email" };
      await logEvent(base44, leadId, "email", "skipped", "no_email");
    } else if (!resendFromEmail) {
      console.warn("[sendMissedCallResponse] Resend not configured - skipping email");
      emailResult = { status: "skipped", reason: "resend_not_configured" };
      await logEvent(base44, leadId, "email", "skipped", "resend_not_configured");
    } else {
      // Send Email
      const emailSubject = "Sorry we missed your call — quick question";
      const emailBody = `Hey ${leadName},

just saw you tried calling us.

We might have been helping another customer.

What were you needing help with?

${bookingLink ? `You can reply here or book directly below:\n${bookingLink}` : "You can reply here to get started."}

– ${businessName}`;

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: leadEmail,
          subject: emailSubject,
          body: emailBody,
          from_name: businessName,
        });

        emailSent = true;
        emailResult = { status: "sent" };
        await logEvent(base44, leadId, "email", "sent", null);
        console.log("[sendMissedCallResponse] Email sent successfully");
      } catch (error) {
        emailResult = { status: "failed", error: error.message };
        await logEvent(base44, leadId, "email", "failed", error.message);
        console.error("[sendMissedCallResponse] Email send failed:", error.message);
      }
    }

    // ─────────────────────────────────────────────────────
    // RESPONSE
    // ─────────────────────────────────────────────────────
    console.log("[sendMissedCallResponse] Completed:", {
      lead_id: leadId,
      sms: smsResult.status,
      email: emailResult.status,
    });

    return Response.json({
      status: "completed",
      lead_id: leadId,
      sms: smsResult,
      email: emailResult,
    });
  } catch (error) {
    console.error("[sendMissedCallResponse] Fatal error:", error.message);
    return Response.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
});

// ─────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────

async function sendTwilioSMS(base44, { phone, message, leadId }) {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

  if (!accountSid || !authToken || !fromNumber) {
    return { success: false, error: "Twilio credentials not configured" };
  }

  try {
    const auth = btoa(`${accountSid}:${authToken}`);
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: phone,
          Body: message,
        }).toString(),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Twilio API error",
      };
    }

    return { success: true, messageSid: data.sid };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function logEvent(base44, leadId, channel, status, reason, messageSid) {
  try {
    const channelMap = { sms: "sms", email: "email" };
    const subjectMap = {
      sms: "Missed call SMS recovery",
      email: "Missed call email recovery",
    };

    let messageBody = `${status.toUpperCase()}`;
    if (reason) messageBody += ` - ${reason}`;
    if (messageSid) messageBody += ` (${messageSid})`;

    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: leadId,
      channel: channelMap[channel],
      direction: "outbound",
      event_type: channel === "sms" ? "sms_sent" : "email_sent",
      provider: channel === "sms" ? "twilio" : "resend",
      status,
      subject: `[MISSED CALL] ${subjectMap[channel]}`,
      message_body: messageBody,
      provider_message_id: messageSid || null,
      metadata_json: JSON.stringify({
        trigger: "missed_call_response",
        channel,
        reason: reason || null,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error("[logEvent] Failed to log:", error.message);
  }
}