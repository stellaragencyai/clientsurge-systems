import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resendFetch } from "../_shared/resendFetch.js";
import { csEmailShell, csPillButton, csEmailLogoUrl, csEmailEscape, CS_EMAIL_THEME } from "../_shared/clientSurgeEmailDesignSystem.ts";
import { formatClientSurgeFrom, getClientSurgeSignature, senderTags } from "../_shared/clientSurgeEmailSignatures.ts";

function metricCard(label: string, value: string | number, detail: string) {
  return `<td style="width:33.33%;padding:6px;vertical-align:top;"><div style="background:${CS_EMAIL_THEME.soft};border:1px solid ${CS_EMAIL_THEME.border};border-radius:16px;padding:18px 16px;text-align:center;"><div style="font-size:28px;line-height:34px;font-weight:900;color:#000000;">${csEmailEscape(value)}</div><div style="margin-top:4px;color:${CS_EMAIL_THEME.deep};font-size:11px;line-height:15px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;">${csEmailEscape(label)}</div><div style="margin-top:5px;color:${CS_EMAIL_THEME.muted};font-size:12px;line-height:17px;font-weight:700;">${csEmailEscape(detail)}</div></div></td>`;
}

function pipelineTable(statuses: string[], pipeline: Record<string, number>) {
  return `<div style="margin-top:24px;background:#ffffff;border:1px solid ${CS_EMAIL_THEME.border};border-radius:16px;padding:20px 22px;"><div style="color:${CS_EMAIL_THEME.deep};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.09em;margin-bottom:12px;">Pipeline Summary</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">${statuses.map((status) => `<tr><td style="padding:9px 0;border-bottom:1px solid ${CS_EMAIL_THEME.border};color:${CS_EMAIL_THEME.muted};font-weight:800;">${csEmailEscape(status)}</td><td style="padding:9px 0;border-bottom:1px solid ${CS_EMAIL_THEME.border};color:#000000;font-weight:900;text-align:right;">${pipeline[status] || 0}</td></tr>`).join("")}</table></div>`;
}

function buildWeeklyDigestHtml(input: { dateLabel: string; newLeadCount: number; mrr: number; newClientCount: number; statuses: string[]; pipeline: Record<string, number> }) {
  const metrics = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;border-collapse:collapse;"><tr>${metricCard("New Leads", input.newLeadCount, "Created this week")}${metricCard("MRR", `$${input.mrr.toLocaleString()}`, "Paid monthly revenue")}${metricCard("New Clients", input.newClientCount, "Paid orders this week")}</tr></table>`;
  const body = `${metrics}${pipelineTable(input.statuses, input.pipeline)}${csPillButton("View Admin Dashboard →", "https://clientsurgesystems.com/admin")}`;
  const signature = getClientSurgeSignature("system");
  return csEmailShell({
    badge: "Weekly Digest",
    title: `Weekly Digest — ${input.dateLabel}`,
    subtitle: "Your ClientSurge weekly lead, revenue, and pipeline snapshot is ready.",
    body,
    logoUrl: csEmailLogoUrl(),
    footerTitle: signature.footerTitle,
    footerText: signature.footerText,
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 3600000);

    const allLeads = await base44.asServiceRole.entities.SpaLead.filter({}).catch(() => []);
    const newLeads = (allLeads || []).filter((lead) => lead.created_date > weekAgo.toISOString());
    const bookedLeads = (allLeads || []).filter((lead) => lead.status === "Booked");

    const orders = await base44.asServiceRole.entities.Order.filter({ payment_status: "paid" }).catch(() => []);
    const mrr = (orders || []).reduce((sum, order) => sum + (order.monthly_rate || 0), 0);
    const newClients = (orders || []).filter((order) => order.created_date > weekAgo.toISOString());

    const statuses = ["New", "Contacted", "Replied", "Qualified", "Booked"];
    const pipeline: Record<string, number> = {};
    for (const status of statuses) pipeline[status] = (allLeads || []).filter((lead) => lead.status === status).length;

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return secureJson({ error: "RESEND_API_KEY not configured" }, { status: 500 });

    const dateLabel = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    const html = buildWeeklyDigestHtml({ dateLabel, newLeadCount: newLeads.length, mrr, newClientCount: newClients.length, statuses, pipeline });
    const signature = getClientSurgeSignature("system");

    const response = await resendFetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: formatClientSurgeFrom("system"),
        reply_to: signature.replyTo,
        to: signature.fromEmail === "system@clientsurgesystems.com" ? "nolan@clientsurgesystems.com" : Deno.env.get("ADMIN_EMAIL") || "nolan@clientsurgesystems.com",
        subject: `Weekly Digest — ${newLeads.length} new leads, $${mrr.toLocaleString()} MRR`,
        html,
        tags: senderTags("system", "weekly_digest"),
      }),
    });

    if (!response.ok) throw new Error(`Resend error ${response.status}`);

    console.log("[sendWeeklyDigest] Sent", { new_leads: newLeads.length, booked: bookedLeads.length, mrr, new_clients: newClients.length });
    return secureJson({ success: true, new_leads: newLeads.length, booked: bookedLeads.length, mrr, new_clients: newClients.length });
  } catch (err) {
    console.error("[sendWeeklyDigest]", err.message);
    return secureJson({ error: err.message }, { status: 500 });
  }
});
