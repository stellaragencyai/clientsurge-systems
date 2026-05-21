import { secureJson } from "../response.ts";
/**
 * Shared response helpers for consistent JSON responses across all functions.
 */

export function okJson(data: Record<string, unknown> = {}, status = 200): Response {
  return secureJson(data, { status });
}

export function errJson(
  message: string,
  status = 400,
  extra: Record<string, unknown> = {}
): Response {
  return secureJson({ error: message, ...extra }, { status });
}
