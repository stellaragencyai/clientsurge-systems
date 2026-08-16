# Pre-launch beta hardening

## Required state

`beta.clientsurgesystems.com` is a non-production preview hostname and must never be indexed as a canonical public surface.

## Controls

1. On any hostname other than `clientsurgesystems.com` or `www.clientsurgesystems.com`, set `robots` to `noindex,nofollow,noarchive` at runtime before rendering public content.
2. Keep canonical URLs pointed at the production root host, never the beta hostname.
3. Exclude beta URLs from every sitemap.
4. Protect `beta.clientsurgesystems.com` with Cloudflare Access or an equivalent authenticated gate before launch.
5. Do not cache authenticated beta responses at the CDN edge.
6. Verify `/robots.txt`, page-level robots metadata, canonical tags, and unauthenticated access before each release.

## Verification

- `curl -s https://beta.clientsurgesystems.com | grep -i robots` should not expose an indexable beta document.
- Browser inspection on beta should show `noindex,nofollow,noarchive`.
- Production root should remain indexable according to launch policy.
- Search-engine sitemaps must contain only production-host URLs.

This file documents the required control because the beta Base44 app is owned by a separate Base44 account and cannot be modified through the currently authenticated Base44 connector.
