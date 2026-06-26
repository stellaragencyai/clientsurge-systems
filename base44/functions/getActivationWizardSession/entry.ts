import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const WIZARD_STEPS = [
  "Payment Received",
  "Setup Authorization Agreement",
  "Business Details",
  "Website Intelligence Scan",
  "Lead Path Confirmation",
  "Smart Access Setup",
  "Booking / Calendar Setup",
  "Phone / SMS Setup",
  "Email / Domain Setup",
  "AI Business Profile + Template Approval",
  "AI Simulation Lab",
  "Proof Logs",
  "Client Go-Live Approval",
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { order_id, advance_to_step } = body;

    if (!order_id) return json({ error: "order_id required" }, 400);

    // Find or create session
    let sessions = await base44.asServiceRole.entities.ActivationWizardSession.filter(
      { order_id },
      "-created_date",
      1
    ).catch(() => []);

    let session = sessions?.[0] || null;

    if (!session) {
      const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
      if (!order) return json({ error: "Order not found" }, 404);

      session = await base44.asServiceRole.entities.ActivationWizardSession.create({
        order_id,
        client_id: order.client_id || "",
        client_project_id: order.client_project_id || "",
        client_email: order.customer_email || "",
        business_name: order.business_name || "",
        package_key: order.package_key || order.package_type || order.selected_package_type || "",
        current_step: 0,
        completed_steps: [],
        blockers: [],
        status: "in_progress",
        last_updated_at: new Date().toISOString(),
      });
      console.log(`[getActivationWizardSession] Created session for order ${order_id}`);
    }

    // If advancing to a specific step, validate authorization gate
    if (advance_to_step !== undefined && advance_to_step > 0) {
      const auths = await base44.asServiceRole.entities.SetupAuthorization.filter(
        { order_id, authorization_status: "accepted" },
        "-created_date",
        1
      ).catch(() => []);

      if (!auths?.length && advance_to_step > 1) {
        return json({
          error: "Setup Authorization Agreement must be accepted before proceeding",
          blocked: true,
          block_step: 0,
          session,
        }, 403);
      }

      const completedSteps = session.completed_steps || [];
      if (!completedSteps.includes(advance_to_step - 1)) {
        completedSteps.push(advance_to_step - 1);
      }

      session = await base44.asServiceRole.entities.ActivationWizardSession.update(session.id, {
        current_step: advance_to_step,
        completed_steps: [...new Set(completedSteps)],
        last_updated_at: new Date().toISOString(),
      });
    }

    return json({
      success: true,
      session,
      wizard_steps: WIZARD_STEPS,
    });
  } catch (error) {
    console.error("[getActivationWizardSession] Error:", error.message);
    return json({ error: error.message }, 500);
  }
});