/**
 * Shared alert trigger helper
 * Call from webhook handlers to create alerts non-blocking
 * Usage: triggerAlert(base44, { trigger_type, lead_id, phone_number, intent, message })
 */
export async function triggerAlert(base44, payload) {
  try {
    // Fire async, don't await - this ensures webhooks respond fast
    base44.functions.invoke("alertTrigger", payload).catch((err) => {
      console.error("[alertSystem] Alert trigger failed (async):", err);
    });
  } catch (err) {
    console.error("[alertSystem] Alert invocation error:", err);
    // Fail silently - don't break webhook
  }
}

/**
 * Check if a message contains high-intent keywords
 */
export function isHighIntent(message, intent) {
  if (!message) return false;
  const lowerMsg = message.toLowerCase();
  const keywords = ["book", "booking", "urgent", "asap", "now", "today", "price", "pricing"];
  const hasKeyword = keywords.some((kw) => lowerMsg.includes(kw));
  const isBooking = intent === "booking";
  return hasKeyword || isBooking;
}