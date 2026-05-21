const CLOSED_ORDER_STATUSES = new Set([
  "cancelled",
  "canceled",
  "refunded",
  "failed",
  "archived",
]);

const CLOSED_PAYMENT_STATUSES = new Set([
  "cancelled",
  "canceled",
  "refunded",
  "failed",
]);

function parseCapacityLimit(value) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return null;
  }

  const limit = Number.parseInt(String(value), 10);
  return Number.isFinite(limit) && limit >= 0 ? limit : null;
}

function isActiveCheckoutOrder(order) {
  const orderStatus = String(order?.order_status || "").toLowerCase();
  const paymentStatus = String(order?.payment_status || "").toLowerCase();

  return !CLOSED_ORDER_STATUSES.has(orderStatus) && !CLOSED_PAYMENT_STATUSES.has(paymentStatus);
}

export async function getActiveCheckoutOrderCount(base44) {
  const orders = await base44.asServiceRole.entities.Order.list("-created_date", 500).catch(() => []);
  return orders.filter(isActiveCheckoutOrder).length;
}

export async function assertCheckoutCapacityAvailable({
  base44,
  limitValue = Deno.env.get("CLIENTSURGE_CHECKOUT_CAPACITY_LIMIT"),
}) {
  const limit = parseCapacityLimit(limitValue);
  if (limit === null) {
    return {
      ok: true,
      enforced: false,
      active_orders: null,
      capacity_limit: null,
    };
  }

  const activeOrders = await getActiveCheckoutOrderCount(base44);
  if (activeOrders >= limit) {
    return {
      ok: false,
      enforced: true,
      active_orders: activeOrders,
      capacity_limit: limit,
      reason: "ClientSurge onboarding capacity is currently full.",
    };
  }

  return {
    ok: true,
    enforced: true,
    active_orders: activeOrders,
    capacity_limit: limit,
  };
}

export const __testing = {
  isActiveCheckoutOrder,
  parseCapacityLimit,
};
