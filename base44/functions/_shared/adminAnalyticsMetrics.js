const PAID_ORDER_STATUSES = new Set(["paid", "succeeded", "complete", "completed"]);
const ACTIVE_BILLING_STATUSES = new Set(["active", "trialing"]);

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function isPaidRevenueOrder(order = {}) {
  const paymentStatus = String(order.payment_status || "").toLowerCase();
  const billingStatus = String(order.billing_status || order.subscription_status || "").toLowerCase();

  return PAID_ORDER_STATUSES.has(paymentStatus) || ACTIVE_BILLING_STATUSES.has(billingStatus);
}

export function buildRevenueMetrics(orders = []) {
  const paidOrders = orders.filter(isPaidRevenueOrder);
  const mrr = paidOrders.reduce((sum, order) => sum + toNumber(order.total_monthly), 0);
  const setupRevenue = paidOrders.reduce((sum, order) => sum + toNumber(order.total_setup), 0);

  return {
    mrr,
    arr: mrr * 12,
    setup_revenue: setupRevenue,
    paid_orders: paidOrders.length,
  };
}
