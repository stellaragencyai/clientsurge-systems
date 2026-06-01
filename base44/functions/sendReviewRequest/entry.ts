import { secureJson } from "../_shared/response.ts";
/**
 * Send Review Request — SMS & Email
 * Called manually by admin or via automation
 * Sends review requests via Twilio SMS and/or Resend email
 *
 * Input:
 *  - customer_name (required)
 *  - customer_phone (required for SMS)
 *  - customer_email (required for email)
 *  - business_name (required)
 *  - google_review_link (required)
 *  - yelp_review_link (optional)
 *  - preferred_channel: "sms" | "email" | "both" (default: "both")
 *  - skip_duplicate_check: boolean (default: false)
 *
 * Output:
 *  - success: boolean
 *  - sms_sent: boolean
 *  - email_sent: boolean
 *  - sms_id: string or null
 *  - email_id: string or null
 *  - errors: array
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resendFetch } from "../_shared/resendFetch.js";
import { appendSmsOptOut } from "../_shared/smsOptOut.js";
import { twilioFetch } from "../_shared/providerFetch.js";
import { getReviewFromEmail, getSupportReplyTo } from "../_shared/emailConfig.js";

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
  const response = await twilioFetch(TWILIO_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      From: TWILIO_FROM_NUMBER,
      To: toNumber,
      Body: appendSmsOptOut(messageBody),
    }).toString(),
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

  const response = await resendFetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail || getReviewFromEmail(),
      reply_to: getSupportReplyTo(),
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
// DUPLICATE CHECK (past 7 days)
// ─────────────────────────────────────────────────────────
async function checkDuplicateReviewRequest(base44, phone, email) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const query = {
    event_type: "review_request",
    status: "sent",
    created_date: { $gte: sevenDaysAgo },
  };

  try {
    let recentEvents = [];

    if (phone) {
      const phoneEvents = await base44.asServiceRole.entities.CommunicationEvent.filter(
        {
          ...query,
          channel: "sms",
          subject: { $regex: phone.replace(/\D/g, "") },
        },
        "-created_date",
        1
      );
      if (phoneEvents?.length > 0) recentEvents.push(phoneEvents[0]);
    }

    if (email) {
      const emailEvents = await base44.asServiceRole.entities.CommunicationEvent.filter(
        { ...query, channel: "email", subject: email },
        "-created_date",
        1
      );
      if (emailEvents?.length > 0) recentEvents.push(emailEvents[0]);
    }

    return recentEvents.length > 0;
  } catch (err) {
    console.warn("[SendReviewRequest] Duplicate check failed:", err.message);
    return false; // Fail-open: allow send if check fails
  }
}

// ─────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const {
      customer_name,
      customer_phone,
      customer_email,
      business_name,
      google_review_link,
      yelp_review_link,
      preferred_channel = "both",
      skip_duplicate_check = false,
    } = await req.json();

    // ─────────────────────────────────────────────────────────
    // VALIDATION
    // ─────────────────────────────────────────────────────────
    const errors = [];

    if (!customer_name || typeof customer_name !== "string") {
      errors.push("customer_name is required");
    }
    if (!business_name || typeof business_name !== "string") {
      errors.push("business_name is required");
    }
    if (!google_review_link || typeof google_review_link !== "string") {
      errors.push("google_review_link is required");
    }
    if (!["sms", "email", "both"].includes(preferred_channel)) {
      errors.push('preferred_channel must be "sms", "email", or "both"');
    }

    if ((preferred_channel === "sms" || preferred_channel === "both") && !customer_phone) {
      errors.push("customer_phone is required for SMS channel");
    }
    if ((preferred_channel === "email" || preferred_channel === "both") && !customer_email) {
      errors.push("customer_email is required for email channel");
    }

    if (errors.length > 0) {
      console.error("[SendReviewRequest] Validation errors:", errors);
      return secureJson({ success: false, errors }, { status: 400 });
    }

    console.log(
      `[SendReviewRequest] Processing review request for ${customer_name} (${business_name})`
    );

    // ─────────────────────────────────────────────────────────
    // DUPLICATE CHECK (unless skipped)
    // ─────────────────────────────────────────────────────────
    if (!skip_duplicate_check) {
      const isDuplicate = await checkDuplicateReviewRequest(base44, customer_phone, customer_email);
      if (isDuplicate) {
        console.log(
          `[SendReviewRequest] Duplicate review request within 7 days for ${customer_phone || customer_email} — skipping`
        );
        return secureJson(
          {
            success: false,
            error: "Review request already sent in the last 7 days",
            skipped: true,
          },
          { status: 409 }
        );
      }
    }

    // ─────────────────────────────────────────────────────────
    // BUILD MESSAGE CONTENT
    // ─────────────────────────────────────────────────────────
    const now = new Date().toISOString();
    const fromEmail = Deno.env.get("RESEND_FROM_REVIEWS") || getReviewFromEmail();

    const smsBodies = [
      `Hi ${customer_name.split(" ")[0]}, we'd love your feedback! Share your experience with ${business_name}: ${google_review_link}`,
      `Hey ${customer_name.split(" ")[0]}, if you enjoyed working with us, we'd appreciate a quick review: ${google_review_link}`,
    ];
    const smsBody = appendSmsOptOut(smsBodies[Math.floor(Math.random() * smsBodies.length)]);

    const emailSubject = `Share Your Experience with ${business_name}`;
    const emailBody = `Hi ${customer_name},

We hope you had a great experience with ${business_name}. Your feedback means the world to us!

Would you mind taking a moment to leave a review? It helps other businesses find us and lets us know how we're doing.

🌟 Google Review: ${google_review_link}
${yelp_review_link ? `⭐ Yelp Review: ${yelp_review_link}` : ""}

Thank you!

${business_name} Team`;

    // ─────────────────────────────────────────────────────────
    // SEND SMS
    // ─────────────────────────────────────────────────────────
    let smsSent = false;
    let smsId = null;
    let smsError = null;

    if (preferred_channel === "sms" || preferred_channel === "both") {
      try {
        smsId = await sendTwilioSms(customer_phone, smsBody);
        smsSent = true;
        console.log(`[SendReviewRequest] SMS sent to ${customer_phone} (SID: ${smsId})`);

        await base44.asServiceRole.entities.CommunicationEvent.create({
          channel: "sms",
          direction: "outbound",
          event_type: "review_request",
          provider: "twilio",
          status: "sent",
          subject: customer_phone,
          message_body: smsBody,
          provider_message_id: smsId,
          metadata_json: JSON.stringify({
            customer_name,
            business_name,
            google_review_link,
            yelp_review_link,
            timestamp: now,
          }),
        });
      } catch (err) {
        smsError = err.message;
        console.error(`[SendReviewRequest] SMS send failed: ${err.message}`);

        try {
          await base44.asServiceRole.entities.CommunicationEvent.create({
            channel: "sms",
            direction: "outbound",
            event_type: "review_request",
            provider: "twilio",
            status: "failed",
            subject: customer_phone,
            message_body: smsBody,
            error_message: smsError,
            metadata_json: JSON.stringify({
              customer_name,
              business_name,
              timestamp: now,
            }),
          });
        } catch (logErr) {
          console.warn("[SendReviewRequest] Failed to log SMS error event:", logErr.message);
        }
      }
    }

    // ─────────────────────────────────────────────────────────
    // SEND EMAIL
    // ─────────────────────────────────────────────────────────
    let emailSent = false;
    let emailId = null;
    let emailError = null;

    if (preferred_channel === "email" || preferred_channel === "both") {
      try {
        emailId = await sendResendEmail(
          customer_email,
          emailSubject,
          emailBody,
          fromEmail
        );
        emailSent = true;
        console.log(`[SendReviewRequest] Email sent to ${customer_email} (ID: ${emailId})`);

        await base44.asServiceRole.entities.CommunicationEvent.create({
          channel: "email",
          direction: "outbound",
          event_type: "review_request",
          provider: "resend",
          status: "sent",
          subject: emailSubject,
          message_body: emailBody,
          provider_message_id: emailId,
          metadata_json: JSON.stringify({
            customer_name,
            customer_email,
            business_name,
            google_review_link,
            yelp_review_link,
            timestamp: now,
          }),
        });
      } catch (err) {
        emailError = err.message;
        console.error(`[SendReviewRequest] Email send failed: ${err.message}`);

        try {
          await base44.asServiceRole.entities.CommunicationEvent.create({
            channel: "email",
            direction: "outbound",
            event_type: "review_request",
            provider: "resend",
            status: "failed",
            subject: emailSubject,
            message_body: emailBody,
            error_message: emailError,
            metadata_json: JSON.stringify({
              customer_name,
              customer_email,
              business_name,
              timestamp: now,
            }),
          });
        } catch (logErr) {
          console.warn("[SendReviewRequest] Failed to log email error event:", logErr.message);
        }
      }
    }

    // ─────────────────────────────────────────────────────────
    // RETURN RESULT
    // ─────────────────────────────────────────────────────────
    const allFailed = (preferred_channel === "sms" || preferred_channel === "both") && !smsSent
      && (preferred_channel === "email" || preferred_channel === "both") && !emailSent;

    return secureJson({
      success: !allFailed,
      sms_sent: smsSent,
      email_sent: emailSent,
      sms_id: smsId,
      email_id: emailId,
      errors: [smsError, emailError].filter(Boolean),
    });
  } catch (error) {
    console.error("[SendReviewRequest] Fatal error:", error.message);
    return secureJson(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
});
