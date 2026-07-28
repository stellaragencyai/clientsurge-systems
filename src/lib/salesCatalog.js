// Canonical frontend sales catalog for package display, cart pricing, and checkout routing.
// Do not send public buyers directly to static Stripe Payment Links from this file.
// Checkout must route through /product-signup so Base44 creates a fresh Order and Checkout Session first.

const packageSignupUrl = (packageKey) => `/product-signup?package=${encodeURIComponent(packageKey)}`;

export const IMPLEMENTATION_LABEL = "Professional AI Implementation";
export const IMPLEMENTATION_INCLUSIONS = [
  "AI platform configuration",
  "CRM integration",
  "Google Business Profile integration",
  "Calendar integration",
  "AI receptionist deployment",
  "SMS & email automation setup",
  "Workflow configuration",
  "Testing & quality assurance",
  "Go-live support",
];

export const PUBLIC_STORE_PRODUCTS = [
  {
    product_id: "prod_UNi5RHiKNSTfQl",
    service_key: "instant_lead_response",
    name: "Instant Lead Response",
    subtitle: "SMS",
    description: "AI sends a personalized SMS to every new lead within seconds.",
    setup_fee: 297,
    monthly_fee: 97,
    setup_price_id: "price_1TOwfiB9GU5ysJqEcmQHl3gE",
    monthly_price_id: "price_1TOwfiB9GU5ysJqE20FYUfVc",
    icon: "⚡",
    category: "Response",
    highlights: ["Responds in under 4 seconds", "Works 24/7 with zero manual effort"],
    popular: true,
    checkout_enabled: true,
    availability_label: "Self-Serve Checkout",
    fulfillment_label: "Done-for-you setup included",
  },
  {
    product_id: "prod_UNi5QL0bQl98If",
    service_key: "missed_call_text_back",
    name: "Missed Call Text-Back",
    subtitle: "Never lose a lead",
    description: "Every missed call gets an automatic text-back within 60 seconds.",
    setup_fee: 197,
    monthly_fee: 67,
    setup_price_id: "price_1TOwfiB9GU5ysJqEJuEDhpKS",
    monthly_price_id: "price_1TOwfiB9GU5ysJqE8knUfswZ",
    icon: "📞",
    category: "Response",
    highlights: ["60-second auto text-back", "Stops missed-call lead loss", "Works 24/7 with zero manual effort"],
    checkout_enabled: true,
    availability_label: "Self-Serve Checkout",
    fulfillment_label: "Done-for-you setup included",
  },
  {
    product_id: "prod_UNi5N0l5MtaV0R",
    service_key: "nurture_sequence_14d",
    name: "14-Day Nurture Sequence",
    subtitle: "SMS + Email",
    description: "Multi-step SMS and email follow-up keeps leads warm for 14 days.",
    setup_fee: 397,
    monthly_fee: 127,
    setup_price_id: "price_1TOwfiB9GU5ysJqEtwQAmCuN",
    monthly_price_id: "price_1TOwfiB9GU5ysJqEsoZmFl6D",
    icon: "🔄",
    category: "Follow-Up",
    highlights: ["14-day automated sequence", "SMS and email combined", "Plug-and-play with your existing setup"],
    popular: true,
    checkout_enabled: true,
    availability_label: "Self-Serve Checkout",
    fulfillment_label: "Done-for-you setup included",
  },
  {
    product_id: "prod_UNi5fLL2SyJJdP",
    service_key: "ai_booking_agent",
    name: "AI Booking Agent",
    subtitle: "Booking handoff",
    description: "Guided booking flow that moves inbound leads toward a confirmed booking handoff.",
    setup_fee: 497,
    monthly_fee: 147,
    setup_price_id: "price_1TOwfiB9GU5ysJqEij8Qq9rd",
    monthly_price_id: "price_1TOwfiB9GU5ysJqEKhYvS71r",
    icon: "📅",
    category: "Booking",
    highlights: ["Booking link and intake flow", "Confirmation and reminder messaging", "Tested end-to-end before go-live"],
    popular: true,
    checkout_enabled: true,
    availability_label: "Self-Serve Checkout",
    fulfillment_label: "Done-for-you setup included",
  },
  {
    product_id: "prod_UNi5PWv05ECzXI",
    service_key: "lead_reactivation",
    name: "Old Lead Reactivation",
    subtitle: "Recover dormant leads",
    description: "Re-engage dormant leads from the canonical Leads table with controlled batch messaging.",
    setup_fee: 297,
    monthly_fee: 97,
    setup_price_id: "price_1TOwfiB9GU5ysJqExMxwfoFr",
    monthly_price_id: "price_1TOwfiB9GU5ysJqEfsJEvPcI",
    icon: "💰",
    category: "Revenue",
    highlights: ["Works with your existing lead database", "Safe batch sending with rate controls", "Full activity log per lead"],
    checkout_enabled: true,
    availability_label: "Self-Serve Checkout",
    fulfillment_label: "Done-for-you setup included",
  },
  {
    product_id: "prod_UNi5dvOUm6Fi9i",
    service_key: "review_request",
    name: "Review Request Automation",
    subtitle: "SMS or Email",
    description: "Send review requests after configured completion events through a canonical trigger flow.",
    setup_fee: 197,
    monthly_fee: 67,
    setup_price_id: "price_1TOwfiB9GU5ysJqEO8byuwlT",
    monthly_price_id: "price_1TOwfiB9GU5ysJqEryd66HuE",
    icon: "⭐",
    category: "Reputation",
    highlights: ["Manual or post-completion trigger", "SMS or email channel support", "Sent automatically after each appointment"],
    checkout_enabled: true,
    availability_label: "Self-Serve Checkout",
    fulfillment_label: "Done-for-you setup included",
  },
];

