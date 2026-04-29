// Canonical sales catalog for packaged offers, pilot/manual store truth,
// cart pricing, checkout canonicalization, and admin visibility.
// This file intentionally stays plain ESM so both the frontend and backend can import it.

export const PUBLIC_STORE_PRODUCTS = [
  {
    product_id: "prod_UNi5RHiKNSTfQl",
    service_key: "instant_lead_response",
    name: "Instant Lead Response",
    subtitle: "SMS",
    description: "Pilot-ready SMS lead response installed and tested by our team before it moves live.",
    setup_fee: 297,
    monthly_fee: 97,
    setup_price_id: "price_1TOwfiB9GU5ysJqEcmQHl3gE",
    monthly_price_id: "price_1TOwfiB9GU5ysJqE20FYUfVc",
    icon: "⚡",
    category: "Response",
    highlights: [
      "Responds in under 4 seconds",
      "Manual operator setup and QA",
      "Canonical backend test gating",
    ],
    popular: true,
    checkout_enabled: true,
    store_purchase_enabled: true,
    store_status: "pilot",
    availability_label: "Pilot Install Available",
    fulfillment_label: "Operator setup + canonical testing",
  },
  {
    product_id: "prod_UNi5QL0bQl98If",
    service_key: "missed_call_text_back",
    name: "Missed Call Text-Back",
    subtitle: "Never lose a lead",
    description: "Pilot missed-call recovery service with manual install, webhook review, and canonical testing before launch.",
    setup_fee: 197,
    monthly_fee: 67,
    setup_price_id: "price_1TOwfiB9GU5ysJqEJuEDhpKS",
    monthly_price_id: "price_1TOwfiB9GU5ysJqE8knUfswZ",
    icon: "📞",
    category: "Response",
    highlights: [
      "60-second auto text-back",
      "Requires Twilio routing review",
      "Canonical backend test gating",
    ],
    checkout_enabled: true,
    store_purchase_enabled: true,
    store_status: "pilot",
    availability_label: "Pilot Install Available",
    fulfillment_label: "Manual routing review + canonical testing",
  },
  {
    product_id: "prod_UNi5N0l5MtaV0R",
    service_key: "nurture_sequence_14d",
    name: "14-Day Nurture Sequence",
    subtitle: "SMS + Email",
    description: "Configuration and first-step runtime tests exist today, but the full 14-day scheduler is not self-serve yet.",
    setup_fee: 397,
    monthly_fee: 127,
    setup_price_id: "price_1TOwfiB9GU5ysJqEtwQAmCuN",
    monthly_price_id: "price_1TOwfiB9GU5ysJqEsoZmFl6D",
    icon: "🔄",
    category: "Follow-Up",
    highlights: [
      "First-step runtime test only",
      "Full scheduler still in pilot buildout",
      "Manual review required before sale",
    ],
    popular: true,
    checkout_enabled: true,
    store_purchase_enabled: false,
    store_status: "manual_review",
    availability_label: "Manual Review Required",
    fulfillment_label: "Not self-serve today",
  },
  {
    product_id: "prod_UNi5fLL2SyJJdP",
    service_key: "ai_booking_agent",
    name: "AI Booking Agent",
    subtitle: "Booking handoff",
    description: "Booking handoff configuration and simulation exist, but production booking automation is still a guided pilot service.",
    setup_fee: 497,
    monthly_fee: 147,
    setup_price_id: "price_1TOwfiB9GU5ysJqEij8Qq9rd",
    monthly_price_id: "price_1TOwfiB9GU5ysJqEKhYvS71r",
    icon: "📅",
    category: "Booking",
    highlights: [
      "Booking link and intake configuration",
      "Canonical booking simulation test",
      "Manual review required before sale",
    ],
    popular: true,
    checkout_enabled: true,
    store_purchase_enabled: false,
    store_status: "manual_review",
    availability_label: "Simulation / Manual Review",
    fulfillment_label: "Not self-serve today",
  },
  {
    product_id: "prod_UNi5PWv05ECzXI",
    service_key: "lead_reactivation",
    name: "Old Lead Reactivation",
    subtitle: "Recover dormant leads",
    description: "Lead targeting and batch summary tests exist, but production outbound reactivation still needs manual operator review.",
    setup_fee: 297,
    monthly_fee: 97,
    setup_price_id: "price_1TOwfiB9GU5ysJqExMxwfoFr",
    monthly_price_id: "price_1TOwfiB9GU5ysJqEfsJEvPcI",
    icon: "💰",
    category: "Revenue",
    highlights: [
      "Uses canonical Leads",
      "Controlled batch test runs",
      "Production outbound flow not self-serve",
      "Canonical event summary tracking",
    ],
    checkout_enabled: true,
    store_purchase_enabled: false,
    store_status: "manual_review",
    availability_label: "Pilot Review Required",
    fulfillment_label: "Not self-serve today",
  },
  {
    product_id: "prod_UNi5dvOUm6Fi9i",
    service_key: "review_request",
    name: "Review Request Automation",
    subtitle: "SMS or Email",
    description: "Review-request configuration and trigger simulation exist, but the live production trigger flow is still pending.",
    setup_fee: 197,
    monthly_fee: 67,
    setup_price_id: "price_1TOwfiB9GU5ysJqEO8byuwlT",
    monthly_price_id: "price_1TOwfiB9GU5ysJqEryd66HuE",
    icon: "⭐",
    category: "Reputation",
    highlights: [
      "Configured trigger simulation",
      "SMS or email channel support",
      "Manual review required before sale",
    ],
    checkout_enabled: true,
    store_purchase_enabled: false,
    store_status: "manual_review",
    availability_label: "Simulation / Manual Review",
    fulfillment_label: "Not self-serve today",
  },
  {
    product_id: "prod_UNi5aQjPk58U4o",
    service_key: null,
    name: "AI Email Follow-Up",
    subtitle: "Sequence",
    description: "Smart email sequences that nurture leads and clients with personalized, timely messages.",
    setup_fee: 297,
    monthly_fee: 97,
    setup_price_id: "price_1TOwfiB9GU5ysJqEJcZwnVFL",
    monthly_price_id: "price_1TOwfiB9GU5ysJqExHsLIEtN",
    icon: "📧",
    category: "Follow-Up",
    highlights: [
      "Personalized per lead",
      "Smart send timing",
      "Operator-scoped rollout",
    ],
    checkout_enabled: false,
    store_purchase_enabled: false,
    store_status: "coming_soon",
    availability_label: "Coming Soon",
    fulfillment_label: "Exclusive early access",
    coming_soon: true,
  },
  {
    product_id: "prod_UNi5ybXQSG6QkX",
    service_key: null,
    name: "Missed Appointment Recovery",
    subtitle: "Rebook no-shows",
    description: "Re-engage no-shows with recovery messaging to recover lost appointments.",
    setup_fee: 247,
    monthly_fee: 77,
    setup_price_id: "price_1TOwfiB9GU5ysJqEO8w24UTX",
    monthly_price_id: "price_1TOwfiB9GU5ysJqE1M9PoI15",
    icon: "🗓️",
    category: "Booking",
    highlights: [
      "Targets no-shows quickly",
      "Recovery sequence playbook",
      "Operator-scoped rollout",
    ],
    checkout_enabled: false,
    store_purchase_enabled: false,
    store_status: "coming_soon",
    availability_label: "Coming Soon",
    fulfillment_label: "Exclusive early access",
    coming_soon: true,
  },
  {
    product_id: "prod_UNi5Df5KWsS4lW",
    service_key: null,
    name: "New Client Onboarding",
    subtitle: "Welcome flow",
    description: "Automated welcome sequences and onboarding messages for new clients after signup or purchase.",
    setup_fee: 347,
    monthly_fee: 107,
    setup_price_id: "price_1TOwfiB9GU5ysJqEJ7XM5LB6",
    monthly_price_id: "price_1TOwfiB9GU5ysJqEpL7Tbjzm",
    icon: "🎉",
    category: "Retention",
    highlights: [
      "Welcome flow messaging",
      "Expectation setting",
      "Operator-scoped rollout",
    ],
    checkout_enabled: false,
    store_purchase_enabled: false,
    store_status: "coming_soon",
    availability_label: "Coming Soon",
    fulfillment_label: "Exclusive early access",
    coming_soon: true,
  },
  {
    product_id: "prod_UNi53DY2nkRTuM",
    service_key: null,
    name: "Social DM Auto-Responder",
    subtitle: "Instagram & Facebook",
    description: "Instant DM response flow for social inquiries that need a consultative integration review first.",
    setup_fee: 397,
    monthly_fee: 127,
    setup_price_id: "price_1TOwfiB9GU5ysJqE3mAZpu43",
    monthly_price_id: "price_1TOwfiB9GU5ysJqEfV7uVJLb",
    icon: "💬",
    category: "Social",
    highlights: [
      "Instagram and Facebook DM flow",
      "Lead capture from social",
      "Operator-scoped rollout",
    ],
    checkout_enabled: false,
    store_purchase_enabled: false,
    store_status: "coming_soon",
    availability_label: "Coming Soon",
    fulfillment_label: "Exclusive early access",
    coming_soon: true,
  },
  {
    product_id: "prod_UNi5Li4ZFZGRIc",
    service_key: null,
    name: "AI Reputation Manager",
    subtitle: "Reviews & ratings",
    description: "Reputation workflow offering that still requires a consultative delivery review before sale.",
    setup_fee: 447,
    monthly_fee: 137,
    setup_price_id: "price_1TOwfiB9GU5ysJqEEvf0RdVG",
    monthly_price_id: "price_1TOwfiB9GU5ysJqEkzPf9zrt",
    icon: "🛡️",
    category: "Reputation",
    highlights: [
      "Multi-platform reputation support",
      "Manual delivery review",
      "No fake monitoring claims",
    ],
    checkout_enabled: false,
    store_purchase_enabled: false,
    store_status: "coming_soon",
    availability_label: "Coming Soon",
    fulfillment_label: "Exclusive early access",
    coming_soon: true,
  },
  {
    product_id: "prod_UNi5nfHZ3XKzzZ",
    service_key: null,
    name: "Lead Scoring & Qualification",
    subtitle: "AI-powered",
    description: "Lead prioritization offering that remains consultative until its delivery path is standardized.",
    setup_fee: 547,
    monthly_fee: 167,
    setup_price_id: "price_1TOwfiB9GU5ysJqELMl0Jlbf",
    monthly_price_id: "price_1TOwfiB9GU5ysJqEesWHeFVY",
    icon: "🧠",
    category: "Intelligence",
    highlights: [
      "Lead prioritization support",
      "Advisory qualification playbook",
      "Operator-scoped rollout",
    ],
    checkout_enabled: false,
    store_purchase_enabled: false,
    store_status: "coming_soon",
    availability_label: "Coming Soon",
    fulfillment_label: "Exclusive early access",
    coming_soon: true,
  },
];

