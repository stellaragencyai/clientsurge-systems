# Historical Pipeline Batch Note

This file is preserved as a historical work log from the pre-recovery activation architecture.

Do **not** follow the old instructions in this batch for any live environment work. In particular:

- `activateAllServices` is retired
- `configureService` is retired
- `aiPackageOrchestrator` is retired
- Stripe should not be wired directly to any legacy activation path

## Canonical Production Paths

- Stripe webhook: `base44/functions/stripeWebhookOrders/entry.ts`
- Shared Stripe lifecycle logic: `base44/functions/_shared/stripeOrderWebhook.js`
- Install lifecycle: `base44/functions/_shared/installPipeline.js`
- Portal state: `base44/functions/getClientPortalContext/entry.ts`

If you need current behavior, read the canonical files above instead of this archived task batch.
