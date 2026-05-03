/**
 * sendAdminPurchaseNotification
 * Sends a "💰 New Purchase!" alert email to the admin when a customer completes checkout.
 * Called by stripeWebhookOrders on checkout.session.completed.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const {
      customer_name,
      customer_email,
      customer_phone,
      business_name,
      order_id,
      items = [],
      total_setup,
      total_monthly,
    } = body;

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.error("[sendAdminPurchaseNotification] RESEND_API_KEY not set");
      return Response.json({ error: "RESEND_API_KEY not set" }, { status: 500 });
    }

    const settingsRecords = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
    const settings = settingsRecords?.[0] || {};

    if (!settings.resend_enabled) {
      return Response.json({ skipped: true, reason: "Resend disabled in AdminSettings" });
    }

    const toEmail = settings.lead_notification_email || Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || Deno.env.get("ADMIN_EMAIL");
    if (!toEmail) {
      console.warn("[sendAdminPurchaseNotification] No admin notification email configured — skipping");
      return Response.json({ skipped: true, reason: "No admin email configured" });
    }

    const fromEmail = settings.resend_from_email || "notifications@clientsurgesystems.com";

    const safeName = escapeHtml(customer_name || "Unknown");
    const safeEmail = escapeHtml(customer_email || "—");
    const safePhone = escapeHtml(customer_phone || "—");
    const safeBiz = escapeHtml(business_name || "Unknown");
    const purchasedAt = new Date().toLocaleString("en-US", {
      timeZone: "America/Phoenix",
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    const itemList = (items || []).map((item) =>
      `<li style="padding:4px 0;font-size:13px;color:#1a1209;">${escapeHtml(item.icon || "")} <strong>${escapeHtml(item.product_name || item.name || "")}</strong> — $${item.setup_fee || 0} setup + $${item.monthly_fee || 0}/mo</li>`
    ).join("");

    const htmlBody = `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#f5f5f5;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e5e5;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#15803d,#16a34a);padding:24px 28px;">
      <p style="margin:0;color:rgba(255,255,255,0.7);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">ClientSurge Systems</p>
      <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:700;">💰 New Purchase!</h1>
    </div>
    <div style="padding:28px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
        <tr><td style="padding:8px 0;color:#888;width:130px;font-weight:600;">Customer</td><td style="padding:8px 0;color:#1a1a1a;font-weight:700;">${safeName}</td></tr>
        <tr style="background:#fafafa;"><td style="padding:8px 6px;color:#888;font-weight:600;">Business</td><td style="padding:8px 6px;color:#1a1a1a;">${safeBiz}</td></tr>
        <tr><td style="padding:8px 0;color:#888;font-weight:600;">Email</td><td style="padding:8px 0;color:#1a1a1a;">${safeEmail}</td></tr>
        <tr style="background:#fafafa;"><td style="padding:8px 6px;color:#888;font-weight:600;">Phone</td><td style="padding:8px 6px;color:#1a1a1a;">${safePhone}</td></tr>
        <tr><td style="padding:8px 0;color:#888;font-weight:600;">Purchased At</td><td style="padding:8px 0;color:#888;font-size:12px;">${purchasedAt} MST</td></tr>
      </table>

      <div style="background:#f0fdf4;border:1px solid rgba(34,197,94,0.25);border-radius:10px;padding:16px 18px;margin-bottom:20px;">
        <p style="margin:0 0 10px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;color:#15803d;">Services Purchased</p>
        <ul style="margin:0;padding-left:18px;line-height:1.9;">
          ${itemList || "<li style='font-size:13px;color:#888;'>No item details available</li>"}
        </ul>
        <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(34,197,94,0.15);">
          ${total_setup != null ? `<div style="font-size:13px;color:rgba(26,18,9,0.6);">One-time setup: <strong>$${total_setup}</strong></div>` : ""}
          ${total_monthly != null ? `<div style="font-size:15px;font-weight:800;color:#15803d;margin-top:2px;">Monthly recurring: $${total_monthly}/mo</div>` : ""}
        </div>
      </div>

      <a href="https://clientsurgesystems.com/admin" style="display:inline-block;background:linear-gradient(135deg,#6b3f1f,#9a5c2e);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
        View in Admin Dashboard →
      </a>
    </div>
  </div>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `ClientSurge Systems <${fromEmail}>`,
        to: toEmail,
        subject: `💰 New Purchase — ${safeBiz} ($${total_monthly || 0}/mo)`,
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[sendAdminPurchaseNotification] Resend error:", err);
      return Response.json({ error: err?.message || "Resend failed" }, { status: 500 });
    }

    const resendData = await res.json().catch(() => ({}));
    console.log(`[sendAdminPurchaseNotification] Sent to ${toEmail} for order ${order_id}`);

    return Response.json({ success: true, sent_to: toEmail, email_id: resendData?.id || null });
  } catch (error) {
    console.error("[sendAdminPurchaseNotification] error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});