export const CANONICAL_SERVICE_PRODUCTS = PUBLIC_STORE_PRODUCTS.filter(
  (product) => product.checkout_enabled
);

const PACKAGE_DEFINITIONS = [
  {
    package_key: "starter_system",
    name: "Starter System",
    fit: "Best for businesses that need instant response and booking handoff first.",
    description: "Start with immediate lead response plus a canonical booking handoff.",
    pricing_value_statement:
      "Even one additional booking per month often covers the ongoing service fee.",
    display_features: [
      "Instant response to new leads by SMS",
      "AI booking handoff and intake flow",
      "Booking link integration",
      "Confirmation and reminder messaging",
      "Launch setup, testing, and go-live support",
      "Client portal progress tracking",
      "Month-to-month ongoing service",
    ],
    included_service_keys: ["instant_lead_response", "ai_booking_agent"],
    setup_total: 695,
    monthly_total: 197,
  },
  {
    package_key: "growth_system",
    name: "Growth System",
    fit: "Best for steady lead flow that needs response, recovery, nurture, and booking.",
    description: "The core response and nurture stack for businesses actively converting inbound demand.",
    pricing_value_statement:
      "Most clients recover this cost with just a few additional bookings per month.",
    display_features: [
      "Everything in Starter",
      "Missed-call text-back recovery",
      "14-day SMS and email nurture sequence",
      "Faster follow-up across multiple touchpoints",
      "Booking handoff plus reminders",
      "Canonical install tracking and testing",
      "Lead status visibility in portal",
      "14 days of optimization after launch",
      "Most popular done-for-you package",
    ],
    included_service_keys: [
      "instant_lead_response",
      "missed_call_text_back",
      "nurture_sequence_14d",
      "ai_booking_agent",
    ],
    setup_total: 1195,
    monthly_total: 349,
    badge: "Most Popular",
    highlight: true,
  },
  {
    package_key: "pro_system",
    name: "Pro System",
    fit: "Best for teams that want the full canonical response, reactivation, and review stack.",
    description: "The complete tracked install bundle across all currently canonical self-serve services.",
    pricing_value_statement:
      "High-volume teams usually justify this package quickly once reactivation and review flows go live.",
    display_features: [
      "Everything in Growth",
      "Old lead reactivation campaigns",
      "Review request automation",
      "Full tracked self-serve service bundle",
      "Multi-touch lifecycle automation",
      "Expanded revenue recovery coverage",
      "Priority optimization workflow",
      "Highest-value canonical package bundle",
    ],
    included_service_keys: [
      "instant_lead_response",
      "missed_call_text_back",
      "nurture_sequence_14d",
      "ai_booking_agent",
      "lead_reactivation",
      "review_request",
    ],
    setup_total: 1495,
    monthly_total: 469,
  },
];

