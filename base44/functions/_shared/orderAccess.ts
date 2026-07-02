export function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function getRequesterEmail(base44) {
  const user = base44?.user || base44?.auth?.user || base44?.session?.user || null;
  return cleanString(user?.email).toLowerCase();
}

export function getRequesterRole(base44) {
  const user = base44?.user || base44?.auth?.user || base44?.session?.user || null;
  return cleanString(user?.role).toLowerCase();
}

export function isAdminRequester(base44) {
  return ["admin", "super_admin"].includes(getRequesterRole(base44));
}

export function getOrderAccessTokens(order = {}) {
  return [
    order.setup_token,
    order.setup_access_token,
    order.status_token,
    order.order_status_token,
    order.access_token,
    order.portal_access_token,
    order.preview_token,
    order.install_configuration?.setup_token,
    order.install_configuration?.status_token,
    order.install_configuration?.access_token,
  ]
    .map(cleanString)
    .filter((value) => value.length >= 16);
}

export function canAccessOrder(base44, order, providedToken = "") {
  if (!order?.id) return false;
  if (isAdminRequester(base44)) return true;

  const requesterEmail = getRequesterEmail(base44);
  const orderEmail = cleanString(order.customer_email).toLowerCase();
  if (requesterEmail && orderEmail && requesterEmail === orderEmail) return true;

  const token = cleanString(providedToken);
  if (token.length >= 16 && getOrderAccessTokens(order).includes(token)) return true;

  return false;
}

export function forbiddenOrderResponse() {
  return Response.json(
    { error: "Not authorized to access this order. Sign in or use a valid setup link." },
    { status: 403 },
  );
}
