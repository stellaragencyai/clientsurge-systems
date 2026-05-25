# Installation Workflow Guide

## Canonical Install Path

1. `createCheckoutSession`
2. `stripeWebhookOrders`
3. `_shared/stripeOrderWebhook.js`
4. `_shared/installPipeline.js`

## Canonical Order State

- `Order.client_id`
- `Order.client_project_id`
- `Order.install_configuration`
- `Order.pipeline_status`
- `Order.items[].install_status`

## Canonical Project Mirrors

- `ClientProject.pipeline_status`
- `ClientProject.install_started_at`
- `ClientProject.install_completed_at`

## Operator Rules

- Do not use retired activation paths like `activateAllServices`.
- Do not store `ClientProject.id` inside `Order.client_id`.
- Do not fake missing linkage from “first active” records.

## Portal Contract

Client portal state must be derived from canonical order/project linkage, not guessed UI state.
