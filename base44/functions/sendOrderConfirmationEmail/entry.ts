/**
 * sendOrderConfirmationEmail
 * Sends a rich HTML order confirmation email to the customer after checkout.
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

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toCurrencyAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function toPurchasedItems(items = []) {
  return Array.isArray(items)
    ? items.map((item) => ({
        icon: cleanString(item?.icon),
        product_name:
          cleanString(item?.product_name) ||
          cleanString(item?.name) ||
          cleanString(item?.service_key) ||
          "Service",
        setup_fee: toCurrencyAmount(item?.setup_fee),
        monthly_fee: toCurrencyAmount(item?.monthly_fee),
      }))
    : [];
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const customerEmail = cleanString(body.customer_email);
    if (!customerEmail) {
      return Response.json({ error: "customer_email required" }, { status: 400 });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return Response.json({ error: "RESEND_API_KEY not set" }, { status: 500 });
    }

    const settingsRecords = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
    const settings = settingsRecords?.[0] || {};
    if (!settings.resend_enabled) {
      return Response.json({ skipped: true, reason: "Resend disabled in AdminSettings" });
    }

    const appUrl = (cleanString(Deno.env.get("APP_URL")) || "https://clientsurgesystems.com").replace(/\/+$/, "");
    const portalLink = `${appUrl}/client-portal`;
    const fromEmail =
      settings.resend_from_email ||
      Deno.env.get("RESEND_FROM_EMAIL") ||
      "orders@clientsurgesystems.com";
    const safeName = escapeHtml(body.customer_name || "Valued Customer");
    const safeBusinessName = escapeHtml(body.business_name || "Your Business");
    const totalSetup = toCurrencyAmount(body.total_setup);
    const totalMonthly = toCurrencyAmount(body.total_monthly);
    const items = toPurchasedItems(body.items);

    const itemRows = items
      .map(
        (item) => `
      <tr style="border-bottom:1px solid #f0e8e0;">
        <td style="padding:10px 6px;font-size:13px;color:#1a1209;">${escapeHtml(item.icon || "")} ${escapeHtml(item.product_name)}</td>
        <td style="padding:10px 6px;font-size:13px;color:#9a5c2e;text-align:right;">${item.setup_fee > 0 ? `$${item.setup_fee} setup` : "No setup fee"}</td>
        <td style="padding:10px 6px;font-size:13px;font-weight:700;color:#1a1209;text-align:right;">$${item.monthly_fee}/mo</td>
      </tr>`
      )
      .join("");

    const htmlBody = `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#f5f0eb;margin:0;padding:24px;">
  <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8ddd4;">
    <div style="background:linear-gradient(135deg,#6b3f1f,#9a5c2e);padding:28px 32px;">
      <p style="margin:0 0 4px;color:rgba(255,255,255,0.65);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">ClientSurge Systems</p>
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;">Order Confirmed ✅</h1>
    </div>
    <div style="padding:32px;">
      <p style="font-size:15px;color:#1a1209;margin:0 0 8px;">Hi <strong>${safeName}</strong>,</p>
      <p style="font-size:14px;color:rgba(26,18,9,0.65);line-height:1.7;margin:0 0 24px;">
        Thank you for your order! We've received your payment for <strong>${safeBusinessName}</strong> and our team has been notified.
        Your AI automation setup will begin within 1 business day, and you'll be live in <strong>5–7 business days</strong>.
      </p>

      <div style="background:#fdf8f2;border:1.5px solid rgba(154,92,46,0.18);border-radius:12px;overflow:hidden;margin-bottom:24px;">
        <div style="padding:14px 16px;background:rgba(154,92,46,0.06);border-bottom:1px solid rgba(154,92,46,0.1);">
          <p style="margin:0;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.14em;color:#9a5c2e;">Your Services</p>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:rgba(154,92,46,0.04);">
              <th style="padding:8px 6px;font-size:11px;color:rgba(26,18,9,0.5);text-align:left;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Service</th>
              <th style="padding:8px 6px;font-size:11px;color:rgba(26,18,9,0.5);text-align:right;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Setup</th>
              <th style="padding:8px 6px;font-size:11px;color:rgba(26,18,9,0.5);text-align:right;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Monthly</th>
            </tr>
          </thead>
          <tbody>${itemRows || `<tr><td colspan="3" style="padding:12px 8px;font-size:13px;color:#888;">Order items will appear in your client portal shortly.</td></tr>`}</tbody>
        </table>
        <div style="padding:14px 16px;border-top:1.5px solid rgba(154,92,46,0.12);display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:12px;color:rgba(26,18,9,0.5);">Total</span>
          <div style="text-align:right;">
            <div style="font-size:12px;color:rgba(26,18,9,0.6);">${totalSetup > 0 ? `$${totalSetup} one-time setup` : "No setup fee"}</div>
            <div style="font-size:14px;font-weight:800;color:#9a5c2e;">$${totalMonthly}/month</div>
          </div>
        </div>
      </div>

      <div style="background:#f0faf4;border:1px solid rgba(34,197,94,0.2);border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:0.1em;">What Happens Next</p>
        <ol style="margin:0;padding-left:18px;font-size:13px;color:rgba(26,18,9,0.7);line-height:1.8;">
          <li>Our team reviews your order and begins setup</li>
          <li>You'll receive an onboarding form to provide key details</li>
          <li>We configure, test, and go live in 5–7 business days</li>
          <li>Track your progress anytime in the Client Portal</li>
        </ol>
      </div>

      <a href="${portalLink}" style="display:block;text-align:center;background:linear-gradient(135deg,#6b3f1f,#9a5c2e);color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 28px;border-radius:999px;margin-bottom:20px;">
        View Your Client Portal →
      </a>

      <p style="font-size:12px;color:rgba(26,18,9,0.45);text-align:center;margin:0;">
        Questions? Email us at <a href="mailto:support@clientsurgesystems.com" style="color:#9a5c2e;">support@clientsurgesystems.com</a> or call (602) 584-3227
      </p>
    </div>
  </div>
</body>
</html>`;

    const textBody = [
      "ClientSurge Systems",
      "",
      "Order Confirmed",
      `Hi ${cleanString(body.customer_name) || "there"},`,
      "",
      `Thanks for your order for ${cleanString(body.business_name) || "your business"}.`,
      "We've received your payment and our team has been notified.",
      "Your AI automation setup will begin within 1 business day, and you'll be live in 5–7 business days.",
      "",
      "Your Services:",
      ...(items.length > 0
        ? items.map(
            (item) =>
              `- ${item.product_name}: ${item.setup_fee > 0 ? `$${item.setup_fee} setup + ` : ""}$${item.monthly_fee}/mo`
          )
        : ["- Order items will appear in your client portal shortly."]),
      "",
      `One-time setup: ${totalSetup > 0 ? `$${totalSetup}` : "No setup fee"}`,
      `Monthly recurring: $${totalMonthly}/month`,
      "",
      "What Happens Next:",
      "1. Our team reviews your order and begins setup",
      "2. You'll receive an onboarding form to provide key details",
      "3. We configure, test, and go live in 5–7 business days",
      "4. Track your progress anytime in the Client Portal",
      "",
      `Client Portal: ${portalLink}`,
    ].join("\n");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `ClientSurge Systems <${fromEmail}>`,
        to: customerEmail,
        subject: "✅ Order Confirmed — Your AI Automation Setup is Starting",
        html: htmlBody,
        text: textBody,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return Response.json({ error: err?.message || "Resend failed" }, { status: 500 });
    }

    const resendData = await res.json().catch(() => ({}));
    const orderId = cleanString(body.order_id);

    if (orderId) {
      await base44.asServiceRole.entities.CommunicationEvent.create({
        order_id: orderId,
        channel: "email",
        direction: "outbound",
        event_type: "email_sent",
        provider: "resend",
        status: "sent",
        subject: "Order confirmation email sent to customer",
        provider_message_id: resendData?.id,
        metadata_json: JSON.stringify({
          target: "order_confirmation",
          to: customerEmail,
        }),
      });
    }

    return Response.json({ success: true, email_id: resendData?.id || null });
  } catch (error) {
    console.error("[sendOrderConfirmationEmail] error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
