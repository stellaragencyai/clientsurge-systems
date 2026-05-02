/**
 * Installation Pipeline: Post-Payment Service Orchestration
 * 
 * Orchestrates complete workflow: Payment → Config → Testing → Live Services
 * Manages state transitions and sends notifications
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

// ─────────────────────────────────────────
// ERROR TYPES
// ─────────────────────────────────────────

class InstallLinkingError extends Error {
  constructor(message, details) {
    super(message);
    this.name = "InstallLinkingError";
    this.details = details || {};
  }
}

class InstallTransitionError extends Error {
  constructor(message, details) {
    super(message);
    this.name = "InstallTransitionError";
    this.details = details || {};
  }
}

// ─────────────────────────────────────────
// SERVICE REGISTRY
// ─────────────────────────────────────────

const SERVICE_CONFIG = {
  instant_lead_response: { display_name: "Instant Lead Response", required_config: ["sms_template"] },
  missed_call_text_back: { display_name: "Missed Call Text-Back", required_config: ["sms_template", "twilio_number"] },
  nurture_sequence_14d: { display_name: "14-Day Nurture Sequence", required_config: ["email_enabled", "sms_enabled"] },
  ai_booking_agent: { display_name: "AI Booking Agent", required_config: ["booking_link"] },
  lead_reactivation: { display_name: "Lead Reactivation", required_config: ["message_template"] },
  review_request: { display_name: "Review Request", required_config: ["review_link"] },
};

const VALID_TRANSITIONS = {
  "Paid": ["Ready for Install"],
  "Ready for Install": ["Configuring"],
  "Configuring": ["Testing"],
  "Testing": ["Live", "Error"],
  "Live": ["Live"],
  "Error": ["Ready for Install", "Configuring"],
};

// ─────────────────────────────────────────
// MAIN API HANDLER
// ─────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { action, order_id, service_key, install_status, note } = payload;

    if (action === "initialize") {
      const order = await base44.asServiceRole.entities.Order.get(order_id);
      if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

      const result = await initializePaidOrderInstallPipeline(base44, order);
      return Response.json(result);
    }

    if (action === "update_status") {
      const order = await base44.asServiceRole.entities.Order.get(order_id);
      if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

      const result = await updateServiceInstallStatus(base44, order, service_key, install_status, note);
      return Response.json(result);
    }

    if (action === "list_queue") {
      const orders = await listInstallQueue(base44);
      return Response.json({ orders });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[Pipeline] Error:", error.message);
    return Response.json(
      { error: error.message, details: error.details || {} },
      { status: error.name === "InstallTransitionError" ? 409 : 500 }
    );
  }
});

// ─────────────────────────────────────────
// CORE FUNCTIONS
// ─────────────────────────────────────────

async function initializePaidOrderInstallPipeline(base44, order) {
  console.log(`[Pipeline] Initializing order ${order.id}`);

  const updatedOrder = await base44.asServiceRole.entities.Order.update(order.id, {
    payment_status: "paid",
    pipeline_status: "Ready for Install",
    install_initialized_at: new Date().toISOString(),
  });

  let clientProject;
  try {
    const existing = await base44.asServiceRole.entities.ClientProject.filter(
      { order_id: order.id },
      "-created_date",
      1
    );

    if (existing?.length > 0) {
      clientProject = existing[0];
      console.log(`[Pipeline] Linked to existing project ${clientProject.id}`);
    } else {
      clientProject = await base44.asServiceRole.entities.ClientProject.create({
        order_id: order.id,
        business_name: order.business_name,
        owner_email: order.customer_email,
        owner_name: order.customer_name,
        status: "Configuring",
        plan: order.plan_type || "Custom Services",
        install_configuration: order.install_configuration || {},
      });
      console.log(`[Pipeline] Created project ${clientProject.id}`);
    }
  } catch (error) {
    throw new InstallLinkingError("Failed to create/link project", {
      order_id: order.id,
      error: error.message,
    });
  }

  await base44.asServiceRole.entities.Order.update(order.id, {
    client_id: clientProject.id,
  });

  return {
    success: true,
    order: updatedOrder,
    project: clientProject,
    message: "Order initialized for installation",
  };
}

async function updateServiceInstallStatus(base44, order, serviceKey, nextStatus, note = "") {
  console.log(`[Pipeline] Updating ${serviceKey}: ${nextStatus}`);

  const item = order.items?.find((i) => i.service_key === serviceKey);
  if (!item) throw new Error("Service not found on order");

  const currentStatus = item.install_status || "Paid";
  if (!VALID_TRANSITIONS[currentStatus]?.includes(nextStatus)) {
    throw new InstallTransitionError(
      `Invalid transition: ${currentStatus} → ${nextStatus}`,
      { current_status: currentStatus, requested: nextStatus, valid: VALID_TRANSITIONS[currentStatus] }
    );
  }

  const timestamp = new Date().toISOString();
  const updatedItems = order.items.map((i) => {
    if (i.service_key !== serviceKey) return i;
    const updates = { ...i, install_status: nextStatus };
    if (nextStatus === "Configuring" && !i.install_started_at) {
      updates.install_started_at = timestamp;
    }
    if (nextStatus === "Live") {
      updates.install_completed_at = timestamp;
    }
    if (nextStatus === "Error") {
      updates.install_error = note;
    }
    return updates;
  });

  const newPipelineStatus = calculatePipelineStatus(updatedItems);
  const updatedOrder = await base44.asServiceRole.entities.Order.update(order.id, {
    items: updatedItems,
    pipeline_status: newPipelineStatus,
    last_install_event_at: timestamp,
  });

  // If all services live, send celebration email
  if (updatedItems.every((i) => i.install_status === "Live")) {
    await base44.asServiceRole.entities.Order.update(order.id, {
      order_status: "fully_live",
    });

    await sendLiveNotification(base44, updatedOrder);
  }

  return {
    success: true,
    order: updatedOrder,
    status: nextStatus,
    pipeline_status: newPipelineStatus,
  };
}

async function listInstallQueue(base44) {
  const orders = await base44.asServiceRole.entities.Order.filter(
    { payment_status: "paid" },
    "-install_initialized_at"
  );

  return (orders || []).map((order) => ({
    id: order.id,
    business_name: order.business_name,
    customer_email: order.customer_email,
    pipeline_status: order.pipeline_status,
    items: (order.items || []).filter((i) => i.tracking_enabled),
    created_date: order.created_date,
    install_initialized_at: order.install_initialized_at,
  }));
}

// ─────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────

function calculatePipelineStatus(items) {
  const statuses = items.map((i) => i.install_status || "Paid");
  if (statuses.every((s) => s === "Live")) return "Live";
  if (statuses.some((s) => s === "Error")) return "Error";
  if (statuses.some((s) => s === "Testing")) return "Testing";
  if (statuses.some((s) => s === "Configuring")) return "Configuring";
  if (statuses.some((s) => s === "Ready for Install")) return "Ready for Install";
  return "Paid";
}

async function sendLiveNotification(base44, order) {
  const serviceNames = order.items
    ?.filter((i) => i.install_status === "Live")
    .map((i) => i.product_name)
    .join(", ");

  const body = `
<div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 580px; margin: 0 auto; color: #1a1a1a;">
  <div style="background: linear-gradient(135deg, #6b3f1f 0%, #9a5c2e 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 32px; color: white;">🚀 You're Live!</h1>
  </div>
  
  <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
    <p style="margin: 0 0 20px; font-size: 16px; color: #333;">Hi ${order.customer_name},</p>
    
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #555;">
      Your ClientSurge automation is now <strong>active and running</strong>. Your services are live and ready to work.
    </p>
    
    <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
      <p style="margin: 0; font-weight: 600; color: #1e40af; font-size: 14px;">✓ Active Services</p>
      <p style="margin: 8px 0 0; color: #1e40af; font-size: 13px;">${serviceNames}</p>
    </div>
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
      <p style="margin: 0; font-weight: 600; color: #92400e; font-size: 14px;">What's Running Now</p>
      <ul style="margin: 8px 0 0; padding-left: 20px; color: #92400e; font-size: 13px;">
        <li>✓ Instant lead responses (24/7)</li>
        <li>✓ Automated follow-up sequences</li>
        <li>✓ Real-time lead tracking</li>
      </ul>
    </div>
    
    <div style="text-align: center;">
      <a href="https://clientsurgesystems.com/client-portal" style="display: inline-block; background: linear-gradient(135deg, #6b3f1f 0%, #9a5c2e 100%); color: white; text-decoration: none; font-weight: 600; padding: 12px 28px; border-radius: 999px; font-size: 14px;">
        Go To Your Dashboard →
      </a>
    </div>
    
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #999;">Questions? Use the support chat in your portal.</p>
    </div>
  </div>
</div>`;

  await base44.asServiceRole.integrations.Core.SendEmail({
    to: order.customer_email,
    subject: "🚀 Your ClientSurge Systems Are LIVE!",
    body,
    from_name: "ClientSurge Systems",
  });

  console.log(`[Pipeline] Sent live notification to ${order.customer_email}`);
}

export { InstallLinkingError, InstallTransitionError };