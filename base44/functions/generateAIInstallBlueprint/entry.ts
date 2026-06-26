import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CANONICAL_PRO_SERVICE_KEYS = [
  "instant_lead_response",
  "missed_call_text_back",
  "nurture_sequence_14d",
  "ai_booking_agent",
  "daily_lead_digest",
  "inbound_sms_assistant",
];

const SERVICE_DISPLAY_NAMES = {
  instant_lead_response: "Instant Lead Response",
  missed_call_text_back: "Missed Call Text-Back",
  nurture_sequence_14d: "14-Day Nurture Sequence",
  ai_booking_agent: "AI Booking Agent",
  daily_lead_digest: "Daily Lead Digest",
  inbound_sms_assistant: "Inbound SMS Assistant",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id } = await req.json().catch(() => ({}));

    if (!order_id) return json({ error: "order_id required" }, 400);

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return json({ error: "Order not found" }, 404);

    // Fetch website scan
    const scans = await base44.asServiceRole.entities.WebsiteIntelligenceScan.filter(
      { order_id }, "-created_date", 1
    ).catch(() => []);
    const scan = scans?.[0] || null;

    // Fetch install configuration
    const config = order.install_configuration || {};
    const brand = config.brand || {};
    const messaging = config.messaging || {};

    // Generate blueprint via LLM
    const blueprintResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are an AI installation blueprint generator. Create a client-specific installation blueprint based on the following information:

Business: ${brand.business_name || order.business_name}
Industry: ${brand.industry || "Unknown"}
Website: ${brand.website || "Not provided"}
Booking Link: ${messaging.booking_link || "Not provided"}
Business Hours: ${config.shared?.business_hours || "Not provided"}
Package: Pro System (6 automations)

Website Scan Results:
${scan ? JSON.stringify(scan.lead_paths || [], null, 2) : "No scan available"}

Detected Industry: ${scan?.detected_industry || "Unknown"}
Detected Phone Numbers: ${scan?.phone_numbers?.join(", ") || "None"}
Detected Booking Links: ${scan?.booking_links?.join(", ") || "None"}
Tracking Gaps: ${scan?.tracking_gaps?.join(", ") || "None"}

Generate a comprehensive blueprint with:
1. detected_lead_paths (from scan)
2. required_integrations (Twilio, Resend, booking platform, CRM, etc.)
3. six_automations (one entry per canonical service key with config_summary)
4. message_template_plan (SMS and email templates for each automation)
5. booking_rules
6. sms_phone_rules
7. email_domain_rules
8. test_plan (scenarios to test before go-live)
9. launch_blockers (issues that must be resolved)

Return as structured JSON.`,
      response_json_schema: {
        type: "object",
        properties: {
          detected_lead_paths: { type: "array", items: { type: "object" } },
          required_integrations: { type: "array", items: { type: "string" } },
          six_automations: { type: "array", items: { type: "object" } },
          message_template_plan: { type: "object" },
          booking_rules: { type: "string" },
          sms_phone_rules: { type: "string" },
          email_domain_rules: { type: "string" },
          test_plan: { type: "array", items: { type: "object" } },
          launch_blockers: { type: "array", items: { type: "string" } },
        },
      },
    });

    // Check for existing blueprint
    const existing = await base44.asServiceRole.entities.AIInstallBlueprint.filter(
      { order_id }, "-created_date", 1
    ).catch(() => []);

    const sixAutomations = CANONICAL_PRO_SERVICE_KEYS.map((key) => ({
      service_key: key,
      display_name: SERVICE_DISPLAY_NAMES[key] || key,
      config_summary: blueprintResponse.six_automations?.find((a) => a.service_key === key)?.config_summary || "",
    }));

    const blueprintData = {
      order_id,
      client_id: order.client_id || "",
      client_project_id: order.client_project_id || "",
      client_email: order.customer_email || "",
      business_name: order.business_name || "",
      industry: brand.industry || scan?.detected_industry || "",
      package_key: "pro_system",
      blueprint_status: "generated",
      detected_lead_paths: blueprintResponse.detected_lead_paths || [],
      required_integrations: blueprintResponse.required_integrations || [],
      six_automations: sixAutomations,
      message_template_plan: blueprintResponse.message_template_plan || {},
      booking_rules: blueprintResponse.booking_rules || "",
      sms_phone_rules: blueprintResponse.sms_phone_rules || "",
      email_domain_rules: blueprintResponse.email_domain_rules || "",
      test_plan: blueprintResponse.test_plan || [],
      launch_blockers: blueprintResponse.launch_blockers || [],
      generated_at: new Date().toISOString(),
      raw_blueprint: JSON.stringify(blueprintResponse),
    };

    let blueprint;
    if (existing?.length > 0) {
      blueprint = await base44.asServiceRole.entities.AIInstallBlueprint.update(existing[0].id, blueprintData);
    } else {
      blueprint = await base44.asServiceRole.entities.AIInstallBlueprint.create(blueprintData);
    }

    return json({ success: true, blueprint });
  } catch (error) {
    console.error("[generateAIInstallBlueprint] Error:", error.message);
    return json({ error: error.message }, 500);
  }
});