import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { buildCommunicationEvent } from "../_shared/installPipeline.js";
import { resendFetch } from "../_shared/resendFetch.js";
import { csEmailShell, csInfoCard, csPillButton, csEmailLogoUrl, csEmailEscape, CS_EMAIL_THEME } from "../_shared/clientSurgeEmailDesignSystem.ts";
import { formatClientSurgeFrom, getClientSurgeSignature, senderTags } from "../_shared/clientSurgeEmailSignatures.ts";

const REPORT_STATUSES = new Set(["Live", "live"]);

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getClientEmail(client: any): string {
  return cleanString(client.email || client.client_email || client.contact_email);
}

function getClientName(client: any): string {
  return cleanString(client.owner_name || client.client_name || client.customer_name || client.full_name) || "there";
}

function getBusinessName(client: any): string {
  return cleanString(client.business_name || client.company_name || client.name) || "your business";
}

function getReportMonth(now = new Date()): string {
  return now.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "America/Phoenix" });
}

function getDaysLive(client: any, now = new Date()): number | null {
  const startDate = cleanString(client.start_date || client.go_live_date || client.launch_date);
  if (!startDate) return null;
  const startedAt = new Date(startDate);
  if (Number.isNaN(startedAt.getTime())) return null;
  return Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24)));
}

function getActiveSystems(client: any): string[] {
  const systems = [];
  if (client.step_instant_response) systems.push("Instant Lead Response");
  if (client.step_missed_call) systems.push("Missed Call Text-Back");
  if (client.step_followup_sequence || client.step_followup) systems.push("AI Lead Follow-Up");
  if (client.step_booking) systems.push("Appointment Booking");
  if (client.step_review_request || client.step_reviews) systems.push("Review & Reputation Automation");
  if (client.step_reactivation || client.step_lead_reactivation) systems.push("Customer Reactivation");
  if (client.step_messages_customized) systems.push("Custom-Branded Messaging");
  if (client.step_tested) systems.push("End-to-End QA Verified");
  return systems.length ? systems : ["Core automation systems running"];
}

function systemList(systems: string[]) {
  return `<div style="margin-top:24px;background:#ffffff;border:1px solid ${CS_EMAIL_THEME.border};border-radius:16px;padding:20px 22px;"><div style="color:${CS_EMAIL_THEME.deep};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.09em;margin-bottom:12px;">Active Automation Systems</div>${systems.map((system) => `<div style="padding:10px 0;border-bottom:1px solid ${CS_EMAIL_THEME.border};color:#000;font-size:14px;line-height:21px;font-weight:800;">${csEmailEscape(system)}</div>`).join("")}</div>`;
}

function metricGrid(daysLive: number | null, activeSystems: string[]) {
  const liveValue = daysLive === null ? "Live" : String(daysLive);
  const liveDetail = daysLive === null ? "Automation status" : "Days live";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;border-collapse:collapse;"><tr><td style="width:50%;padding:6px;vertical-align:top;"><div style="background:${CS_EMAIL_THEME.soft};border:1px solid ${CS_EMAIL_THEME.border};border-radius:16px;padding:18px 16px;text-align:center;"><div style="font-size:30px;line-height:36px;font-weight:900;color:#000;">${csEmailEscape(liveValue)}</div><div style="margin-top:4px;color:${CS_EMAIL_THEME.deep};font-size:11px;line-height:15px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;">${csEmailEscape(liveDetail)}</div></div></td><td style="width:50%;padding:6px;vertical-align:top;"><div style="background:${CS_EMAIL_THEME.soft};border:1px solid ${CS_EMAIL_THEME.border};border-radius:16px;padding:18px 16px;text-align:center;"><div style="font-size:30px;line-height:36px;font-weight:900;color:#000;">${activeSystems.length}</div><div style="margin-top:4px;color:${CS_EMAIL_THEME.deep};font-size:11px;line-height:15px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;">Systems Running</div></div></td></tr></table>`;
}

