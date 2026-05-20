export function isWebhookErrorEvent(event = {}) {
  if (event.status !== "failed") {
    return false;
  }

  const eventType = String(event.event_type || "").toLowerCase();
  const channel = String(event.channel || "").toLowerCase();
  const contextType = String(event.context_type || "").toLowerCase();

  return (
    channel === "webhook" ||
    eventType.includes("webhook") ||
    contextType.includes("webhook")
  );
}

export function countWebhookErrorEvents(events = []) {
  return events.filter(isWebhookErrorEvent).length;
}
