import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * generateLeadMagnet — #421 #421a #421b #421c
 * Elite perk #1: generates 3 industry lead magnets.
 * FIX: Was checking package_key === "elite" but canonical key is "pro_system".
 * FIX: Removed TypeScript type annotations from .js file.
 * FIX: Added CommunicationEvent notification for portal visibility (#421c).
 */

// All keys that qualify for the Elite perk
const ELITE_TIERS = new Set(["pro_system", "elite_system", "pro", "elite"]);

// #421a: 3 pain points per industry
const PAIN_POINTS = {
  med_spa: [
    "Attracting new patients consistently without expensive ads",
    "Getting Google reviews automatically after every appointment",
    "Retaining clients and reducing no-shows",
  ],
  dental: [
    "Converting new patient inquiries to confirmed appointments",
    "Reducing no-shows with automated reminders",
    "Growing 5-star Google reviews without manually asking",
  ],
  hvac: [
    "Generating leads during the off-season",
    "Following up on estimates that go cold",
    "Getting 5-star reviews after every service call",
  ],
  roofing: [
    "Capturing storm leads before competitors do",
    "Following up on insurance claim leads automatically",
    "Getting referrals from past customers without asking",
  ],
  chiropractic: [
    "Filling open appointment slots automatically",
    "Reducing patient no-shows and late cancellations",
    "Building a steady stream of new patient referrals",
  ],
  contractors: [
    "Converting estimates to signed contracts faster",
    "Following up on cold leads that went quiet",
    "Building your Google review profile without manual effort",
  ],
  default: [
    "Capturing more leads automatically from your website",
    "Following up with leads without manual effort",
    "Building social proof and online reviews at scale",
  ],
};

function buildMarkdown(business_name, industry, pain_point, content) {
  return `# ${pain_point}\n## A Free Guide for ${industry.replace(/_/g, " ")} Businesses\n*By ${business_name}*\n\n---\n\n${content}\n\n---\n*This guide was prepared by ${business_name}. Questions? Call or text us anytime.*`;
}

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

    // FIX: Check all tier fields, not just package_key === "elite"
    const isEliteTier = order && (
      ELITE_TIERS.has(order.package_key) ||
      ELITE_TIERS.has(order.package_type) ||
      ELITE_TIERS.has(order.selected_package_type)
    );

    if (!order || !isEliteTier) {
      return json({ error: "Elite/Pro tier only" }, 403);
    }

    const industry = order.install_configuration?.brand?.industry || order.industry || "default";
    const business_name = order.install_configuration?.brand?.business_name || order.business_name || "Your Business";
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const painPoints = PAIN_POINTS[industry] || PAIN_POINTS.default;
    const magnets = [];

    // #421a: Generate 3 lead magnets, one per pain point
    for (const pain_point of painPoints.slice(0, 3)) {
      let content = "";

      if (openaiKey) {
        try {
          const prompt = `Write a practical, actionable 650-word guide for a ${industry.replace(/_/g, " ")} business called "${business_name}" on this topic: "${pain_point}". Format: intro paragraph, 4-5 numbered tips with explanations, closing paragraph. Tone: friendly expert. No fluff. Return plain text only.`;
          const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [{ role: "user", content: prompt }],
              max_tokens: 900,
              temperature: 0.75,
            }),
          });
          const aiData = await aiRes.json();
          content = aiData?.choices?.[0]?.message?.content?.trim() || "";
        } catch (aiErr) {
          console.warn("[generateLeadMagnet] OpenAI call failed:", aiErr.message);
        }
      }

      const markdown = buildMarkdown(business_name, industry, pain_point, content || `[Content for: ${pain_point}]\n\nThis guide covers key strategies for ${business_name} to address: ${pain_point}.`);
      const words = content ? content.split(/\s+/).length : 0;
      magnets.push({ pain_point, content: markdown, word_count: words });
    }

    // #421b: Save markdown to Order (PDF conversion requires separate service)
    await base44.asServiceRole.entities.Order.update(order_id, {
      lead_magnets: JSON.stringify(magnets.map(m => ({ pain_point: m.pain_point, content: m.content }))),
      lead_magnets_generated_at: new Date().toISOString(),
    });

    // #421c: Notify via CommunicationEvent for portal visibility
    await base44.asServiceRole.entities.CommunicationEvent.create({
      channel: "internal",
      direction: "system",
      event_type: "status_update",
      provider: "internal",
      status: "processed",
      order_id,
      subject: `Lead magnets generated: ${magnets.length} documents`,
      message_body: `Topics: ${magnets.map(m => m.pain_point).join(" | ")}. Business: ${business_name}. Industry: ${industry}.`,
      environment: "production",
    }).catch(() => {});

    console.log(`[generateLeadMagnet] Generated ${magnets.length} magnets for ${business_name} (${industry})`);

    return json({
      success: true,
      magnets: magnets.map(m => ({ pain_point: m.pain_point, word_count: m.word_count })),
      order_id,
    });
  } catch (err) {
    console.error("[generateLeadMagnet]", err.message);
    return json({ error: err.message }, 500);
  }
});