function buildReport({ client, month, now = new Date() }: { client: any; month: string; now?: Date }) {
  const businessName = getBusinessName(client);
  const ownerName = getClientName(client);
  const daysLive = getDaysLive(client, now);
  const activeSystems = getActiveSystems(client);
  const signature = getClientSurgeSignature("founder");

  const body = `<p style="margin:0 0 10px;color:${CS_EMAIL_THEME.muted};font-size:15px;line-height:22px;font-weight:650;">Hi ${csEmailEscape(ownerName)},</p>${metricGrid(daysLive, activeSystems)}${systemList(activeSystems)}${csInfoCard("What this means", "Your ClientSurge systems have been running in the background to capture leads, respond faster, support booking follow-up, and keep your customer pipeline moving.", { accent: true })}${csInfoCard("Recommended next step", "Reply to this report if you want to review results or tune next month’s automations. Nolan will help directly.")}${csPillButton("Open Client Portal →", "https://clientsurgesystems.com/client-portal")}`;
  const html = csEmailShell({ badge: "Monthly Report", title: `${month} Performance Summary`, subtitle: `${businessName} — monthly ClientSurge automation report.`, body, logoUrl: csEmailLogoUrl(), footerTitle: signature.footerTitle, footerText: signature.footerText });
  const textSystems = activeSystems.map((system) => `- ${system}`).join("\n");
  const text = `Hi ${ownerName}\n\n${month} Performance Summary - ${businessName}\n${daysLive !== null ? `Days live: ${daysLive}\n` : ""}Active automation systems:\n${textSystems}\n\nYour ClientSurge systems have been running in the background to capture leads, respond faster, support booking follow-up, and keep your customer pipeline moving.\n\nIf you want to review results or tune next month of automations, reply to this email and Nolan will help directly.\n\n${signature.plainText}`;

  return { business_name: businessName, owner_name: ownerName, days_live: daysLive, active_systems: activeSystems, subject: `${month} Performance Summary - ${businessName}`, html, text };
}

async function sendReportEmail({ resendKey, to, report }: { resendKey: string; to: string; report: ReturnType<typeof buildReport> }) {
  const signature = getClientSurgeSignature("founder");
  const response = await resendFetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: formatClientSurgeFrom("founder"), reply_to: signature.replyTo, to, subject: report.subject, html: report.html, text: report.text, tags: senderTags("founder", "monthly_client_report") }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.message || `Resend request failed: ${response.status}`);
  return body;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { client_id, send_email = false, limit = 200 } = await req.json().catch(() => ({}));

    const month = getReportMonth();
    const clients = client_id ? await base44.asServiceRole.entities.OnboardingClient.filter({ id: client_id }).catch(() => []) : await base44.asServiceRole.entities.OnboardingClient.list("-created_date", Math.min(Number(limit) || 200, 500));
    const liveClients = (clients || []).filter((client: any) => REPORT_STATUSES.has(client.status));
    if (!liveClients.length) return secureJson({ success: true, month, reports: [], emails_sent: 0, message: "No live clients to report on." });

    const resendKey = Deno.env.get("RESEND_API_KEY") || "";
    if (send_email && !resendKey) return secureJson({ error: "RESEND_API_KEY missing" }, { status: 500 });

    const results = [];
    let emailsSent = 0;
    for (const client of liveClients) {
      const email = getClientEmail(client);
      const report = buildReport({ client, month });
      const result: any = { client_id: client.id || null, business_name: report.business_name, email, month, active_systems: report.active_systems, days_live: report.days_live, sent: false };

      if (send_email && email) {
        try {
          const emailResult = await sendReportEmail({ resendKey, to: email, report });
          result.sent = true;
          result.resend_message_id = emailResult?.id || null;
          emailsSent += 1;
          await base44.asServiceRole.entities.CommunicationEvent.create(buildCommunicationEvent({ order: { id: client.order_id || client.orderId || client.id, customer_email: email, business_name: report.business_name }, event_type: "email_sent", provider: "resend", status: "sent", subject: report.subject, message_body: report.text, metadata: { context_type: "monthly_client_report", client_id: client.id || null, report_month: month, active_systems: report.active_systems, resend_message_id: result.resend_message_id } }));
        } catch (error) {
          result.error = error instanceof Error ? error.message : String(error);
        }
      }
      results.push(result);
    }

    return secureJson({ success: true, month, preview: !send_email, emails_sent: emailsSent, reports: results });
  } catch (error: any) {
    return secureJson({ error: error.message }, { status: 500 });
  }
});
