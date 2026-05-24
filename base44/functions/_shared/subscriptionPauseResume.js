export function buildPauseCollectionParams({ behavior = "void", resumes_at } = {}) {
  const allowedBehaviors = new Set(["void", "keep_as_draft", "mark_uncollectible"]);
  const selectedBehavior = allowedBehaviors.has(behavior) ? behavior : "void";
  const params = new URLSearchParams();
  params.set("pause_collection[behavior]", selectedBehavior);

  if (resumes_at) {
    const timestamp = Number.isFinite(Number(resumes_at))
      ? Number(resumes_at)
      : Math.floor(new Date(resumes_at).getTime() / 1000);
    if (Number.isFinite(timestamp) && timestamp > 0) {
      params.set("pause_collection[resumes_at]", String(timestamp));
    }
  }

  return params;
}

export function buildResumeCollectionParams() {
  const params = new URLSearchParams();
  params.set("pause_collection", "");
  return params;
}

export function canManageBillingOrder({ user = {}, order = {} }) {
  if (user.role === "admin") return true;
  const userEmail = String(user.email || "").trim().toLowerCase();
  const orderEmail = String(order.customer_email || order.client_email || "").trim().toLowerCase();
  return Boolean(userEmail && orderEmail && userEmail === orderEmail);
}
