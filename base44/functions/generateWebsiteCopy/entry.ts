/**
 * generateWebsiteCopy
 * Generates AI website copy for a client based on their industry, tone, and business details.
 * Supports regenerating specific sections only.
 *
 * Payload:
 *   - order_id: string (required)
 *   - sections: string[] (optional, defaults to all sections)
 *     Options: "hero", "problem", "solution", "services", "cta", "testimonial_intro", "faq_intro"
 *
 * Returns: { order_id, sections: { [section_key]: { old: string, new: string } } }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SECTION_PROMPTS = {
  hero: (ctx) => `Write a punchy hero headline (max 12 words) and subheadline (max 22 words) for a ${ctx.industry} business called "${ctx.business_name}". Tone: ${ctx.tone}. They help clients with: ${ctx.problem}. Return JSON: {"headline": "...", "subheadline": "..."}`,

  problem: (ctx) => `Write a 2-sentence "Problem" section for a ${ctx.industry} business website. Business: "${ctx.business_name}". Pain points they solve: ${ctx.problem}. Tone: ${ctx.tone}. Return JSON: {"heading": "...", "body": "..."}`,

  solution: (ctx) => `Write a 2-sentence "Solution" section for a ${ctx.industry} business called "${ctx.business_name}". Their value prop: ${ctx.value_prop || ctx.problem}. Tone: ${ctx.tone}. Return JSON: {"heading": "...", "body": "..."}`,

  services: (ctx) => `Write 3 short service description cards for a ${ctx.industry} business called "${ctx.business_name}". Tone: ${ctx.tone}. Each card: a title (3-5 words) and a 1-sentence description. Return JSON: {"cards": [{"title": "...", "description": "..."}, ...]}`,

  cta: (ctx) => `Write a CTA section for a ${ctx.industry} business called "${ctx.business_name}". Tone: ${ctx.tone}. Return JSON: {"heading": "...", "subtext": "...", "button_text": "..."}`,

  testimonial_intro: (ctx) => `Write a 1-sentence testimonial section intro for a ${ctx.industry} business called "${ctx.business_name}". Tone: ${ctx.tone}. Return JSON: {"heading": "...", "intro": "..."}`,

  faq_intro: (ctx) => `Write a 2-sentence FAQ section intro for a ${ctx.industry} business called "${ctx.business_name}". Tone: ${ctx.tone}. Return JSON: {"heading": "...", "intro": "..."}`,
};

const ALL_SECTIONS = Object.keys(SECTION_PROMPTS);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { order_id, sections: requestedSections } = await req.json();
    if (!order_id) {
      return Response.json({ error: 'order_id is required' }, { status: 400 });
    }

    const sectionsToGenerate = (requestedSections && requestedSections.length > 0)
      ? requestedSections.filter(s => ALL_SECTIONS.includes(s))
      : ALL_SECTIONS;

    if (sectionsToGenerate.length === 0) {
      return Response.json({ error: 'No valid sections specified' }, { status: 400 });
    }

    // Fetch the Order
    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    // Build context from order + install_configuration
    const installConfig = order.install_configuration || {};
    const sharedConfig = installConfig.shared || {};
    const businessName = order.business_name || 'Your Business';
    const industry = order.items?.[0]?.service_key?.replace(/_/g, ' ') || 'local service';
    const tone = installConfig.brand?.tone_of_voice || sharedConfig.tone_of_voice || 'Professional';
    const problem = order.notes || `providing excellent ${industry} services`;
    const valueP = installConfig.brand?.value_proposition || problem;

    const ctx = {
      business_name: businessName,
      industry,
      tone,
      problem,
      value_prop: valueP,
    };

    console.log(`[generateWebsiteCopy] order=${order_id} business="${businessName}" industry="${industry}" tone="${tone}" sections=${sectionsToGenerate.join(',')}`);

    // Retrieve existing copy (stored on order.install_configuration.website_copy)
    const existingCopy = installConfig.website_copy || {};

    // Generate new copy for each section in parallel
    const results = {};
    await Promise.all(
      sectionsToGenerate.map(async (section) => {
        const prompt = SECTION_PROMPTS[section](ctx);
        const generated = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: { type: 'object' },
          model: 'claude_sonnet_4_6',
        });
        results[section] = {
          old: existingCopy[section] || null,
          new: generated,
          section_label: section.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        };
        console.log(`[generateWebsiteCopy] ✓ ${section}`);
      })
    );

    return Response.json({
      order_id,
      business_name: businessName,
      industry,
      tone,
      sections: results,
    });

  } catch (error) {
    console.error('[generateWebsiteCopy] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});