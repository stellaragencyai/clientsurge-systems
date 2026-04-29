function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function buildBillingSummary({ order = null, subscription = null, project = null } = {}) {
  const currentPlan =
    cleanString(subscription?.plan_type) ||
    cleanString(order?.plan_type) ||
    cleanString(project?.plan) ||
    "Custom Service Bundle";
  const subscriptionStatus =
    cleanString(subscription?.status) ||
    cleanString(order?.subscription_status) ||
    "missing";
  const billingStatus =
    cleanString(subscription?.billing_status) ||
    cleanString(order?.billing_status) ||
    (subscriptionStatus !== "missing" ? subscriptionStatus : "unknown");
  const renewalDate =
    subscription?.current_period_end ||
    order?.current_period_end ||
    null;
  const warnings = [];

  if (!cleanString(subscription?.stripe_subscription_id) && !cleanString(order?.stripe_subscription_id)) {
    warnings.push("Subscription record missing");
  }

  if (billingStatus === "past_due" || cleanString(order?.payment_status) === "failed") {
    warnings.push("Payment follow-up required");
  }

  if (billingStatus === "canceled") {
    warnings.push("Subscription canceled. Historical config is preserved, but service access is no longer active.");
  }

  return {
    currentPlan,
    subscriptionStatus,
    billingStatus,
    renewalDate,
    warnings,
    manualChangeMessage: "Plan changes, upgrades, downgrades, and cancellations are still reviewed manually before billing is changed.",
  };
}

export function formatBillingDate(value) {
  if (!value) {
    return "Unavailable";
  }

  return new Date(value).toLocaleDateString();
}
