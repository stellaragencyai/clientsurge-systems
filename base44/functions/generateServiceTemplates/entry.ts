/**
 * generateServiceTemplates — #413
 * AI personalization layer for ClientSurge service activation.
 *
 * Reads industry + business_name + tone_of_voice from Order.install_configuration.
 * Generates personalized: instant SMS, missed call SMS, nurture Day 1 email,
 * review request SMS. Writes generated templates back to install_configuration.
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const TONE_MAP = {
  Professional: { greeting: "Hello", sign_off: "Best regards" },
  Friendly:     { greeting: "Hey there", sign_off: "Talk soon" },
  Luxury:       { greeting: "Good day", sign_off: "With warm regards" },
  Casual:       { greeting: "Hey", sign_off: "Cheers" },
  Energetic:    { greeting: "Hi", sign_off: "Let's go" },
};

function buildTemplates(business_name: string, industry: string, tone: string, booking_link: string) {
  const t = TONE_MAP[tone] || TONE_MAP["Friendly"];
  const biz = business_name || "our business";
  const book = booking_link || "our booking page";

  return {
    instant_lead_sms: `${t.greeting}! Thanks for reaching out to ${biz}. We received your inquiry and will be in touch within minutes. Book directly here: ${book} — ${t.sign_off}, ${biz} Team`,

    missed_call_sms: `Hi! You just called ${biz} and we missed you — sorry about that! Reply here or book online: ${book}. We'll get back to you ASAP. — ${biz}`,

    nurture_day1_email: {
      subject: `Your inquiry to ${biz} — here's what happens next`,
      body: `${t.greeting},\n\nThank you for reaching out to ${biz}. We specialize in ${industry} services and we'd love to help.\n\nHere's what to expect:\n• We'll review your inquiry within 1 business day\n• A team member will reach out to discuss your needs\n• We'll get you scheduled at a time that works for you\n\nIn the meantime, feel free to book directly: ${book}\n\n${t.sign_off},\nThe ${biz} Team`,
    },

    review_request_sms: `Hi! It was great working with you at ${biz}. If you had a positive experience, we'd really appreciate a quick Google review — it helps us a ton: [REVIEW_LINK]. Thank you! — ${biz}`,

    appointment_reminder_sms: `Reminder: You have an upcoming appointment with ${biz}. Reply CONFIRM to confirm or CANCEL to cancel. Book/reschedule: ${book}`,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id } = await req.json();

    if (!order_id) return Response.json({ error: "order_id required" }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

    const cfg = order.install_configuration || {};
    const brand = cfg.brand || {};
    const messaging = cfg.messaging || {};

    const business_name = brand.business_name || order.business_name || "";
    const industry      = brand.industry || order.industry || "your industry";
    const tone          = brand.brand_voice || "Friendly";
    const booking_link  = messaging.booking_link || "";

    if (!business_name) {
      return Response.json({ error: "install_configuration.brand.business_name is required" }, { status: 422 });
    }

    const templates = buildTemplates(business_name, industry, tone, booking_link);

    // Write templates back into install_configuration
    const updated_cfg = {
      ...cfg,
      generated_templates: {
        ...templates,
        generated_at: new Date().toISOString(),
        tone_used: tone,
        industry_used: industry,
      },
    };

    await base44.asServiceRole.entities.Order.update(order_id, {
      install_configuration: updated_cfg,
    });

    console.log(`[generateServiceTemplates] Templates generated for order ${order_id} — tone: ${tone}, industry: ${industry}`);

    return Response.json({
      success: true,
      order_id,
      templates,
      tone_used: tone,
      industry_used: industry,
    });
  } catch (err) {
    console.error("[generateServiceTemplates] Error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});
