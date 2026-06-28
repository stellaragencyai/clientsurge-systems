/**
 * Tasks 17 & 18: Email notification when onboarding submission completes
 * or when OnboardingSubmission status moves to "completed".
 *
 * Called by entity automation on OnboardingSubmission create/update.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { secureJson } from "../_shared/response.ts";
import { resendFetch } from "../_shared/resendFetch.js";

const ADMIN_PORTAL_URL = Deno.env.get("APP_URL") || "https://clientsurgesystems.com";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const DEFAULT_FROM_EMAIL = "noreply@clientsurgesystems.com";
const DEFAULT_ADMIN_NOTIFICATION_EMAIL = "nolan@clientsurgesystems.com";

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: unknown): value is string {
  const email = normalizeString(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function splitEmailList(value: unknown): string[] {
  if (!value) return [];

  return String(value)
    .split(/[,;\s]+/)
    .map((email) => email.trim())
    .filter(Boolean);
}

function getValidEmailList(...values: unknown[]): string[] {
  const emails = values
    .flatMap(splitEmailList)
    .filter(isValidEmail);

  return emails.length ? Array.from(new Set(emails)) : [DEFAULT_ADMIN_NOTIFICATION_EMAIL];
}

function getFromEmail(): string {
  const configuredFrom = normalizeString(Deno.env.get("RESEND_FROM_EMAIL"));
  return isValidEmail(configuredFrom) ? configuredFrom : DEFAULT_FROM_EMAIL;
}

function normalizeStatus(value: unknown): string {
  return normalizeString(value).toLowerCase();
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cleanSubjectValue(value: unknown, fallback = "New Client"): string {
  const cleaned = normalizeString(value).replace(/[\r\n]+/g, " ").slice(0, 120);
  return cleaned || fallback;
}

const FROM_EMAIL = getFromEmail();
const ADMIN_NOTIFICATION_EMAILS = getValidEmailList(
  Deno.env.get("ADMIN_NOTIFICATION_EMAIL"),
  Deno.env.get("ADMIN_EMAIL"),
);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));

    // Base44 entity automation payload shape:
    // { event, data, old_data, payload_too_large }
    const event = payload.event || {};
    const data = payload.data || payload;
    const oldData = payload.old_data || payload.oldData || {};
    const submissionData = data.submission_data || {};
    const oldSubmissionData = oldData.submission_data || {};

    const eventType = normalizeString(event?.type || payload.event_type || payload.type).toLowerCase();
    const currentStatus = normalizeStatus(data.status || submissionData.status);
    const previousStatus = normalizeStatus(oldData.status || oldSubmissionData.status);

    const isCreate = eventType === "create" || eventType === "created";
    const isUpdate = eventType === "update" || eventType === "updated";

    // Notify when the onboarding submission is created, because creation means the form was submitted.
    // Also notify later if an existing submission is moved into completed status.
    const updatedToCompleted = isUpdate && currentStatus === "completed" && previousStatus !== "completed";
    const manualCompletedSmokeTest = !eventType && currentStatus === "completed" && previousStatus !== "completed";

    if (!isCreate && !updatedToCompleted && !manualCompletedSmokeTest) {
      return secureJson({
        skipped: true,
        reason: "Submission was not newly created and did not move to completed",
        eventType,
        currentStatus,
        previousStatus,
      });
    }

    if (!RESEND_API_KEY) {
      console.error("[notifyOnboardingComplete] RESEND_API_KEY not set");
      return secureJson({ error: "Email provider not configured. Missing RESEND_API_KEY." }, { status: 500 });
    }

    const id = data.id || data._id || null;
    const lead_id = data.lead_id || data.leadId || submissionData.lead_id || null;
    const order_id = data.order_id || data.orderId || submissionData.order_id || null;
    const client_id = data.client_id || data.clientId || submissionData.client_id || null;
    const client_email = data.client_email || data.email || submissionData.client_email || submissionData.email || "";
    const business_name = data.business_name || submissionData.business_name || "";

    const safeBusinessName = escapeHtml(business_name || "Not provided");
    const safeClientEmail = escapeHtml(client_email || "Not provided");
    const safeOrderId = escapeHtml(order_id || "");
    const displayName = cleanSubjectValue(business_name || client_email || "New Client");

    const adminTrackingUrl = `${ADMIN_PORTAL_URL}/admin?tab=automation-tracking`;
    const installQueueUrl = `${ADMIN_PORTAL_URL}/admin?tab=install-queue`;
    const submissionDate = new Date().toLocaleString("en-US", { timeZone: "America/Phoenix" });

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #0A1628;">
        <div style="margin-bottom: 28px;">
          <img src="${ADMIN_PORTAL_URL}/og-image.png" alt="ClientSurge Systems" style="height: 40px; width: auto;" />
        </div>
        
        <div style="background: linear-gradient(135deg, #003B8F 0%, #0088CC 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; color: white;">
          <p style="font-size: 12px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; margin: 0 0 8px; opacity: 0.8;">Action Required</p>
          <h1 style="font-size: 22px; font-weight: 800; margin: 0 0 8px; line-height: 1.3;">New Onboarding Submission Completed ✓</h1>
          <p style="font-size: 14px; margin: 0; opacity: 0.85;">A client has completed their onboarding form and is ready for setup.</p>
        </div>

        <div style="background: #f8fbff; border: 1px solid rgba(0,136,204,0.15); border-radius: 8px; padding: 18px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="font-size: 12px; color: #666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; padding: 5px 0; width: 40%;">Business</td>
              <td style="font-size: 14px; font-weight: 600; color: #0A1628; padding: 5px 0;">${safeBusinessName}</td>
            </tr>
            <tr>
              <td style="font-size: 12px; color: #666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; padding: 5px 0;">Client Email</td>
              <td style="font-size: 14px; color: #0A1628; padding: 5px 0;">${safeClientEmail}</td>
            </tr>
            ${order_id ? `<tr>
              <td style="font-size: 12px; color: #666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; padding: 5px 0;">Order ID</td>
              <td style="font-size: 14px; color: #0A1628; padding: 5px 0; font-family: monospace;">${safeOrderId}</td>
            </tr>` : ""}
            <tr>
              <td style="font-size: 12px; color: #666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; padding: 5px 0;">Submitted</td>
              <td style="font-size: 14px; color: #0A1628; padding: 5px 0;">${submissionDate} MST</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin-bottom: 28px;">
          <a href="${adminTrackingUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #0088CC 0%, #003B8F 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 14px rgba(0,136,204,0.35);">
            View Automation Tracking →
          </a>
        </div>

        <p style="font-size: 13px; color: #666; text-align: center; line-height: 1.6;">
          Next step: Review the submission details and begin service configuration in the admin panel.<br>
          <a href="${installQueueUrl}" style="color: #0088CC; text-decoration: none; font-weight: 600;">Open Install Queue</a>
        </p>

        <hr style="border: none; border-top: 1px solid #e5eaf0; margin: 24px 0;" />
        <p style="font-size: 11px; color: #999; text-align: center; margin: 0;">
          ClientSurge Systems · Phoenix, AZ · <a href="${ADMIN_PORTAL_URL}" style="color: #999;">clientsurgesystems.com</a>
        </p>
      </div>
    `;

    const emailText = `
New onboarding submission completed.

Business: ${business_name || "Not provided"}
Client Email: ${client_email || "Not provided"}
Order ID: ${order_id || "Not provided"}
Submitted: ${submissionDate} MST

View Automation Tracking:
${adminTrackingUrl}

Open Install Queue:
${installQueueUrl}
    `.trim();

    const emailRes = await resendFetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `ClientSurge Systems <${FROM_EMAIL}>`,
        to: ADMIN_NOTIFICATION_EMAILS,
        subject: `🟢 New Onboarding Submission — ${displayName}`,
        html: emailHtml,
        text: emailText,
        tags: [{ name: "category", value: "onboarding_notification" }],
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("[notifyOnboardingComplete] Resend error:", errText);
      return secureJson({
        error: "Email send failed",
        detail: errText,
        from: FROM_EMAIL,
        to: ADMIN_NOTIFICATION_EMAILS,
      }, { status: 500 });
    }

    let providerMessageId: string | null = null;
    try {
      const providerPayload = await emailRes.clone().json();
      providerMessageId = typeof providerPayload?.id === "string" ? providerPayload.id : null;
    } catch (_) {
      providerMessageId = null;
    }

    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: lead_id || null,
      order_id: order_id || null,
      client_id: client_id || null,
      context_type: "onboarding_submission",
      context_id: id || null,
      channel: "email",
      direction: "system",
      event_type: "status_update",
      provider: "resend",
      status: "sent",
      subject: `Onboarding submission complete — ${displayName}`,
      message_body: `Admin notification sent for completed onboarding: ${client_email || "No client email provided"}`,
      provider_message_id: providerMessageId || undefined,
      metadata_json: JSON.stringify({
        notified: ADMIN_NOTIFICATION_EMAILS,
        from: FROM_EMAIL,
        eventType,
        currentStatus,
        previousStatus,
      }),
      environment: "production",
      dashboard_truth_status: "trusted",
      dashboard_truth_notes: "Resend accepted admin onboarding completion notification.",
    }).catch((logError: Error) => {
      console.warn("[notifyOnboardingComplete] CommunicationEvent log failed:", logError?.message);
    });

    console.log(
      `[notifyOnboardingComplete] Notification sent to ${ADMIN_NOTIFICATION_EMAILS.join(", ")} for ${displayName}`,
    );

    return secureJson({
      success: true,
      notified: ADMIN_NOTIFICATION_EMAILS,
      from: FROM_EMAIL,
      provider_message_id: providerMessageId,
    });
  } catch (error) {
    console.error("[notifyOnboardingComplete] Error:", error?.message || error);
    return secureJson({ error: error?.message || "Unknown error" }, { status: 500 });
  }
});
