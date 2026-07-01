import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const CS = {
  electric: "#00AEEF",
  electricDeep: "#0088CC",
  electricNavy: "#005691",
  text: "#000000",
  muted: "#262626",
  softText: "#4B5563",
  surface: "#FFFFFF",
  page: "#F7FBFE",
  blueSoft: "#EEF9FF",
  border: "#C9E7FB",
  gold: "#D4AF37",
};

function clean(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function escapeHtml(value: unknown): string {
  return clean(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildActivationEmail(params: {
  customerName: string;
  orderId?: string;
  dashboardUrl?: string;
  packageName?: string;
}) {
  const firstName = escapeHtml(params.customerName || "there");
  const orderId = escapeHtml(params.orderId || "Pending");
  const packageName = escapeHtml(params.packageName || "ClientSurge System");
  const dashboardUrl = escapeHtml(params.dashboardUrl || "https://clientsurgesystems.com/ClientDashboard");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Your AI Systems Are Being Activated</title>
</head>
<body style="margin:0;padding:0;background:${CS.page};color:${CS.text};font-family:Inter,Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;line-height:1px;font-size:1px;">Your ClientSurge installation has started. We are connecting SMS, missed-call recovery, and AI lead response.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:${CS.page};border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:30px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;width:100%;background:${CS.surface};border:1px solid ${CS.border};border-radius:18px;overflow:hidden;box-shadow:0 20px 58px rgba(0,136,204,0.16);">
          <tr><td style="height:7px;background:linear-gradient(90deg,${CS.electricDeep} 0%,${CS.electric} 48%,${CS.electricNavy} 100%);font-size:1px;line-height:1px;">&nbsp;</td></tr>
          <tr>
            <td style="padding:28px 32px 22px 32px;border-bottom:1px solid ${CS.border};background:#ffffff;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="vertical-align:top;">
                    <div style="font-family:Montserrat,Arial,sans-serif;font-size:24px;line-height:30px;font-weight:900;letter-spacing:-0.03em;color:#000000;">ClientSurge <span style="color:${CS.electric};">Systems</span></div>
                    <div style="margin-top:7px;color:${CS.softText};font-size:12px;line-height:18px;font-weight:700;">AI lead-response and booking automation</div>
                  </td>
                  <td align="right" style="vertical-align:top;">
                    <span style="display:inline-block;background:${CS.blueSoft};color:${CS.electricNavy};border:1px solid ${CS.border};border-radius:999px;padding:8px 12px;font-size:11px;line-height:14px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;">Installation In Progress</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:34px 32px 10px 32px;">
              <p style="margin:0 0 10px 0;color:${CS.softText};font-size:15px;line-height:22px;font-weight:650;">Hi ${firstName},</p>
              <h1 style="margin:0;color:#000000;font-family:Montserrat,Arial,sans-serif;font-size:34px;line-height:40px;font-weight:900;letter-spacing:-0.045em;">Your AI systems are now activating.</h1>
              <p style="margin:14px 0 0 0;color:${CS.muted};font-size:17px;line-height:27px;font-weight:500;">Live installation has begun. We are connecting the systems that help capture leads, recover missed calls, and respond faster than your competitors.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0 0;">
                <tr>
                  <td bgcolor="${CS.electricDeep}" style="border-radius:999px;background:linear-gradient(90deg,${CS.electricDeep},${CS.electricNavy});box-shadow:0 8px 24px rgba(0,121,193,0.36);">
                    <a href="${dashboardUrl}" style="display:inline-block;padding:15px 23px;color:#ffffff;text-decoration:none;font-size:15px;line-height:20px;font-weight:900;border-radius:999px;">View Installation Dashboard →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="width:33.33%;padding:0 8px 0 0;vertical-align:top;">
                    <div style="background:${CS.blueSoft};border:1px solid ${CS.border};border-radius:16px;padding:17px 16px;min-height:76px;">
                      <div style="color:${CS.softText};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;">Current Stage</div>
                      <div style="margin-top:7px;color:#000000;font-size:14px;line-height:19px;font-weight:900;">Webhook Configuration</div>
                    </div>
                  </td>
                  <td style="width:33.33%;padding:0 4px;vertical-align:top;">
                    <div style="background:${CS.blueSoft};border:1px solid ${CS.border};border-radius:16px;padding:17px 16px;min-height:76px;">
                      <div style="color:${CS.softText};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;">Package</div>
                      <div style="margin-top:7px;color:#000000;font-size:14px;line-height:19px;font-weight:900;">${packageName}</div>
                    </div>
                  </td>
                  <td style="width:33.33%;padding:0 0 0 8px;vertical-align:top;">
                    <div style="background:${CS.blueSoft};border:1px solid ${CS.border};border-radius:16px;padding:17px 16px;min-height:76px;">
                      <div style="color:${CS.softText};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;">Order ID</div>
                      <div style="margin-top:7px;color:#000000;font-size:14px;line-height:19px;font-weight:900;">${orderId}</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 0 32px;">
              <div style="background:#ffffff;border:1px solid ${CS.border};border-radius:16px;padding:22px 22px;">
                <div style="color:${CS.electricDeep};font-size:11px;line-height:15px;font-weight:900;text-transform:uppercase;letter-spacing:0.09em;">Activation Progress</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border-collapse:collapse;">
                  <tr>
                    <td style="width:20%;text-align:center;vertical-align:top;"><div style="margin:0 auto;width:26px;height:26px;border-radius:50%;background:${CS.electric};color:#ffffff;font-size:13px;line-height:26px;font-weight:900;">✓</div><div style="margin-top:8px;color:#000;font-size:12px;line-height:16px;font-weight:800;">Order<br/>Received</div></td>
                    <td style="width:20%;text-align:center;vertical-align:top;"><div style="margin:0 auto;width:26px;height:26px;border-radius:50%;background:${CS.electric};color:#ffffff;font-size:13px;line-height:26px;font-weight:900;">✓</div><div style="margin-top:8px;color:#000;font-size:12px;line-height:16px;font-weight:800;">Setup<br/>Started</div></td>
                    <td style="width:20%;text-align:center;vertical-align:top;"><div style="margin:0 auto;width:26px;height:26px;border-radius:50%;background:${CS.electricDeep};color:#ffffff;font-size:13px;line-height:26px;font-weight:900;">●</div><div style="margin-top:8px;color:#000;font-size:12px;line-height:16px;font-weight:800;">Connecting<br/>Twilio</div></td>
                    <td style="width:20%;text-align:center;vertical-align:top;"><div style="margin:0 auto;width:26px;height:26px;border-radius:50%;background:#ffffff;border:1px solid ${CS.border};color:${CS.electricDeep};font-size:13px;line-height:24px;font-weight:900;">4</div><div style="margin-top:8px;color:${CS.softText};font-size:12px;line-height:16px;font-weight:800;">Testing<br/>AI</div></td>
                    <td style="width:20%;text-align:center;vertical-align:top;"><div style="margin:0 auto;width:26px;height:26px;border-radius:50%;background:#ffffff;border:1px solid ${CS.border};color:${CS.electricDeep};font-size:13px;line-height:24px;font-weight:900;">5</div><div style="margin-top:8px;color:${CS.softText};font-size:12px;line-height:16px;font-weight:800;">Going<br/>Live</div></td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="width:33.33%;padding:0 8px 0 0;vertical-align:top;">
                    <div style="background:#ffffff;border:1px solid ${CS.border};border-radius:16px;padding:19px 18px;min-height:122px;">
                      <div style="width:34px;height:34px;border-radius:999px;background:${CS.blueSoft};color:${CS.electricDeep};line-height:34px;text-align:center;font-weight:900;">01</div>
                      <h2 style="margin:13px 0 6px 0;color:#000;font-size:16px;line-height:21px;font-weight:900;">SMS Automation</h2>
                      <p style="margin:0;color:${CS.softText};font-size:13px;line-height:20px;">Routing incoming texts to your AI response system.</p>
                    </div>
                  </td>
                  <td style="width:33.33%;padding:0 4px;vertical-align:top;">
                    <div style="background:#ffffff;border:1px solid ${CS.border};border-radius:16px;padding:19px 18px;min-height:122px;">
                      <div style="width:34px;height:34px;border-radius:999px;background:${CS.blueSoft};color:${CS.electricDeep};line-height:34px;text-align:center;font-weight:900;">02</div>
                      <h2 style="margin:13px 0 6px 0;color:#000;font-size:16px;line-height:21px;font-weight:900;">Missed Call Recovery</h2>
                      <p style="margin:0;color:${CS.softText};font-size:13px;line-height:20px;">Preparing automatic text-back when calls go unanswered.</p>
                    </div>
                  </td>
                  <td style="width:33.33%;padding:0 0 0 8px;vertical-align:top;">
                    <div style="background:#ffffff;border:1px solid ${CS.border};border-radius:16px;padding:19px 18px;min-height:122px;">
                      <div style="width:34px;height:34px;border-radius:999px;background:${CS.blueSoft};color:${CS.electricDeep};line-height:34px;text-align:center;font-weight:900;">03</div>
                      <h2 style="margin:13px 0 6px 0;color:#000;font-size:16px;line-height:21px;font-weight:900;">Lead Response</h2>
                      <p style="margin:0;color:${CS.softText};font-size:13px;line-height:20px;">Setting up 60-second lead response behavior.</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 0 32px;">
              <div style="background:${CS.blueSoft};border:1px solid ${CS.border};border-left:6px solid ${CS.electric};border-radius:16px;padding:20px 22px;">
                <div style="color:${CS.electricDeep};font-size:11px;line-height:15px;font-weight:900;text-transform:uppercase;letter-spacing:0.09em;">Your Action Items</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;border-collapse:collapse;">
                  <tr><td style="width:28px;padding:8px 0;color:${CS.electricDeep};font-size:15px;font-weight:900;">✓</td><td style="padding:8px 0;color:#000;font-size:14px;line-height:20px;font-weight:750;">Keep your booking link accessible while we test it.</td></tr>
                  <tr><td style="width:28px;padding:8px 0;color:${CS.electricDeep};font-size:15px;font-weight:900;">✓</td><td style="padding:8px 0;color:#000;font-size:14px;line-height:20px;font-weight:750;">Make sure your phone number is verified in your account.</td></tr>
                  <tr><td style="width:28px;padding:8px 0;color:${CS.electricDeep};font-size:15px;font-weight:900;">✓</td><td style="padding:8px 0;color:#000;font-size:14px;line-height:20px;font-weight:750;">Watch for setup progress updates from ClientSurge Systems.</td></tr>
                </table>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 32px 32px 32px;">
              <div style="background:#000000;border-radius:16px;padding:20px 22px;color:#ffffff;box-shadow:0 12px 32px rgba(0,0,0,0.16);">
                <p style="margin:0;color:#ffffff;font-size:15px;line-height:22px;font-weight:900;">Questions while we activate this?</p>
                <p style="margin:8px 0 0 0;color:#DFF6FF;font-size:13px;line-height:20px;">Reply to this email or call <a href="tel:+16025843227" style="color:#ffffff;text-decoration:underline;font-weight:900;">(602) 584-3227</a>. ClientSurge Systems · Phoenix, Arizona</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });

    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const { order_id } = payload;
    const targetOrderId = order_id || payload.entity_id;

    if (!targetOrderId) return Response.json({ error: "order_id required" }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(targetOrderId);
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });
    if (order.payment_status !== "paid") return Response.json({ skipped: true, reason: "Order not paid yet" });

    const existingEvents = await base44.asServiceRole.entities.CommunicationEvent.filter({ context_id: targetOrderId, event_type: "webhook_instructions_sent" }, "-created_date", 1);
    if (existingEvents?.length > 0) return Response.json({ skipped: true, reason: "Instructions already sent" });

    const customerEmail = order.customer_email;
    const customerName = order.customer_name || "there";
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "support@clientsurgesystems.com";
    const dashboardUrl = order.dashboard_url || order.portal_url || "https://clientsurgesystems.com/ClientDashboard";
    const packageName = order.package_name || order.plan_name || order.selected_package || "ClientSurge System";

    if (resendApiKey && customerEmail) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: `ClientSurge Systems <${fromEmail}>`,
          to: [customerEmail],
          subject: "Your AI Systems Are Being Activated — Next Steps",
          html: buildActivationEmail({ customerName, orderId: targetOrderId, dashboardUrl, packageName }),
        }),
      });
    }

    await base44.asServiceRole.entities.CommunicationEvent.create({
      context_type: "order",
      context_id: targetOrderId,
      order_id: targetOrderId,
      event_type: "webhook_instructions_sent",
      channel: "email",
      direction: "outbound",
      status: "sent",
      provider: "resend",
      subject: "Webhook setup instructions sent",
      message_body: "Automated webhook setup instructions delivered to client",
    }).catch(() => {});

    console.log(`[autoSendWebhookInstructions] Instructions sent for order ${targetOrderId}`);
    return Response.json({ success: true, order_id: targetOrderId });
  } catch (error) {
    console.error("[autoSendWebhookInstructions] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
