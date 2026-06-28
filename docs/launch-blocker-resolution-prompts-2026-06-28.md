# Launch Blocker Execution Prompts - 2026-06-28

Use these prompts/tasks to drive Base44, GitHub, Asana, Stripe, Resend, Twilio, and Google proof completion.

## Prompt 1 - Failed jobs cleanup

Audit the 120 production-trusted failed AutomationJob records. Group by job_type and error message. Mark internal/test/smoke/backfill records as dashboard_excluded with a clear reason. For true production failures, create DeadLetterLog records with failure reason and next action. Rerun runPipelineProofAudit, runAdminReconciliation, and runLaunchValidationEngine. Do not mark DashboardTruthCheck safe_to_launch until production failed/stuck/dead-letter counts are zero.

## Prompt 2 - Stripe proof

Verify live Stripe checkout path end to end. Confirm live mode keys, production webhook endpoint, non-test checkout links, and live Payment Link or Checkout Session configuration. Run one live low-dollar checkout with a real email and business name. Verify Order.payment_status is paid and Stripe IDs are stored. Confirm post-payment ClientProject, ClientInstallationOS, and AutomationChecklist handoff. Rerun launch validation.

## Prompt 3 - Voice proof

Verify Twilio voice webhook and ElevenLabs agent configuration. Place a real inbound call. Confirm the call reaches the AI responder or fallback. Confirm Base44 records call start, call completion, provider, direction inbound, production environment, and post-call transcript/outcome/duration. Rerun launch validation.

## Prompt 4 - Booking proof

Open live booking route from the public website. Confirm the Calendly or booking page loads. Complete a test booking or booking click. Confirm demo_booking_click or booking_click event appears in ConversionTrackingEvent and GA4 Realtime. Attach screenshot or admin evidence.

## Prompt 5 - Google proof

Run Tag Assistant on clientsurgesystems.com. Confirm Consent Mode v2 defaults are denied before consent and update after accept/reject. In GA4 configure internal traffic, unwanted referrals, and cross-domain domains. Capture screenshots and attach proof. Generate missing conversion events and verify in GA4 Realtime or DebugView.

## Prompt 6 - Resend proof

Verify Resend sender domain authentication. Confirm SPF, DKIM, and DMARC pass. Send a real transactional email from production. Confirm provider message ID is stored and the recipient inbox receives it. Attach screenshot/proof.

## Prompt 7 - Twilio SMS proof

Run one live SMS flow. Confirm provider Message SID exists and delivery_status becomes delivered. Confirm recipient device receives message. Investigate 4 failed SMS records and resolve or mark as internal/test if appropriate.
