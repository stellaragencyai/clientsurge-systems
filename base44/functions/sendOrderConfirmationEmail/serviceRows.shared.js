import { getServiceProductByKey } from "../../../src/lib/salesCatalog.js";

export function formatMoney(amount) {
  return Number(amount || 0).toLocaleString();
}

export function resolveServiceRows(order, packageOffer) {
  const orderItems = Array.isArray(order?.items) ? order.items : [];
  if (orderItems.length > 0) {
    return orderItems.map((item) => {
      const product = getServiceProductByKey(item.service_key);

      return {
        name: item.product_name || product?.name || item.service_key || "Service",
        setup_fee: item.setup_fee ?? product?.setup_fee ?? 0,
        monthly_fee: item.monthly_fee ?? product?.monthly_fee ?? 0,
      };
    });
  }

  return (packageOffer?.included_services || []).map((service) => ({
    name: service.name,
    setup_fee: service.setup_fee,
    monthly_fee: service.monthly_fee,
  }));
}
