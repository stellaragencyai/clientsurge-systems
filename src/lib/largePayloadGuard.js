/**
 * Task 14 — Large payload queue guard
 * Flags events exceeding 50KB for special processing
 */

const MAX_PAYLOAD_BYTES = 50 * 1024; // 50KB

export function getPayloadSize(obj) {
  try {
    return new TextEncoder().encode(JSON.stringify(obj)).length;
  } catch {
    return 0;
  }
}

export function isLargePayload(obj) {
  return getPayloadSize(obj) > MAX_PAYLOAD_BYTES;
}

export function buildPayloadSafeEvent(obj) {
  if (!isLargePayload(obj)) return { data: obj, payload_too_large: false };
  // Strip message body / large text fields
  const safe = { ...obj };
  if (safe.message_body) safe.message_body = '[truncated — payload_too_large]';
  if (safe.metadata_json) safe.metadata_json = null;
  return { data: safe, payload_too_large: true };
}