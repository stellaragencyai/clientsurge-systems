import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import {
  buildSocialStarterPdfBase64,
  buildSocialStarterPrompt,
  normalizeSocialStarterCaptions,
} from "../_shared/socialStarterPack.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const { order_id } = await req.json().catch(() => ({}));
    if (!order_id) return Response.json({ error: "order_id required" }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

    const brand = order.install_configuration?.brand || {};
    const businessName = order.business_name || brand.business_name || order.customer_name || "Client";
    const industry = order.industry || brand.industry || order.items?.[0]?.service_key?.replace(/_/g, " ") || "local service";
    const tone = brand.tone_of_voice || "friendly, confident, helpful";

    const generated = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: buildSocialStarterPrompt({ businessName, industry, tone }),
      response_json_schema: { type: "object" },
      model: "claude_sonnet_4_6",
    });
    const captions = normalizeSocialStarterCaptions(generated?.captions || []);
    const title = `${businessName} Social Starter Pack`;
    const fileBase64 = buildSocialStarterPdfBase64({ title, captions });

    const packLog = await base44.asServiceRole.entities.SocialContentLog.create({
      order_id,
      client_email: order.customer_email || order.client_email || "",
      industry,
      content_type: "social_starter_pack",
      platform: "Portal PDF",
      title,
      body: captions.map((caption) => `${caption.index}. ${caption.hook}\n${caption.body}`).join("\n\n"),
      hashtags: [...new Set(captions.flatMap((caption) => caption.hashtags || []))],
      status: "draft",
      topic: "Elite Social Starter Pack",
      word_count: captions.reduce((sum, caption) => sum + caption.body.split(/\s+/).filter(Boolean).length, 0),
      generated_by: user.email,
      file_base64: fileBase64,
      file_mime_type: "application/pdf",
    });

    await Promise.all(captions.map((caption) =>
      base44.asServiceRole.entities.SocialContentLog.create({
        order_id,
        client_email: order.customer_email || order.client_email || "",
        industry,
        content_type: caption.platform === "facebook" ? "facebook" : "instagram",
        platform: caption.platform,
        caption_category: caption.category,
        title: caption.hook,
        body: caption.body,
        hashtags: caption.hashtags,
        status: "draft",
        topic: "Elite Social Starter Pack",
        generated_by: user.email,
      }).catch(() => null)
    ));

    await base44.asServiceRole.entities.CommunicationEvent.create({
      order_id,
      client_project_id: order.client_project_id || null,
      channel: "internal",
      direction: "system",
      event_type: "ai_generated",
      provider: "internal",
      status: "processed",
      subject: "Elite social starter pack generated",
      metadata_json: JSON.stringify({
        social_content_log_id: packLog.id,
        caption_count: captions.length,
        file_mime_type: "application/pdf",
      }),
    }).catch(() => {});

    return Response.json({ success: true, order_id, social_content_log_id: packLog.id, caption_count: captions.length });
  } catch (error) {
    console.error("[generateSocialStarterPack]", error);
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
});