export const CANONICAL_SERVICE_PRODUCTS = PUBLIC_STORE_PRODUCTS.filter((product) => product.checkout_enabled);

export const PACKAGE_DEFINITIONS = [
  {
    package_key: "starter_system",
    name: "Starter System",
    customer_facing_name: "Starter",
    internal_label: "Starter System",
    fit: "Best for businesses that need instant response and missed-call recovery first.",
    description: "Start with immediate website lead response plus automatic missed-call text-back.",
    checkout_eligibility: "checkout_enabled",
    checkout_enabled: true,
    checkout_url: packageSignupUrl("starter_system"),
    stripe_product_id: "prod_UReWMpnZsCnfcL",
    setup_price_id: "price_1TSlDWBVGjsISdG0SyoWzAm3",
    monthly_price_id: "price_1TSlDWBVGjsISdG0Ej1O16ov",
    included_service_keys: ["instant_lead_response", "missed_call_text_back"],
    implementation_fee: 249,
    implementation_label: "Professional AI Implementation",
    setup_total: 249,
    monthly_total: 249,
  },
  {
    package_key: "growth_system",
    name: "Growth System",
    customer_facing_name: "Growth",
    internal_label: "Growth System",
    fit: "Best for steady lead flow that needs response, recovery, nurture, and booking.",
    description: "The core response and nurture stack for businesses actively converting inbound demand.",
    checkout_eligibility: "checkout_enabled",
    checkout_enabled: true,
    checkout_url: packageSignupUrl("growth_system"),
    stripe_product_id: "prod_UReWhZsWks1HuA",
    setup_price_id: "price_1TSlDXBVGjsISdG0eTWcARLM",
    monthly_price_id: "price_1TSlDXBVGjsISdG0X9unS4Qf",
    included_service_keys: ["instant_lead_response", "missed_call_text_back", "nurture_sequence_14d", "ai_booking_agent"],
    implementation_fee: 499,
    implementation_label: "Professional AI Implementation",
    setup_total: 499,
    monthly_total: 499,
    badge: "Most Popular",
    highlight: true,
  },
  {
    package_key: "pro_system",
    legacy_package_keys: ["elite_system"],
    name: "Pro System",
    customer_facing_name: "Pro",
    internal_label: "Pro System",
    fit: "Best for teams that want the full response, reactivation, and review stack.",
    description: "The complete AI automation bundle — every service, fully managed.",
    checkout_eligibility: "checkout_enabled",
    checkout_enabled: true,
    checkout_url: packageSignupUrl("pro_system"),
    stripe_product_id: "prod_UReW1LmsVbn4BZ",
    setup_price_id: "price_1TSlDYBVGjsISdG0l2rHzet1",
    monthly_price_id: "price_1TSlDXBVGjsISdG0Abdx85z3",
    included_service_keys: ["instant_lead_response", "missed_call_text_back", "nurture_sequence_14d", "ai_booking_agent", "lead_reactivation", "review_request"],
    implementation_fee: 999,
    implementation_label: "Professional AI Implementation",
    setup_total: 999,
    monthly_total: 999,
  },
];

