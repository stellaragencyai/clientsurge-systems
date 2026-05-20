import { PACKAGE_DEFINITIONS, normalizePackageKey } from "./salesCatalog.js";

export function getCurrentPackageKey({ project, subscription, order } = {}) {
  return normalizePackageKey(
    subscription?.plan_key ||
      order?.selected_package_type ||
      order?.package_type ||
      order?.pricing_summary?.package_key ||
      project?.package_type ||
      project?.selected_package_type ||
      project?.plan
  );
}

export function getSubscriptionChangeOptions({ project, subscription, order } = {}) {
  const currentPackageKey = getCurrentPackageKey({ project, subscription, order });

  return PACKAGE_DEFINITIONS.map((plan) => ({
    package_key: plan.package_key,
    name: plan.name,
    description: plan.description,
    monthly_total: plan.monthly_total,
    monthly_price_id: plan.monthly_price_id,
    included_service_keys: plan.included_service_keys,
    is_current: plan.package_key === currentPackageKey,
  }));
}

export function getSubscriptionChangeOrderId({ project, subscription, order } = {}) {
  return (
    order?.id ||
    subscription?.order_id ||
    project?.order_id ||
    project?.latest_order_id ||
    project?.source_order_id ||
    null
  );
}
