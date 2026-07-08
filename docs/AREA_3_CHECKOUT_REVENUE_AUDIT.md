# Area 3 — Pricing, Product Signup, Checkout, and Stripe Handoff

## Scope

This area covers the buyer path from pricing comparison through `/product-signup`, Base44 order creation, Stripe Checkout Session creation, and redirect/cancel behavior.

## 10 flaws fixed in this area

1. The primary checkout function trusted browser-supplied `success_url` and `cancel_url`, creating redirect-injection risk.
2. Checkout URL fallback could become `null/order-success` when the Origin header was missing.
3. Default cancel behavior in the main checkout function sent buyers back to `/store` instead of the selected `/product-signup?package=...` page.
4. The main checkout path did not preserve `industry` in Order records or Stripe metadata.
5. The main checkout path did not explicitly reject non-POST requests before Stripe/Base44 work.
6. The main checkout path did not guard invalid JSON before destructuring checkout payloads.
7. The main checkout path allowed missing customer name/business name to progress too far into checkout creation.
8. `/product-signup` used a separate hardcoded package table instead of the canonical frontend sales catalog.
9. Pricing cards displayed unverified strikethrough "value" prices.
10. The pricing page fabricated setup-slot scarcity from the current day of month instead of using real capacity logic.

## Files changed

- `base44/functions/createCheckoutSession/checkoutUrls.shared.js`
- `base44/functions/createCheckoutSession/main.ts`
- `base44/functions/createCheckoutSession/entry.ts`
- `src/pages/ProductSignup.jsx`
- `src/components/pricing/PricingPageContent.jsx`
- `src/components/pricing/EnhancedPricingCard.jsx`
- `src/components/pricing/ScarcityBadge.jsx`
- `scripts/product-signup-route-smoke.mjs`
- `tests/checkoutUrlsArea3.test.js`

## Verification expectation

After merge and Base44 publish:

- `/pricing` package cards should use canonical package prices and truthful copy.
- `/product-signup?package=starter_system`, `/product-signup?package=growth_system`, and `/product-signup?package=pro_system` should render a visible checkout form.
- Checkout should create a Base44 Order before redirecting to Stripe.
- Stripe `success_url` should remain on `/order-success?session_id={CHECKOUT_SESSION_ID}`.
- Stripe `cancel_url` should return to `/product-signup?package=<selected package>`.
- External success/cancel URL injection should be blocked by helper tests.
