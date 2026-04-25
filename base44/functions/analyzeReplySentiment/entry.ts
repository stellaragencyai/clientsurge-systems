/**
 * analyzeReplySentiment — AI sentiment analysis for inbound lead replies.
 *
 * Triggered by entity automation when a new inbound Message is created,
 * OR called directly with { lead_id, message_text }.
 *
 * Uses InvokeLLM to classify the message as Positive / Neutral / Negative
 * and saves the result + reason to the Leads record.
 *
 * Automation payload: { event: { entity_id }, data: { lead_id, message_text, direction } }
 * Direct payload:     { lead_id, message_text }
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const isAutomationPayload = !!(body?.event?.entity_id || body?.data?.id);

    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (user && user.role !== "admin") {
      return Response.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }
    if (!user && !isAutomationPayload) {
      return Response.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    // Support automation payload (Messages entity) and direct call
    const messageData = body?.data ?? {};
    const leadId = body?.lead_id ?? messageData?.lead_id ?? null;
    const messageText = body?.message_text ?? messageData?.message_text ?? null;
    const direction = messageData?.direction ?? "inbound";

    if (!leadId) {
      return Response.json({ error: "lead_id is required" }, { status: 400 });
    }

    // Only process inbound messages
    if (direction !== "inbound") {
      return Response.json({ success: true, skipped: true, reason: "Outbound message — skipping sentiment analysis" });
    }

    // Load the lead
    const lead = await base44.asServiceRole.entities.Leads.get(leadId);
    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    // If no message text provided, fetch the latest inbound message for this lead
    let textToAnalyze = messageText;
    if (!textToAnalyze) {
      const messages = await base44.asServiceRole.entities.Messages.filter(
        { lead_id: leadId, direction: "inbound" },
        "-created_date",
        1
      );
      textToAnalyze = messages?.[0]?.message_text ?? null;
    }

    if (!textToAnalyze) {
      return Response.json({ success: true, skipped: true, reason: "No inbound message text to analyze" });
    }

    // Call LLM for sentiment analysis
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a sales CRM sentiment classifier. Analyze the following inbound message from a lead and classify their sentiment.

Lead context:
- Business: ${lead.business_name || "Unknown"}
- Problem they mentioned: ${lead.problem || "Unknown"}

Inbound message:
"${textToAnalyze}"

Classify the sentiment as exactly one of: Positive, Neutral, or Negative.

Rules:
- Positive: The lead sounds interested, enthusiastic, asking to move forward, asking questions about next steps, or expressing appreciation.
- Negative: The lead sounds frustrated, uninterested, skeptical, dismissive, or wants to opt out.
- Neutral: The lead is asking a factual question, giving a vague response, or their tone is unclear.

Respond ONLY with valid JSON in this exact format:
{
  "sentiment": "Positive" | "Neutral" | "Negative",
  "reason": "one sentence explaining why"
}`,
      response_json_schema: {
        type: "object",
        properties: {
          sentiment: { type: "string" },
          reason: { type: "string" }
        }
      }
    });

    const sentiment = result?.sentiment ?? null;
    const reason = result?.reason ?? "";

    // Validate the result
    const validSentiments = ["Positive", "Neutral", "Negative"];
    const finalSentiment = validSentiments.includes(sentiment) ? sentiment : (lead.reply_sentiment || "Unknown");

    // Save to lead record
    await base44.asServiceRole.entities.Leads.update(leadId, {
      reply_sentiment: finalSentiment,
      reply_sentiment_reason: reason,
      reply_sentiment_analyzed_at: new Date().toISOString(),
    });

    // Log CommunicationEvent
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: leadId,
      channel: "internal",
      direction: "system",
      event_type: "status_update",
      provider: "internal",
      status: "processed",
      subject: `AI Sentiment: ${finalSentiment}`,
      message_body: `Reply sentiment analyzed as "${finalSentiment}". Reason: ${reason}. Message analyzed: "${textToAnalyze.slice(0, 120)}${textToAnalyze.length > 120 ? "…" : ""}"`,
    });

    console.log(`analyzeReplySentiment: Lead ${leadId} → ${finalSentiment} (${reason})`);

    return Response.json({
      success: true,
      lead_id: leadId,
      sentiment: finalSentiment,
      reason,
    });

  } catch (error) {
    console.error("analyzeReplySentiment error:", error);
    return Response.json({ error: error.message || "Sentiment analysis failed" }, { status: 500 });
  }
});
