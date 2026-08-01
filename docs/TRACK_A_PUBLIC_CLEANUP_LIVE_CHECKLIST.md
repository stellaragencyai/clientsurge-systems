# Track A Live Verification Checklist

Use this checklist after deploying the Track A public cleanup candidate.

## Public routes
- [ ] `/` loads the real public homepage.
- [ ] `/` does not show a generated `Pages` directory.
- [ ] `/pricing` loads pricing.
- [ ] `/pricing` shows Starter System: $249 setup + $99/month.
- [ ] `/pricing` shows Growth System: $499 setup + $249/month.
- [ ] `/pricing` shows Pro System: $999 setup + $499/month.
- [ ] `/pricing` does not show a generated `Pages` directory.
- [ ] `/automations` loads without generated route leaks.
- [ ] `/contact` loads without generated route leaks.

## Legal routes
- [ ] `/privacy` loads.
- [ ] `/terms` loads.
- [ ] `/sms-terms` loads.
- [ ] `/refund-policy` loads.
- [ ] Footer links point to `/privacy`, `/terms`, `/sms-terms`, and `/refund-policy`.

## Private/internal routes
- [ ] `/dashboard` does not expose internal page lists to unauthenticated visitors.
- [ ] `/admin` does not expose internal page lists to unauthenticated visitors.
- [ ] `/setup` does not expose internal page lists to unauthenticated visitors.
- [ ] `/client` does not expose internal page lists to unauthenticated visitors.
- [ ] `/client-portal` does not expose internal page lists to unauthenticated visitors.
- [ ] `/onboarding` does not expose internal page lists to unauthenticated visitors.
- [ ] `/audit` does not expose internal page lists to unauthenticated visitors.
- [ ] `/observability` does not expose internal page lists to unauthenticated visitors.
- [ ] `/reconciliation` does not expose internal page lists to unauthenticated visitors.

## SEO files
- [ ] `/robots.txt` returns clean text.
- [ ] `/robots.txt` disallows admin/dashboard/client/setup/internal/private route families.
- [ ] `/robots.txt` includes `Sitemap: https://clientsurgesystems.com/sitemap.xml`.
- [ ] `/sitemap.xml` returns XML.
- [ ] `/sitemap.xml` contains only:
  - `https://clientsurgesystems.com/`
  - `https://clientsurgesystems.com/pricing`
  - `https://clientsurgesystems.com/automations`
  - `https://clientsurgesystems.com/contact`
  - `https://clientsurgesystems.com/privacy`
  - `https://clientsurgesystems.com/terms`
  - `https://clientsurgesystems.com/sms-terms`
  - `https://clientsurgesystems.com/refund-policy`

## Do not mark complete unless
- [ ] Live production passes every check above.
- [ ] No generated Base44 `Pages` directory is visible to normal visitors.
- [ ] No internal admin/setup/client route names are exposed to unauthenticated visitors.
