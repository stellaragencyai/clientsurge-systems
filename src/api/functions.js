import { base44 } from "@/api/base44Client";

export async function getStripeCustomerPortalUrl(params = {}) {
  const response = await base44.functions.invoke("getStripeCustomerPortalUrl", params);
  return response?.data || response || {};
}
