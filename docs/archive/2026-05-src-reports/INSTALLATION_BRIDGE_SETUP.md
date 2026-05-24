# ClientSurge Installation Bridge Setup - Historical Note

> This document predates the shared canonical install pipeline. Any references to `configureService`, auto-triggered activation, or "system is live" status should be treated as legacy planning notes, not current production truth.

## Current Production Truth

- Payment lifecycle is owned by `base44/functions/_shared/stripeOrderWebhook.js`
- Install state is owned by `base44/functions/_shared/installPipeline.js`
- `activateAllServices`, `configureService`, and `aiPackageOrchestrator` are retired and must not be re-enabled
- Admin should manage fulfillment through the canonical install queue/workspace and order status transitions

## What This Replaces

Older versions of this doc described:

- service-level auto-configuration via `configureService`
- automatic install-stage advancement through `activateAllServices`
- production readiness based on those retired paths

Those statements are no longer valid.

## Safe Operator Guidance

1. Confirm the paid order was processed by `stripeWebhookOrders`.
2. Confirm `Order.client_id` and `Order.client_project_id` are populated.
3. Confirm `Order.install_configuration` and `Order.items[].install_status` were initialized.
4. Use the canonical install workspace to move services through real tracked states.
5. Verify portal state through `getClientPortalContext`.
