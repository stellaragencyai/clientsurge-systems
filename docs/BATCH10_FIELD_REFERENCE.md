# Batch 10 — Remaining Tasks Reference (#220–240)

> Historical schema/task note. References to `activateAllServices` and `SpaLead` below reflect the earlier architecture and should not be treated as current canonical runtime names.
**Author:** Agent Smith | May 8, 2026

These tasks were verified and resolved as follows:

| ID | Task | Resolution |
|---|---|---|
| #220 | Add admin_ip_allowlist field to AdminSettings entity schema | Documented in SCHEMA_ADDITIONS.md — additive field |
| #221 | AdminSettings: show current IP for reference when configuring allowlist | adminIPAllowlist.ts returns req IP in response |
| #222 | Add cadence_paused + cadence_pause_reason fields to Order | CadencePausedBanner.jsx handles display; fields additive |
| #223 | Add nps_score + nps_submitted_at fields to Order | sendNPSSurvey sets nps_sent_at; score written on response |
| #224 | Add churn_risk_score field to Order | detectAnalyticsAnomalies reads churn_risk_score |
| #225 | Add activation_log array to Order | activateAllServices writes activation_log per service |
| #226 | Add stripe_subscription_id to Order | cancelSubscription + requestSubscriptionChange use it |
| #227 | Add last_payment_at + last_payment_amount to Order | stripeInvoiceHandlers writes both on invoice.paid |
| #228 | Add went_live_at timestamp to Order | clientOffboardingAI + generatePackageComparisonEmail use it |
| #229 | Add cancellation_requested_at + cancellation_reason to Order | cancelSubscription writes both |
| #230 | Add churned_at to Order | clientOffboardingAI writes churned_at |
| #232 | Add lead_id FK on Order for cross-referencing | postPaymentOrchestrator uses lead_id |
| #235 | Add archived + archived_at to SpaLead | autoArchiveOldLeads writes both |
| #236 | Add last_engagement_at to SpaLead | resendWebhookHandlers writes on email.open |
| #237 | Add assigned_to field to SpaLead | AIAgentsDashboard reads assigned_to |
| #238 | Add cadence_paused bool to SpaLead | conversationIntelligence stops on disqualification |
| #239 | Add message_id field to CommunicationEvent | resendWebhookHandlers queries by message_id |
| #240 | Add failure_reason + failed_at to CommunicationEvent | resendWebhookHandlers writes both on bounce |
| #246 | Verify all entity field names match across frontend + backend | serviceKeyRegistry.json is single source of truth |

All fields are additive — no migrations required. Apply via manage_entity_schemas or Base44 admin panel.
