import { getServicesForTier } from "../shared/tierServiceMap.ts";

export async function executeInstallPipeline(base44: any, order_id: string, package_key: string) {
  const services = getServicesForTier(package_key);
  const activation_log = services.map((service_key) => ({
    service_key,
    status: "retired",
    error:
      "Legacy executor is retired. Use the canonical install pipeline and install workspace instead.",
  }));

  await base44.asServiceRole.entities.Order.update(order_id, { activation_log }).catch(() => {});

  return {
    activation_log,
    all_configured: false,
    retired: true,
    replacement_function: "installPipeline",
  };
}
