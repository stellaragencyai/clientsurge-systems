# ClientSurge Systems Email Template Inventory + Upgrade Plan

Purpose: identify every email-producing path in the app and upgrade them one by one to the ClientSurge website theme.

Website theme standard:

- Electric blue: `#00AEEF`
- Deep CTA gradient: `#0088CC` to `#005691`
- White surface cards
- Black headings
- Soft electric background: `#EEF9FF` / `#F7FBFE`
- Borders: `#C9E7FB`
- Header logo lockup: logo image when `CLIENTSURGE_LOGO_URL` / `CLIENTSURGE_EMAIL_LOGO_URL` is available; fallback CS mark otherwise
- Display headings: Montserrat-style fallback
- Body copy: Inter-style fallback
- CTA: rounded pill, gradient fill, white text, blue glow

## Current upgrade status

### Completed in PR #1197

1. `base44/functions/autoSendWebhookInstructions/entry.ts`
   - Email: `Your AI Systems Are Being Activated — Next Steps`
   - Status: rebuilt from plain HTML into premium activation email
   - Added: hero, logo lockup, progress tracker, system cards, status cards, action-items card, CTA, premium footer

2. `base44/functions/submitContactInquiry/main.ts`
   - Email: admin contact-form lead alert
   - Status: rebuilt with website theme

3. `base44/functions/submitContactInquiry/main.ts`
   - Email: customer message-received confirmation
   - Status: rebuilt with website theme

## Remaining email-producing paths found in code search

These are the next targets. Each should be upgraded or confirmed to route through the shared website-theme shell.

### Core customer lifecycle emails

- `base44/functions/sendOrderConfirmationEmail/main.ts`
- `base44/functions/sendPortalWelcomeEmail/main.ts`
- `base44/functions/sendPortalWelcomeEmail/entry.ts`
- `base44/functions/sendDemoConfirmationEmail/main.ts`
- `base44/functions/sendDemoConfirmationEmail/entry.ts`
- `base44/functions/sendDemoPrepEmail/main.ts`
- `base44/functions/sendDemoPrepEmail/entry.ts`
- `base44/functions/sendWentLiveEmail/main.ts`
- `base44/functions/sendWentLiveEmail/entry.ts`
- `base44/functions/sendGoLiveNotification/entry.ts`
- `base44/functions/sendMilestoneEmail/main.ts`
- `base44/functions/sendMilestoneEmail/entry.ts`

### Operational / admin emails

- `base44/functions/sendAdminLeadNotification/entry.ts`
- `base44/functions/sendDailyDigest/main.ts`
- `base44/functions/sendDailyDigest/entry.ts`
- `base44/functions/sendWeeklyDigest/main.ts`
- `base44/functions/sendWeeklyDigest/entry.ts`
- `base44/functions/monthlyClientReport/entry.ts`
- `base44/functions/generateMonthlyPerformanceReport/main.ts`
- `base44/functions/missingCredentialsAlert/main.ts`
- `base44/functions/notifyOnboardingComplete/entry.ts`
- `base44/functions/onChecklistStatusChange/entry.ts`
- `base44/functions/onOnboardingStageChange/main.ts`

### Marketing / nurture / outbound emails

- `base44/functions/processNurtureCampaigns/main.ts`
- `base44/functions/processNurtureCampaigns/entry.ts`
- `base44/functions/sendEmailCampaign/main.ts`
- `base44/functions/sendOnboardingEmailSequence/main.ts`
- `base44/functions/sendFollowUpEmail/main.ts`
- `base44/functions/sendFollowUpEmail/entry.ts`
- `base44/functions/runWinBackSequence/main.ts`
- `base44/functions/runWinBackSequence/entry.ts`
- `base44/functions/resendBroadcast/main.ts`
- `base44/functions/resendBroadcast/entry.ts`
- `base44/functions/generatePackageComparisonEmail/entry.ts`

### Utility / generic email engines

- `base44/functions/_shared/clientSurgeResendTemplates.ts`
- `base44/functions/sendSmartEmail/main.ts`
- `base44/functions/sendEmail/main.ts`
- `base44/functions/sendContactEmail/main.ts`
- `base44/functions/retryFailedEvent/entry.ts`

### Other workflow emails

- `base44/functions/initiateVoiceCloneIntake/main.ts`
- `base44/functions/initiateVoiceCloneIntake/entry.ts`
- `base44/functions/clientOffboardingAI/main.ts`
- `base44/functions/sendNPSSurvey/main.ts`
- `base44/functions/sendNPSSurvey/entry.ts`
- `base44/functions/cancelSubscription/main.ts`

## Execution order

### Wave 1 — revenue + onboarding trust emails

1. Activation email — done
2. Order confirmation
3. Portal welcome
4. Demo confirmation
5. Demo prep
6. Went-live / go-live notification
7. Milestone email

### Wave 2 — lead/admin truth emails

1. Contact admin alert — done
2. Customer contact confirmation — done
3. Admin lead notification
4. Daily digest
5. Weekly digest
6. Monthly report
7. Missing credentials alert
8. Onboarding complete

### Wave 3 — marketing/nurture emails

1. Follow-up email
2. Nurture campaign processing
3. Onboarding email sequence
4. Win-back sequence
5. Broadcast engine
6. Package comparison email
7. NPS survey

## Quality gate for each upgraded template

Every upgraded email must pass:

- Uses ClientSurge website theme colors only
- Uses logo lockup or fallback CS mark in top-left header
- Has one clear CTA
- Uses card-based hierarchy
- Mobile-safe table-based HTML
- No brown legacy styling
- No emoji-led presentation
- No plain unstyled `<h2><p><ol>` output
- Includes support email / phone in footer
- Downstream failures must not block core form/order workflows

## Notes

The inventory came from code search for Resend/email patterns and should be re-run after each large merge because some email content can be produced by generic email engines rather than a single obvious template file.
