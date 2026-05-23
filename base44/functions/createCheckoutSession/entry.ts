// base44/functions/createCheckoutSession/main.ts
import Stripe from "npm:stripe@14";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

// base44/functions/createCheckoutSession/checkoutCapacity.shared.js
var CLOSED_ORDER_STATUSES = /* @__PURE__ */ new Set([
  "cancelled",
  "canceled",
  "refunded",
  "failed",
  "archived"
]);
var CLOSED_PAYMENT_STATUSES = /* @__PURE__ */ new Set([
  "cancelled",
  "canceled",
  "refunded",
  "failed"
]);
function parseCapacityLimit(value) {
  if (value === void 0 || value === null || String(value).trim() === "") {
    return null;
  }
  const limit = Number.parseInt(String(value), 10);
  return Number.isFinite(limit) && limit >= 0 ? limit : null;
}
function isActiveCheckoutOrder(order) {
  const orderStatus = String(order?.order_status || "").toLowerCase();
  const paymentStatus = String(order?.payment_status || "").toLowerCase();
  return !CLOSED_ORDER_STATUSES.has(orderStatus) && !CLOSED_PAYMENT_STATUSES.has(paymentStatus);
}
async function getActiveCheckoutOrderCount(base44) {
  const orders = await base44.asServiceRole.entities.Order.list("-created_date", 500).catch(() => []);
  return orders.filter(isActiveCheckoutOrder).length;
}
async function assertCheckoutCapacityAvailable({
  base44,
  limitValue = Deno.env.get("CLIENTSURGE_CHECKOUT_CAPACITY_LIMIT")
}) {
  const limit = parseCapacityLimit(limitValue);
  if (limit === null) {
    return {
      ok: true,
      enforced: false,
      active_orders: null,
      capacity_limit: null
    };
  }
  const activeOrders = await getActiveCheckoutOrderCount(base44);
  if (activeOrders >= limit) {
    return {
      ok: false,
      enforced: true,
      active_orders: activeOrders,
      capacity_limit: limit,
      reason: "ClientSurge onboarding capacity is currently full."
    };
  }
  return {
    ok: true,
    enforced: true,
    active_orders: activeOrders,
    capacity_limit: limit
  };
}

