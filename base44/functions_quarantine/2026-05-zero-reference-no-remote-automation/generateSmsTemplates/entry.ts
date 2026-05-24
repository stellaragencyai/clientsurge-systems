/**
 * generateSmsTemplates — #413a #413b #413d
 * Uses OpenAI to generate custom SMS templates per industry + tone.
 * Enforces 160-char hard limit with retry (#413b).
 * Static fallback templates per industry if OpenAI fails (#413d).
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

// #413d: static fallback templates per industry
const FALLBACK_TEMPLATES: Record<string, Record<string, string>> = {
  instant_response: {
    med_spa: "Hi! Thanks for reaching out to {business_name}. We'd love to help — when works best for a quick call? Reply STOP to opt out.",
    dental: "Hi! {business_name} here. Thanks for your inquiry! We'll be in touch shortly to get you scheduled. Reply STOP to opt out.",
    tanning: "Hey! Thanks for contacting {business_name}. We have openings this week — want to book? Reply STOP to opt out.",
    hvac: "Hi, this is {business_name}. Got your request! We'll call you shortly to schedule service. Reply STOP to opt out.",
    roofing: "Hi! {business_name} here. Thanks for reaching out — we'll contact you soon for a free estimate. Reply STOP to opt out.",
    default: "Hi! Thanks for reaching out to {business_name}. We'll be in touch shortly! Reply STOP to opt out.",
  },
  missed_call_textback: {
    med_spa: "Hi, you just called {business_name}! We're with a client — reply here and we'll get back to you ASAP. Reply STOP to opt out.",
    dental: "Hi! You called {business_name}. Sorry we missed you — text us here and we'll follow up right away. Reply STOP to opt out.",
    tanning: "Hey! You called {business_name} and we missed you — text back to book or ask anything! Reply STOP to opt out.",
    hvac: "Hi, you called {business_name}. We're on a job — text back your issue and we'll call you as soon as possible. Reply STOP to opt out.",
    roofing: "Hi! You called {business_name}. We missed your call — text us and we'll get back to you quickly. Reply STOP to opt out.",
    default: "Hi! You just called {business_name} and we missed you. Text back and we'll follow up shortly. Reply STOP to opt out.",
  },
};

function getFallback(template_type: string, industry: string): string {
  const templates = FALLBACK_TEMPLATES[template_type] || {};
  return templates[industry] || templates.default || "Hi! Thanks for contacting us. We'll be in touch shortly. Reply STOP to opt out.";
}

// #413b: enforce 160-char limit
function enforce160(text: string): string {
  if (text.length <= 160) return text;
  // Trim to 157 + "..."
  return text.slice(0, 157) + "...";
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id, industry = "default", tone = "friendly", template_types = ["instant_response", "missed_call_textback"] } = await req.json();

    const order = order_id ? await base44.asServiceRole.entities.Order.get(order_id).catch(() => null) : null;
    const business_name = order?.client_name || "our team";
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const generated: Record<string, string> = {};

    for (const template_type of template_types) {
      if (!openaiKey) {
        // #413d: fallback immediately if no OpenAI key
        generated[template_type] = getFallback(template_type, industry).replace("{business_name}", business_name);
        continue;
      }

      // #413a: OpenAI prompt per template type
      const prompts: Record<string, string> = {
        instant_response: `Write a ${tone} SMS auto-response for a ${industry.replace("_", " ")} business called "${business_name}". The message should: acknowledge the inquiry, indicate someone will follow up, invite a response. Tone: ${tone}. End with "Reply STOP to opt out." Max 160 characters. Return ONLY the SMS text.`,
        missed_call_textback: `Write a ${tone} SMS text-back for a missed call at a ${industry.replace("_", " ")} called "${business_name}". Acknowledge the missed call, invite them to text back. Tone: ${tone}. End with "Reply STOP to opt out." Max 160 characters. Return ONLY the SMS text.`,
        followup_day1: `Write a ${tone} Day 1 follow-up SMS for a ${industry.replace("_", " ")} called "${business_name}" for a lead who hasn't booked yet. Tone: ${tone}. End with "Reply STOP to opt out." Max 160 characters. Return ONLY the SMS text.`,
        followup_day3: `Write a ${tone} Day 3 follow-up SMS for a ${industry.replace("_", " ")} called "${business_name}". Brief, value-focused, low pressure. End with "Reply STOP to opt out." Max 160 characters. Return ONLY the SMS text.`,
      };

      const prompt = prompts[template_type] || prompts.instant_response;

      try {
        const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], max_tokens: 80, temperature: 0.7 }),
        });
        const aiData = await aiRes.json();
        let text = aiData?.choices?.[0]?.message?.content?.trim() || "";

        // #413b: 160-char hard limit — retry once if exceeded
        if (text.length > 160) {
          const retryPrompt = prompt + ` IMPORTANT: Your previous response was too long. Keep it under 160 characters total including the opt-out text.`;
          const retryRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: retryPrompt }], max_tokens: 70, temperature: 0.5 }),
          });
          const retryData = await retryRes.json();
          text = retryData?.choices?.[0]?.message?.content?.trim() || text;
        }

        generated[template_type] = enforce160(text) || getFallback(template_type, industry).replace("{business_name}", business_name);
      } catch {
        // #413d: fallback on OpenAI error
        generated[template_type] = getFallback(template_type, industry).replace("{business_name}", business_name);
      }
    }

    // Save to order if order_id provided
    if (order_id) {
      await base44.asServiceRole.entities.Order.update(order_id, { sms_templates: generated }).catch(() => {});
    }

    return Response.json({ success: true, templates: generated, industry, tone });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
