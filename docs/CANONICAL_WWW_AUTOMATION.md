# Canonical Apex-Domain Automation

Goal: make every public URL land on `https://clientsurgesystems.com` with HTTPS lock security.

## Current Live Finding

As of May 21, 2026:

- `http://clientsurgesystems.com` redirects to `https://clientsurgesystems.com/`.
- `https://clientsurgesystems.com` returns `200`.
- `http://www.clientsurgesystems.com` redirects to the HTTPS apex domain.
- `https://www.clientsurgesystems.com` redirects to `https://clientsurgesystems.com/`.

That means the host/origin currently treats the apex domain as primary.

## Safe Automation Path

1. Commit and deploy the repo canonical URL changes.
2. In Render/Base44 deployment settings, keep `clientsurgesystems.com` as the primary custom domain.
3. In Cloudflare, keep DNS proxied and optionally add an edge redirect rule from apex/http to `https://clientsurgesystems.com`.
4. Recheck the redirect chain:

```powershell
node scripts/configure-canonical-www.mjs --check
```

## Provider Automation

Do not paste provider passwords into chat. Use short-lived/scoped API keys as environment variables.

## Cloudflare Status

The Codex Cloudflare connector was checked on May 21, 2026. It is authenticated, but it currently returns zero zones and cannot see `clientsurgesystems.com`. Cloudflare DNS or redirect changes cannot be applied through the connector until the domain is added to that Cloudflare account or the connector/token is granted access to the account that owns the zone.

Wrangler is installed locally in this repo:

```powershell
npx wrangler --version
```

Convenience commands:

```powershell
npm run cloudflare:check
npm run cloudflare:apply-redirect
```

Render domain recreate:

```powershell
$env:RENDER_API_KEY = "..."
$env:RENDER_SERVICE_ID = "..."
$env:CONFIRM_RENDER_DOMAIN_RECREATE = "clientsurgesystems.com"
node scripts/configure-canonical-www.mjs --apply-render-recreate
```

Cloudflare redirect rule:

```powershell
$env:CLOUDFLARE_API_TOKEN = "..."
node scripts/configure-canonical-www.mjs --apply-cloudflare-redirect
```

## Risk Notes

- Recreating Render custom domains can briefly affect TLS verification or custom-domain status while DNS/SSL settles.
- Cloudflare redirect rules cannot fix missing origin security headers by themselves unless the route is proxied through a rule/Worker that adds those headers.
- Keep the final target as `https://clientsurgesystems.com`; the lock requires HTTPS.
