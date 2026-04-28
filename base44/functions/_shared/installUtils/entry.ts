/**
 * Install Pipeline Utilities
 */

export const SERVICE_CONFIG_REGISTRY = {
  instant_lead_response: {
    display_name: "Instant Lead Response",
    required_config: ["sms_template"],
  },
  missed_call_text_back: {
    display_name: "Missed Call Text-Back",
    required_config: ["sms_template", "twilio_number"],
  },
  nurture_sequence_14d: {
    display_name: "14-Day Nurture Sequence",
    required_config: ["email_enabled", "sms_enabled"],
  },
  ai_booking_agent: {
    display_name: "AI Booking Agent",
    required_config: ["booking_link"],
  },
  lead_reactivation: {
    display_name: "Lead Reactivation",
    required_config: ["message_template"],
  },
  review_request: {
    display_name: "Review Request Automation",
    required_config: ["review_link"],
  },
};

/**
 * Get tracked service configuration by product ID
 */
export function getTrackedServiceConfig(productId) {
  const productToServiceMap = {
    "prod_instant_response": "instant_lead_response",
    "prod_missed_call": "missed_call_text_back",
    "prod_nurture_14d": "nurture_sequence_14d",
    "prod_booking": "ai_booking_agent",
    "prod_reactivation": "lead_reactivation",
    "prod_reviews": "review_request",
  };

  const serviceKey = productToServiceMap[productId];
  if (!serviceKey) return null;

  return {
    service_key: serviceKey,
    ...SERVICE_CONFIG_REGISTRY[serviceKey],
  };
}

/**
 * Normalize install configuration for new order
 */
export function normalizeInstallConfiguration(baseConfig = {}, orderItems = []) {
  const config = baseConfig || {};
  if (!config.services) config.services = {};

  for (const item of orderItems) {
    if (item.service_key && !config.services[item.service_key]) {
      config.services[item.service_key] = {};
    }
  }

  return config;
}

/**
 * Calculate overall pipeline status from service statuses
 */
export function calculatePipelineStatus(items) {
  const statuses = items.map((i) => i.install_status || "Paid");

  if (statuses.every((s) => s === "Live")) return "Live";
  if (statuses.some((s) => s === "Error")) return "Error";
  if (statuses.some((s) => s === "Testing")) return "Testing";
  if (statuses.some((s) => s === "Configuring")) return "Configuring";
  if (statuses.some((s) => s === "Ready for Install")) return "Ready for Install";
  return "Paid";
}

/**
 * List orders in install pipeline
 */
export async function listInstallQueueOrders(base44, options = {}) {
  const { includeLive = false } = options;

  const validStatuses = [
    "Paid",
    "Ready for Install",
    "Configuring",
    "Testing",
    ...(includeLive ? ["Live"] : []),
  ];

  const allOrders = await base44.asServiceRole.entities.Order.filter(
    { payment_status: "paid" },
    "-install_initialized_at"
  );

  return (allOrders || [])
    .filter((order) => validStatuses.includes(order.pipeline_status))
    .map((order) => ({
      ...order,
      trackedItems: (order.items || []).filter((item) => item.tracking_enabled),
    }));
}