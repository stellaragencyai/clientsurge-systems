import { base44 } from "@/api/base44Client";

export function getAdminQaError(error, fallback = "Unable to create QA customer.") {
  return error?.data?.error || error?.message || fallback;
}

export async function createQaCustomerFixture(payload) {
  const response = await base44.functions.invoke("createQaCustomerFixture", payload);
  return response?.data || null;
}
