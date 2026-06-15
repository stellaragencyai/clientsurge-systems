/**
 * Task 15 — Consistent metadata_json parsing
 * Prevents "[object Object]" display in logs
 */

export function parseMetadata(json) {
  if (!json) return {};
  if (typeof json === 'object') return json;
  try { return JSON.parse(json); } catch { return { _raw: json }; }
}

export function safeStringify(obj) {
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
}

Deno.serve(() => new Response('shared module', { status: 200 }));