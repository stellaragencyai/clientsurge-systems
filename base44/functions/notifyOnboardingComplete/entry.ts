import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const ADMIN_PORTAL_URL = Deno.env.get("APP_URL") || "https://clientsurgesystems.com";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@clientsurgesystems.com";
const ADMIN_NOTIFICATION_EMAIL = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || Deno.env.get("ADMIN_EMAIL");

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

async function resendFetch(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if ([429, 500, 502, 503, 504].includes(res.status)) {
      await new Promise((r) => setTimeout(r, 2000));
      return fetch(url, { ...init, signal: controller.signal });
    }
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

function esc(value: unknown): string {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildEmail(input: { businessName: string; clientEmail: string; orderId?: string; submittedAt: string; adminTrackingUrl: string; installQueueUrl: string }): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body style="margin:0;padding:0;background:#F7FBFE;font-family:Inter,Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;">
  <div style="background:linear-gradient(135deg,#003B8F 0%,#0088CC 100%);border-radius:12px;padding:24px;margin-bottom:24px;color:#fff;">
    <p style="font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;margin:0 0 8px;opacity:0.8;">Action Required</p>
    <h1 style="font-size:22px;font-weight:800;margin:0 0 8px;">New Onboarding Submission Completed</h1>
    <p style="font-size:14px;margin:0;opacity:0.85;">A client completed their onboarding form and is ready for setup.</p>
  </div>
  <div style="background:#fff;border:1px solid #C9E7FB;border-radius:8px;padding:18px;margin-bottom:20px;">
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="font-size:12px;color:#666;font-weight:600;text-transform:uppercase;padding:5px 0;width:40%;">Business</td><td style="font-size:14px;font-weight:600;color:#0A1628;padding:5px 0;">${esc(input.businessName)}</td></tr>
      <tr><td style="font-size:12px;color:#666;font-weight:600;text-transform:uppercase;padding:5px 0;">Client Email</td><td style="font-size:14px;color:#0A1628;padding:5px 0;">${esc(input.clientEmail)}</td></tr>
      ${input.orderId ? `<tr><td style="font-size:12px;color:#666;font-weight:600;text-transform:uppercase;padding:5px 0;">Order ID</td><td style="font-size:14px;color:#0A1628;padding:5px 0;font-family:monospace;">${esc(input.orderId)}</td></tr>` : ""}
      <tr><td style="font-size:12px;color:#666;font-weight:600;text-transform:uppercase;padding:5px 0;">Submitted</td><td style="font-size:14px;color:#0A1628;padding:5px 0;">${esc(input.submittedAt)} MST</td></tr>
    </table>
  </div>
  <div style="text-align:center;margin-bottom:28px;">
    <a href="${esc(input.adminTrackingUrl)}" style="display:inline-block;background:linear-gradient(135deg,#0088CC 0%,#003B8F 100%);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;">View Automation Tracking →</a>
  </div>
  <p style="font-size:13px;color:#666;text-align:center;line-height:1.6;">Next step: Review the submission details and begin service configuration.<br/><a href="${esc(input.installQueueUrl)}" style="color:#0088CC;text-decoration:none;font-weight:600;">Open Install Queue</a></p>
  <hr style="border:none;border-top:1px solid #e5eaf0;margin:24px 0;"/>
  <p style="font-size:11px;color:#999;text-align:center;margin:0;">ClientSurge Systems · Phoenix, AZ</p>
</div></body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));

    // Support both entity-automation payloads ({ event, data, old_data }) and flat payloads.
    const isEntityAutomation = !!(payload?.event?.type || payload?.event?.entity_name);
    const data = isEntityAutomation ? (payload.data || {}) : payload;

    const lead_id = data.lead_id || payload.lead_id;
    const order_id = data.order_id || payload.order_id;
    const client_email = data.client_email || payload.client_email;
    const business_name = data.business_name || payload.business_name;
    const status = data.status || payload.status;

    // Only fire on completed status or create events.
    if (status && status !== "completed" && payload.event?.type !== "create") {
      return json({ skipped: true, reason: "Status not completed" });
    }
    if (!RESEND_API_KEY) return json({ error: "Email provider not configured" }, 500);
    if (!ADMIN_NOTIFICATION_EMAIL) return json({ error: "Admin email not configured" }, 500);

    const adminTrackingUrl = `${ADMIN_PORTAL_URL}/admin?tab=automation-tracking`;
    const installQueueUrl = `${ADMIN_PORTAL_URL}/admin?tab=install-queue`;
    const submissionDate = new Date().toLocaleString("en-US", { timeZone: "America/Phoenix" });
    const emailHtml = buildEmail({ businessName: business_name || "Not provided", clientEmail: client_email || "Not provided", orderId: order_id, submittedAt: submissionDate, adminTrackingUrl, installQueueUrl });

    const emailRes = await resendFetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: `ClientSurge Systems <${FROM_EMAIL}>`, to: [ADMIN_NOTIFICATION_EMAIL], subject: `New Onboarding Submission — ${business_name || client_email || "New Client"}`, html: emailHtml, tags: [{ name: "category", value: "onboarding_notification" }] }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      return json({ error: "Email send failed", detail: errText }, 500);
    }

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

    return json({ success: true, notified: ADMIN_NOTIFICATION_EMAIL });
  } catch (error) {
    console.error("[notifyOnboardingComplete] Error:", error.message);
    return json({ error: error.message }, 500);
  }
});