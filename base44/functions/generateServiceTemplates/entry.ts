import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * generateServiceTemplates — #413 #413a #413b #413c #413d
 * FIX: Removed TypeScript type annotations from .js file.
 * FIX: Now uses InvokeLLM for AI-personalized templates (not static strings).
 * FIX: Added 160-char hard limit validation on all SMS output (#413c).
 * FIX: Static fallback templates per industry when LLM fails (#413d).
 */

// #413d: Static fallback templates per industry
const INDUSTRY_FALLBACKS = {
  med_spa: {
    instant_lead_sms: "Hi! Thanks for reaching out to {biz}. We received your inquiry and will be in touch shortly. Book: {book} — Reply STOP to opt out.",
    missed_call_sms: "Hi! You just called {biz} — sorry we missed you! Text back or book: {book}. We'll be in touch soon! — Reply STOP to opt out.",
  },
  dental: {
    instant_lead_sms: "Hi! Thanks for contacting {biz}. We'll be in touch shortly to discuss your dental care needs. Book: {book} — Reply STOP to opt out.",
    missed_call_sms: "Hi! You called {biz} — sorry we missed you! We'd love to help with your dental needs. Book: {book} — Reply STOP to opt out.",
  },
  hvac: {
    instant_lead_sms: "Hi! Thanks for reaching out to {biz}. We're on it and will call you back soon. For urgent service: {book} — Reply STOP to opt out.",
    missed_call_sms: "Hi! You called {biz} — sorry we missed you! For emergency HVAC service book here: {book}. We'll call back shortly! — Reply STOP to opt out.",
  },
  roofing: {
    instant_lead_sms: "Hi! Thanks for contacting {biz}. We got your roofing inquiry and will be in touch soon. Schedule a free estimate: {book} — Reply STOP to opt out.",
    missed_call_sms: "Hi! You called {biz} about your roof — sorry we missed you! Get a free estimate: {book}. We'll follow up shortly! — Reply STOP to opt out.",
  },
};

function buildFallbackTemplates(business_name, industry, booking_link) {
  const biz = business_name || "us";
  const book = booking_link || "our website";
  const industryFallback = INDUSTRY_FALLBACKS[industry] || {};

  const instant = (industryFallback.instant_lead_sms || "Hi! Thanks for reaching out to {biz}. We'll be in touch shortly. Book: {book} — Reply STOP to opt out.")
    .replace("{biz}", biz).replace("{book}", book);
  const missed = (industryFallback.missed_call_sms || "Hi! You just called {biz} and we missed you. Text back or book here: {book} — Reply STOP to opt out.")
    .replace("{biz}", biz).replace("{book}", book);

  return {
    instant_lead_sms: truncateSms(instant),
    missed_call_sms: truncateSms(missed),
    review_request_sms: truncateSms(`Hi! It was great working with ${biz}. Would you mind leaving a Google review? It helps us a lot: [REVIEW_LINK] — Reply STOP to opt out.`),
    appointment_reminder_sms: truncateSms(`Reminder: You have an upcoming appointment with ${biz}. Reply CONFIRM to confirm or CANCEL to cancel. Reschedule: ${book} — Reply STOP to opt out.`),
    nurture_day1_email: {
      subject: `Your inquiry to ${biz} — what happens next`,
      body: `Hi,\n\nThank you for reaching out to ${biz}. We specialize in ${industry || "our field"} and would love to help.\n\nHere's what to expect:\n• We'll review your inquiry within 1 business day\n• A team member will reach out directly\n• We'll get you scheduled at a time that works\n\nBook directly: ${book}\n\nTalk soon,\nThe ${biz} Team`,
    },
  };
}

// #413c: Truncate SMS to 160 chars max
function truncateSms(text) {
  if (!text || typeof text !== "string") return "";
  if (text.length <= 160) return text;
  return text.slice(0, 157) + "...";
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
    if (!order) return json({ error: "Order not found" }, 404);

    const cfg = order.install_configuration || {};
    const brand = cfg.brand || {};
    const messaging = cfg.messaging || {};

    const business_name = brand.business_name || order.business_name || "";
    const industry = brand.industry || order.industry || "general";
    const tone = brand.brand_voice || brand.tone_of_voice || "Friendly";
    const booking_link = messaging.booking_link || cfg.services?.ai_booking_agent?.booking_link || "";

    if (!business_name) {
      return json({ error: "install_configuration.brand.business_name is required" }, 422);
    }

    // Start with fallback templates
    let templates = buildFallbackTemplates(business_name, industry, booking_link);
    let aiGenerated = false;

    // #413a: Use InvokeLLM for AI-personalized templates
    try {
      const prompt = `Generate personalized AI automation message templates for a ${industry} business called "${business_name}".
Tone: ${tone}. Booking/contact link: ${booking_link || "not provided yet"}.

Rules:
- All SMS templates MUST be under 155 characters (leaving room for opt-out)
- End every SMS with "— Reply STOP to opt out."
- Be warm, professional, and industry-specific
- Mention the business name naturally

Return ONLY valid JSON with these exact keys:
{
  "instant_lead_sms": "(under 155 chars, warm greeting, mention ${business_name}, invite them to book)",
  "missed_call_sms": "(under 155 chars, apologize for missing call, invite to text back or book)",
  "review_request_sms": "(under 155 chars, thank them, ask for Google review, use [REVIEW_LINK] placeholder)",
  "appointment_reminder_sms": "(under 155 chars, confirm appointment, offer CONFIRM or CANCEL reply)",
  "nurture_day1_subject": "(compelling email subject line for Day 1 follow-up)",
  "nurture_day1_body": "(3-4 sentence nurture email body, warm and helpful)"
}`;

      const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            instant_lead_sms: { type: "string" },
            missed_call_sms: { type: "string" },
            review_request_sms: { type: "string" },
            appointment_reminder_sms: { type: "string" },
            nurture_day1_subject: { type: "string" },
            nurture_day1_body: { type: "string" },
          },
        },
      });

      if (aiResult && aiResult.instant_lead_sms) {
        // #413b: Enforce 160-char limit on all SMS
        templates = {
          instant_lead_sms: truncateSms(aiResult.instant_lead_sms),
          missed_call_sms: truncateSms(aiResult.missed_call_sms || templates.missed_call_sms),
          review_request_sms: truncateSms(aiResult.review_request_sms || templates.review_request_sms),
          appointment_reminder_sms: truncateSms(aiResult.appointment_reminder_sms || templates.appointment_reminder_sms),
          nurture_day1_email: {
            subject: aiResult.nurture_day1_subject || templates.nurture_day1_email.subject,
            body: aiResult.nurture_day1_body || templates.nurture_day1_email.body,
          },
        };
        aiGenerated = true;
        console.log(`[generateServiceTemplates] AI templates generated for ${business_name}`);
      }
    } catch (aiErr) {
      console.warn("[generateServiceTemplates] InvokeLLM failed, using fallback:", aiErr.message);
    }

    // #413c: Final validation — ensure no SMS exceeds 160 chars
    const smsFields = ["instant_lead_sms", "missed_call_sms", "review_request_sms", "appointment_reminder_sms"];
    for (const field of smsFields) {
      if (templates[field] && templates[field].length > 160) {
        console.warn(`[generateServiceTemplates] ${field} too long (${templates[field].length} chars), truncating`);
        templates[field] = truncateSms(templates[field]);
      }
    }

    // Write templates back into install_configuration
    const updated_cfg = {
      ...cfg,
      generated_templates: {
        ...templates,
        generated_at: new Date().toISOString(),
        tone_used: tone,
        industry_used: industry,
        ai_generated: aiGenerated,
      },
    };

    await base44.asServiceRole.entities.Order.update(order_id, { install_configuration: updated_cfg });

    console.log(`[generateServiceTemplates] Done for order ${order_id} — industry: ${industry}, tone: ${tone}, ai: ${aiGenerated}`);

    return json({ success: true, order_id, templates, tone_used: tone, industry_used: industry, ai_generated: aiGenerated });
  } catch (err) {
    console.error("[generateServiceTemplates] Error:", err.message);
    return json({ error: err.message }, 500);
  }
});