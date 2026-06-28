# ClientSurge Launch Blocker Resolution Gameplan - 2026-06-28

## Current verdict

Launch remains locked. The admin panels show partial configuration and some proof, but the business is not safe to push paid external traffic until the blockers below are resolved or formally waived.

## Source panels reviewed

- Launch Guide: 2 of 7 complete. Current next step is Stripe Payment Connected.
- Launch Proof Dashboard: Analytics Proof, Voice Proof, and Booking Proof blocked. Stripe Payment Proof and Dashboard Truth Proof unknown. Site Readiness Proof trusted.
- Launch Gates: launch locked, 10 critical blockers, 0 approved gates, 0 proof passed, average proof 0 percent.
- LaunchGate records: active blockers include Stripe payment, voice, booking, dashboard truth, voice front-line, and ElevenLabs post-call logging.

## Priority model

- P0 means blocks revenue or truth layer. Resolve before public launch.
- P1 means blocks measurement, deliverability, or operational confidence. Resolve before serious outbound or paid traffic.
- P2 means proof, screenshot, and approval hygiene. Resolve before declaring final launch-ready.

## P0 - Stripe live payment proof

Problem: Stripe Payment Connected is only in progress. The LaunchGate record says there is no production-trusted paid order. Existing orders are internal, test, smoke, or pending.

Why this matters: If Stripe cannot create a trusted paid order and trigger post-payment automation, the business cannot safely take money.

Fix sequence:
1. Confirm Stripe is in live mode.
2. Confirm production checkout links do not use test payment links.
3. Confirm createCheckoutSession uses the live Stripe secret key in production.
4. Confirm Stripe webhook endpoint points to the production domain.
5. Run one real low-dollar live checkout with a real non-test customer email and real business name.
6. Confirm Base44 creates an Order record with payment_status paid, stripe_session_id, stripe_customer_id, package key/type, and no internal/test markers.
7. Confirm post-payment handoff creates or links ClientProject, ClientInstallationOS, and AutomationChecklist.
8. Rerun Launch Proof / Launch Validation.

Done when: Stripe gate changes from blocked to ready_for_proof or proof_passed, and the latest paid order is production-trusted with Stripe IDs.

## P0 - Dashboard Truth / 120 failed production jobs

Problem: DashboardTruthCheck and LaunchGate show 120 production-trusted failed AutomationJob records.

Why this matters: This is the most dangerous blocker. It means the admin dashboard cannot honestly claim the system is healthy.

Fix sequence:
1. Open Failed Jobs in admin.
2. Inspect failed jobs by job type and error.
3. Split failures into real production failures, internal/test/smoke/backfill pollution, and stale historical failures.
4. Patch production-trust classification if test/backfill jobs are counted as production.
5. Fix real failures by job type: missing environment variables, bad webhook URLs, missing client/project IDs, provider failure, or stuck retry queue.
6. Create DeadLetterLog records for unresolved real failures.
7. Archive or mark test/internal jobs excluded from production dashboard counts.
8. Rerun runPipelineProofAudit, runAdminReconciliation, and runLaunchValidationEngine.

Done when: Dashboard truth shows 0 production-trusted failed jobs, 0 production-trusted stuck jobs, and 0 unresolved production dead letters.

## P0 - Voice inbound proof

Problem: Twilio Voice Gate, Voice Front-Line Responder, and ElevenLabs Post-Call Logging are blocked.

Why this matters: The AI receptionist cannot be sold as live unless a real call is answered, processed, and logged.

Fix sequence:
1. Confirm Twilio voice webhook points to the production receiveInboundVoiceCall function.
2. Confirm ElevenLabs agent and phone number secrets are present.
3. Place a real inbound call to the production number.
4. Confirm the call reaches the AI responder or fallback flow.
5. Confirm Base44 logs a CommunicationEvent or related call record with call started, call completed, inbound direction, provider, and production environment.
6. Confirm ElevenLabs post-call webhook stores transcript, duration, outcome, or post-call summary.
7. Rerun Launch Proof.

