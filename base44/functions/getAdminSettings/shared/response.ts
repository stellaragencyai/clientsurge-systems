const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "X-Frame-Options": "DENY",
};

export function secureJson(data: Record<string, unknown> = {}, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      ...JSON_HEADERS,
      ...(init.headers || {}),
      "Content-Type": "application/json",
      "X-Frame-Options": "DENY",
    },
  });
}

export function okJson(data: Record<string, unknown> = {}, status = 200): Response {
  return secureJson({ success: true, ...data }, { status });
}

export function errJson(message: string, status = 500, extra: Record<string, unknown> = {}): Response {
  return secureJson({ success: false, error: message, ...extra }, { status });
}

export function cachedJson(data: Record<string, unknown> = {}, maxAge = 60): Response {
  return secureJson({ success: true, ...data }, {
    status: 200,
    headers: {
      "Cache-Control": `public, max-age=${maxAge}`,
    },
  });
}