const SERVICE_BY_PRODUCT_ID = Object.fromEntries(
  CANONICAL_SERVICE_PRODUCTS.map((product) => [product.product_id, product])
);

const SERVICE_BY_KEY = Object.fromEntries(
  CANONICAL_SERVICE_PRODUCTS.map((product) => [product.service_key, product])
);

const SERVICE_BY_MONTHLY_PRICE_ID = Object.fromEntries(
  CANONICAL_SERVICE_PRODUCTS.map((product) => [product.monthly_price_id, product])
);

const SERVICE_BY_SETUP_PRICE_ID = Object.fromEntries(
  CANONICAL_SERVICE_PRODUCTS.map((product) => [product.setup_price_id, product])
);

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function uniqueBy(array, keyFn) {
  const seen = new Set();
  const result = [];

  for (const item of array) {
    const key = keyFn(item);
    if (seen.has(key)) {
      continue;
    }

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

function allocateWeightedTotalCents(entries, totalCents, weightField) {
  if (!entries.length) {
    return [];
  }

  const totalWeight = entries.reduce(
    (sumWeight, entry) => sumWeight + Math.max(0, entry[weightField]),
    0
  );

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

    return {
      ...entry,
      allocated_cents: allocated,
      remainder: exact - allocated,
    };
  });

  let remaining = totalCents - provisional.reduce((sumAllocated, entry) => sumAllocated + entry.allocated_cents, 0);

  provisional
    .sort((left, right) => right.remainder - left.remainder)
    .forEach((entry) => {
      if (remaining > 0) {
        entry.allocated_cents += 1;
        remaining -= 1;
      }
    });

  return provisional.map(({ remainder, ...entry }) => entry);
}

