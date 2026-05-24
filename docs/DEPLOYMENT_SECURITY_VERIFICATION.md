# Deployment Security Verification

Canonical production origin: `https://clientsurgesystems.com`

The repo keeps static-host rules in `public/_headers` and `public/_redirects`, but the live production response currently includes `x-render-origin-server: uvicorn`. That means the active Render/Base44 origin is not honoring Netlify/Cloudflare Pages-style `_headers` and `_redirects` files as the source of truth for response headers.

## Release Gate

Run after every production deploy:

```powershell
npm run verify:production-security
```

When using the local Base44 release helper, the script now prints this gate after the
manual Base44 Publish step:

```powershell
npm run release:base44
# click Publish in Base44, then:
npm run verify:production-security
```

If the live publish has already completed and you want the helper to run the live
gate in the same terminal session, use:

```powershell
npm run release:base44 -- -RunProductionSecurityGate
```

The gate verifies:

- `www` redirects to the apex canonical origin.
- `http://clientsurgesystems.com` redirects to HTTPS.
- public pages serve critical browser security headers.
- private SPA paths expose `X-Robots-Tag: noindex` and `Cache-Control: no-store` when the platform supports route headers.
- `robots.txt`, `sitemap.xml`, and `security.txt` reference the apex canonical origin.

## Current Platform Gap

As of the Prompt 4 verification pass, live production still returns the SPA shell for private paths and does not emit all repo-intended headers. Frontend route guards and backend function guards remain the actual access controls. `noindex` and `no-store` are defense-in-depth only.

## Prompt 5 Live Implementation Attempt

Prompt 5 confirmed the active deployment path is a Base44 app-code project served through a Render/Base44 origin. Live responses include `x-render-origin-server: uvicorn`, and this repository has no local `render.yaml`, Dockerfile, FastAPI app, ASGI middleware, or server entry point that controls the production response headers.

The authenticated Base44 CLI is available, but this app is not a CLI Backend Platform app:

```powershell
base44 site deploy -y
```

Result:

```text
Error deploying site: This endpoint is only available for Backend Platform apps
```

The Cloudflare connector was also checked for `clientsurgesystems.com`; the authenticated account currently returns zero visible zones. That means Codex cannot apply a Cloudflare Worker/ruleset for this domain from the current connector session.

Production verification after the attempted deploy still fails:

```text
Summary: 17 pass, 0 warn, 14 fail
```

Passing items:

- `www` redirects to the apex canonical origin.
- HTTP redirects to HTTPS.
- `robots.txt`, `sitemap.xml`, and `security.txt` reference the apex canonical origin.
- Existing live origin emits `X-Content-Type-Options`, `Referrer-Policy`, and HSTS.

Failing items:

- Missing live `Content-Security-Policy`.
- Missing live `X-Frame-Options`.
- Missing live `Permissions-Policy`.
- Missing live `Cross-Origin-Opener-Policy`.
- Sensitive SPA route shells lack live `X-Robots-Tag: noindex`.
- Sensitive SPA route shells lack live `Cache-Control: no-store`.

To close the gap, configure the active hosting layer, CDN, or edge Worker to emit:

- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `Cross-Origin-Opener-Policy`
- `X-Robots-Tag: noindex, nofollow, noarchive` on private/internal route shells
- `Cache-Control: no-store` on private/internal route shells

Do not mark the deployment as fully hardened until the production verifier passes against the live domain.

## Required Provider-Side Fix

One of these provider-side actions is required before `npm run verify:production-security` can pass:

1. Base44 support or Base44 UI config adds the security headers at the app-code hosting layer.
2. Render service configuration adds response headers at the origin serving the Base44 app, using the account/service that currently emits `x-render-origin-server: uvicorn`.
3. The Cloudflare account that owns `clientsurgesystems.com` adds a Worker or transform ruleset in front of the origin to inject the required headers and route-specific noindex/no-store protections.

## Cloudflare Worker Option

This repo now includes a deployable Worker for option 3:

```powershell
npx wrangler deploy --config edge/wrangler.security-headers.jsonc
npm run verify:production-security
```

The Worker is intentionally narrow. It redirects `www.clientsurgesystems.com` to the apex domain, passes normal apex traffic through to the current Base44/Render origin, injects the public security headers required by `scripts/verify-production-security.mjs`, and adds `X-Robots-Tag: noindex, nofollow, noarchive` plus `Cache-Control: no-store` on private/internal SPA paths.

Deployment still requires a Cloudflare API token or logged-in Wrangler session with access to the Cloudflare zone that owns `clientsurgesystems.com`. If Wrangler cannot see the zone, grant the token access to that account or deploy the same header rules at Base44/Render instead.

Latest local validation:

- `npx wrangler deploy --config edge/wrangler.security-headers.jsonc --dry-run` succeeds.
- A real deploy attempt from this desktop session is blocked because Wrangler requires `CLOUDFLARE_API_TOKEN` in this non-interactive environment.
- `npm run verify:production-security` still fails against live production until the Worker/header rules are actually deployed at the provider layer.

After any provider change, rerun:

```powershell
npm run verify:production-security
```

The release should remain blocked until the command exits `0`.
