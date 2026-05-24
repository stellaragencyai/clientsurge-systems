# Communication Outbox Runbook

Prompt 6 added a canonical `CommunicationOutbox` entity and shared sender in
`base44/functions/_shared/communicationOutbox.js`.

## Canonical Flow

1. Caller builds a stable idempotency key from provider, channel, source,
   recipient, message type, template key, and source record ID.
2. The shared sender creates or reuses a `CommunicationOutbox` row.
3. SMS/email compliance checks run before any provider call.
4. Suppressed messages are recorded with a suppression reason and no provider
   request is made.
5. Provider send attempts update the outbox and write a matching
   `CommunicationEvent`.
6. Twilio and Resend callbacks update both `CommunicationOutbox` and
   `CommunicationEvent`.

## Current Canonical Entrypoints

- `sendSMS`
- `sendEmail`
- `sendWebsiteLeadResponse`
- `processAutomationJobs`
- `processWebsiteLeadFollowUps`
- `processDynamicFollowUps`
- `processDripCampaigns`
- `bulkLeadAction`
- `sendEmailCampaign`
- `sendReviewRequest`
- `sendInstantLeadResponseSms`
- `processMissedCallFollowUps`
- `processQualifiedFollowUps`
- `processVoiceCallFollowUps`
- `processNurtureCampaigns`
- `runWinBackSequence`
- `handleNewLead`
- `routeLead`
- `scheduleFollowUpSMS`
- `triggerFollowUpSequence`
- `retryFailedEvent`
- `receiveTwilioMissedCallWebhook`
- `sendDemoConfirmationSMS`
- `sendContactEmail`
- `submitContactInquiry`
- `sendAdminLeadNotification`
- `sendAdminDemoNotification`
- `sendAdminPurchaseNotification` fallback email
- `sendOrderConfirmationEmail`
- `_shared/stripeOrderWebhook` payment recovery email and checkout SMS
- `_shared/installRuntime` runtime SMS/email tests
- Twilio inbound STOP handling
- Twilio SMS delivery callbacks
- Resend delivery, bounce, and complaint callbacks

## Retry Worker Path

Prompt 7 added `processCommunicationOutboxRetries`.

The worker:

1. Queries `CommunicationOutbox` where `status = "failed"`,
   `retryable != false`, and `next_retry_at` is due.
2. Re-runs the shared sender with `allowRetryFailed: true`.
3. Preserves the original `idempotency_key`.
4. Re-checks SMS opt-out, email suppression, consent basis, and quiet-hours
   policy before retry.
5. Refuses already sent, delivered, or cancelled rows.
6. Moves max-attempt rows to `needs_manual_review`.

Manual dry run:

```bash
base44 functions invoke processCommunicationOutboxRetries '{"dry_run":true}'
```

Scheduled run:

```bash
base44 functions invoke processCommunicationOutboxRetries '{"limit":50}'
```

## Manual Retry

Prompt 7 added `retryCommunicationOutboxItem`.

Admins can retry one item:

```bash
base44 functions invoke retryCommunicationOutboxItem '{"outbox_id":"OUTBOX_ID"}'
```

Manual retry:

- requires admin auth
- re-checks STOP/suppression/consent
- preserves the original idempotency key
- writes a `CommunicationEvent` audit record with
  `context_type = "CommunicationOutbox"`

## Admin Visibility

Prompt 7 added `listCommunicationOutbox`.

Supported filters:

- `status`
- `channel`
- `provider`
- `message_type`
- `client_project_id`
- `order_id`
- `lead_id`
- `date_from`
- `date_to`
- `failed_or_suppressed`

Example:

```bash
base44 functions invoke listCommunicationOutbox '{"failed_or_suppressed":true,"limit":100}'
```

## Debugging

Failed lead response:

1. Filter `CommunicationOutbox` by `lead_id`.
2. Check `status`, `last_error`, `attempts`, `next_retry_at`, and
   `communication_event_id`.
3. If `retryable` is true and `next_retry_at` is due, run the retry worker.
4. If status is `needs_manual_review`, inspect provider error and retry
   manually only after consent/suppression state is understood.

Twilio STOP suppression:

1. Find the inbound `CommunicationEvent` with `event_type = "sms_opt_out"`.
2. Confirm matching `WebsiteLead.sms_opted_out = true`.
3. Future SMS rows should become `suppressed` with
   `suppression_reason = "sms_opted_out"`.

Resend bounce/complaint suppression:

1. Find the Resend webhook `CommunicationEvent`.
2. Confirm matching `CommunicationOutbox.status = "failed"` for bounced or
   complained messages.
3. Confirm matching lead `email_suppressed = true` when a lead record can be
   matched.

## Remaining Legacy Direct Senders

This pass migrated the highest-risk active lead response, campaign, missed-call,
payment, checkout, install-runtime, and admin lead/demo notification paths.
The repo still contains older lifecycle/reporting/direct email utilities that
should be treated as migration inventory, not preferred patterns.

Remaining production migration candidates from the latest static scan:

1. `autoSchedule30DayCheckin`
2. `autoSendWebhookInstructions`
3. `cancelSubscription`
4. `clientOffboardingAI`
5. `generateMonthlyPerformanceReport`
6. `generatePackageComparisonEmail`
7. `generateWeeklyReport`
8. `healthCheck` test-send behavior
9. `initiateVoiceCloneIntake`
10. `missingCredentialsAlert`
11. `monthlyClientReport`
12. `onChecklistStatusChange`
13. `onLeadCreated`
14. `onOnboardingStageChange`
15. `saveClientCredentials`
16. `sendAppointmentBookedEmail`
17. `sendClientWelcomeEmail`
18. `sendDailyDigest`
19. `sendDemoConfirmationEmail`
20. `sendDemoPrepEmail`
21. `sendEmailDripStep`
22. `sendFollowUpEmail`
23. `sendGoLiveNotification`
24. `sendLeadConfirmationEmail`
25. `sendMilestoneEmail`
26. `sendMissedCallRecoveryEmail`
27. `sendMonthlyClientReportEmail`
28. `sendNPSSurvey`
29. `sendPortalWelcomeEmail`
30. `sendSmartEmail`
31. `sendVoiceBriefing` SMS fallback
32. `sendWeeklyDigest`
33. `sendWentLiveEmail`
34. `stalledCredentialsAlert`
35. `stalledOnboardingAlert`

Safe exceptions:

- provider health checks that query Twilio/Resend account or domain status
- webhook signature verification and inbound webhook receivers
- voice/call APIs that are not SMS/email outbox sends
- `_shared/communicationOutbox.js`, which is the only approved provider-send
  implementation for Twilio SMS and Resend email
- tests and local proof scripts

Do not add new direct Twilio or Resend calls. New outbound communication should
use `sendCommunicationViaOutbox`.