function enrichPackage(definition) {
  const included_services = definition.included_service_keys
    .map((serviceKey) => SERVICE_BY_KEY[serviceKey])
    .filter(Boolean);
  const compare_at_setup = sum(included_services.map((service) => service.setup_fee));
  const compare_at_monthly = sum(included_services.map((service) => service.monthly_fee));

  return {
    ...definition,
    included_services,
    compare_at_setup,
    compare_at_monthly,
    setup_savings: compare_at_setup - definition.setup_total,
    monthly_savings: compare_at_monthly - definition.monthly_total,
    features: included_services.map((service) => service.name),
  };
}

export const PACKAGE_OFFERS = PACKAGE_DEFINITIONS.map(enrichPackage);

export const CATEGORIES = [
  "All",
  ...new Set(PUBLIC_STORE_PRODUCTS.map((product) => product.category)),
];

export function formatCurrency(amount) {
  return Number(amount || 0).toLocaleString();
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
  return PACKAGE_OFFERS.find((offer) => offer.package_key === packageKey) || null;
}

export function getBestPackageOfferForServiceKeys(serviceKeys = []) {
  const selectedProducts = serviceKeys
    .map((serviceKey) => getServiceProductByKey(serviceKey))
    .filter(Boolean);

  return selectBestPackageOffer(selectedProducts);
}