// base44/functions/createCheckoutSession/installPipeline.shared.js
var PIPELINE_STATUSES = [
  "Paid",
  "Ready for Install",
  "Configuring",
  "Testing",
  "Live",
  "Error"
];
var AFTER_HOURS_BEHAVIORS = [
  "send_after_hours_sms",
  "hold_until_open"
];
var CONSENT_BEHAVIORS = [
  "include_opt_out_language",
  "explicit_consent_required"
];
var BOOKING_MODES = [
  "external_link",
  "internal_placeholder"
];
var REVIEW_REQUEST_TRIGGER_EVENTS = [
  "appointment_completed",
  "order_completed",
  "manual_trigger"
];
var REVIEW_REQUEST_CHANNELS = [
  "sms",
  "email"
];
var ALLOWED_BOOKING_INTAKE_FIELDS = [
  "lead_name",
  "lead_email",
  "lead_phone",
  "customer_name",
  "customer_email",
  "customer_phone",
  "preferred_time",
  "notes"
];
var LEAD_REACTIVATION_SEGMENTS = [
  "all_dormant",
  "contacted_no_reply",
  "qualified_unbooked"
];
var TRACKED_INSTALL_SERVICES = {
  prod_UNi5RHiKNSTfQl: {
    service_key: "instant_lead_response",
    display_name: "Instant Lead Response",
    onboarding_flag: "step_instant_response"
  },
  prod_UNi5QL0bQl98If: {
    service_key: "missed_call_text_back",
    display_name: "Missed Call Text-Back",
    onboarding_flag: "step_missed_call"
  },
  prod_UNi5N0l5MtaV0R: {
    service_key: "nurture_sequence_14d",
    display_name: "14-Day Nurture Sequence"
  },
  prod_UNi5fLL2SyJJdP: {
    service_key: "ai_booking_agent",
    display_name: "AI Booking Agent"
  },
  prod_UNi5PWv05ECzXI: {
    service_key: "lead_reactivation",
    display_name: "Old Lead Reactivation"
  },
  prod_UNi5dvOUm6Fi9i: {
    service_key: "review_request",
    display_name: "Review Request Automation"
  }
};
var TRACKED_INSTALL_SERVICES_BY_KEY = Object.fromEntries(
  Object.values(TRACKED_INSTALL_SERVICES).map((service) => [service.service_key, service])
);
var STATUS_TO_LEGACY_ITEM_STATUS = {
  Paid: "pending",
  "Ready for Install": "pending",
  Configuring: "setting_up",
  Testing: "setting_up",
  Live: "live",
  Error: "setting_up"
};
function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}
function ensureEnumValue(value, allowedValues) {
  return allowedValues.includes(value) ? value : "";
}
function buildEmptySharedInstallConfiguration() {
  return {
    twilio_business_phone: "",
    business_hours: "",
    after_hours_behavior: "",
    consent_behavior: "",
    opt_out_message: ""
  };
}
function buildEmptyServiceInstallConfiguration() {
  return {
    sms_template: ""
  };
}
function buildEmptyNurtureSequenceConfiguration() {
  return {
    sms_enabled: false,
    email_enabled: false,
    steps: []
  };
}
function buildEmptyBookingAgentConfiguration() {
  return {
    booking_link: "",
    booking_mode: "",
    confirmation_template: "",
    reminder_enabled: false,
    reminder_template: "",
    intake_fields: [],
    business_hours: ""
  };
}
function buildEmptyLeadReactivationConfiguration() {
  return {
    target_segment: "",
    message_template: "",
    max_batch_size: 25
  };
}
function buildEmptyReviewRequestConfiguration() {
  return {
    review_link: "",
    trigger_event: "",
    message_template: "",
    channel: "",
    send_delay_minutes: null,
    fallback_internal_feedback_enabled: false
  };
}
function normalizeBoolean(value) {
  return value === true;
}
function normalizeSequenceChannel(value) {
  return ["sms", "email"].includes(value) ? value : "";
}
function normalizeBookingIntakeFields(fields = []) {
  if (!Array.isArray(fields)) {
    return [];
  }
  return [...new Set(
    fields.map((field) => cleanString(field)).filter((field) => ALLOWED_BOOKING_INTAKE_FIELDS.includes(field))
  )];
}
function normalizeBatchSize(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 25;
  }
  return Math.min(Math.max(Math.floor(numericValue), 1), 250);
}
function normalizeSendDelayMinutes(value) {
  if (value === null || value === void 0 || value === "") {
    return null;
  }
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return null;
  }
  return Math.min(Math.floor(numericValue), 60 * 24 * 30);
}
function normalizeNurtureSequenceSteps(steps = []) {
  if (!Array.isArray(steps)) {
    return [];
  }
  return steps.map((step) => ({
    day: Number.isFinite(Number(step?.day)) ? Number(step.day) : 0,
    channel: normalizeSequenceChannel(step?.channel),
    message_template: cleanString(step?.message_template)
  })).filter((step) => step.day > 0 || step.channel || step.message_template).sort((a, b) => a.day - b.day);
}
function getSupportedServiceKeys() {
  return Object.keys(TRACKED_INSTALL_SERVICES_BY_KEY);
}
function getConfiguredServiceKeys(config = {}) {
  return Object.keys(config.services || {}).filter((serviceKey) => getSupportedServiceKeys().includes(serviceKey));
}
function getTrackedServiceKeys(items = []) {
  return getTrackedInstallItems(items).map((item) => item.service_key);
}
function normalizeInstallStatus(status, fallbackStatus) {
  if (PIPELINE_STATUSES.includes(status)) {
    return status;
  }
  return fallbackStatus;
}
function getTrackedServiceConfig(productId) {
  return TRACKED_INSTALL_SERVICES[productId] || null;
}
function getTrackedServiceByKey(serviceKey) {
  return TRACKED_INSTALL_SERVICES_BY_KEY[serviceKey] || null;
}
function normalizeOrderItems(items = [], defaultStatus = "Ready for Install") {
  return items.map((item) => {
    const config = getTrackedServiceConfig(item.product_id);
    const serviceKey = item.service_key || config?.service_key;
    const knownTrackedService = Boolean(config || getTrackedServiceByKey(serviceKey));
    const trackingEnabled = knownTrackedService || item.tracking_enabled === true;
    const resolvedInstallStatus = trackingEnabled ? normalizeInstallStatus(item.install_status, defaultStatus) : item.install_status;
    return {
      ...item,
      service_key: serviceKey,
      tracking_enabled: trackingEnabled,
      service_access_status: item.service_access_status || "active",
      install_status: resolvedInstallStatus,
      status: resolvedInstallStatus && STATUS_TO_LEGACY_ITEM_STATUS[resolvedInstallStatus] ? STATUS_TO_LEGACY_ITEM_STATUS[resolvedInstallStatus] : item.status
    };
  });
}
function getTrackedInstallItems(items = []) {
  return items.filter((item) => item.tracking_enabled && item.service_key);
}
function normalizeInstallConfiguration(config = {}, items = []) {
  const sourceConfig = config && typeof config === "object" ? config : {};
  const trackedServiceKeys = /* @__PURE__ */ new Set([
    ...getTrackedServiceKeys(normalizeOrderItems(items)),
    ...getConfiguredServiceKeys(sourceConfig)
  ]);
  const shared = {
    ...buildEmptySharedInstallConfiguration(),
    twilio_business_phone: cleanString(sourceConfig.shared?.twilio_business_phone),
    business_hours: cleanString(sourceConfig.shared?.business_hours),
    after_hours_behavior: ensureEnumValue(sourceConfig.shared?.after_hours_behavior, AFTER_HOURS_BEHAVIORS),
    consent_behavior: ensureEnumValue(sourceConfig.shared?.consent_behavior, CONSENT_BEHAVIORS),
    opt_out_message: cleanString(sourceConfig.shared?.opt_out_message)
  };
  const services = {};
  for (const serviceKey of trackedServiceKeys) {
    if (!TRACKED_INSTALL_SERVICES_BY_KEY[serviceKey]) {
      continue;
    }
    if (serviceKey === "nurture_sequence_14d") {
      services[serviceKey] = {
        ...buildEmptyNurtureSequenceConfiguration(),
        sms_enabled: normalizeBoolean(sourceConfig.services?.[serviceKey]?.sms_enabled),
        email_enabled: normalizeBoolean(sourceConfig.services?.[serviceKey]?.email_enabled),
        steps: normalizeNurtureSequenceSteps(sourceConfig.services?.[serviceKey]?.steps)
      };
      continue;
    }
    if (serviceKey === "ai_booking_agent") {
      services[serviceKey] = {
        ...buildEmptyBookingAgentConfiguration(),
        booking_link: cleanString(sourceConfig.services?.[serviceKey]?.booking_link),
        booking_mode: ensureEnumValue(sourceConfig.services?.[serviceKey]?.booking_mode, BOOKING_MODES),
        business_hours: cleanString(sourceConfig.services?.[serviceKey]?.business_hours),
        confirmation_template: cleanString(sourceConfig.services?.[serviceKey]?.confirmation_template),
        reminder_enabled: normalizeBoolean(sourceConfig.services?.[serviceKey]?.reminder_enabled),
        reminder_template: cleanString(sourceConfig.services?.[serviceKey]?.reminder_template),
        intake_fields: normalizeBookingIntakeFields(sourceConfig.services?.[serviceKey]?.intake_fields)
      };
      continue;
    }
    if (serviceKey === "lead_reactivation") {
      services[serviceKey] = {
        ...buildEmptyLeadReactivationConfiguration(),
        target_segment: ensureEnumValue(sourceConfig.services?.[serviceKey]?.target_segment, LEAD_REACTIVATION_SEGMENTS),
        message_template: cleanString(sourceConfig.services?.[serviceKey]?.message_template),
        max_batch_size: normalizeBatchSize(sourceConfig.services?.[serviceKey]?.max_batch_size)
      };
      continue;
    }
    if (serviceKey === "review_request") {
      services[serviceKey] = {
        ...buildEmptyReviewRequestConfiguration(),
        review_link: cleanString(sourceConfig.services?.[serviceKey]?.review_link),
        trigger_event: ensureEnumValue(sourceConfig.services?.[serviceKey]?.trigger_event, REVIEW_REQUEST_TRIGGER_EVENTS),
        message_template: cleanString(sourceConfig.services?.[serviceKey]?.message_template),
        channel: ensureEnumValue(sourceConfig.services?.[serviceKey]?.channel, REVIEW_REQUEST_CHANNELS),
        send_delay_minutes: normalizeSendDelayMinutes(sourceConfig.services?.[serviceKey]?.send_delay_minutes),
        fallback_internal_feedback_enabled: normalizeBoolean(sourceConfig.services?.[serviceKey]?.fallback_internal_feedback_enabled)
      };
      continue;
    }
    services[serviceKey] = {
      ...buildEmptyServiceInstallConfiguration(),
      sms_template: cleanString(sourceConfig.services?.[serviceKey]?.sms_template)
    };
  }
  return {
    shared,
    services
  };
}

