import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { secureJson } from "../_shared/response.ts";
import { resendFetch } from "../_shared/resendFetch.js";
import { csEmailShell, csInfoCard, csPillButton, csEmailFrom, csEmailLogoUrl } from "../_shared/clientSurgeEmailDesignSystem.ts";

const ADMIN_PORTAL_URL = Deno.env.get("APP_URL") || "https://clientsurgesystems.com";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_NOTIFICATION_EMAIL = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || Deno.env.get("ADMIN_EMAIL");

function buildAdminOnboardingEmail(input: { businessName: string; clientEmail: string; orderId?: string; submittedAt: string; adminTrackingUrl: string; installQueueUrl: string }) {
  const orderCard = input.orderId ? csInfoCard("Order ID", input.orderId) : "";
  const body = `${csInfoCard("Business", input.businessName || "Not provided", { accent: true })}${csInfoCard("Client Email", input.clientEmail || "Not provided")}${orderCard}${csInfoCard("Submitted", `${input.submittedAt} MST`)}${csPillButton("View Automation Tracking →", input.adminTrackingUrl)}${csInfoCard("Next Step", "Review the submission details and begin service configuration in the admin panel.")}${csPillButton("Open Install Queue →", input.installQueueUrl)}`;
  return csEmailShell({ badge: "Action Required", title: "New onboarding submission completed.", subtitle: "A client completed their onboarding form and is ready for setup.", body, logoUrl: csEmailLogoUrl(), footerTitle: "Internal onboarding alert", footerText: "ClientSurge Systems · Phoenix, Arizona" });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const { lead_id, order_id, client_email, business_name, status, event } = payload;

    if (status && status !== "completed" && event?.type !== "create") return secureJson({ skipped: true, reason: "Status not completed" });
    if (!RESEND_API_KEY) return secureJson({ error: "Email provider not configured" }, { status: 500 });
    if (!ADMIN_NOTIFICATION_EMAIL) return secureJson({ error: "Admin email not configured" }, { status: 500 });

    const adminTrackingUrl = `${ADMIN_PORTAL_URL}/admin?tab=automation-tracking`;
    const installQueueUrl = `${ADMIN_PORTAL_URL}/admin?tab=install-queue`;
    const submissionDate = new Date().toLocaleString("en-US", { timeZone: "America/Phoenix" });
    const emailHtml = buildAdminOnboardingEmail({ businessName: business_name || "Not provided", clientEmail: client_email || "Not provided", orderId: order_id, submittedAt: submissionDate, adminTrackingUrl, installQueueUrl });

    const emailRes = await resendFetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: csEmailFrom("noreply@clientsurgesystems.com"), to: [ADMIN_NOTIFICATION_EMAIL], subject: `New Onboarding Submission — ${business_name || client_email || "New Client"}`, html: emailHtml, tags: [{ name: "category", value: "onboarding_notification" }] }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      return secureJson({ error: "Email send failed", detail: errText }, { status: 500 });
    }

    await base44.asServiceRole.entities.CommunicationEvent.create({ lead_id: lead_id || null, channel: "email", direction: "system", event_type: "status_update", provider: "resend", status: "sent", subject: `Onboarding submission complete — ${business_name || client_email}`, message_body: `Admin notification sent for completed onboarding: ${client_email}` }).catch(() => {});
    return secureJson({ success: true, notified: ADMIN_NOTIFICATION_EMAIL });
  } catch (error) {
    console.error("[notifyOnboardingComplete] Error:", error.message);
    return secureJson({ error: error.message }, { status: 500 });
  }
});
