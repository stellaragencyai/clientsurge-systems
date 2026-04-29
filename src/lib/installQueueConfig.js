export const INSTALL_QUEUE_REFRESH_MS = 30000;
export const LEGACY_INSTALL_QUEUE_STATUS_CONTROLS_ENABLED = false;
export const INSTALL_QUEUE_PRIMARY_ACTION_LABEL = "Open Workspace";

export function resolveSelectedInstallOrderId(orders, requestedOrderId) {
  if (!Array.isArray(orders) || orders.length === 0) {
    return "";
  }

  if (requestedOrderId && orders.some((order) => order.id === requestedOrderId)) {
    return requestedOrderId;
  }

  return orders[0]?.id || "";
}
