import {
  PACKAGE_OFFERS,
  PUBLIC_STORE_PRODUCTS,
  getPackageOffer,
} from "@/lib/salesCatalog";

function byKey(packageKey) {
  return getPackageOffer(packageKey);
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
  pro_system: byKey("pro_system") && {
    setup_fee: byKey("pro_system").setup_total,
    monthly_rate: byKey("pro_system").monthly_total,
    services: byKey("pro_system").included_service_keys.length,
  },
  pro_website_plus_six_automations: byKey("pro_system") && {
    setup_fee: byKey("pro_system").setup_total,
    monthly_rate: byKey("pro_system").monthly_total,
    services: byKey("pro_system").included_service_keys.length,
    legacy_alias_for: "pro_system",
  },
};