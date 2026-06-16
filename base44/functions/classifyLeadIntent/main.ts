/**
 * classifyLeadIntent — self-contained (no _shared imports)
 * Uses OpenAI to classify intent from an inbound message.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
  });
}

const INTENT_VALUES = ["question", "pricing_interest", "availability_interest", "booking_ready", "unsure", "not_interested", "stop", "other"];

async function classifyWithAI(messageText, lead) {
  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openAiKey) {
    console.warn("[classifyLeadIntent] OPENAI_API_KEY not set — using keyword fallback");
    return keywordFallback(messageText);
  }

  const leadContext = lead
    ? `Lead context: Business=${lead.business_name || "unknown"}, Type=${lead.business_type || "unknown"}, Status=${lead.status || "unknown"}`
    : "";

  const prompt = `You are an intent classifier for a marketing automation system. Classify the customer message below into exactly one of these intents:\n${INTENT_VALUES.join(", ")}\n\n${leadContext}\n\nMessage: "${messageText}"\n\nRespond with a JSON object: { "intent": "<one of the values above>", "confidence": <0.0-1.0>, "reasoning": "<one sentence>" }`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${openAiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    console.error(`[classifyLeadIntent] OpenAI error ${res.status}`);
    return keywordFallback(messageText);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  const parsed = JSON.parse(content || "{}");

  const intent = INTENT_VALUES.includes(parsed.intent) ? parsed.intent : "other";
  return { canonical_intent: intent, confidence: parsed.confidence || 0.5, reasoning: parsed.reasoning || "" };
}

function keywordFallback(messageText) {
  const lower = messageText.toLowerCase();
  if (/stop|unsubscribe|opt.?out|remove me/i.test(lower)) return { canonical_intent: "stop", confidence: 0.95, reasoning: "Opt-out keyword detected" };
  if (/not interested|no thanks|leave me alone/i.test(lower)) return { canonical_intent: "not_interested", confidence: 0.85, reasoning: "Disinterest keyword detected" };
  if (/book|schedule|appointment|when can|available|set up/i.test(lower)) return { canonical_intent: "booking_ready", confidence: 0.8, reasoning: "Booking keyword detected" };
  if (/price|cost|how much|pricing|quote|fee/i.test(lower)) return { canonical_intent: "pricing_interest", confidence: 0.8, reasoning: "Pricing keyword detected" };
  if (/\?|how|what|when|where|who|explain|tell me/i.test(lower)) return { canonical_intent: "question", confidence: 0.7, reasoning: "Question pattern detected" };
  return { canonical_intent: "other", confidence: 0.4, reasoning: "No clear intent pattern" };
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));

    const { lead_id, lead, message_text, messageText, message_body, inbound_message } = payload;
    const messageTextValue = message_text || messageText || message_body || inbound_message;

    if (!messageTextValue) return json({ error: "message_text or message_body required" }, 400);

    let leadRecord = lead || null;
    if (!leadRecord && lead_id) {
      const leads = await base44.asServiceRole.entities.Leads.filter({ id: lead_id }, "-created_date", 1).catch(() => []);
      leadRecord = leads?.[0] || null;
    }

    const result = await classifyWithAI(messageTextValue, leadRecord);

    if (lead_id && leadRecord) {
      await base44.asServiceRole.entities.Leads.update(lead_id, {
        ai_intent: result.canonical_intent,
        ai_last_classification: String(messageTextValue).slice(0, 200),
        ai_confidence: result.confidence || 0,
      }).catch(() => null);
    }

    console.log(`[classifyLeadIntent] intent=${result.canonical_intent} confidence=${result.confidence} lead=${lead_id || "none"}`);
    return json({ success: true, lead_id: lead_id || leadRecord?.id || null, ...result });
  } catch (error) {
    console.error("[classifyLeadIntent] error:", error.message);
    return json({ error: error.message, success: false }, 500);
  }
});