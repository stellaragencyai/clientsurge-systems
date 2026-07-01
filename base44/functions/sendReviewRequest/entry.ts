import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";
import { invokeCompliantSms } from "../_shared/compliantSmsInvoker.ts";

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...(init.headers || {}),
    },
  });
}

const FALLBACK_SENDER = "noreply@clientsurgesystems.com";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

function getApprovedEmailSender(settings = {}, options = {}) {
  const configured = String(settings?.resend_from_email || "").trim();
  if (configured && configured.includes("@")) return configured;
  const envSender = String(Deno.env.get("RESEND_FROM_EMAIL") || "").trim();
  if (envSender && envSender.includes("@")) return envSender;
  return FALLBACK_SENDER;
}

function getEmailOutreachGate(context = "email outreach") {
  const proofStatus = String(Deno.env.get("EMAIL_DELIVERABILITY_PROOF_STATUS") || "").trim().toLowerCase();
  const proofReadyValues = ["verified", "passed", "production_verified"];
  if (proofReadyValues.includes(proofStatus)) return { ok: true, reason: null, proof_status: proofStatus || "verified" };
  return {
    ok: false,
    reason: `Email outreach blocked: deliverability proof not complete (context: ${context}). Set EMAIL_DELIVERABILITY_PROOF_STATUS=verified to enable.`,
    proof_status: proofStatus || "missing",
  };
}

async function resendFetch(url, options) {
  try { return await fetch(url, options); }
  catch (err) { throw new Error(`Resend request failed: ${err.message || "network error"}`); }
}

async function sendResendEmail(to, subject, body, fromEmail) {
  if (!RESEND_API_KEY) throw new Error("Resend API key missing");
  const response = await resendFetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: fromEmail, to, subject, text: body }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Resend error: ${error?.message || response.status}`);
  }
  const data = await response.json();
  return data.id;
}

async function checkDuplicateReviewRequest(base44, phone, email) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const query = { event_type: "review_request", status: "sent", created_date: { $gte: sevenDaysAgo } };
  try {
    const recentEvents = [];
    if (phone) {
      const phoneEvents = await base44.asServiceRole.entities.CommunicationEvent.filter(
        { ...query, channel: "sms", recipient: phone }, "-created_date", 1,
      );
      if (phoneEvents?.length > 0) recentEvents.push(phoneEvents[0]);
    }
    if (email) {
      const emailEvents = await base44.asServiceRole.entities.CommunicationEvent.filter(
        { ...query, channel: "email", subject: email }, "-created_date", 1,
      );
      if (emailEvents?.length > 0) recentEvents.push(emailEvents[0]);
    }
    return recentEvents.length > 0;
  } catch (err) {
    console.warn("[SendReviewRequest] Duplicate check failed:", err.message);
    return false;
  }
}

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
      lead_id,
      sms_consent,
    } = await req.json();

    const errors = [];
    if (!customer_name || typeof customer_name !== "string") errors.push("customer_name is required");
    if (!business_name || typeof business_name !== "string") errors.push("business_name is required");
    if (!google_review_link || typeof google_review_link !== "string") errors.push("google_review_link is required");
    if (!["sms", "email", "both"].includes(preferred_channel)) errors.push('preferred_channel must be "sms", "email", or "both"');
    if ((preferred_channel === "sms" || preferred_channel === "both") && !customer_phone) errors.push("customer_phone is required for SMS channel");
    if ((preferred_channel === "email" || preferred_channel === "both") && !customer_email) errors.push("customer_email is required for email channel");
    if (errors.length > 0) return secureJson({ success: false, errors }, { status: 400 });

    if (!skip_duplicate_check) {
      const isDuplicate = await checkDuplicateReviewRequest(base44, customer_phone, customer_email);
      if (isDuplicate) return secureJson({ success: false, error: "Review request already sent in the last 7 days", skipped: true }, { status: 409 });
    }

    const now = new Date().toISOString();
    const fromEmail = getApprovedEmailSender({}, { preferLeads: true });
    const firstName = customer_name.split(" ")[0];
    const smsBodies = [
      `Hi ${firstName}, we'd love your feedback! Share your experience with ${business_name}: ${google_review_link}`,
      `Hey ${firstName}, if you enjoyed working with us, we'd appreciate a quick review: ${google_review_link}`,
    ];
    const smsBody = smsBodies[Math.floor(Math.random() * smsBodies.length)];

    const emailSubject = `Share Your Experience with ${business_name}`;
    const emailBody = `Hi ${customer_name},\n\nWe hope you had a great experience with ${business_name}. Your feedback means the world to us!\n\nWould you mind taking a moment to leave a review?\n\nGoogle Review: ${google_review_link}\n${yelp_review_link ? `Yelp Review: ${yelp_review_link}\n` : ""}Thank you!\n\n${business_name} Team`;

    let smsSent = false;
    let smsId = null;
    let smsError = null;

    if (preferred_channel === "sms" || preferred_channel === "both") {
      try {
        const smsResult = await invokeCompliantSms(base44, {
          to: customer_phone,
          body: smsBody,
          lead_id,
          context_id: lead_id,
          sms_consent: sms_consent === true,
          reason: "review_request",
        });
        smsId = smsResult.sid || null;
        smsSent = true;
      } catch (err) {
        smsError = err.message;
        console.error(`[SendReviewRequest] SMS send blocked/failed: ${err.message}`);
      }
    }

    let emailSent = false;
    let emailId = null;
    let emailError = null;

    if (preferred_channel === "email" || preferred_channel === "both") {
      try {
        const sendGate = getEmailOutreachGate("review request email");
        if (!sendGate.ok) {
          emailError = sendGate.reason;
          await base44.asServiceRole.entities.CommunicationEvent.create({
            channel: "email", direction: "outbound", event_type: "review_request", provider: "resend",
            status: "blocked", subject: emailSubject, message_body: emailBody, error_message: emailError,
            metadata_json: JSON.stringify({ customer_name, customer_email, business_name, timestamp: now, proof_status: sendGate.proof_status, requires_owner_action: true }),
          });
          throw new Error(sendGate.reason);
        }
        emailId = await sendResendEmail(customer_email, emailSubject, emailBody, fromEmail);
        emailSent = true;
        await base44.asServiceRole.entities.CommunicationEvent.create({
          channel: "email", direction: "outbound", event_type: "review_request", provider: "resend",
          status: "sent", subject: customer_email, message_body: emailBody, provider_message_id: emailId,
          metadata_json: JSON.stringify({ customer_name, customer_email, business_name, google_review_link, yelp_review_link, timestamp: now }),
        });
      } catch (err) {
        emailError = err.message;
        console.error(`[SendReviewRequest] Email send failed: ${err.message}`);
        try {
          await base44.asServiceRole.entities.CommunicationEvent.create({
            channel: "email", direction: "outbound", event_type: "review_request", provider: "resend",
            status: "failed", subject: customer_email || emailSubject, message_body: emailBody, error_message: emailError,
            metadata_json: JSON.stringify({ customer_name, customer_email, business_name, timestamp: now }),
          });
        } catch (logErr) {
          console.warn("[SendReviewRequest] Failed to log email error event:", logErr.message);
        }
      }
    }

    const needsSms = preferred_channel === "sms" || preferred_channel === "both";
    const needsEmail = preferred_channel === "email" || preferred_channel === "both";
    const allFailed = (!needsSms || !smsSent) && (!needsEmail || !emailSent);

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
    return secureJson({ success: false, error: error.message }, { status: 500 });
  }
});
