# ClientSurge Launch Gate Policy

Last reviewed: 2026-08-01

ClientSurge Systems must not be published, deployed, merged to production, or described as launch-ready unless every required gate below has current evidence from the same commit or approved release artifact.

## Required Gates

1. Clean GitHub change surface
   - Work happens on a named remediation or release branch.
   - `git status --short --branch` shows only intentional release changes.
   - A PR or written release packet lists all changed systems.

2. Local verification
   - `npm run lint` passes.
   - `npm run typecheck` passes.
   - Focused Node tests for touched areas pass.
   - `npm run build` passes.
   - Any failing full-suite or Deno test has a specific blocker and owner.

3. Security and dependency review
   - `npm audit --omit=dev` exits 0, or every remaining finding is listed in `docs/SECURITY_AUDIT_EXCEPTIONS.md` with scope, mitigation, owner, and recheck trigger.
   - No frontend code calls `base44.asServiceRole`.
   - Customer RLS cannot mutate authoritative billing, activation, install, checklist, or subscription truth fields.

4. Base44 publish readiness
   - The CLI account has access to the production app ID before any publish.
   - Backend function list and entity visibility are verified against the production app.
   - Publish output includes exact app ID, changed functions/entities, and post-publish verification.

5. Cloudflare live-edge readiness
   - `npm run cloudflare:security:dry-run` passes.
   - Route diagnosis proves apex and `www` traffic reach the intended security Worker.
   - Edge health returns 200 on `/.well-known/clientsurge-edge-health.json`.
   - The production-security verifier passes on `https://clientsurgesystems.com`.

6. Payment and communication safety
   - Checkout uses canonical package price IDs.
   - Stripe webhooks are idempotent and replayable.
   - Resend, Twilio, voice, and social sends remain gated by consent, authorization, idempotency, and audit trails.
   - No real email, SMS, voice call, social post, Stripe charge, refund, or subscription mutation is performed during verification unless explicitly approved for that test.

7. Live-domain proof
   - Browser proof covers homepage, pricing, checkout handoff, login/access, portal entry, sensitive route headers, and mobile layout.
   - Release proof records the commit SHA, bundle hash, live asset hash, status headers, and any remaining provider blockers.

## Stop Conditions

Stop the release and do not publish if any of these are true:

- The custom domain is bypassing the intended Cloudflare security Worker.
- `clientsurgesystems.com` lacks CSP or COOP response headers.
- Sensitive routes are missing `X-Robots-Tag: noindex` or `Cache-Control: no-store`.
- Base44 production app access cannot be verified.
- Stripe, Resend, Twilio, voice, or social provider readiness is inferred from code only and not verified through the provider.
- A customer role can update authoritative billing, subscription, activation, install, or checklist truth fields.
- CI fails for code reasons, or CI is blocked by account/billing state and no local substitute evidence is documented.

## Approval Boundary

The following operations require explicit owner approval immediately before execution:

- Base44 publish or deploy.
- Cloudflare DNS, Worker route, transform rule, origin rule, redirect rule, WAF, or custom hostname changes.
- GitHub merge to `main` or production branch.
- Stripe live charge, refund, subscription, product, price, webhook, or customer mutation.
- Resend domain, key, webhook, or real-send changes.
- Twilio/voice/social live sends or provider configuration changes.
