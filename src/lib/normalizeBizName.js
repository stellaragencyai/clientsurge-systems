/**
 * Task 4 (Data) — Normalized business name for deduplication
 * Applies consistent casing/punctuation normalization
 */

const STRIP_PATTERNS = [
  /\b(llc|ltd|inc|corp|co|company|group|the)\b\.?/gi,
  /[^a-z0-9\s]/gi,
  /\s+/g,
];

export function normalizeBusinessName(name = '') {
  if (!name || typeof name !== 'string') return '';
  let normalized = name.toLowerCase().trim();
  normalized = normalized.replace(/\b(llc|ltd|inc|corp|co\.?|company|group|the)\b/gi, '');
  normalized = normalized.replace(/[^a-z0-9\s]/g, '');
  normalized = normalized.replace(/\s+/g, ' ').trim();
  return normalized;
}

export function areSameBusinessName(a, b) {
  return normalizeBusinessName(a) === normalizeBusinessName(b);
}