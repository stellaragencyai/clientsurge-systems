# Backend Integrations Memory

- Current mandate: restore broken business-critical flows first.
- Highest-priority failures:
  - lead-capture submit `404`
  - checkout-session create `404`
  - auth/login blank path diagnosis
- Key source docs:
  - `src/DOMAIN_01_STRIPE_PAYMENTS.md`
  - `src/DOMAIN_02_LEAD_PIPELINE.md`
  - `src/WEBHOOK_INTEGRATION_GUIDE.md`
- Constraint: prefer small, canonical fixes over duplicate patches.
- Success signal: forms and checkout reach their real backend targets and produce traceable outcomes.
