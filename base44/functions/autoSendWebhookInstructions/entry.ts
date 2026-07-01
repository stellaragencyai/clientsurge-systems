import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const THEME = {
  electric: "#00AEEF",
  deep: "#0088CC",
  navy: "#005691",
  page: "#F7FBFE",
  soft: "#EEF9FF",
  border: "#C9E7FB",
  text: "#000000",
  muted: "#4B5563",
};

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function esc(value: unknown): string {
  return text(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function logoLockup(logoUrl?: string): string {
  const src = esc(logoUrl || "");
  const mark = src
    ? `<img src="${src}" width="46" height="46" alt="ClientSurge Systems" style="display:block;width:46px;height:46px;border:0;border-radius:12px;object-fit:contain;background:#ffffff;" />`
    : `<div style="width:46px;height:46px;border-radius:12px;background:linear-gradient(135deg,${THEME.deep},${THEME.navy});box-shadow:0 8px 22px rgba(0,174,239,0.28);color:#ffffff;font-family:Montserrat,Arial,sans-serif;font-size:15px;line-height:46px;font-weight:900;text-align:center;">CS</div>`;

  return `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr><td style="padding:0 12px 0 0;vertical-align:middle;">${mark}</td><td style="vertical-align:middle;"><div style="font-family:Montserrat,Arial,sans-serif;font-size:24px;line-height:29px;font-weight:900;letter-spacing:-0.03em;color:#000000;">ClientSurge <span style="color:${THEME.electric};">Systems</span></div><div style="margin-top:5px;color:${THEME.muted};font-size:12px;line-height:17px;font-weight:700;">AI lead-response and booking automation</div></td></tr></table>`;
}

function smallCard(label: string, value: string): string {
  return `<td style="width:33.33%;padding:0 6px;vertical-align:top;"><div style="background:${THEME.soft};border:1px solid ${THEME.border};border-radius:16px;padding:17px 16px;min-height:76px;"><div style="color:${THEME.muted};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;">${label}</div><div style="margin-top:7px;color:#000000;font-size:14px;line-height:19px;font-weight:900;">${value}</div></div></td>`;
}

function systemCard(num: string, title: string, copy: string): string {
  return `<td style="width:33.33%;padding:0 6px;vertical-align:top;"><div style="background:#ffffff;border:1px solid ${THEME.border};border-radius:16px;padding:19px 18px;min-height:122px;"><div style="width:34px;height:34px;border-radius:999px;background:${THEME.soft};color:${THEME.deep};line-height:34px;text-align:center;font-weight:900;">${num}</div><h2 style="margin:13px 0 6px 0;color:#000;font-size:16px;line-height:21px;font-weight:900;">${title}</h2><p style="margin:0;color:${THEME.muted};font-size:13px;line-height:20px;">${copy}</p></div></td>`;
}

function buildActivationEmail(input: { customerName: string; orderId: string; packageName: string; dashboardUrl: string; logoUrl?: string }): string {
  const name = esc(input.customerName || "there");
  const orderId = esc(input.orderId || "Pending");
  const packageName = esc(input.packageName || "ClientSurge System");
  const dashboardUrl = esc(input.dashboardUrl || "https://clientsurgesystems.com/ClientDashboard");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Your AI Systems Are Being Activated</title></head><body style="margin:0;padding:0;background:${THEME.page};color:#000;font-family:Inter,Arial,Helvetica,sans-serif;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Your ClientSurge installation has started.</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:${THEME.page};border-collapse:collapse;"><tr><td align="center" style="padding:30px 12px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;width:100%;background:#fff;border:1px solid ${THEME.border};border-radius:18px;overflow:hidden;box-shadow:0 20px 58px rgba(0,136,204,0.16);"><tr><td style="height:7px;background:linear-gradient(90deg,${THEME.deep},${THEME.electric},${THEME.navy});font-size:1px;line-height:1px;">&nbsp;</td></tr><tr><td style="padding:26px 32px 22px 32px;border-bottom:1px solid ${THEME.border};background:#fff;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr><td style="vertical-align:middle;">${logoLockup(input.logoUrl)}</td><td align="right" style="vertical-align:middle;"><span style="display:inline-block;background:${THEME.soft};color:${THEME.navy};border:1px solid ${THEME.border};border-radius:999px;padding:8px 12px;font-size:11px;line-height:14px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;">Installation In Progress</span></td></tr></table></td></tr><tr><td style="padding:34px 32px 10px 32px;"><p style="margin:0 0 10px 0;color:${THEME.muted};font-size:15px;line-height:22px;font-weight:650;">Hi ${name},</p><h1 style="margin:0;color:#000;font-family:Montserrat,Arial,sans-serif;font-size:34px;line-height:40px;font-weight:900;letter-spacing:-0.045em;">Your AI systems are now activating.</h1><p style="margin:14px 0 0 0;color:#262626;font-size:17px;line-height:27px;font-weight:500;">Live installation has begun. We are connecting the systems that help capture leads, recover missed calls, and respond faster.</p><table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0 0;"><tr><td bgcolor="${THEME.deep}" style="border-radius:999px;background:linear-gradient(90deg,${THEME.deep},${THEME.navy});box-shadow:0 8px 24px rgba(0,121,193,0.36);"><a href="${dashboardUrl}" style="display:inline-block;padding:15px 23px;color:#fff;text-decoration:none;font-size:15px;line-height:20px;font-weight:900;border-radius:999px;">View Installation Dashboard →</a></td></tr></table></td></tr><tr><td style="padding:24px 26px 0 26px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>${smallCard("Current Stage", "Webhook Configuration")}${smallCard("Package", packageName)}${smallCard("Order ID", orderId)}</tr></table></td></tr><tr><td style="padding:24px 32px 0 32px;"><div style="background:#fff;border:1px solid ${THEME.border};border-radius:16px;padding:22px;"><div style="color:${THEME.deep};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.09em;">Activation Progress</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border-collapse:collapse;"><tr><td style="width:20%;text-align:center;"><div style="margin:0 auto;width:26px;height:26px;border-radius:50%;background:${THEME.electric};color:#fff;font-size:13px;line-height:26px;font-weight:900;">✓</div><div style="margin-top:8px;color:#000;font-size:12px;line-height:16px;font-weight:800;">Order<br/>Received</div></td><td style="width:20%;text-align:center;"><div style="margin:0 auto;width:26px;height:26px;border-radius:50%;background:${THEME.electric};color:#fff;font-size:13px;line-height:26px;font-weight:900;">✓</div><div style="margin-top:8px;color:#000;font-size:12px;line-height:16px;font-weight:800;">Setup<br/>Started</div></td><td style="width:20%;text-align:center;"><div style="margin:0 auto;width:26px;height:26px;border-radius:50%;background:${THEME.deep};color:#fff;font-size:13px;line-height:26px;font-weight:900;">●</div><div style="margin-top:8px;color:#000;font-size:12px;line-height:16px;font-weight:800;">Connecting<br/>Twilio</div></td><td style="width:20%;text-align:center;"><div style="margin:0 auto;width:26px;height:26px;border-radius:50%;background:#fff;border:1px solid ${THEME.border};color:${THEME.deep};font-size:13px;line-height:24px;font-weight:900;">4</div><div style="margin-top:8px;color:${THEME.muted};font-size:12px;line-height:16px;font-weight:800;">Testing<br/>AI</div></td><td style="width:20%;text-align:center;"><div style="margin:0 auto;width:26px;height:26px;border-radius:50%;background:#fff;border:1px solid ${THEME.border};color:${THEME.deep};font-size:13px;line-height:24px;font-weight:900;">5</div><div style="margin-top:8px;color:${THEME.muted};font-size:12px;line-height:16px;font-weight:800;">Going<br/>Live</div></td></tr></table></div></td></tr><tr><td style="padding:24px 26px 0 26px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>${systemCard("01", "SMS Automation", "Routing incoming texts to your AI response system.")}${systemCard("02", "Missed Call Recovery", "Preparing automatic text-back when calls go unanswered.")}${systemCard("03", "Lead Response", "Setting up 60-second lead response behavior.")}</tr></table></td></tr><tr><td style="padding:24px 32px 0 32px;"><div style="background:${THEME.soft};border:1px solid ${THEME.border};border-left:6px solid ${THEME.electric};border-radius:16px;padding:20px 22px;"><div style="color:${THEME.deep};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.09em;">Your Action Items</div><p style="margin:12px 0 0 0;color:#000;font-size:14px;line-height:23px;font-weight:700;">✓ Keep your booking link accessible while we test it.<br/>✓ Make sure your phone number is verified.<br/>✓ Watch for setup progress updates from ClientSurge Systems.</p></div></td></tr><tr><td style="padding:30px 32px 32px 32px;"><div style="background:#000;border-radius:16px;padding:20px 22px;color:#fff;box-shadow:0 12px 32px rgba(0,0,0,0.16);"><p style="margin:0;color:#fff;font-size:15px;line-height:22px;font-weight:900;">Questions while we activate this?</p><p style="margin:8px 0 0 0;color:#DFF6FF;font-size:13px;line-height:20px;">Reply to this email or call <a href="tel:+16025843227" style="color:#fff;text-decoration:underline;font-weight:900;">(602) 584-3227</a>. ClientSurge Systems · Phoenix, Arizona</p></div></td></tr></table></td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const targetOrderId = payload.order_id || payload.entity_id;
    if (!targetOrderId) return Response.json({ error: "order_id required" }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(targetOrderId);
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });
    if (order.payment_status !== "paid") return Response.json({ skipped: true, reason: "Order not paid yet" });

    const existing = await base44.asServiceRole.entities.CommunicationEvent.filter({ context_id: targetOrderId, event_type: "webhook_instructions_sent" }, "-created_date", 1);
    if (existing?.length > 0) return Response.json({ skipped: true, reason: "Instructions already sent" });

    const customerEmail = order.customer_email;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "support@clientsurgesystems.com";
    const dashboardUrl = order.dashboard_url || order.portal_url || "https://clientsurgesystems.com/ClientDashboard";
    const packageName = order.package_name || order.plan_name || order.selected_package || "ClientSurge System";
    const logoUrl = Deno.env.get("CLIENTSURGE_LOGO_URL") || order.logo_url || "";

    if (resendApiKey && customerEmail) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: `ClientSurge Systems <${fromEmail}>`,
          to: [customerEmail],
          subject: "Your AI Systems Are Being Activated — Next Steps",
          html: buildActivationEmail({ customerName: order.customer_name || "there", orderId: String(targetOrderId), packageName, dashboardUrl, logoUrl }),
        }),
      });
    }

    await base44.asServiceRole.entities.CommunicationEvent.create({ context_type: "order", context_id: targetOrderId, order_id: targetOrderId, event_type: "webhook_instructions_sent", channel: "email", direction: "outbound", status: "sent", provider: "resend", subject: "Webhook setup instructions sent", message_body: "Automated webhook setup instructions delivered to client" }).catch(() => {});
    return Response.json({ success: true, order_id: targetOrderId });
  } catch (error) {
    console.error("[autoSendWebhookInstructions] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
