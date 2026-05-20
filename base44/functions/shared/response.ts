/**
 * response.ts — #124
 * Consistent okJson() and errJson() helpers for all backend functions.
 */
export function okJson(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify({ success: true, ...data }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Frame-Options": "DENY",          // #93
      "Cache-Control": "no-store",
    },
  });
}

export function errJson(message: string, status = 500, extra: Record<string, unknown> = {}): Response {
  return new Response(JSON.stringify({ success: false, error: message, ...extra }), {
    status,
    headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
  });
}

// #153: cacheable read-only response
export function cachedJson(data: Record<string, unknown>, maxAge = 60): Response {
  return new Response(JSON.stringify({ success: true, ...data }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${maxAge}`,
      "X-Frame-Options": "DENY",
    },
  });
}