Done when: Voice gate and post-call logging gate show ready_for_proof or proof_passed with a production-trusted call record.

## P1 - Booking flow proof

Problem: Booking Flow Gate is blocked even though a Calendly link exists.

Why this matters: A configured booking link is not proof. The flow must load and produce an event or booking confirmation.

Fix sequence:
1. Open the booking link from the live site.
2. Confirm the booking page loads.
3. Trigger a real booking or test booking.
4. Confirm demo_booking_click event, booking confirmation record/log, or Calendly confirmation email.
5. Confirm GA4 event fires.
6. Rerun Launch Proof.

Done when: Booking Flow Gate is not blocked and has event or confirmation proof.

## P1 - Analytics and Consent proof

Problem: GA4 is active, but the proof matrix is incomplete. Missing or unverified items include booking/demo/scroll events, Tag Assistant Consent Mode proof, internal traffic exclusion, unwanted referrals, and cross-domain measurement.

Fix sequence:
1. Generate required live events: page_view, cta_click, pricing_view, checkout_click, form_submit, demo_booking_click, booking_click if used, and scroll_depth if tracked.
2. Confirm events in Base44 ConversionTrackingEvent records.
3. Confirm events in GA4 Realtime or DebugView.
4. Run Google Tag Assistant. Before consent optional storage should be denied. After accept analytics and ad consent should update. After reject optional storage should remain denied.
5. Configure GA4 internal traffic for Nolan devices and network.
6. Configure GA4 unwanted referrals for Stripe checkout and customer portal domains.
7. Configure cross-domain measurement for clientsurgesystems.com, www.clientsurgesystems.com, and verified checkout domain.
8. Attach screenshots or notes in admin proof fields once supported.

Done when: Launch Validation Engine shows GA4 active verified, event matrix verified, and manual Google proof items completed or approved.

## P1 - Resend proof

Problem: Resend is sending, but sender/domain proof and inbox proof are still manual.

Fix sequence:
1. Confirm Resend sender domain is verified.
2. Confirm SPF, DKIM, and DMARC records are passing.
3. Send a real transactional email from production.
4. Confirm Base44 logs provider message ID.
5. Confirm recipient inbox receives the email.
6. Attach screenshot/proof.

Done when: Resend gate has provider ID, non-failed delivery status, and manual inbox/domain proof.

## P1 - Twilio SMS proof

Problem: Twilio SMS has delivery evidence, but still needs recipient proof and cleanup of failed SMS statuses.

Fix sequence:
1. Run one live SMS flow.
2. Confirm provider Message SID exists.
3. Confirm status callback updates delivery status to delivered.
4. Confirm message arrives on recipient device.
5. Investigate the 4 failed SMS records.
6. Classify failures as internal/test or production.
7. Fix the underlying cause if production.

Done when: Twilio SMS gate has delivered provider proof and failed records are resolved or excluded from production counts.

## P2 - Admin approval and screenshots

Problem: Many gates are ready_for_proof but not approved because no screenshots/evidence are attached.

Fix sequence:
1. Capture screenshots for public CTA desktop, public CTA mobile, admin dashboard metrics, client portal login/data, SSL/security headers, GA4 realtime events, Tag Assistant consent mode, Stripe custom domain, and Resend domain verification.
2. Attach or record proof in the admin panel once proof fields are wired.
3. Approve or waive gates intentionally.

Done when: Manual proof gates are approved, not guessed.

## Implementation work already started

- Added GitHub function: base44/functions/runLaunchValidationEngine/entry.ts.
- Updated GitHub UI: src/components/admin/LaunchProofDashboard.jsx.
- Sent Base44 patch request to upgrade live admin Launch Proof, Launch Guide, and Launch Gates directly.

## Final launch rule

Do not launch external paid traffic until Stripe live payment proof passes, dashboard truth has zero production blockers, voice proof passes or the voice offer is removed from launch scope, booking proof passes, GA4 and Consent Mode proof are verified, Resend and Twilio delivery proof are verified, and manual dashboard evidence is attached or explicitly waived.
