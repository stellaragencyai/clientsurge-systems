// Task #21: Idempotency key tracking for SMS/email sends
const idempotencyCache = new Map();

export function generateIdempotencyKey(lead_id, action, timestamp) {
  return `${lead_id}-${action}-${timestamp}`.toLowerCase();
}

export function isRequestIdempotent(key, maxAgeMs = 3600000) {
  if (!idempotencyCache.has(key)) {
    idempotencyCache.set(key, Date.now());
    return { isDuplicate: false, shouldProcess: true };
  }

  const savedTime = idempotencyCache.get(key);
  const age = Date.now() - savedTime;

  if (age > maxAgeMs) {
    idempotencyCache.delete(key);
    idempotencyCache.set(key, Date.now());
    return { isDuplicate: false, shouldProcess: true };
  }

  return { isDuplicate: true, shouldProcess: false };
}

export function clearIdempotencyKey(key) {
  idempotencyCache.delete(key);
}