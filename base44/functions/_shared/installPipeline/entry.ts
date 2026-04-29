/**
 * Installation Pipeline: Post-Payment Service Orchestration
 * Core orchestration for payment → live services workflow
 */

import { InstallLinkingError, InstallTransitionError } from "./installErrors.js";
import {
  getTrackedServiceConfig,
  normalizeInstallConfiguration,
  calculatePipelineStatus,
} from "./installUtils.js";

/**
 * Main entry point: Initialize install pipeline when payment completes
 */
export async function initializePaidOrderInstallPipeline({
  base44,
  order,
  stripeCustomerId,
}) {
  console.log(`[Install] Initializing order ${order.id}`);

  const updatedOrder = await base44.asServiceRole.entities.Order.update(order.id, {
    payment_status: "paid",
    stripe_customer_id: stripeCustomerId,
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
    } else {
      clientProject = await base44.asServiceRole.entities.ClientProject.create({
        order_id: order.id,
        stripe_customer_id: stripeCustomerId,
        business_name: order.business_name,
        owner_email: order.customer_email,
        owner_name: order.customer_name,
        status: "Configuring",
        plan: order.plan_type || "Custom",
        install_configuration: order.install_configuration || {},
      });
    }
  } catch (error) {
    throw new InstallLinkingError("Failed to create/link client project", {
      order_id: order.id,
      error: error.message,
    });
  }

  await base44.asServiceRole.entities.Order.update(order.id, {
    client_id: clientProject.id,
  });

  return { order: updatedOrder, project: clientProject };
}

/**
 * Update service install status with validation
 */
export async function updateTrackedServiceInstallStatus({
  base44,
  order,
  serviceKey,
  nextStatus,
  note = "",
}) {
  const VALID_TRANSITIONS = {
    "Paid": ["Ready for Install"],
    "Ready for Install": ["Configuring"],
    "Configuring": ["Testing"],
    "Testing": ["Live", "Error"],
    "Live": ["Live"],
    "Error": ["Ready for Install", "Configuring"],
  };

  const item = order.items?.find((i) => i.service_key === serviceKey);
  if (!item) throw new Error("Tracked service not found");

  const currentStatus = item.install_status || "Paid";
  if (!VALID_TRANSITIONS[currentStatus]?.includes(nextStatus)) {
    throw new InstallTransitionError(
      `Invalid transition: ${currentStatus} → ${nextStatus}`,
      { current_status: currentStatus, requested_status: nextStatus }
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

  const updatedOrder = await base44.asServiceRole.entities.Order.update(order.id, {
    items: updatedItems,
    pipeline_status: calculatePipelineStatus(updatedItems),
    last_install_event_at: timestamp,
  });

  if (updatedItems.every((i) => i.install_status === "Live")) {
    await base44.asServiceRole.entities.Order.update(order.id, {
      order_status: "fully_live",
    });
    await sendServiceLiveNotification(base44, updatedOrder);
  }

  return updatedOrder;
}

/**
 * Send "You're Live!" celebration email
 */
async function sendServiceLiveNotification(base44, order) {
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
      Your automation is now <strong>active and running</strong>. Your services are live and handling leads.
    </p>
    
    <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
      <p style="margin: 0; font-weight: 600; color: #1e40af; font-size: 14px;">Active Services</p>
      <ul style="margin: 8px 0 0; padding-left: 20px; color: #1e40af; font-size: 13px;">
        <li>${serviceNames}</li>
      </ul>
    </div>
    
    <p style="margin: 0; font-size: 14px; color: #666;">
      Log in to your <a href="https://clientsurgesystems.com/client-portal" style="color: #6b3f1f; font-weight: 600;">Client Portal</a> to monitor activity.
    </p>
  </div>
</div>`;

  await base44.asServiceRole.integrations.Core.SendEmail({
    to: order.customer_email,
    subject: "🚀 Your ClientSurge Systems Are LIVE!",
    body,
    from_name: "ClientSurge Systems",
  });

  console.log(`[Notification] Sent live notification to ${order.customer_email}`);
}

export {
  InstallLinkingError,
  InstallTransitionError,
  getTrackedServiceConfig,
  normalizeInstallConfiguration,
};