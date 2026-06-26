import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

    // Fetch website scan for context
    const scans = await base44.asServiceRole.entities.WebsiteIntelligenceScan.filter(
      { order_id }, "-created_date", 1
    ).catch(() => []);
    const scan = scans?.[0] || null;

    const config = order.install_configuration || {};
    const brand = config.brand || {};

    const profileResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are an AI business profile generator. Create a brand voice profile for:

Business: ${brand.business_name || order.business_name}
Industry: ${brand.industry || scan?.detected_industry || "Unknown"}
Brand Voice: ${brand.brand_voice || "Professional and friendly"}
Tagline: ${brand.tagline || "None"}
Visible Services: ${scan?.visible_services?.join(", ") || "Not available"}

Generate:
1. business_summary (2-3 sentences)
2. brand_tone (descriptive)
3. ideal_lead_types (array of strings)
4. approved_vocabulary (words/phrases the AI should use)
5. blocked_topics (topics the AI must avoid)
6. sms_templates (array with service_key, intent, template)
7. email_templates (array with service_key, intent, subject, body)
8. booking_prompts (array of strings to encourage booking)
9. nurture_copy (for 14-day sequence)
10. daily_digest_tone (how the digest should sound)
11. escalation_rules (when to escalate to human)
12. lead_qualification_questions (array of questions to ask leads)

IMPORTANT: No AI-generated messages will go live until approved by admin/client.`,
      response_json_schema: {
        type: "object",
        properties: {
          business_summary: { type: "string" },
          brand_tone: { type: "string" },
          ideal_lead_types: { type: "array", items: { type: "string" } },
          approved_vocabulary: { type: "array", items: { type: "string" } },
          blocked_topics: { type: "array", items: { type: "string" } },
          sms_templates: { type: "array", items: { type: "object" } },
          email_templates: { type: "array", items: { type: "object" } },
          booking_prompts: { type: "array", items: { type: "string" } },
          nurture_copy: { type: "string" },
          daily_digest_tone: { type: "string" },
          escalation_rules: { type: "string" },
          lead_qualification_questions: { type: "array", items: { type: "string" } },
        },
      },
    });

    const existing = await base44.asServiceRole.entities.AIBusinessProfile.filter(
      { order_id }, "-created_date", 1
    ).catch(() => []);

    const profileData = {
      ...profileResponse,
      order_id,
      client_id: order.client_id || "",
      client_project_id: order.client_project_id || "",
      client_email: order.customer_email || "",
      business_name: order.business_name || "",
      approval_status: "pending",
      generated_at: new Date().toISOString(),
      raw_profile: JSON.stringify(profileResponse),
    };

    let profile;
    if (existing?.length > 0) {
      profile = await base44.asServiceRole.entities.AIBusinessProfile.update(existing[0].id, profileData);
    } else {
      profile = await base44.asServiceRole.entities.AIBusinessProfile.create(profileData);
    }

    return json({ success: true, profile });
  } catch (error) {
    console.error("[generateAIBusinessProfile] Error:", error.message);
    return json({ error: error.message }, 500);
  }
});