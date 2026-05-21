import { secureJson } from "../_shared/response.ts";
/**
 * aiOnboardingIntelligence
 * Pre-flight gap detector + credential completeness check.
 *
 * Before activation, AI scans the order's install_configuration for
 * missing required fields per service. It:
 *   - Auto-fills safe defaults where possible
 *   - Returns structured blockers (must fix before activating)
 *   - Returns warnings (can activate but may need attention)
 *   - Returns optimal activation sequence based on what's ready
 *   - Sets ready_to_activate = true/false
 *
 * Smallest steps:
 *   1. Load order + onboarding client data
 *   2. Resolve package + service list
 *   3. Per service: check required credentials in install_configuration
 *   4. Auto-fill safe defaults (business phone, generic templates)
 *   5. Return structured pre-flight report
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const REQUIRED_BY_SERVICE = {
  instant_lead_response: [
    { field: "services.instant_lead_response.sms_template", label: "Instant Response SMS template", can_autofill: true, default: "Hi {{name}}! Thanks for reaching out to {{business}}. We'll be in touch shortly." },
  ],
  missed_call_text_back: [
    { field: "shared.twilio_business_phone", label: "Business phone number (Twilio)", can_autofill: false },
    { field: "services.missed_call_text_back.sms_template", label: "Missed Call SMS template", can_autofill: true, default: "Hi {{name}}! Sorry we missed your call. We're available Mon–Fri 9am–6pm. Reply or call back: {{booking_link}}" },
  ],
  nurture_sequence_14d: [
    { field: "services.nurture_sequence_14d.sms_enabled", label: "Nurture SMS enabled flag", can_autofill: true, default: true },
    { field: "services.nurture_sequence_14d.email_enabled", label: "Nurture email enabled flag", can_autofill: true, default: true },
  ],
  ai_booking_agent: [
    { field: "services.ai_booking_agent.booking_link", label: "Booking link URL", can_autofill: false },
  ],
  review_request: [
    { field: "services.review_request.review_link", label: "Google Review link", can_autofill: false },
  ],
  lead_reactivation: [
    { field: "services.lead_reactivation.message_template", label: "Reactivation message template", can_autofill: true, default: "Hi {{name}}, we haven't spoken in a while. {{business}} has some updates we think you'll love. Are you still interested?" },
  ],
};

const TIER_SERVICE_MAP = {
  starter_system: ["instant_lead_response", "ai_booking_agent"],
  growth_system:  ["instant_lead_response", "missed_call_text_back", "nurture_sequence_14d", "ai_booking_agent"],
  elite_system:   ["instant_lead_response", "missed_call_text_back", "nurture_sequence_14d", "ai_booking_agent", "lead_reactivation", "review_request"],
};

const ACTIVATION_SEQUENCE = [
  "instant_lead_response",
  "missed_call_text_back",
  "nurture_sequence_14d",
  "ai_booking_agent",
  "review_request",
  "lead_reactivation",
];

function getNestedValue(obj, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

function setNestedValue(obj, path, value) {
  const keys = path.split(".");
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return secureJson({ error: "Admin access required" }, { status: 403 });
    }

    const { order_id, package_key, service_keys } = await req.json();
    if (!order_id) return secureJson({ error: "order_id required" }, { status: 400 });

    // Step 1: Load order data
    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) return secureJson({ error: "Order not found" }, { status: 404 });

    // Step 2: Resolve services
    const resolvedPackageKey = package_key || order.pricing_summary?.package_key || order.package_type;
    let services = service_keys || (resolvedPackageKey ? TIER_SERVICE_MAP[resolvedPackageKey] : null);
    if (!services || services.length === 0) {
      services = (order.items || []).map(i => i.service_key).filter(Boolean);
    }

    const config = order.install_configuration || {};
    const blockers = [];
    const warnings = [];
    const auto_filled = [];
    const updatedConfig = JSON.parse(JSON.stringify(config)); // deep clone

    // Step 3+4: Check each service's required credentials
    for (const sk of services) {
      const requirements = REQUIRED_BY_SERVICE[sk] || [];
      for (const req_item of requirements) {
        const existing = getNestedValue(config, req_item.field);
        if (!existing) {
          if (req_item.can_autofill) {
            // Auto-fill safe default
            setNestedValue(updatedConfig, req_item.field, req_item.default);
            auto_filled.push(`${req_item.label} → set to default`);
          } else {
            blockers.push(`[${sk}] Missing: ${req_item.label} — required before activation`);
          }
        }
      }
    }

    // Write auto-filled defaults back to order
    if (auto_filled.length > 0) {
      await base44.asServiceRole.entities.Order.update(order_id, {
        install_configuration: updatedConfig,
      });
      console.log(`[Intelligence] Auto-filled ${auto_filled.length} defaults for order ${order_id}`);
    }

    // Additional warnings
    if (!order.customer_email) warnings.push("Customer email missing — go-live notification will fail");
    if (!order.business_name) warnings.push("Business name missing — AI templates may use fallback placeholder");

    const orderedServices = ACTIVATION_SEQUENCE.filter(sk => services.includes(sk));
    const extras = services.filter(sk => !ACTIVATION_SEQUENCE.includes(sk));
    const activation_sequence = [...orderedServices, ...extras];

    const ready_to_activate = blockers.length === 0;

    console.log(`[Intelligence] Pre-flight for ${order_id}: ready=${ready_to_activate}, blockers=${blockers.length}, auto_filled=${auto_filled.length}`);

    return secureJson({
      success: true,
      ready_to_activate,
      blockers,
      warnings,
      auto_filled,
      activation_sequence,
      services_checked: services.length,
      package_key: resolvedPackageKey,
    });
  } catch (error) {
    console.error("[aiOnboardingIntelligence] Error:", error.message);
    return secureJson({ error: error.message }, { status: 500 });
  }
});