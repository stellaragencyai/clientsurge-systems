/**
 * Task 15 — Service key registry audit helper
 * Validates every Order.items entry has a valid service_key
 */
import serviceKeyRegistry from '@/data/serviceKeyRegistry.json';

const VALID_KEYS = new Set(Object.keys(serviceKeyRegistry));

export function isValidServiceKey(key) {
  return VALID_KEYS.has(key);
}

export function validateOrderItems(items = []) {
  const errors = [];
  items.forEach((item, idx) => {
    if (!item.service_key) {
      errors.push(`Item[${idx}] missing service_key`);
    } else if (!isValidServiceKey(item.service_key)) {
      errors.push(`Item[${idx}] unknown service_key: ${item.service_key}`);
    }
  });
  return errors;
}

export function getAllValidServiceKeys() {
  return Array.from(VALID_KEYS);
}