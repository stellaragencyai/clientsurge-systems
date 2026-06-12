/**
 * postPaymentOrchestrator — Called after a successful Stripe payment.
 * Creates ClientProject, links client_id, sends order confirmation email.
 * Self-contained — no local imports.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
  });
}

Deno.serve(async (req) => {
  let body = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { order_id } = body;
  if (!order_id) return json({ error: "order_id required" }, 400);

  const base44 = createClientFromRequest(req);
  const tasks = [];

  try {
    // Load the order
    const orders = await base44.asServiceRole.entities.Order.filter(
      { id: order_id }, "-created_date", 1
    ).catch(() => []);
    const order = orders?.[0];
    if (!order) {
      console.error("[postPaymentOrchestrator] Order not found", { order_id });
      return json({ error: "Order not found" }, 404);
    }

    console.log("[postPaymentOrchestrator] Processing paid order", {
      order_id, customer_email: order.customer_email, business_name: order.business_name,
    });

    // Step 1: Link client_id by User lookup on customer_email
    if (!order.client_id && order.customer_email) {
      const users = await base44.asServiceRole.entities.User.filter(
        { email: order.customer_email }, "-created_date", 1
      ).catch(() => []);
      if (users?.[0]) {
        await base44.asServiceRole.entities.Order.update(order_id, { client_id: users[0].id }).catch(() => null);
        tasks.push(`client_id_linked: ${users[0].id}`);
        console.log("[postPaymentOrchestrator] client_id linked", { client_id: users[0].id });
      } else {
        tasks.push("client_id: no matching user found");
        console.log("[postPaymentOrchestrator] No matching user for email", { email: order.customer_email });
      }
    }

    // Step 2: Create or update ClientProject
    const existingProjects = await base44.asServiceRole.entities.ClientProject.filter(
      { client_email: order.customer_email || "" }, "-created_date", 1
    ).catch(() => []);

    if (!existingProjects?.length) {
      const packageType = order.package_type || order.selected_package_type || "starter_system";
      const planName = order.pricing_summary?.package_name || order.plan_type || "Starter System";
      const project = await base44.asServiceRole.entities.ClientProject.create({
        client_email: order.customer_email,
        client_name: order.customer_name || order.customer_email,
        business_name: order.business_name || order.customer_name || "",
        plan: planName.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        step_payment: "complete",
        step_onboarding: "in_progress",
        step_system_setup: "pending",
        step_sms: "pending",
        step_email: "pending",
        step_booking: "pending",
        step_followup: "pending",
        step_live: "pending",
      }).catch(err => {
        console.error("[postPaymentOrchestrator] ClientProject create failed", { error: err.message });
        return null;
      });

      if (project) {
        await base44.asServiceRole.entities.Order.update(order_id, {
          client_project_id: project.id,
        }).catch(() => null);
        tasks.push(`client_project_created: ${project.id}`);
        console.log("[postPaymentOrchestrator] ClientProject created", { project_id: project.id });
      }
    } else {
      const project = existingProjects[0];
      await base44.asServiceRole.entities.ClientProject.update(project.id, {
        step_payment: "complete",
      }).catch(() => null);
      await base44.asServiceRole.entities.Order.update(order_id, {
        client_project_id: project.id,
      }).catch(() => null);
      tasks.push(`client_project_updated: ${project.id}`);
      console.log("[postPaymentOrchestrator] Existing ClientProject updated", { project_id: project.id });
    }

    // Step 3: Log order confirmation CommunicationEvent
    await base44.asServiceRole.entities.CommunicationEvent.create({
      order_id,
      lead_id: order.lead_id || order.crm_lead_id || null,
      channel: "email",
      direction: "outbound",
      event_type: "order_paid",
      provider: "internal",
      status: "processed",
      subject: `Order confirmation — ${order.customer_email}`,
      message_body: `Payment confirmed for ${order.business_name || order.customer_name}. Plan: ${order.plan_type || "N/A"}. Setup fee: $${order.total_setup || 0}. Monthly: $${order.total_monthly || 0}.`,
      metadata_json: JSON.stringify({
        order_id,
        package_type: order.package_type,
        total_setup: order.total_setup,
        total_monthly: order.total_monthly,
      }),
    }).catch(() => null);
    tasks.push("order_confirmation_event_logged");

    // Step 4: Fire deployment confirmation email (replaces demo confirmation)
    base44.asServiceRole.functions.invoke("sendDeploymentConfirmationEmail", {
      order_id,
      customer_email: order.customer_email,
      customer_name: order.customer_name,
      package_name: order.pricing_summary?.package_name || order.plan_type,
      package_key: order.package_type || order.selected_package_type || "starter_system",
    }).catch(err => {
      console.error("[postPaymentOrchestrator] sendDeploymentConfirmationEmail failed (non-blocking)", { error: err.message });
    });
    tasks.push("deployment_confirmation_email_queued");

    // Step 5: Fire admin purchase notification (non-blocking)
    base44.asServiceRole.functions.invoke("sendAdminPurchaseNotification", {
      order_id,
      customer_email: order.customer_email,
      customer_name: order.customer_name,
      business_name: order.business_name,
      total_setup: order.total_setup,
      total_monthly: order.total_monthly,
    }).catch(() => null);
    tasks.push("admin_notification_queued");

    // Step 6: Fire AI Brain Installer (non-blocking) — handles steps 5–10:
    //   creates AutomationJobs, applies default config, runs test lead,
    //   marks services Live, finalizes ClientProject, writes AuditLog
    base44.asServiceRole.functions.invoke("aiBrainInstaller", {
      order_id,
    }).catch(err => {
      console.error("[postPaymentOrchestrator] aiBrainInstaller invoke failed (non-blocking)", { error: err.message });
    });
    tasks.push("ai_brain_installer_queued");

    console.log("[postPaymentOrchestrator] Complete", { order_id, tasks });
    return json({ success: true, order_id, tasks });

  } catch (err) {
    console.error("[postPaymentOrchestrator] Fatal error", { error: err.message, order_id });
    await base44.asServiceRole.entities.CommunicationEvent.create({
      order_id,
      channel: "internal",
      direction: "system",
      event_type: "order_paid",
      provider: "internal",
      status: "failed",
      subject: `postPaymentOrchestrator failed for order ${order_id}`,
      error_message: err.message,
      metadata_json: JSON.stringify({ order_id, error: err.message }),
    }).catch(() => null);
    return json({ error: err.message, order_id, tasks }, 500);
  }
});