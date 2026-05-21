import { secureJson } from "../_shared/response.ts";
/**
 * sendMilestoneEmail — #118 #231
 * Triggered by entity automation when ClientProject.workflow_stage changes.
 * Sends a personalized milestone email for each stage transition.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resendFetch } from "../_shared/resendFetch.js";

const MILESTONE_EMAILS: Record<string, { subject: string; headline: string; body: string }> = {
  "In Progress": {
    subject: "Your ClientSurge setup is underway! 🚀",
    headline: "We're building your system",
    body: "Our team has started configuring your AI automation system. You'll hear from us within 24 hours with your first update.",
  },
  "Configuring": {
    subject: "Your automations are being configured ⚙️",
    headline: "Almost there!",
    body: "We're actively wiring up your AI automations. This typically takes 24-48 hours. We'll send you access as soon as everything is tested and live.",
  },
  "Ready for Install": {
    subject: "Your system is ready for final install ✅",
    headline: "Final step in progress",
    body: "Your customized system is built and ready. We're doing final testing before going live. Expect your live confirmation within a few hours.",
  },
  "Active": {
    subject: "🎉 You're live! Your AI automations are running",
    headline: "You're officially live!",
    body: "Your AI lead response system is now live and running 24/7. Every new lead will get an instant response within 60 seconds — even at 2am.",
  },
  "Complete": {
    subject: "Setup complete — here's what's running for you",
    headline: "All systems go!",
    body: "Your full automation stack is configured, tested, and live. Check your client portal for a live view of everything that's running.",
  },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const project_id = body.project_id || body.event?.entity_id || body.data?.id;
    const new_stage = body.workflow_stage || body.data?.workflow_stage;

    if (!project_id || !new_stage) {
      return secureJson({ error: "project_id and workflow_stage required" }, { status: 400 });
    }

    const template = MILESTONE_EMAILS[new_stage];
    if (!template) {
      return secureJson({ skipped: true, reason: `No email defined for stage: ${new_stage}` });
    }

    const project = await base44.asServiceRole.entities.ClientProject.get(project_id);
    if (!project?.order_id) return secureJson({ error: "Project has no order_id" }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(project.order_id);
    if (!order?.customer_email) return secureJson({ error: "No customer email on order" }, { status: 400 });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const portalUrl = `https://clientsurgesystems.com/client-portal?order_id=${project.order_id}`;

    const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="background:linear-gradient(135deg,#0A0F1E,#111827);border-radius:16px;padding:32px;color:#fff;text-align:center;margin-bottom:24px;">
    <h1 style="color:#00FFB3;font-size:24px;margin:0 0 8px;">${template.headline}</h1>
    <p style="color:#9CA3AF;font-size:15px;margin:0;">${template.body}</p>
  </div>
  <div style="text-align:center;">
    <a href="${portalUrl}" style="display:inline-block;background:linear-gradient(135deg,#00D4FF,#00FFB3);color:#0A0F1E;border-radius:9999px;padding:14px 32px;font-weight:800;font-size:15px;text-decoration:none;">
      View Your Portal →
    </a>
  </div>
  <p style="color:#9CA3AF;font-size:12px;text-align:center;margin-top:24px;">
    Questions? Reply to this email or contact nolan@clientsurgesystems.com
  </p>
</div>`;

    const res = await resendFetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "system@clientsurgesystems.com",
        reply_to: "nolan@clientsurgesystems.com",
        to: order.customer_email,
        subject: template.subject,
        html,
      }),
    });

    if (!res.ok) throw new Error(`Resend error ${res.status}`);

    await base44.asServiceRole.entities.CommunicationEvent.create({
      context_id: project_id, context_type: "client_project",
      event_type: "email_sent", direction: "outbound",
      metadata_json: JSON.stringify({ milestone: new_stage, subject: template.subject }),
    });

    console.log(`[sendMilestoneEmail] Sent "${new_stage}" email to ${order.customer_email}`);
    return secureJson({ success: true, stage: new_stage, email: order.customer_email });
  } catch (err) {
    console.error("[sendMilestoneEmail]", err.message);
    return secureJson({ error: err.message }, { status: 500 });
  }
});
