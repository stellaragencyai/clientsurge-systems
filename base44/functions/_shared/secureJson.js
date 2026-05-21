const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "X-Frame-Options": "DENY",
};

export function secureJson(data = {}, init = {}) {
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
