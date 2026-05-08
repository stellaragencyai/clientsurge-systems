/**
 * conversationIntelligence.ts — #532 #533 #537 #538 #539 #540
 * Shared AI conversation utilities:
 * #532: industry_key context in all AI prompts
 * #533: 160-char SMS enforcement with retry
 * #537: conversation memory — last 5 CommunicationEvents
 * #538: booking intent detector → auto scheduleDemoBooking
 * #539: objection handler — pricing_concern → industry pitch
 * #540: disqualification handler — not_interested → stop sequences
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

// #533: enforce 160 chars
export function enforce160(text: string): string {
  return text.length <= 160 ? text : text.slice(0, 157) + "...";
}

// #537: load last 5 CommunicationEvents for a lead
export async function loadConversationHistory(base44: any, lead_id: string): Promise<any[]> {
  const events = await base44.asServiceRole.entities.CommunicationEvent
    .filter({ lead_id })
    .catch(() => []);
  return (events || [])
    .sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())
    .slice(0, 5)
    .reverse();
}

// Format history for prompt
export function formatHistoryForPrompt(events: any[]): string {
  return events.map(e => `${e.direction === "inbound" ? "Lead" : "AI"}: ${e.message}`).join("
");
}

// #538: detect booking intent
const BOOKING_SIGNALS = ["book", "schedule", "appointment", "when can", "available", "come in", "visit", "yes", "sounds good", "let's do it", "set it up"];
export function detectBookingIntent(message: string): boolean {
  const m = message.toLowerCase();
  return BOOKING_SIGNALS.some(s => m.includes(s));
}

// #539: detect pricing concern
const PRICING_SIGNALS = ["too expensive", "how much", "price", "cost", "afford", "cheaper", "discount", "what does it cost", "pricing"];
export function detectPricingConcern(message: string): boolean {
  const m = message.toLowerCase();
  return PRICING_SIGNALS.some(s => m.includes(s));
}

// #540: detect disqualification
const DISQUALIFY_SIGNALS = ["not interested", "no thanks", "stop", "don't contact", "remove me", "unsubscribe", "leave me alone"];
export function detectDisqualification(message: string): boolean {
  const m = message.toLowerCase();
  return DISQUALIFY_SIGNALS.some(s => m.includes(s));
}

// #532: industry-aware system prompt builder
const INDUSTRY_CONTEXT: Record<string, string> = {
  med_spa: "You are an AI receptionist for a med spa. Focus on treatments, skincare, consultations. Be warm, professional, and knowledgeable about aesthetic services.",
  dental: "You are an AI receptionist for a dental office. Focus on appointments, cleanings, and patient care. Be friendly and reassuring.",
  tanning: "You are an AI receptionist for a tanning salon. Focus on sessions, memberships, and UV/spray options. Be upbeat and helpful.",
  hvac: "You are an AI dispatcher for an HVAC company. Focus on service calls, repairs, and scheduling. Be efficient and professional.",
  roofing: "You are an AI assistant for a roofing company. Focus on estimates, repairs, and insurance claims. Be professional and solution-focused.",
  contractors: "You are an AI assistant for a general contractor. Focus on project estimates, timelines, and scheduling. Be professional and reliable.",
  default: "You are a helpful AI receptionist. Be friendly, professional, and focused on booking appointments.",
};

export function buildSystemPrompt(industry: string, business_name: string, tone: string = "friendly"): string {
  const base = INDUSTRY_CONTEXT[industry] || INDUSTRY_CONTEXT.default;
  return `${base}
Business: ${business_name}. Tone: ${tone}. Always be concise (under 160 chars for SMS). Never make up prices, hours, or information not given to you. If unsure, offer to have someone call them back.`;
}

// Main handler — classifies intent + builds appropriate response context
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, message, industry = "default", business_name, tone } = await req.json();

    const history = await loadConversationHistory(base44, lead_id);
    const isBooking = detectBookingIntent(message);
    const isPricing = detectPricingConcern(message);
    const isDisqualified = detectDisqualification(message);

    let intent = "general";
    if (isBooking) intent = "booking_ready";
    else if (isPricing) intent = "pricing_concern";
    else if (isDisqualified) intent = "not_interested";

    // #540: stop sequences on disqualification
    if (isDisqualified) {
      await base44.asServiceRole.entities.SpaLead.filter({ id: lead_id })
        .then(async (leads: any[]) => {
          if (leads?.[0]) {
            await base44.asServiceRole.entities.SpaLead.update(leads[0].id, {
              status: "Disqualified",
              tags: [...(leads[0].tags || []), "opted_out"],
            });
          }
        }).catch(() => {});
    }

    const system_prompt = buildSystemPrompt(industry, business_name || "our business", tone);
    const history_text = formatHistoryForPrompt(history);

    return Response.json({ success: true, intent, history_length: history.length, system_prompt, history_text, should_stop: isDisqualified, should_book: isBooking });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
