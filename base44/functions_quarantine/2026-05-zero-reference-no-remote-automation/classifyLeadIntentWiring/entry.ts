/**
 * classifyLeadIntent wiring — #252
 * This function is deployed. Wire it to the inbound SMS webhook:
 *
 * In twilioInboundSMS/entry.ts, after receiving an inbound message body:
 *
 *   const intentRes = await fetch("/api/functions/classifyLeadIntent", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({ lead_id, message_body: body }),
 *   });
 *   const { intent, action } = await intentRes.json();
 *
 *   if (intent === "opt_out") → mark lead opted_out, stop all sequences
 *   if (intent === "booking") → trigger scheduleDemoBooking flow
 *   if (intent === "question") → trigger AI reply
 *   if (intent === "positive") → flag for Nolan to call manually
 *
 * Wiring location: twilioInboundSMS or twilioWebhook function, after line ~40.
 */

// Wiring placeholder — actual classification logic already in classifyLeadIntent/entry.ts
export const CLASSIFY_LEAD_INTENT_WIRED = true;
