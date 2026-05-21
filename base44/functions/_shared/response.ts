const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "X-Frame-Options": "DENY",
};

export function okJson(data: Record<string, unknown> = {}, status = 200): Response {
  return new Response(JSON.stringify({ success: true, ...data }), {
    status,
    headers: JSON_HEADERS,
  });
}

export function errJson(message: string, status = 500, extra: Record<string, unknown> = {}): Response {
  return new Response(JSON.stringify({ success: false, error: message, ...extra }), {
    status,
    headers: JSON_HEADERS,
  });
}

export function cachedJson(data: Record<string, unknown> = {}, maxAge = 60): Response {
  return new Response(JSON.stringify({ success: true, ...data }), {
    status: 200,
    headers: {
      ...JSON_HEADERS,
      "Cache-Control": `public, max-age=${maxAge}`,
    },
  });
}
