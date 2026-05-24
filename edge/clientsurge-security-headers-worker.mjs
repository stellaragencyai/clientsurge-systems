const CANONICAL_HOST = "clientsurgesystems.com";
const CANONICAL_ORIGIN = `https://${CANONICAL_HOST}`;

export const SECURITY_HEADERS = Object.freeze({
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "script-src 'self' 'unsafe-inline' https://assets.calendly.com https://calendly.com https://js.stripe.com https://checkout.stripe.com https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://assets.calendly.com https://unpkg.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' https://fonts.gstatic.com data:",
    "connect-src 'self' https://fonts.googleapis.com https://*.base44.app https://api.base44.com https://api.stripe.com https://checkout.stripe.com https://api.resend.com https://api.twilio.com https://api.openai.com https://api.elevenlabs.io https://api.github.com https://api.telegram.org https://www.google-analytics.com https://*.google-analytics.com https://stats.g.doubleclick.net https://pagead2.googlesyndication.com",
    "frame-src 'self' https://calendly.com https://assets.calendly.com https://js.stripe.com https://checkout.stripe.com https://www.youtube.com",
    "worker-src 'self' blob:",
    "form-action 'self' https://checkout.stripe.com",
  ].join("; "),
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": 'camera=(), microphone=(), geolocation=(), payment=(self "https://checkout.stripe.com"), usb=(), bluetooth=(), interest-cohort=()',
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
});

const SENSITIVE_PATH_PATTERNS = [
  /^\/admin(?:\/|$)/,
  /^\/client-portal(?:\/|$)/,
  /^\/client-dashboard(?:\/|$)/,
  /^\/onboarding(?:\/|$)/,
  /^\/login(?:\/|$)/,
  /^\/setup(?:\/|$)/,
  /^\/motion-lab(?:\/|$)/,
  /^\/order-success(?:\/|$)/,
  /^\/thank-you(?:\/|$)/,
];

export function isSensitivePath(pathname) {
  return SENSITIVE_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
}

export function decorateHeaders(headers, pathname) {
  const nextHeaders = new Headers(headers);

  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    nextHeaders.set(name, value);
  }

  if (isSensitivePath(pathname)) {
    nextHeaders.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    nextHeaders.set("Cache-Control", "no-store");
  }

  return nextHeaders;
}

export async function handleRequest(request) {
  const url = new URL(request.url);

  if (url.hostname === `www.${CANONICAL_HOST}` || url.protocol === "http:") {
    url.hostname = CANONICAL_HOST;
    url.protocol = "https:";
    return Response.redirect(url.toString(), 301);
  }

  const response = await fetch(request);
  const headers = decorateHeaders(response.headers, url.pathname);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  fetch: handleRequest,
};
