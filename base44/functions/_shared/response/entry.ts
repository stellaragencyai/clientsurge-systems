/**
 * Shared response helpers for consistent JSON responses across all functions.
 * Defines secureJson (canonical), okJson, and errJson.
 */

export function secureJson(data: Record<string, unknown> = {}, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...(init.headers || {}),
    },
  });
}

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

// Minimal handler so this utility file is deployable and importable by other functions
Deno.serve(() => new Response("OK", { status: 200 }));