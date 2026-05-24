# Service Configuration Guide - Historical Reference

> Retired path: `configureService` no longer performs production activation. The canonical install state lives in `base44/functions/_shared/installPipeline.js`, and real service go-live work must flow through the install workspace and shared order state.

This document is preserved only to explain the older service-by-service configuration concept. It is not the live production source of truth for activation.

## What Changed

- `configureService` is quarantined and returns a retired-path response.
- Bulk activation through `activateAllServices` and `aiPackageOrchestrator` is retired.
- Canonical install state now lives on:
  - `Order.install_configuration`
  - `Order.items[].install_status`
  - `Order.pipeline_status`
  - `ClientProject.install_configuration` mirror fields populated by the shared install pipeline

## Use This Instead

- Shared install logic: `base44/functions/_shared/installPipeline.js`
- Stripe paid-order lifecycle: `base44/functions/_shared/stripeOrderWebhook.js`
- Portal install view: `base44/functions/getClientPortalContext/entry.ts`
- Admin install control surface: canonical install workspace / queue views

## Historical Note

If you are reading an older task log, doc, or automation that tells you to call `configureService`, `activateAllServices`, or `aiPackageOrchestrator`, treat it as stale guidance and do not re-enable it.
