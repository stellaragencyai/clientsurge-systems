import { secureJson } from "../_shared/response.ts";
/**
 * sendWeeklyDigest — #298
 * Emails Nolan every Monday: new leads, MRR, conversions, pipeline summary.
 * Scheduled via Base44 automation — every Monday 8am MST.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resendFetch } from "../_shared/resendFetch.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 3600000);

    // New leads this week
    const allLeads = await base44.asServiceRole.entities.SpaLead.filter({}).catch(() => []);
    const newLeads = (allLeads || []).filter(l => l.created_date > weekAgo.toISOString());
    const bookedLeads = (allLeads || []).filter(l => l.status === "Booked");

    // Revenue
    const orders = await base44.asServiceRole.entities.Order.filter({ payment_status: "paid" }).catch(() => []);
    const mrr = (orders || []).reduce((sum, o) => sum + (o.monthly_rate || 0), 0);
    const newClients = (orders || []).filter(o => o.created_date > weekAgo.toISOString());

    // Pipeline
    const statuses = ["New","Contacted","Replied","Qualified","Booked"];
    const pipeline = {};
    for (const s of statuses) {
      pipeline[s] = (allLeads || []).filter(l => l.status === s).length;
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const html = `
<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:32px 20px;">
  <h1 style="color:#0A0F1E;font-size:22px;font-weight:800;margin:0 0 4px;">📊 Weekly Digest</h1>
  <p style="color:#6B7280;font-size:13px;margin:0 0 24px;">${now.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</p>

  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px;">
    <div style="background:#F0FFF4;border:1px solid #BBF7D0;border-radius:10px;padding:14px;text-align:center;">
      <p style="font-size:24px;font-weight:800;color:#065F46;margin:0;">${newLeads.length}</p>
      <p style="font-size:11px;color:#6B7280;margin:4px 0 0;">New Leads</p>
    </div>
    <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:14px;text-align:center;">
      <p style="font-size:24px;font-weight:800;color:#1E40AF;margin:0;">$${mrr.toLocaleString()}</p>
      <p style="font-size:11px;color:#6B7280;margin:4px 0 0;">MRR</p>
    </div>
    <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:10px;padding:14px;text-align:center;">
      <p style="font-size:24px;font-weight:800;color:#92400E;margin:0;">${newClients.length}</p>
      <p style="font-size:11px;color:#6B7280;margin:4px 0 0;">New Clients</p>
    </div>
  </div>

  <h2 style="font-size:15px;font-weight:700;color:#111827;margin:0 0 10px;">Pipeline</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;">
    ${statuses.map(s => `<tr><td style="padding:6px 0;color:#374151;">${s}</td><td style="padding:6px 0;font-weight:700;color:#111827;text-align:right;">${pipeline[s] || 0}</td></tr>`).join("")}
  </table>

  <div style="margin-top:20px;text-align:center;">
    <a href="https://clientsurgesystems.com/admin" style="display:inline-block;background:#0A0F1E;color:#fff;border-radius:9999px;padding:12px 28px;font-size:13px;font-weight:700;text-decoration:none;">
      View Admin Dashboard →
    </a>
  </div>
</div>`;

    await resendFetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "system@clientsurgesystems.com",
        to: "nolan@clientsurgesystems.com",
        subject: `📊 Weekly Digest — ${newLeads.length} new leads, $${mrr.toLocaleString()} MRR`,
        html,
      }),
    });

    console.log("[sendWeeklyDigest] Sent");
    return secureJson({ success: true, new_leads: newLeads.length, mrr, new_clients: newClients.length });
  } catch (err) {
    console.error("[sendWeeklyDigest]", err.message);
    return secureJson({ error: err.message }, { status: 500 });
  }
});