export function getPackageServices(packageKey) {
  return getPackageOffer(packageKey)?.included_services || [];
}

export function normalizeSelectedProducts(items = []) {
  const products = items
    .map((item) => {
      if (typeof item === "string") {
        return getServiceProductById(item);
      }

      if (item?.product_id) {
        return getServiceProductById(item.product_id);
      }

      return null;
    })
    .filter(Boolean);

  return uniqueBy(products, (product) => product.product_id);
}

function getEligiblePackageOffers(products) {
  const selectedServiceKeys = new Set(products.map((product) => product.service_key));

  return PACKAGE_OFFERS.filter((offer) =>
    offer.included_service_keys.every((serviceKey) => selectedServiceKeys.has(serviceKey))
  );
}

function selectBestPackageOffer(products) {
  const eligible = getEligiblePackageOffers(products);

  if (!eligible.length) {
    return null;
  }

  return [...eligible].sort((left, right) => {
    const savingsDifference =
      (right.setup_savings + right.monthly_savings) -
      (left.setup_savings + left.monthly_savings);

    if (savingsDifference !== 0) {
      return savingsDifference;
    }

    return right.included_service_keys.length - left.included_service_keys.length;
  })[0];
}

function allocatePackagePricing(packageOffer) {
  const includedServices = packageOffer.included_services.map((service) => ({
    ...service,
    setup_fee_cents: toCents(service.setup_fee),
    monthly_fee_cents: toCents(service.monthly_fee),
  }));

  const allocatedSetup = allocateWeightedTotalCents(
    includedServices,
    toCents(packageOffer.setup_total),
    "setup_fee_cents"
  );
  const allocatedMonthly = allocateWeightedTotalCents(
    includedServices,
    toCents(packageOffer.monthly_total),
    "monthly_fee_cents"
  );

  return Object.fromEntries(
    includedServices.map((service) => {
      const setupShare = allocatedSetup.find((entry) => entry.product_id === service.product_id)?.allocated_cents || 0;
      const monthlyShare = allocatedMonthly.find((entry) => entry.product_id === service.product_id)?.allocated_cents || 0;

      return [
        service.product_id,
        {
          setup_fee: fromCents(setupShare),
          monthly_fee: fromCents(monthlyShare),
          setup_discount_fee: service.setup_fee - fromCents(setupShare),
          monthly_discount_fee: service.monthly_fee - fromCents(monthlyShare),
        },
      ];
    })
  );
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

    return {
      ...product,
      compare_at_setup_fee: product.setup_fee,
      compare_at_monthly_fee: product.monthly_fee,
      setup_fee: actualSetup,
      monthly_fee: actualMonthly,
      setup_discount_fee: packageShare ? packageShare.setup_discount_fee : 0,
      monthly_discount_fee: packageShare ? packageShare.monthly_discount_fee : 0,
      source_package_key: packageServiceKeys.has(product.service_key) ? packageOffer.package_key : null,
      source_package_name: packageServiceKeys.has(product.service_key) ? packageOffer.name : null,
    };
  });

  const total_setup_before_discount = fromCents(sum(products.map((product) => toCents(product.setup_fee))));
  const total_monthly_before_discount = fromCents(sum(products.map((product) => toCents(product.monthly_fee))));
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
    setup_discount_total: total_setup_before_discount - total_setup,
    monthly_discount_total: total_monthly_before_discount - total_monthly,
  };
}

export function buildStoredPricingSummary(items = []) {
  const summary = buildPricingSummaryForProducts(items);
  const packageOffer = summary.package_offer;

  return {
    pricing_version: "canonical_sales_catalog_v1",
    package_key: packageOffer?.package_key || null,
    package_name: packageOffer?.name || null,
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

export function getPackageDisplayLabel(pricingSummary) {
  if (!pricingSummary?.package_name) {
    return "Custom Service Bundle";
  }

  if ((pricingSummary.add_on_service_keys || []).length > 0) {
    return `${pricingSummary.package_name} + Add-Ons`;
  }

  return pricingSummary.package_name;
}

export const AI_PRODUCTS = PUBLIC_STORE_PRODUCTS;
export const SELF_SERVE_PRODUCTS = CANONICAL_SERVICE_PRODUCTS;
