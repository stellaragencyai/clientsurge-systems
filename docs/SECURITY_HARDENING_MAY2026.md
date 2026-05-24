# ClientSurge Website Security Hardening - May 21, 2026

Scope: passive white-hat review of `https://clientsurgesystems.com` plus local code hardening. The canonical public host is now `https://clientsurgesystems.com`. The typo domain `https://clientsurgeystems.com` did not resolve during this check.

## Passive Before Check

Live response headers already had:
- `Strict-Transport-Security: max-age=31536000`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

Not observed in the live header check:
- HTTP `Content-Security-Policy`
- `Permissions-Policy`
- `X-Frame-Options`
- `Cross-Origin-Opener-Policy`
- `X-Robots-Tag` on private SPA routes

No destructive, credentialed, brute-force, fuzzing, or exploit traffic was used.

## 10 Findings And Immediate Enhancements

| # | Security flaw or exposure | Immediate enhancement incorporated | Evidence after fix |
|---|---|---|---|
| 1 | CSP allowed broad HTTPS script sources, increasing supply-chain/XSS blast radius. | Tightened CSP in `index.html` and deploy headers to named script/connect/frame/style origins. | `tests/securityHeaders.test.js` asserts no arbitrary `https:` in `script-src`. |
| 2 | Clickjacking protection depended only on browser defaults. | Added `frame-ancestors 'self'` plus `X-Frame-Options: SAMEORIGIN`. | `public/_headers`; CSP test coverage. |
| 3 | Powerful browser APIs were not explicitly denied. | Added `Permissions-Policy` blocking camera, microphone, geolocation, USB, Bluetooth, and restricting payment. | `tests/securityHeaders.test.js`. |
| 4 | HSTS lacked subdomain/preload deployment guidance. | Added deploy header with `includeSubDomains; preload`. | `public/_headers`. |
| 5 | Private SPA routes relied mainly on client-side noindex changes and robots.txt. | Added `X-Robots-Tag: noindex, nofollow, noarchive` and `Cache-Control: no-store` for admin/client/setup/order routes. | `public/_headers`. |
| 6 | Public lead capture accepted non-POST methods and loosely accepted content types. | Enforced POST, JSON bodies, and max body size on `submitLeadCapture`. | Function code plus node tests for input normalization. |
| 7 | Lead capture accepted malformed emails/short phone values deeper into the flow. | Added email validation and stricter normalized phone acceptance. | `tests/submitLeadCaptureQuality.test.js`. |
| 8 | Lead capture stored raw forwarded IP values. | Masked stored IP addresses while keeping raw IP only for immediate rate limiting. | `tests/submitLeadCaptureQuality.test.js`. |
| 9 | Public functions could return raw server error messages to callers. | Changed lead/contact catch blocks to log internally and return generic public errors. | `submitLeadCapture` and `submitContactInquiry` entries. |
| 10 | Stored/generated HTML previews could execute inside the admin app DOM. | Rendered social content as plain text and moved campaign HTML preview into a sandboxed iframe with its own restrictive CSP. | `SocialMediaEngine.jsx`, `CampaignBuilder.jsx`. |

## Extra Defensive Improvements

- Added `/.well-known/security.txt` so good-faith researchers have a clear reporting path.
- Replaced the custom `sendTestLead` admin check with the shared `requireAdminUser` guard and `AuthGuardError` status handling.
- Escaped user-controlled contact inquiry values before embedding them in Resend HTML emails.

## Safety Test Before And After

Before:
- Header check showed HSTS, `nosniff`, and referrer policy.
- Header check did not show CSP, permissions policy, `X-Frame-Options`, or private-route `X-Robots-Tag`.
- Local code inspection found broad CSP, raw public error returns, stored HTML injection surfaces, and weaker public lead intake checks.

After:
- `npm run test:node` verifies CSP/header files, HTML escaping, lead normalization, IP masking, and existing auth/lead protections.
- `npm run build` verifies the frontend still compiles after CSP/admin preview changes.
- Deployment still needs the hosting layer to honor `public/_headers`; if Render is serving through a custom Python/ASGI layer, mirror these headers there too.

## Residual Risk

- `script-src 'unsafe-inline'` remains because `index.html` currently contains inline route metadata and JSON-LD. This is improved but not perfect. A future hardening pass should move inline scripts into bundled files or add nonce/hash-based CSP.
- Public lead capture still uses in-memory rate limiting inside the function runtime. For stronger abuse protection, move counters to durable storage or an edge/WAF rule.
- This was a passive/code-level hardening pass, not a full authenticated penetration test.
