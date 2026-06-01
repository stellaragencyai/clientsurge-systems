const CANONICAL_ORIGIN = "https://clientsurgesystems.com";
const CANONICAL_HOST = "clientsurgesystems.com";
const ALTERNATE_HOST = "www.clientsurgesystems.com";

export const SECURITY_TXT = `Contact: mailto:system@clientsurgesystems.com
Preferred-Languages: en
Canonical: https://clientsurgesystems.com/.well-known/security.txt
Policy: https://clientsurgesystems.com/privacy-policy
Expires: 2027-06-01T00:00:00Z
`;

export const GLOBAL_SECURITY_HEADERS = {
  "Content-Security-Policy": [
    "default-src 'self' https: data: blob:",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:",
    "style-src 'self' 'unsafe-inline' https:",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "connect-src 'self' https: wss:",
    "frame-src https://calendly.com https://assets.calendly.com https://base44.app https://*.base44.app https://base44.com https://*.base44.com",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors https://base44.app https://*.base44.app https://base44.com https://*.base44.com 'self'",
  ].join("; "),
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), usb=(), bluetooth=()",
  "Cross-Origin-Opener-Policy": "same-origin",
};

export const SENSITIVE_HEADERS = {
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Cache-Control": "no-store",
};

export function isSensitivePath(pathname) {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/onboarding" ||
    pathname === "/motion-lab" ||
    pathname === "/client-portal" ||
    pathname === "/setup/preview" ||
    pathname.startsWith("/setup/preview/")
  );
}

export function applySecurityHeaders(headers, pathname) {
  for (const [name, value] of Object.entries(GLOBAL_SECURITY_HEADERS)) {
    headers.set(name, value);
  }

  if (isSensitivePath(pathname)) {
    for (const [name, value] of Object.entries(SENSITIVE_HEADERS)) {
      headers.set(name, value);
    }
  }

  return headers;
}

function canonicalRedirect(url) {
  const target = new URL(url.toString());
  target.protocol = "https:";
  target.hostname = CANONICAL_HOST;
  return Response.redirect(target.toString(), 301);
}

function securityTxtResponse() {
  const headers = applySecurityHeaders(new Headers({
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "public, max-age=3600",
  }), "/.well-known/security.txt");
  return new Response(SECURITY_TXT, { status: 200, headers });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.protocol === "http:" || url.hostname === ALTERNATE_HOST) {
      return canonicalRedirect(url);
    }

    if (url.pathname === "/.well-known/security.txt") {
      return securityTxtResponse();
    }

    const originResponse = await fetch(request);
    const headers = applySecurityHeaders(new Headers(originResponse.headers), url.pathname);

    return new Response(originResponse.body, {
      status: originResponse.status,
      statusText: originResponse.statusText,
      headers,
    });
  },
};
