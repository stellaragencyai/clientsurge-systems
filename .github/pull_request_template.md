## Scope

- [ ] Public website
- [ ] Base44 function/entity/schema
- [ ] Stripe
- [ ] Twilio / messaging
- [ ] Resend / email
- [ ] CRM / lead truth
- [ ] Admin dashboard / launch gates
- [ ] Security / routing / Cloudflare
- [ ] Docs only

## Production impact

- [ ] No production behavior change
- [ ] Production-facing change, approval required before publish
- [ ] Base44 production publish required after merge
- [ ] Cloudflare cache purge required

## Provider impact

- [ ] No provider changes
- [ ] Stripe test-mode only
- [ ] Stripe live approval required
- [ ] Twilio sandbox/test number only
- [ ] Twilio live approval required
- [ ] Resend test-safe recipient only
- [ ] Resend production approval required

## Required checks

- [ ] `npm ci`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npm run test:node`
- [ ] `npm run test:deno`

## Proof attached

- [ ] Source proof
- [ ] Base44 sync proof
- [ ] Base44 publish proof, if applicable
- [ ] Live-domain smoke proof, if applicable
- [ ] Provider proof, if applicable
- [ ] Rollback plan

## Release notes

Describe what changed, why it is safe, and how to roll back.
