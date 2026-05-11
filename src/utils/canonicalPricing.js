import { PACKAGE_OFFERS, PUBLIC_STORE_PRODUCTS } from "@/lib/salesCatalog";

function byKey(packageKey) {
  return PACKAGE_OFFERS.find((offer) => offer.package_key === packageKey) || null;
}

export const CANONICAL_PRICING = {
  individual_services: Object.fromEntries(
    PUBLIC_STORE_PRODUCTS.map((product) => [
      product.service_key || product.product_id,
      {
        setup_fee: product.setup_fee,
        monthly_rate: product.monthly_fee,
      },
    ])
  ),
  starter_system: byKey("starter_system") && {
    setup_fee: byKey("starter_system").setup_total,
    monthly_rate: byKey("starter_system").monthly_total,
    services: byKey("starter_system").included_service_keys.length,
  },
  growth_system: byKey("growth_system") && {
    setup_fee: byKey("growth_system").setup_total,
    monthly_rate: byKey("growth_system").monthly_total,
    services: byKey("growth_system").included_service_keys.length,
  },
  elite_system: byKey("elite_system") && {
    setup_fee: byKey("elite_system").setup_total,
    monthly_rate: byKey("elite_system").monthly_total,
    services: byKey("elite_system").included_service_keys.length,
  },
};
