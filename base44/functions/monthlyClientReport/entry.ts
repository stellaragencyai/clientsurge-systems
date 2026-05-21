/**
 * monthlyClientReport — #526
 * Generates personalized monthly reports for live clients. Email delivery is
 * explicit via send_email=true so previews never send accidentally.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { buildCommunicationEvent } from "../_shared/installPipeline.js";
import { resendFetch } from "../_shared/resendFetch.js";

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
  return now.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "America/Phoenix",
  });
}

function getDaysLive(client: any, now = new Date()): number | null {
  const startDate = cleanString(client.start_date || client.go_live_date || client.launch_date);
  if (!startDate) {
    return null;
  }

  const startedAt = new Date(startDate);
  if (Number.isNaN(startedAt.getTime())) {
    return null;
  }

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

function buildReport({ client, month, now = new Date() }: { client: any; month: string; now?: Date }) {
  const businessName = getBusinessName(client);
  const ownerName = getClientName(client);
  const daysLive = getDaysLive(client, now);
  const activeSystems = getActiveSystems(client);

  const htmlSystems = activeSystems
    .map((system) => `<li style="margin:0 0 8px;color:#374151;">${system}</li>`)
    .join("");
  const textSystems = activeSystems.map((system) => `- ${system}`).join("\n");

  const html = `<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:32px 20px;background:#fff;color:#111827;">
    <p style="font-size:15px;line-height:1.6;color:#374151;">Hi ${ownerName},</p>
    <h2 style="margin:0 0 8px;color:#0A0F1E;font-size:22px;">${month} Performance Summary</h2>
    <p style="margin:0 0 22px;color:#6B7280;font-size:14px;">${businessName}</p>
    ${daysLive !== null ? `<p style="font-size:14px;color:#374151;"><strong>Days live:</strong> ${daysLive}</p>` : ""}
    <p style="font-size:14px;color:#374151;"><strong>Active automation systems:</strong></p>
    <ul style="padding-left:20px;margin:10px 0 22px;">${htmlSystems}</ul>
    <p style="font-size:14px;line-height:1.7;color:#374151;">Your ClientSurge systems have been running in the background to capture leads, respond faster, support booking follow-up, and keep your customer pipeline moving.</p>
    <p style="font-size:14px;line-height:1.7;color:#374151;">If you want to review results or tune the next month of automations, reply to this email and Nolan will help directly.</p>
    <p style="margin-top:26px;color:#6B7280;font-size:13px;">Nolan<br>Founder, ClientSurge Systems<br>nolan@clientsurgesystems.com</p>
  </div>`;

  const text = `Hi ${ownerName},

${month} Performance Summary - ${businessName}
${daysLive !== null ? `Days live: ${daysLive}\n` : ""}
Active automation systems:
${textSystems}

Your ClientSurge systems have been running in the background to capture leads, respond faster, support booking follow-up, and keep your customer pipeline moving.

If you want to review results or tune the next month of automations, reply to this email and Nolan will help directly.

Nolan
Founder, ClientSurge Systems
nolan@clientsurgesystems.com`;

  return {
    business_name: businessName,
    owner_name: ownerName,
    days_live: daysLive,
    active_systems: activeSystems,
    subject: `${month} Performance Summary - ${businessName}`,
    html,
    text,
  };
}

async function sendReportEmail({ resendKey, fromEmail, to, report }: {
  resendKey: string;
  fromEmail: string;
  to: string;
  report: ReturnType<typeof buildReport>;
}) {
  const response = await resendFetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `ClientSurge Systems <${fromEmail}>`,
      reply_to: "nolan@clientsurgesystems.com",
      to,
      subject: report.subject,
      html: report.html,
      text: report.text,
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.message || `Resend request failed: ${response.status}`);
  }

  return body;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const {
      client_id,
      send_email = false,
      limit = 200,
    } = await req.json().catch(() => ({}));

    const month = getReportMonth();
    const clients = client_id
      ? await base44.asServiceRole.entities.OnboardingClient.filter({ id: client_id }).catch(() => [])
      : await base44.asServiceRole.entities.OnboardingClient.list("-created_date", Math.min(Number(limit) || 200, 500));
    const liveClients = (clients || []).filter((client: any) => REPORT_STATUSES.has(client.status));

    if (!liveClients.length) {
      return Response.json({ success: true, month, reports: [], emails_sent: 0, message: "No live clients to report on." });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY") || "";
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "reports@clientsurgesystems.com";
    if (send_email && !resendKey) {
      return Response.json({ error: "RESEND_API_KEY missing" }, { status: 500 });
    }

    const results = [];
    let emailsSent = 0;

    for (const client of liveClients) {
      const email = getClientEmail(client);
      const report = buildReport({ client, month });
      const result: any = {
        client_id: client.id || null,
        business_name: report.business_name,
        email,
        month,
        active_systems: report.active_systems,
        days_live: report.days_live,
        sent: false,
      };

      if (send_email && email) {
        try {
          const emailResult = await sendReportEmail({ resendKey, fromEmail, to: email, report });
          result.sent = true;
          result.resend_message_id = emailResult?.id || null;
          emailsSent += 1;

          await base44.asServiceRole.entities.CommunicationEvent.create(
            buildCommunicationEvent({
              order: {
                id: client.order_id || client.orderId || client.id,
                customer_email: email,
                business_name: report.business_name,
              },
              event_type: "email_sent",
              provider: "resend",
              status: "sent",
              subject: report.subject,
              message_body: report.text,
              metadata: {
                context_type: "monthly_client_report",
                client_id: client.id || null,
                report_month: month,
                active_systems: report.active_systems,
                resend_message_id: result.resend_message_id,
              },
            })
          );
        } catch (error) {
          result.error = error instanceof Error ? error.message : String(error);
        }
      }

      results.push(result);
    }

    return Response.json({
      success: true,
      month,
      preview: !send_email,
      emails_sent: emailsSent,
      reports: results,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
