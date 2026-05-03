/**
 * Shared response helpers for consistent JSON responses across all functions.
 */

export function okJson(data, status = 200) {
  return Response.json(data, { status });
}

export function errJson(message, status = 400, extra = {}) {
  return Response.json({ error: message, ...extra }, { status });
}