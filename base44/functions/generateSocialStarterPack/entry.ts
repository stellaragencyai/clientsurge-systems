import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * generateSocialStarterPack — #444
 * Elite perk #5: AI generates 10 ready-to-post social captions (5 lead gen + 5 social proof)
 * in client's brand tone. Saves to Order + notifies via CommunicationEvent for portal delivery.
 */

const ELITE_KEYS = new Set(["pro_system", "elite_system", "elite", "pro"]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Frame-Options": "DENY" },
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id } = await req.json().catch(() => ({}));
    if (!order_id) return json({ error: "order_id required" }, 400);

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return json({ error: "Order not found" }, 404);

    const isElite = ELITE_KEYS.has(order.package_key) || ELITE_KEYS.has(order.package_type) || ELITE_KEYS.has(order.selected_package_type);
    if (!isElite) return json({ error: "Elite/Pro tier only" }, 403);

    const cfg = order.install_configuration || {};
    const brand = cfg.brand || {};
    const business_name = brand.business_name || order.business_name || "Your Business";
    const industry = brand.industry || order.industry || "general";
    const tone = brand.brand_voice || brand.tone_of_voice || "Professional";

    const prompt = `Generate 10 ready-to-post social media captions for a ${industry} business called "${business_name}".
Tone: ${tone}.

Generate:
- 5 lead generation captions (aimed at attracting new customers, highlighting services, offering free consultations or quotes)
- 5 social proof captions (highlighting expertise, sharing tips, building trust, celebrating milestones)

Each caption should be:
- Platform-agnostic (works on Facebook, Instagram, LinkedIn)
- 80-150 words
- Include 3-5 relevant hashtags
- End with a clear call-to-action

Return ONLY valid JSON:
{
  "captions": [
    { "type": "lead_gen", "title": "short title", "body": "full caption text with hashtags", "best_for": "Facebook" },
    ... (5 lead_gen + 5 social_proof = 10 total)
  ]
}`;

    const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          captions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                title: { type: "string" },
                body: { type: "string" },
                best_for: { type: "string" },
              },
            },
          },
        },
      },
    });

    const captions = aiResult?.captions || [];

    // Save to Order
    await base44.asServiceRole.entities.Order.update(order_id, {
      social_starter_pack: JSON.stringify(captions),
      social_starter_pack_generated_at: new Date().toISOString(),
    });

    // Notify for portal delivery
    await base44.asServiceRole.entities.CommunicationEvent.create({
      channel: "internal",
      direction: "system",
      event_type: "status_update",
      provider: "internal",
      status: "processed",
      order_id,
      subject: `Social Starter Pack generated: ${captions.length} captions`,
      message_body: `Business: ${business_name}. Industry: ${industry}. Tone: ${tone}. ${captions.filter(c => c.type === "lead_gen").length} lead-gen + ${captions.filter(c => c.type === "social_proof").length} social-proof captions.`,
      environment: "production",
    }).catch(() => {});

    console.log(`[generateSocialStarterPack] Generated ${captions.length} captions for ${business_name}`);

    return json({ success: true, captions: captions.map(c => ({ type: c.type, title: c.title, best_for: c.best_for })), order_id });
  } catch (err) {
    console.error("[generateSocialStarterPack]", err.message);
    return json({ error: err.message }, 500);
  }
});