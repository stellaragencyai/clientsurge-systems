import { secureJson } from "../_shared/response.ts";
/**
 * sendMonthlyClientReportEmail — #115
 * After generating monthly report, emails it to the client.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resendFetch } from "../_shared/resendFetch.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id } = await req.json();

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order?.client_email) return secureJson({ error: "No client email" }, { status: 400 });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return secureJson({ error: "No Resend key" }, { status: 500 });

    // Generate report data
    const report = await base44.asServiceRole.functions
      .invoke("generateMonthlyPerformanceReport", { order_id }).catch(() => null);

    const month = new Date().toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "America/Phoenix" });
    const metrics = report?.metrics || {};

    await resendFetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "system@clientsurgesystems.com",
        reply_to: "nolan@clientsurgesystems.com",
        to: order.client_email,
        subject: `📊 Your ${month} AI Performance Report — ${order.client_name}`,
        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 20px;background:#fff">
          <h2 style="color:#0A0F1E;font-size:20px;font-weight:800">Your ${month} Report 📊</h2>
          <p style="color:#374151;font-size:14px">Hey ${order.client_name || "there"}, here's how your AI system performed this month:</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0">
            ${[
              ["Leads Captured", metrics.leads_this_month ?? "—"],
              ["Responses Sent", metrics.messages_sent ?? "—"],
              ["Demos Booked", metrics.demos_booked ?? "—"],
              ["Response Rate", metrics.response_rate ? metrics.response_rate + "%" : "—"],
            ].map(([l,v]) => `<div style="background:#F9FAFB;border-radius:10px;padding:14px;text-align:center">
              <p style="color:#6B7280;font-size:11px;font-weight:700;text-transform:uppercase;margin:0 0 4px">${l}</p>
              <p style="color:#0A0F1E;font-size:22px;font-weight:900;margin:0">${v}</p>
            </div>`).join("")}
          </div>
          <p style="color:#374151;font-size:13px;line-height:1.7">
            ${metrics.summary || "Your AI system has been running smoothly this month. Reply to this email if you have any questions."}
          </p>
          <p style="color:#6B7280;font-size:12px;margin-top:24px">— Nolan @ ClientSurge Systems</p>
        </div>`,
      }),
    });

    return secureJson({ success: true, sent_to: order.client_email, month });
  } catch (err: any) {
    return secureJson({ error: err.message }, { status: 500 });
  }
});