// base44/functions/createCheckoutSession/salesCatalog.shared.js
var PUBLIC_STORE_PRODUCTS = [
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
    icon: "\u26A1",
    category: "Response",
    highlights: [
      "Responds in under 4 seconds",
      "Works 24/7 with zero manual effort"
    ],
    popular: true,
    checkout_enabled: true,
    availability_label: "Self-Serve Checkout",
    fulfillment_label: "Done-for-you setup included"
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
    icon: "\u{1F4DE}",
    category: "Response",
    highlights: [
      "60-second auto text-back",
      "Stops missed-call lead loss",
      "Works 24/7 with zero manual effort"
    ],
    checkout_enabled: true,
    availability_label: "Self-Serve Checkout",
    fulfillment_label: "Done-for-you setup included"
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
    icon: "\u{1F504}",
    category: "Follow-Up",
    highlights: [
      "14-day automated sequence",
      "SMS and email combined",
      "Plug-and-play with your existing setup"
    ],
    popular: true,
    checkout_enabled: true,
    availability_label: "Self-Serve Checkout",
    fulfillment_label: "Done-for-you setup included"
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
    icon: "\u{1F4C5}",
    category: "Booking",
    highlights: [
      "Booking link and intake flow",
      "Confirmation and reminder messaging",
      "Tested end-to-end before go-live"
    ],
    popular: true,
    checkout_enabled: true,
    availability_label: "Self-Serve Checkout",
    fulfillment_label: "Done-for-you setup included"
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
    icon: "\u{1F4B0}",
    category: "Revenue",
    highlights: [
      "Works with your existing lead database",
      "Safe batch sending with rate controls",
      "Full activity log per lead"
    ],
    checkout_enabled: true,
    availability_label: "Self-Serve Checkout",
    fulfillment_label: "Done-for-you setup included"
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
    icon: "\u2B50",
    category: "Reputation",
    highlights: [
      "Manual or post-completion trigger",
      "SMS or email channel support",
      "Sent automatically after each appointment"
    ],
    checkout_enabled: true,
    availability_label: "Self-Serve Checkout",
    fulfillment_label: "Done-for-you setup included"
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
    icon: "\u{1F4E7}",
    category: "Follow-Up",
    highlights: [
      "Personalized per lead",
      "Smart send timing",
      "Fully managed deployment"
    ],
    checkout_enabled: false,
    availability_label: "Coming Soon",
    fulfillment_label: "Exclusive early access",
    coming_soon: true
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
    icon: "\u{1F5D3}\uFE0F",
    category: "Booking",
    highlights: [
      "Targets no-shows quickly",
      "Recovery sequence playbook",
      "Fully managed deployment"
    ],
    checkout_enabled: false,
    availability_label: "Coming Soon",
    fulfillment_label: "Exclusive early access",
    coming_soon: true
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
    icon: "\u{1F389}",
    category: "Retention",
    highlights: [
      "Welcome flow messaging",
      "Expectation setting",
      "Fully managed deployment"
    ],
    checkout_enabled: false,
    availability_label: "Coming Soon",
    fulfillment_label: "Exclusive early access",
    coming_soon: true
  },
  {
    product_id: "prod_UNi53DY2nkRTuM",
    service_key: null,
    name: "Social DM Auto-Responder",
    subtitle: "Instagram & Facebook",
    description: "Instant DM response flow for social inquiries that need a consultative integration review first.",
    setup_fee: 497,
    monthly_fee: 127,
    setup_price_id: "price_1TOwfiB9GU5ysJqE3mAZpu43",
    monthly_price_id: "price_1TOwfiB9GU5ysJqEfV7uVJLb",
    icon: "\u{1F4AC}",
    category: "Social",
    highlights: [
      "Instagram and Facebook DM flow",
      "Lead capture from social",
      "Fully managed deployment"
    ],
    checkout_enabled: false,
    availability_label: "Coming Soon",
    fulfillment_label: "Exclusive early access",
    coming_soon: true
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
    icon: "\u{1F6E1}\uFE0F",
    category: "Reputation",
    highlights: [
      "Multi-platform reputation support",
      "Consultative setup with your team",
      "Tracks reviews across Google & Yelp"
    ],
    checkout_enabled: false,
    availability_label: "Coming Soon",
    fulfillment_label: "Exclusive early access",
    coming_soon: true
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
    icon: "\u{1F9E0}",
    category: "Intelligence",
    highlights: [
      "Lead prioritization support",
      "AI scores and ranks every lead automatically",
      "Fully managed deployment"
    ],
    checkout_enabled: false,
    availability_label: "Coming Soon",
    fulfillment_label: "Exclusive early access",
    coming_soon: true
  }
];
var CANONICAL_SERVICE_PRODUCTS = PUBLIC_STORE_PRODUCTS.filter(
  (product) => product.checkout_enabled
);
var PACKAGE_DEFINITIONS = [
  {
    package_key: "starter_system",
    name: "Starter System",
    fit: "Best for businesses that need instant response and missed-call recovery first.",
    description: "Start with immediate website lead response plus automatic missed-call text-back.",
    stripe_product_id: "prod_UReWMpnZsCnfcL",
    setup_price_id: "price_1TSlDWBVGjsISdG0SyoWzAm3",
    monthly_price_id: "price_1TSlDWBVGjsISdG0Ej1O16ov",
    test_stripe_product_id: "prod_UYhtwNW8eVqQdI",
    test_setup_price_id: "price_1TZaTKBVGjsISdG0FYZuolxJ",
    test_monthly_price_id: "price_1TZaTLBVGjsISdG0dj7Y62fu",
    included_service_keys: ["instant_lead_response", "missed_call_text_back"],
    setup_total: 797,
    monthly_total: 497
  },
  {
    package_key: "growth_system",
    name: "Growth System",
    fit: "Best for steady lead flow that needs response, recovery, nurture, and booking.",
    description: "The core response and nurture stack for businesses actively converting inbound demand.",
    stripe_product_id: "prod_UReWhZsWks1HuA",
    setup_price_id: "price_1TSlDXBVGjsISdG0eTWcARLM",
    monthly_price_id: "price_1TSlDXBVGjsISdG0X9unS4Qf",
    test_stripe_product_id: "prod_UYhtW1TiATAaSS",
    test_setup_price_id: "price_1TZaTLBVGjsISdG0OLeOUdAH",
    test_monthly_price_id: "price_1TZaTMBVGjsISdG0FlG2VVWG",
    included_service_keys: [
      "instant_lead_response",
      "missed_call_text_back",
      "nurture_sequence_14d",
      "ai_booking_agent"
    ],
    setup_total: 1297,
    monthly_total: 997,
    badge: "Most Popular",
    highlight: true
  },
  {
    package_key: "elite_system",
    name: "Elite System",
    fit: "Best for teams that want the full response, reactivation, and review stack.",
    description: "The complete AI automation bundle \u2014 every service, fully managed.",
    stripe_product_id: "prod_UReW1LmsVbn4BZ",
    setup_price_id: "price_1TSlDYBVGjsISdG0l2rHzet1",
    monthly_price_id: "price_1TSlDXBVGjsISdG0Abdx85z3",
    test_stripe_product_id: "prod_UYhtICcoNgWC9d",
    test_setup_price_id: "price_1TZaTMBVGjsISdG0TtdrSHRP",
    test_monthly_price_id: "price_1TZaTNBVGjsISdG0t7w5I7gM",
    included_service_keys: [
      "instant_lead_response",
      "missed_call_text_back",
      "nurture_sequence_14d",
      "ai_booking_agent",
      "lead_reactivation",
      "review_request"
    ],
    setup_total: 2497,
    monthly_total: 1997
  }
];
var SERVICE_BY_PRODUCT_ID = Object.fromEntries(
  CANONICAL_SERVICE_PRODUCTS.map((product) => [product.product_id, product])
);
var SERVICE_BY_KEY = Object.fromEntries(
  CANONICAL_SERVICE_PRODUCTS.map((product) => [product.service_key, product])
);
var SERVICE_BY_MONTHLY_PRICE_ID = Object.fromEntries(
  CANONICAL_SERVICE_PRODUCTS.map((product) => [product.monthly_price_id, product])
);
var SERVICE_BY_SETUP_PRICE_ID = Object.fromEntries(
  CANONICAL_SERVICE_PRODUCTS.map((product) => [product.setup_price_id, product])
);
function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}
function uniqueBy(array, keyFn) {
  const seen = /* @__PURE__ */ new Set();
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
    const exact = entry[weightField] / totalWeight * totalCents;
    const allocated = Math.floor(exact);
    return {
      ...entry,
      allocated_cents: allocated,
      remainder: exact - allocated
    };
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
function enrichPackage(definition) {
  const included_services = definition.included_service_keys.map((serviceKey) => SERVICE_BY_KEY[serviceKey]).filter(Boolean);
  const compare_at_setup = sum(included_services.map((service) => service.setup_fee));
  const compare_at_monthly = sum(included_services.map((service) => service.monthly_fee));
  return {
    ...definition,
    included_services,
    compare_at_setup,
    compare_at_monthly,
    setup_savings: compare_at_setup - definition.setup_total,
    monthly_savings: compare_at_monthly - definition.monthly_total,
    features: included_services.map((service) => service.name)
  };
}
var PACKAGE_OFFERS = PACKAGE_DEFINITIONS.map(enrichPackage);
var CATEGORIES = [
  "All",
  ...new Set(PUBLIC_STORE_PRODUCTS.map((product) => product.category))
];
function getServiceProductById(productId) {
  return SERVICE_BY_PRODUCT_ID[productId] || null;
}
function normalizeSelectedProducts(items = []) {
  const products = items.map((item) => {
    if (typeof item === "string") {
      return getServiceProductById(item);
    }
    if (item?.product_id) {
      return getServiceProductById(item.product_id);
    }
    return null;
  }).filter(Boolean);
  return uniqueBy(products, (product) => product.product_id);
}
function getEligiblePackageOffers(products) {
  const selectedServiceKeys = new Set(products.map((product) => product.service_key));
  return PACKAGE_OFFERS.filter(
    (offer) => offer.included_service_keys.every((serviceKey) => selectedServiceKeys.has(serviceKey))
  );
}
function selectBestPackageOffer(products) {
  const eligible = getEligiblePackageOffers(products);
  if (!eligible.length) {
    return null;
  }
  return [...eligible].sort((left, right) => {
    const packageSizeDifference = right.included_service_keys.length - left.included_service_keys.length;
    if (packageSizeDifference !== 0) {
      return packageSizeDifference;
    }
    const savingsDifference = right.setup_savings + right.monthly_savings - (left.setup_savings + left.monthly_savings);
    if (savingsDifference !== 0) {
      return savingsDifference;
    }
    return right.setup_total - left.setup_total;
  })[0];
}
function allocatePackagePricing(packageOffer) {
  const includedServices = packageOffer.included_services.map((service) => ({
    ...service,
    setup_fee_cents: toCents(service.setup_fee),
    monthly_fee_cents: toCents(service.monthly_fee)
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
          monthly_discount_fee: service.monthly_fee - fromCents(monthlyShare)
        }
      ];
    })
  );
}
function buildPricingSummaryForProducts(items = []) {
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
      source_package_name: packageServiceKeys.has(product.service_key) ? packageOffer.name : null
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
    monthly_discount_total: total_monthly_before_discount - total_monthly
  };
}
function buildStoredPricingSummary(items = []) {
  const summary = buildPricingSummaryForProducts(items);
  const packageOffer = summary.package_offer;
  return {
    pricing_version: "canonical_sales_catalog_v1",
    package_key: packageOffer?.package_key || null,
    package_name: packageOffer?.name || null,
    package_stripe_product_id: packageOffer?.stripe_product_id || null,
    package_setup_price_id: packageOffer?.setup_price_id || null,
    package_monthly_price_id: packageOffer?.monthly_price_id || null,
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
    compare_at_monthly: packageOffer?.compare_at_monthly || null
  };
}
function buildStripeLineItemsForPricingSummary(pricingSummary, { livemode = true } = {}) {
  const packageOffer = pricingSummary?.package_offer || null;
  const addOnServiceKeys = pricingSummary?.add_on_service_keys || [];
  const setupPriceId = livemode === false ? packageOffer?.test_setup_price_id : packageOffer?.setup_price_id;
  const monthlyPriceId = livemode === false ? packageOffer?.test_monthly_price_id : packageOffer?.monthly_price_id;
  if (!setupPriceId || !monthlyPriceId) {
    throw new Error("Live checkout currently requires a Starter, Growth, or Elite package bundle.");
  }
  if (addOnServiceKeys.length > 0) {
    throw new Error("Live checkout currently supports package bundles only; add-on checkout is not enabled.");
  }
  return [
    {
      price: setupPriceId,
      quantity: 1
    },
    {
      price: monthlyPriceId,
      quantity: 1
    }
  ];
}

