# Function Prune First Pass - May 2026

This pass moves low-risk, zero-local-reference Base44 functions out of the deployable `base44/functions` folder and into quarantine.

Quarantine folders:

```text
base44/functions_quarantine/2026-05-first-pass
base44/functions_quarantine/2026-05-zero-reference-no-remote-automation
base44/functions_quarantine/2026-05-duplicate-unused
```

## Selection Rules

- No local references found outside the function's own folder across `src`, `base44/automations`, `base44/functions`, `scripts`, and `tests`.
- Not an obvious public form endpoint, webhook endpoint, payment endpoint, install endpoint, client portal endpoint, or shared runtime dependency.
- No remote Base44 automation metadata attached for the second pass.
- Prefer reversible quarantine over hard deletion because Base44 functions may be invoked manually, externally, or by platform configuration that is not visible in the local repo.

## Quarantined Functions

### Test and Demo Utilities

- `testInboundSmsReply`
- `testInstantLeadResponse`
- `testMissedCallResponse`
- `testWebsiteLeadAutomation`

### Seed and One-Time Setup

- `seedEmailTemplates`
- `seedIndustryTemplates`

### Unused AI and Messaging Helpers

- `generateMessage`
- `sendSmartEmail`
- `validateAIOutputs`

### Voice and ElevenLabs Extras

- `createElevenLabsAgent`

### Website and Content Generation

- `aiWebsiteCopyFinalizer`
- `generateSitemap`
- `generateSocialStarterPack`
- `generateWebsiteSpec`

### Miscellaneous Low-Risk Utilities

- `pushTasksToGitHub`
- `secureFormSubmission`

### Additional Zero-Reference Functions Without Remote Automation Metadata

- `addStripeCustomerIdToProject`
- `applyAutomationRules`
- `autoArchiveOldLeads`
- `autoCloseStaleLeads`
- `autoOptimizeSMSTemplates`
- `bookingConfirmationLoop`
- `classifyLeadIntentWiring`
- `classifyLeadReply`
- `contactFrequencyLimiter`
- `dailyDigestGate`
- `fixAutomationAlert`
- `generateSmsTemplates`
- `getAutomationAlerts`
- `getOpenClawInstallAssist`
- `handleBookingTrigger`
- `onboardingStepTelegramAlert`
- `pipelineIntegrityCheck`
- `predictOptimalSendTime`
- `resendActivationLink`
- `runLaunchReadinessCheck`
- `scheduleFollowUp`
- `selfHealingMonitor`
- `sendEmailDripStep`
- `sendFollowUpEmail`
- `sendGoLiveNotification`
- `sendLeadConfirmationEmail`
- `sendMonthlyClientReportEmail`
- `sendNPSSurvey`
- `sendWeeklyDigest`
- `syncLeadToCRM`
- `trackEmailEvent`
- `updateMetricsSnapshot`
- `verifyRealOrder`
- `workflowStageManager`

## Restored Because Remote Automation Metadata Exists

These had no local references, but Base44 remote metadata reported attached automations. They were restored to `base44/functions`.

- `aiMessageWriter`
- `sendVoiceBriefing`

## Kept Despite Zero Local References Because Remote Automation Metadata Exists

- `enrollMissedCallDrip`
- `monthlyClientReport`
- `onChecklistStatusChange`
- `sendAppointmentBookedEmail`
- `sendBookingLinkSMS`
- `sendMissedCallRecoveryEmail`
- `stalledCredentialsAlert`
- `stalledOnboardingAlert`
- `stampFollowUpAt`
- `triggerAutoReviewRequest`

## Restore Procedure

Move a function folder back from quarantine to `base44/functions` before publishing:

```powershell
Move-Item -LiteralPath .\base44\functions_quarantine\2026-05-first-pass\FUNCTION_NAME -Destination .\base44\functions\FUNCTION_NAME
```

Use the second quarantine path when restoring a function from the second pass.

## Duplicate / Legacy Endpoint Removal

The duplicate audit moved these additional functions out of `base44/functions`.

### Obsolete Booking Sender

- `sendBookingEmail` - only referenced by the already-quarantined `handleBookingTrigger`; current live flows use `sendAppointmentBookedEmail`, `sendBookingLinkSMS`, and canonical communication senders.

### Legacy Stripe Webhook Wrappers

- `stripePaymentWebhook`
- `stripeInvoiceWebhook`
- `stripeInvoiceHandlers`

These were compatibility wrappers around the canonical Stripe lifecycle handler. `src/STRIPE_GO_LIVE.md` already marks them as legacy endpoints to remove or disable, with `stripeWebhookOrders` as the canonical Stripe webhook endpoint.

### Deprecated Compatibility Wrappers

- `createLeadAndDispatch`
- `scheduleFollowUpEmails`
- `sendLeadInstantSms`

These existed only to return deprecated/quarantined responses or point callers toward canonical replacements.

Then run:

```bash
npm run base44:functions-check
npm run build
```

## Notes

- Documentation may still mention these functions as historical implementation notes or backlog items.
- `secureFormSubmission` was quarantined because live submit functions currently implement their own validation and no local code calls this function directly.
