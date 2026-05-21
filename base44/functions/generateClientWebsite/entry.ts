import { secureJson } from "../_shared/response.ts";
/**
 * generateClientWebsite — #418
 * Elite tier: uses OpenAI to write hero headline, subheading, 3 proof points.
 * Starter/Growth: uses businessConfigTemplates static copy.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id } = await req.json();
    if (!order_id) return secureJson({ error: "order_id required" }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return secureJson({ error: "Order not found" }, { status: 404 });

    const package_key = order.package_key || "starter";
    const industry = order.industry || "default";
    const business_name = order.client_name || "Your Business";
    const tone = order.install_configuration?.tone_of_voice || "professional";
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    let copy: Record<string, string> = {};

    if (package_key === "elite" && openaiKey) {
      // #418: OpenAI-generated hero copy for Elite tier
      const prompt = `You are writing homepage copy for a local ${industry.replace("_", " ")} business called "${business_name}" in Phoenix, AZ. Tone: ${tone}. Write:
1. A punchy hero headline (max 8 words, no quotes)
2. A subheading (max 18 words, no quotes)  
3. Three social proof points (each max 12 words, no quotes)
Return as JSON: { "headline": "...", "subheading": "...", "proof1": "...", "proof2": "...", "proof3": "..." }`;

      const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], max_tokens: 200, temperature: 0.8, response_format: { type: "json_object" } }),
      });
      const aiData = await aiRes.json();
      try { copy = JSON.parse(aiData?.choices?.[0]?.message?.content || "{}"); } catch {}
    }

    // Update WebsiteSpec with generated copy
    const specs = await base44.asServiceRole.entities.WebsiteSpec.filter({ order_id }).catch(() => []);
    if (specs?.length > 0) {
      await base44.asServiceRole.entities.WebsiteSpec.update(specs[0].id, {
        brand: JSON.stringify({ ...JSON.parse(specs[0].brand || "{}"), generated_copy: copy }),
      });
    }

    await base44.asServiceRole.entities.Order.update(order_id, { workflow_stage: "Website Copy Generated" });

    return secureJson({ success: true, copy, package_key, industry });
  } catch (err) {
    return secureJson({ error: err.message }, { status: 500 });
  }
});
