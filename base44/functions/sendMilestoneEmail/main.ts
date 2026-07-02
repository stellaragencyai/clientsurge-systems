import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resendFetch } from "../_shared/resendFetch.js";
import { csEmailShell, csInfoCard, csPillButton, csEmailFrom, csEmailLogoUrl } from "../_shared/clientSurgeEmailDesignSystem.ts";

const MILESTONE_EMAILS: Record<string, { subject: string; headline: string; body: string; badge: string }> = {
  "In Progress": { subject: "Your ClientSurge setup is underway", headline: "We're building your system.", body: "Our team has started configuring your AI automation system. You will hear from us within 24 hours with your first update.", badge: "In Progress" },
  "Configuring": { subject: "Your automations are being configured", headline: "Your automations are being configured.", body: "We are wiring up your AI automations and preparing the system for testing. This stage typically takes 24-48 hours.", badge: "Configuring" },
  "Ready for Install": { subject: "Your system is ready for final install", headline: "Final install is in progress.", body: "Your customized system is built and ready. We are doing final testing before going live.", badge: "Final Install" },
  "Active": { subject: "Your ClientSurge AI automations are running", headline: "Your system is active.", body: "Your AI lead response system is now live and running 24/7. New leads can move through your response workflow even after hours.", badge: "Active" },
  "Complete": { subject: "Setup complete — here's what's running for you", headline: "Setup is complete.", body: "Your automation stack is configured, tested, and live. Check your client portal for the latest view of what is running.", badge: "Complete" },
};

function buildMilestoneEmail(input: { stage: string; headline: string; body: string; portalUrl: string }) {
  const body = `${csInfoCard("Current Milestone", input.stage, { accent: true })}${csInfoCard("What this means", input.body)}${csPillButton("View Your Portal →", input.portalUrl)}`;
  return csEmailShell({ badge: input.stage, title: input.headline, subtitle: "Your ClientSurge installation has moved to the next stage.", body, logoUrl: csEmailLogoUrl(), footerTitle: "Installation update", footerText: "Reply to this email if anything looks off. ClientSurge Systems · Phoenix, Arizona" });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const project_id = body.project_id || body.event?.entity_id || body.data?.id;
    const new_stage = body.workflow_stage || body.data?.workflow_stage;
    if (!project_id || !new_stage) return secureJson({ error: "project_id and workflow_stage required" }, { status: 400 });

    const template = MILESTONE_EMAILS[new_stage];
    if (!template) return secureJson({ skipped: true, reason: `No email defined for stage: ${new_stage}` });

    const project = await base44.asServiceRole.entities.ClientProject.get(project_id);
    if (!project?.order_id) return secureJson({ error: "Project has no order_id" }, { status: 400 });
    const order = await base44.asServiceRole.entities.Order.get(project.order_id);
    if (!order?.customer_email) return secureJson({ error: "No customer email on order" }, { status: 400 });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const portalUrl = `https://clientsurgesystems.com/client-portal?order_id=${project.order_id}`;
    const html = buildMilestoneEmail({ stage: new_stage, headline: template.headline, body: template.body, portalUrl });

    const res = await resendFetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: csEmailFrom(), reply_to: "nolan@clientsurgesystems.com", to: order.customer_email, subject: template.subject, html }),
    });
    if (!res.ok) throw new Error(`Resend error ${res.status}`);

    await base44.asServiceRole.entities.CommunicationEvent.create({ context_id: project_id, context_type: "client_project", event_type: "email_sent", direction: "outbound", metadata_json: JSON.stringify({ milestone: new_stage, subject: template.subject }) });
    return secureJson({ success: true, stage: new_stage, email: order.customer_email });
  } catch (err) {
    console.error("[sendMilestoneEmail]", err.message);
    return secureJson({ error: err.message }, { status: 500 });
  }
});
