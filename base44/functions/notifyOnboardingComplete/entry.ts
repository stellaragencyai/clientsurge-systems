/**
 * Tasks 17 & 18: Email notification when onboarding submission completes
 * or when OnboardingSubmission status moves to "completed".
 *
 * Called by entity automation on OnboardingSubmission create/update.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ADMIN_PORTAL_URL = Deno.env.get("APP_URL") || "https://clientsurgesystems.com";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@clientsurgesystems.com";
const ADMIN_NOTIFICATION_EMAIL = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || Deno.env.get("ADMIN_EMAIL");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));

    const { lead_id, order_id, client_email, business_name, status, event } = payload;

    // Only fire on completed status
    if (status && status !== "completed" && event?.type !== "create") {
      return Response.json({ skipped: true, reason: "Status not completed" });
    }

    if (!RESEND_API_KEY) {
      console.error("[notifyOnboardingComplete] RESEND_API_KEY not set");
      return Response.json({ error: "Email provider not configured" }, { status: 500 });
    }

    if (!ADMIN_NOTIFICATION_EMAIL) {
      console.error("[notifyOnboardingComplete] ADMIN_NOTIFICATION_EMAIL not set");
      return Response.json({ error: "Admin email not configured" }, { status: 500 });
    }

    const adminTrackingUrl = `${ADMIN_PORTAL_URL}/admin?tab=automation-tracking`;
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
              <td style="font-size: 14px; font-weight: 600; color: #0A1628; padding: 5px 0;">${business_name || "Not provided"}</td>
            </tr>
            <tr>
              <td style="font-size: 12px; color: #666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; padding: 5px 0;">Client Email</td>
              <td style="font-size: 14px; color: #0A1628; padding: 5px 0;">${client_email || "Not provided"}</td>
            </tr>
            ${order_id ? `<tr>
              <td style="font-size: 12px; color: #666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; padding: 5px 0;">Order ID</td>
              <td style="font-size: 14px; color: #0A1628; padding: 5px 0; font-family: monospace;">${order_id}</td>
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
          <a href="${ADMIN_PORTAL_URL}/admin?tab=install-queue" style="color: #0088CC; text-decoration: none; font-weight: 600;">Open Install Queue</a>
        </p>

        <hr style="border: none; border-top: 1px solid #e5eaf0; margin: 24px 0;" />
        <p style="font-size: 11px; color: #999; text-align: center; margin: 0;">
          ClientSurge Systems · Phoenix, AZ · <a href="${ADMIN_PORTAL_URL}" style="color: #999;">clientsurgesystems.com</a>
        </p>
      </div>
    `;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `ClientSurge Systems <${FROM_EMAIL}>`,
        to: [ADMIN_NOTIFICATION_EMAIL],
        subject: `🟢 New Onboarding Submission — ${business_name || client_email || "New Client"}`,
        html: emailHtml,
        tags: [{ name: "category", value: "onboarding_notification" }],
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("[notifyOnboardingComplete] Resend error:", errText);
      return Response.json({ error: "Email send failed", detail: errText }, { status: 500 });
    }

    // Log the event
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: lead_id || null,
      channel: "email",
      direction: "system",
      event_type: "status_update",
      provider: "resend",
      status: "sent",
      subject: `Onboarding submission complete — ${business_name || client_email}`,
      message_body: `Admin notification sent for completed onboarding: ${client_email}`,
    }).catch(() => {});

    console.log(`[notifyOnboardingComplete] Notification sent to ${ADMIN_NOTIFICATION_EMAIL} for ${business_name || client_email}`);
    return Response.json({ success: true, notified: ADMIN_NOTIFICATION_EMAIL });

  } catch (error) {
    console.error("[notifyOnboardingComplete] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});