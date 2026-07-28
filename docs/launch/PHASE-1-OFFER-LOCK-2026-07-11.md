# Phase 1 — ClientSurge Offer Lock

Date: 2026-07-11
Status: Operational package catalog locked; two owner decisions remain explicitly excluded from public claims.

## Positioning

**What ClientSurge does:** ClientSurge installs and manages AI automation systems that help local service businesses respond to leads faster, recover missed calls, follow up consistently, book appointments, request reviews, and reactivate old opportunities.

**Why businesses should act:** Every delayed response, missed call, and forgotten follow-up creates an avoidable opportunity for a competitor to win the customer first.

**Primary public CTA:** Free Automation Audit.

## Initial outreach industries

1. HVAC
2. Roofing and Restoration
3. Dental and Orthodontics
4. Med Spas and Aesthetic Clinics
5. Plumbing and Drain Services

These industries are the controlled launch focus. Other industries may remain visible, but the first campaigns, audits, examples, and sales assets should prioritize these five.

## Canonical packages

### Starter System

- Setup and installation: **$249 one time**
- Monthly support: **$99 per month, beginning 30 days after checkout**
- Stripe product: `prod_UReWMpnZsCnfcL`
- Stripe setup price: `price_1TyJ0sBVGjsISdG0WTYUzr4U`
- Stripe monthly price: `price_1TyJ0zBVGjsISdG05Nwwf4CR`
- Included automations:
  - Instant Lead Response
  - Missed Call Text-Back

### Growth System

- Setup and installation: **$499 one time**
- Monthly support: **$249 per month, beginning 30 days after checkout**
- Stripe product: `prod_UReWhZsWks1HuA`
- Stripe setup price: `price_1TyJ15BVGjsISdG0kwqh9Pkk`
- Stripe monthly price: `price_1TyJ1CBVGjsISdG06Qlx3730`
- Included automations:
  - Instant Lead Response
  - Missed Call Text-Back
  - 14-Day Nurture Sequence
  - AI Booking Agent
- Public badge: **Most Popular**

### Pro System

- Setup and installation: **$999 one time**
- Monthly support: **$499 per month, beginning 30 days after checkout**
- Stripe product: `prod_UReW1LmsVbn4BZ`
- Stripe setup price: `price_1TyJ1IBVGjsISdG00IO5OwMd`
- Stripe monthly price: `price_1TyJ1PBVGjsISdG0e9F1BvaO`
- Included automations:
  - Instant Lead Response
  - Missed Call Text-Back
  - 14-Day Nurture Sequence
  - AI Booking Agent
  - Old Lead Reactivation
  - Review Request Automation
- Legacy package alias: `elite_system` maps to `pro_system`.

## Claims intentionally excluded

The website, checkout, dashboard, and sales material must not publish any of the following until explicitly approved and implemented:

- Annual billing discounts
- Monthly lead, SMS, email, or automation allowances
- Included AI voice minutes
- A full AI Phone Receptionist included in a package
- Guaranteed revenue, bookings, conversion rates, or recovery percentages
- Fake compare-at prices, scarcity, or savings claims

## Owner decisions still required

- [ ] Final guarantee or risk-reversal policy
- [ ] Final AI voice packaging, allowance, and price

Until those decisions are complete, AI voice is an optional consultative add-on and no guarantee is advertised.

## Base44 reconciliation

The production `PackageTier` records have correct dollar amounts but placeholder price IDs and noncanonical module keys. The production `AutomationModule` registry also uses legacy combined keys.

After GitHub-to-Base44 publishing is restored:

1. Run `syncOfferCatalog` with `{ "dry_run": true }`.
2. Review every proposed create/update and any duplicate record IDs.
3. Apply with `{ "dry_run": false, "confirm_phrase": "SYNC OFFER CATALOG" }`.
4. Query `PackageTier` and `AutomationModule` read-only to verify the final records.
5. Run checkout smoke tests for Starter, Growth, and Pro.

## Phase 1 checklist

- [x] Verify live Stripe account and products
- [x] Verify six live Stripe package prices
- [x] Confirm package dollar amounts
- [x] Confirm included automation bundles
- [x] Set initial five outreach industries
- [x] Lock positioning statement
- [x] Lock urgency statement
- [x] Remove unapproved annual, usage-limit, and voice-entitlement claims from code
- [x] Add Base44 dry-run reconciliation function
- [ ] Restore GitHub Actions / Base44 publishing
- [ ] Publish this branch to Base44
- [ ] Run Base44 offer-catalog dry run
- [ ] Apply Base44 offer-catalog reconciliation
- [ ] Verify three live checkout flows
- [ ] Approve guarantee
- [ ] Approve AI voice packaging
