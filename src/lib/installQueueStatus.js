const PAID_STATUSES = new Set(["paid", "succeeded", "complete", "completed", "active"]);
const STARTED_STATUSES = new Set(["configuring", "testing", "live", "active", "completed", "error", "failed"]);
const NOT_STARTED_PIPELINE_STATUSES = new Set(["paid", "ready for install", "pending", "pending install"]);

export const STALLED_INSTALL_THRESHOLD_HOURS = 48;

export function getOrderPaidTimestamp(order) {
  if (!order) return null;
  return order.paid_at || order.paid_date || order.payment_completed_at || order.completed_at || order.created_date || null;
}

export function isPaidInstallOrder(order) {
  if (!order) return false;
  const paymentStatus = String(order.payment_status || "").trim().toLowerCase();
  const orderStatus = String(order.order_status || "").trim().toLowerCase();
  const subscriptionStatus = String(order.subscription_status || "").trim().toLowerCase();

  return PAID_STATUSES.has(paymentStatus) || PAID_STATUSES.has(orderStatus) || subscriptionStatus === "active";
}

export function hasInstallStarted(order) {
  if (!order) return false;

  if (order.install_started_at || order.install_initialized_at || order.activated_at || order.live_at) {
    return true;
  }

  const workflowStage = String(order.workflow_stage || "").trim().toLowerCase();
  if (workflowStage && workflowStage !== "pending" && workflowStage !== "paid" && workflowStage !== "ready for install") {
    return true;
  }

  const pipelineStatus = String(order.pipeline_status || "").trim().toLowerCase();
  if (pipelineStatus && !NOT_STARTED_PIPELINE_STATUSES.has(pipelineStatus)) {
    return true;
  }

  return (order.items || []).some((item) => {
    const status = String(item?.install_status || "").trim().toLowerCase();
    return STARTED_STATUSES.has(status);
  });
}

export function getStalledInstallWarning(order, now = Date.now()) {
  if (!isPaidInstallOrder(order) || hasInstallStarted(order)) return null;

  const paidTimestamp = getOrderPaidTimestamp(order);
  const paidMs = paidTimestamp ? new Date(paidTimestamp).getTime() : NaN;
  if (!Number.isFinite(paidMs)) return null;

  const hoursSincePaid = Math.floor((now - paidMs) / 3600000);
  if (hoursSincePaid < STALLED_INSTALL_THRESHOLD_HOURS) return null;

  return {
    label: "Install stalled",
    hoursSincePaid,
    title: `Paid ${hoursSincePaid}h ago with no install started`,
  };
}