// base44/functions/createCheckoutSession/main.ts
var stripeSecretKey = Deno.env.get("STRIPE_LIVE_SECRET_KEY") || Deno.env.get("STRIPE_SECRET_KEY") || "";
var stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
function maskSecret(secret = "") {
  if (!secret) return "missing";
  if (secret.length <= 8) return `${secret.slice(0, 2)}***`;
  return `${secret.slice(0, 7)}...${secret.slice(-4)}`;
}
async function resolveStripeAccountSummary() {
  if (!stripe) {
    return {
      secret_present: false,
      secret_prefix: "missing",
      secret_fingerprint: "missing",
      livemode: null,
      account_id: null,
      business_name: null
    };
  }
  try {
    const account = await stripe.accounts.retrieve();
    return {
      secret_present: true,
      secret_prefix: stripeSecretKey.startsWith("sk_test_") ? "sk_test_" : stripeSecretKey.startsWith("sk_live_") ? "sk_live_" : "unknown",
      secret_fingerprint: maskSecret(stripeSecretKey),
      livemode: Boolean(account?.livemode),
      account_id: account?.id || null,
      business_name: account?.business_profile?.name || account?.settings?.dashboard?.display_name || null
    };
  } catch (error) {
    return {
      secret_present: true,
      secret_prefix: stripeSecretKey.startsWith("sk_test_") ? "sk_test_" : stripeSecretKey.startsWith("sk_live_") ? "sk_live_" : "unknown",
      secret_fingerprint: maskSecret(stripeSecretKey),
      livemode: null,
      account_id: null,
      business_name: null,
      account_lookup_error: error instanceof Error ? error.message : String(error)
    };
  }
}
Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  try {
    const base44 = createClientFromRequest(req);
    const {
      items,
      product_ids,
      customer_name,
      customer_email,
      customer_phone,
      business_name,
      success_url,
      cancel_url
    } = await req.json();
    if (!stripe) {
      console.error("[createCheckoutSession] Stripe is not configured", {
        requestId,
        secret_present: false
      });
      return Response.json({ error: "Stripe is not configured", request_id: requestId }, { status: 500 });
    }
    const requestedProductIds = Array.isArray(product_ids) && product_ids.length ? product_ids : Array.isArray(items) ? items.map((item) => item?.product_id || item).filter(Boolean) : [];
    if (!requestedProductIds.length || !customer_email) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    const capacity = await assertCheckoutCapacityAvailable({ base44 });
    if (!capacity.ok) {
      console.warn("[createCheckoutSession] capacity limit reached", {
        requestId,
        active_orders: capacity.active_orders,
        capacity_limit: capacity.capacity_limit
      });
      return Response.json(
        {
          error: capacity.reason,
          code: "checkout_capacity_full",
          active_orders: capacity.active_orders,
          capacity_limit: capacity.capacity_limit,
          request_id: requestId
        },
        { status: 409 }
      );
    }
    const pricingSummary = buildPricingSummaryForProducts(requestedProductIds);
    if (!pricingSummary.priced_items.length) {
      return Response.json({ error: "No canonical services selected for checkout", request_id: requestId }, { status: 400 });
    }
    const stripeAccount = await resolveStripeAccountSummary();
    console.log("[createCheckoutSession] request received", {
      requestId,
      requestedProductIds,
      customer_email,
      business_name,
      success_url,
      cancel_url,
      stripeAccount
    });
    const orderItems = pricingSummary.priced_items.map((item) => ({
      product_id: item.product_id,
      product_name: item.name,
      setup_price_id: item.setup_price_id,
      monthly_price_id: item.monthly_price_id,
      setup_fee: item.setup_fee,
      monthly_fee: item.monthly_fee,
      compare_at_setup_fee: item.compare_at_setup_fee,
      compare_at_monthly_fee: item.compare_at_monthly_fee,
      setup_discount_fee: item.setup_discount_fee,
      monthly_discount_fee: item.monthly_discount_fee,
      source_package_key: item.source_package_key,
      source_package_name: item.source_package_name,
      status: "pending",
      service_key: getTrackedServiceConfig(item.product_id)?.service_key,
      tracking_enabled: Boolean(getTrackedServiceConfig(item.product_id)),
      service_access_status: "active"
    }));
    const order = await base44.asServiceRole.entities.Order.create({
      customer_email,
      customer_name,
      customer_phone: customer_phone || "",
      business_name,
      items: orderItems,
      total_setup: pricingSummary.total_setup,
      total_monthly: pricingSummary.total_monthly,
      pricing_summary: buildStoredPricingSummary(pricingSummary.priced_items),
      install_configuration: normalizeInstallConfiguration({}, orderItems),
      payment_status: "pending",
      order_status: "pending_payment",
      selected_package_type: pricingSummary.package_offer?.package_key || null,
      package_type: pricingSummary.package_offer?.package_key || null,
      plan_type: pricingSummary.package_offer?.name || "Custom Service Bundle"
    });
    const line_items = buildStripeLineItemsForPricingSummary(pricingSummary);
    const sessionMetadata = {
      order_id: order.id,
      base44_app_id: Deno.env.get("BASE44_APP_ID"),
      customer_name,
      customer_phone: customer_phone || "",
      business_name,
      items_json: JSON.stringify(
        pricingSummary.priced_items.map((item) => ({
          product_id: item.product_id,
          product_name: item.name,
          service_key: item.service_key
        }))
      ),
      package_key: pricingSummary.package_offer?.package_key || "",
      package_stripe_product_id: pricingSummary.package_offer?.stripe_product_id || "",
      request_id: requestId
    };
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email,
      line_items,
      subscription_data: {
        metadata: {
          order_id: order.id,
          plan_type: pricingSummary.package_offer?.name || "Custom Service Bundle",
          package_key: pricingSummary.package_offer?.package_key || "",
          services_json: JSON.stringify(
            pricingSummary.priced_items.map((item) => ({
              product_id: item.product_id,
              product_name: item.name,
              service_key: item.service_key
            }))
          ),
          request_id: requestId
        }
      },
      success_url: success_url || `${req.headers.get("origin")}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${req.headers.get("origin")}/store`,
      metadata: sessionMetadata
    });
    await base44.asServiceRole.entities.Order.update(order.id, {
      stripe_session_id: session.id
    });
    console.log("[createCheckoutSession] session created", {
      requestId,
      orderId: order.id,
      sessionId: session.id,
      sessionUrl: session.url,
      mode: session.mode,
      status: session.status,
      customer: session.customer,
      subscription: session.subscription,
      livemode: session.livemode,
      lineItemPriceIds: line_items.map((item) => item.price)
    });
    return Response.json({ url: session.url, session_id: session.id, request_id: requestId });
  } catch (error) {
    console.error("[createCheckoutSession] Checkout error", {
      requestId,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : void 0
    });
    return Response.json({ error: error instanceof Error ? error.message : "Checkout failed", request_id: requestId }, { status: 500 });
  }
});
