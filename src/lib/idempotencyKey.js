/**
 * Idempotency key management for Stripe and webhook operations
 * Prevents duplicate fulfillment on retries
 * Uses stripe_event_id or stripe_transaction_id as key
 */

import { base44 } from "@/api/base44Client";

export function generateIdempotencyKey(sourceId, eventType) {
  // Format: {source}_{eventType}_{timestamp}
  const timestamp = Date.now();
  return `${sourceId}_${eventType}_${timestamp}`;
}

export function extractStripeEventId(event) {
  // Stripe event structure: { id: "evt_...", type: "...", ... }
  return event?.id || event?.stripe_event_id || null;
}

export function validateIdempotencyKey(key) {
  // Check if key follows our format or is a standard UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const stripeEventRegex = /^evt_[a-zA-Z0-9]{24,}$/;
  
  return uuidRegex.test(key) || stripeEventRegex.test(key);
}

export async function checkIdempotencyRecord(key, entity = "StripeEvent") {
  // Returns true if this idempotency key has already been processed
  try {
    const records = await base44.entities[entity].filter(
      { idempotency_key: key },
      null,
      1
    );
    return records && records.length > 0;
  } catch (e) {
    console.error(`Failed to check idempotency for ${key}:`, e);
    return false;
  }
}

export async function saveIdempotencyRecord(key, data = {}, entity = "StripeEvent") {
  // Save idempotency record to prevent duplicate processing
  try {
    await base44.entities[entity].create({
      idempotency_key: key,
      processed_at: new Date().toISOString(),
      data,
    });
  } catch (e) {
    console.error(`Failed to save idempotency record:`, e);
  }
}