export const PACKAGE_KEY_ALIASES = {
  starter: "starter_system",
  "starter system": "starter_system",
  starter_system: "starter_system",
  growth: "growth_system",
  "growth system": "growth_system",
  growth_system: "growth_system",
  elite: "pro_system",
  "elite system": "pro_system",
  elite_system: "pro_system",
  pro: "pro_system",
  "pro system": "pro_system",
  pro_system: "pro_system",
  pro_website_plus_six_automations: "pro_system",
  "pro_website_plus_six_automations": "pro_system",
};

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function uniqueBy(array, keyFn) {
  const seen = new Set();
  const result = [];
  for (const item of array) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function toCents(amount) {
  return Math.round(Number(amount || 0) * 100);
}

function fromCents(amount) {
  return Math.round(amount) / 100;
}

function enrichPackage(definition) {
  const included_services = definition.included_service_keys.map((serviceKey) => SERVICE_BY_KEY[serviceKey]).filter(Boolean);
  const compare_at_setup = Math.max(sum(included_services.map((service) => service.setup_fee)), definition.setup_total);
  const compare_at_monthly = Math.max(sum(included_services.map((service) => service.monthly_fee)), definition.monthly_total);
  return {
    ...definition,
    included_services,
    optional_service_keys: CANONICAL_SERVICE_PRODUCTS.filter((service) => !definition.included_service_keys.includes(service.service_key)).map((service) => service.service_key),
    optional_services: CANONICAL_SERVICE_PRODUCTS.filter((service) => !definition.included_service_keys.includes(service.service_key)),
    compare_at_setup,
    compare_at_monthly,
    setup_savings: Math.max(0, compare_at_setup - definition.setup_total),
    monthly_savings: Math.max(0, compare_at_monthly - definition.monthly_total),
    features: included_services.map((service) => service.name),
  };
}

const SERVICE_BY_PRODUCT_ID = Object.fromEntries(CANONICAL_SERVICE_PRODUCTS.map((product) => [product.product_id, product]));
const SERVICE_BY_KEY = Object.fromEntries(CANONICAL_SERVICE_PRODUCTS.map((product) => [product.service_key, product]));
const SERVICE_BY_MONTHLY_PRICE_ID = Object.fromEntries(CANONICAL_SERVICE_PRODUCTS.map((product) => [product.monthly_price_id, product]));
const SERVICE_BY_SETUP_PRICE_ID = Object.fromEntries(CANONICAL_SERVICE_PRODUCTS.map((product) => [product.setup_price_id, product]));

export const PACKAGE_OFFERS = PACKAGE_DEFINITIONS.map(enrichPackage);
export const CATEGORIES = ["All", ...new Set(PUBLIC_STORE_PRODUCTS.map((product) => product.category))];

export function formatCurrency(amount) {
  return Number(amount || 0).toLocaleString();
}

export function normalizePackageKey(packageKey) {
  const normalized = String(packageKey || "").trim().toLowerCase();
  return PACKAGE_KEY_ALIASES[normalized] || normalized || null;
}

export function getPackageOfferByName(packageName) {
  const normalizedName = String(packageName || "").trim().toLowerCase();
  if (!normalizedName) return null;
  return PACKAGE_OFFERS.find((offer) => offer.name.toLowerCase() === normalizedName) || getPackageOffer(normalizedName) || null;
}

export function getServiceProductById(productId) {
  return SERVICE_BY_PRODUCT_ID[productId] || null;
}

export function getServiceProductByKey(serviceKey) {
  return SERVICE_BY_KEY[serviceKey] || null;
}

export function getServiceProductByMonthlyPriceId(priceId) {
  return SERVICE_BY_MONTHLY_PRICE_ID[priceId] || null;
}

export function getServiceProductBySetupPriceId(priceId) {
  return SERVICE_BY_SETUP_PRICE_ID[priceId] || null;
}

export function getPackageOffer(packageKey) {
  const normalizedKey = normalizePackageKey(packageKey);
  return PACKAGE_OFFERS.find((offer) => offer.package_key === normalizedKey) || null;
}

export function getPackageStorePath(packageKey) {
  const normalizedKey = normalizePackageKey(packageKey);
  return normalizedKey ? `/product-signup?package=${encodeURIComponent(normalizedKey)}` : "/product-signup";
}

export function getBestPackageOfferForServiceKeys(serviceKeys = []) {
  const selectedProducts = serviceKeys.map((serviceKey) => getServiceProductByKey(serviceKey)).filter(Boolean);
  return selectBestPackageOffer(selectedProducts);
}

export function getPackageServices(packageKey) {
  return getPackageOffer(packageKey)?.included_services || [];
}

export function normalizeSelectedProducts(items = []) {
  const products = items.map((item) => {
    if (typeof item === "string") return getServiceProductById(item);
    if (item?.product_id) return getServiceProductById(item.product_id);
    return null;
  }).filter(Boolean);
  return uniqueBy(products, (product) => product.product_id);
}

function getEligiblePackageOffers(products) {
  const selectedServiceKeys = new Set(products.map((product) => product.service_key));
  return PACKAGE_OFFERS.filter((offer) => offer.included_service_keys.every((serviceKey) => selectedServiceKeys.has(serviceKey)));
}

function selectBestPackageOffer(products) {
  const eligible = getEligiblePackageOffers(products);
  if (!eligible.length) return null;
  return [...eligible].sort((left, right) => {
    const packageSizeDifference = right.included_service_keys.length - left.included_service_keys.length;
    if (packageSizeDifference !== 0) return packageSizeDifference;
    const savingsDifference = (right.setup_savings + right.monthly_savings) - (left.setup_savings + left.monthly_savings);
    if (savingsDifference !== 0) return savingsDifference;
    return right.setup_total - left.setup_total;
  })[0];
}

function allocateWeightedTotalCents(entries, totalCents, weightField) {
  if (!entries.length) return [];
  const totalWeight = entries.reduce((sumWeight, entry) => sumWeight + Math.max(0, entry[weightField]), 0);
  if (totalWeight <= 0) {
    const equalShare = Math.floor(totalCents / entries.length);
    let remainder = totalCents - equalShare * entries.length;
    return entries.map((entry) => {
      const cents = equalShare + (remainder > 0 ? 1 : 0);
      remainder = Math.max(0, remainder - 1);
      return { ...entry, allocated_cents: cents };
    });
  }
  const provisional = entries.map((entry) => {
    const exact = (entry[weightField] / totalWeight) * totalCents;
    const allocated = Math.floor(exact);
    return { ...entry, allocated_cents: allocated, remainder: exact - allocated };
  });
  let remaining = totalCents - provisional.reduce((sumAllocated, entry) => sumAllocated + entry.allocated_cents, 0);
  provisional.sort((left, right) => right.remainder - left.remainder).forEach((entry) => {
    if (remaining > 0) {
      entry.allocated_cents += 1;
      remaining -= 1;
    }
  });
  return provisional.map(({ remainder, ...entry }) => entry);
}

function allocatePackagePricing(packageOffer) {
  const includedServices = packageOffer.included_services.map((service) => ({
    ...service,
    setup_fee_cents: toCents(service.setup_fee),
    monthly_fee_cents: toCents(service.monthly_fee),
  }));
  const allocatedSetup = allocateWeightedTotalCents(includedServices, toCents(packageOffer.setup_total), "setup_fee_cents");
  const allocatedMonthly = allocateWeightedTotalCents(includedServices, toCents(packageOffer.monthly_total), "monthly_fee_cents");
  return Object.fromEntries(includedServices.map((service) => {
    const setupShare = allocatedSetup.find((entry) => entry.product_id === service.product_id)?.allocated_cents || 0;
    const monthlyShare = allocatedMonthly.find((entry) => entry.product_id === service.product_id)?.allocated_cents || 0;
    return [service.product_id, {
      setup_fee: fromCents(setupShare),
      monthly_fee: fromCents(monthlyShare),
      setup_discount_fee: service.setup_fee - fromCents(setupShare),
      monthly_discount_fee: service.monthly_fee - fromCents(monthlyShare),
    }];
  }));
}

export function buildPricingSummaryForProducts(items = []) {
  const products = normalizeSelectedProducts(items);
  const packageOffer = selectBestPackageOffer(products);
  const packagePricing = packageOffer ? allocatePackagePricing(packageOffer) : {};
  const packageServiceKeys = new Set(packageOffer?.included_service_keys || []);
  const priced_items = products.map((product) => {
    const packageShare = packagePricing[product.product_id];
    const actualSetup = packageShare ? packageShare.setup_fee : product.setup_fee;
    const actualMonthly = packageShare ? packageShare.monthly_fee : product.monthly_fee;
    const compareAtSetupFee = Math.max(product.setup_fee, actualSetup);
    const compareAtMonthlyFee = Math.max(product.monthly_fee, actualMonthly);
    return {
      ...product,
      compare_at_setup_fee: compareAtSetupFee,
      compare_at_monthly_fee: compareAtMonthlyFee,
      setup_fee: actualSetup,
      monthly_fee: actualMonthly,
      setup_discount_fee: Math.max(0, compareAtSetupFee - actualSetup),
      monthly_discount_fee: Math.max(0, compareAtMonthlyFee - actualMonthly),
      source_package_key: packageServiceKeys.has(product.service_key) ? packageOffer.package_key : null,
      source_package_name: packageServiceKeys.has(product.service_key) ? packageOffer.name : null,
    };
  });
  const total_setup_before_discount = Math.max(fromCents(sum(products.map((product) => toCents(product.setup_fee)))), packageOffer?.compare_at_setup || 0);
  const total_monthly_before_discount = Math.max(fromCents(sum(products.map((product) => toCents(product.monthly_fee)))), packageOffer?.compare_at_monthly || 0);
  const total_setup = fromCents(sum(priced_items.map((product) => toCents(product.setup_fee))));
  const total_monthly = fromCents(sum(priced_items.map((product) => toCents(product.monthly_fee))));
  const add_on_services = priced_items.filter((product) => !packageServiceKeys.has(product.service_key));
  return {
    products,
    priced_items,
    package_offer: packageOffer,
    selected_service_keys: priced_items.map((product) => product.service_key),
    selected_product_ids: priced_items.map((product) => product.product_id),
    package_service_keys: packageOffer?.included_service_keys || [],
    add_on_service_keys: add_on_services.map((product) => product.service_key),
    total_setup_before_discount,
    total_monthly_before_discount,
    total_setup,
    total_monthly,
    setup_discount_total: Math.max(0, total_setup_before_discount - total_setup),
    monthly_discount_total: Math.max(0, total_monthly_before_discount - total_monthly),
  };
}

export function resolvePackageStripeIds(packageOffer) {
  return {
    stripe_product_id: packageOffer?.stripe_product_id || null,
    setup_price_id: packageOffer?.setup_price_id || null,
    monthly_price_id: packageOffer?.monthly_price_id || null,
  };
}

export function buildStoredPricingSummary(items = []) {
  const summary = buildPricingSummaryForProducts(items);
  const packageOffer = summary.package_offer;
  const packageStripeIds = resolvePackageStripeIds(packageOffer);
  return {
    pricing_version: "canonical_sales_catalog_v1",
    package_key: packageOffer?.package_key || null,
    package_name: packageOffer?.name || null,
    package_stripe_product_id: packageStripeIds.stripe_product_id,
    package_setup_price_id: packageStripeIds.setup_price_id,
    package_monthly_price_id: packageStripeIds.monthly_price_id,
    package_service_keys: summary.package_service_keys,
    add_on_service_keys: summary.add_on_service_keys,
    selected_service_keys: summary.selected_service_keys,
    selected_product_ids: summary.selected_product_ids,
    total_setup_before_discount: summary.total_setup_before_discount,
    total_monthly_before_discount: summary.total_monthly_before_discount,
    total_setup: summary.total_setup,
    total_monthly: summary.total_monthly,
    setup_discount_total: summary.setup_discount_total,
    monthly_discount_total: summary.monthly_discount_total,
    compare_at_setup: packageOffer?.compare_at_setup || null,
    compare_at_monthly: packageOffer?.compare_at_monthly || null,
  };
}

export function buildStripeLineItemsForPricingSummary(pricingSummary) {
  const packageOffer = pricingSummary?.package_offer || null;
  const addOnServiceKeys = pricingSummary?.add_on_service_keys || [];
  const packageStripeIds = resolvePackageStripeIds(packageOffer);
  if (!packageStripeIds.setup_price_id || !packageStripeIds.monthly_price_id) {
    throw new Error("Live checkout currently requires a Starter, Growth, or Pro package bundle.");
  }
  if (addOnServiceKeys.length > 0) {
    throw new Error("Live checkout currently supports package bundles only; add-on checkout is not enabled.");
  }
  return [
    { price: packageStripeIds.setup_price_id, quantity: 1 },
    { price: packageStripeIds.monthly_price_id, quantity: 1 },
  ];
}

export function getPackageDisplayLabel(pricingSummary) {
  if (!pricingSummary?.package_name) return "Custom Service Bundle";
  if ((pricingSummary.add_on_service_keys || []).length > 0) return `${pricingSummary.package_name} + Add-Ons`;
  return pricingSummary.package_name;
}

export const AI_PRODUCTS = PUBLIC_STORE_PRODUCTS;
export const SELF_SERVE_PRODUCTS = CANONICAL_SERVICE_PRODUCTS;