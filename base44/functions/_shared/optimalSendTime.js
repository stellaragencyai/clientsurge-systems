export const DEFAULT_OPTIMAL_SEND_HOUR = 10;

function toHour(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getUTCHours();
}

function isReplyEvent(event) {
  const direction = String(event?.direction || "").toLowerCase();
  const eventType = String(event?.event_type || "").toLowerCase();
  const status = String(event?.status || "").toLowerCase();
  return direction === "inbound" || eventType.includes("received") || status === "received";
}

export function predictOptimalSendHour(events = [], options = {}) {
  const fallbackHour = Number.isInteger(options.fallbackHour)
    ? options.fallbackHour
    : DEFAULT_OPTIMAL_SEND_HOUR;
  const minSamples = Number.isInteger(options.minSamples) ? options.minSamples : 3;
  const buckets = Array.from({ length: 24 }, () => 0);
  let samples = 0;

  for (const event of events) {
    if (!isReplyEvent(event)) continue;
    const hour = toHour(event.last_engagement_at || event.created_date || event.timestamp);
    if (hour === null) continue;
    buckets[hour] += 1;
    samples += 1;
  }

  if (samples < minSamples) {
    return {
      optimal_send_hour: fallbackHour,
      confidence: "fallback",
      sample_count: samples,
      hourly_reply_counts: buckets,
    };
  }

  let bestHour = fallbackHour;
  let bestCount = -1;
  for (let hour = 0; hour < buckets.length; hour += 1) {
    if (buckets[hour] > bestCount) {
      bestHour = hour;
      bestCount = buckets[hour];
    }
  }

  return {
    optimal_send_hour: bestHour,
    confidence: bestCount >= 5 ? "high" : "medium",
    sample_count: samples,
    hourly_reply_counts: buckets,
  };
}

export function buildOptimalSendTimePatch(prediction, now = new Date()) {
  return {
    optimal_send_hour: prediction.optimal_send_hour,
    optimal_send_hour_confidence: prediction.confidence,
    optimal_send_hour_sample_count: prediction.sample_count,
    optimal_send_hour_updated_at: now.toISOString(),
  };
}
