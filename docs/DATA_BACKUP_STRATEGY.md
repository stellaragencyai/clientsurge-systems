# ClientSurge Entity Data Backup Strategy

This strategy covers Base44 entity data that supports launch and customer operations. It does not store secrets, API keys, raw credentials, or private provider tokens in GitHub, markdown, Google Sheets, or exported CSV files.

## Scope

Back up operational records needed to recover launch, billing, onboarding, and automation state:

- `Leads`
- `WebsiteLead`
- `Order`
- `Subscription`
- `ClientProject`
- `OnboardingClient`
- `CommunicationEvent`
- `AutomationJob`
- `AgentLog`
- `AdminSettings` without secret values
- `SupportMessage`
- `DemoRequest`

## Backup Cadence

1. Daily during launch week:
   - Export `Order`, `Subscription`, `ClientProject`, `OnboardingClient`, `WebsiteLead`, `Leads`, `CommunicationEvent`, and `AutomationJob`.
   - Store the export in the approved private operations drive.
2. Weekly after launch stabilization:
   - Export the same critical entities.
   - Keep at least the latest four weekly snapshots.
3. Monthly operating archive:
   - Export critical entities to Google Sheets or CSV in the approved private operations drive.
   - Name the archive `clientsurge-entity-backup-YYYY-MM`.
   - Record export time, operator, source environment, entity counts, and verification result.
4. Before high-risk changes:
   - Take a manual export before bulk imports, billing migrations, provider webhook changes, launch publish windows, or admin data repair.

## Export Rules

- Never export or paste API keys, webhook secrets, Stripe keys, Twilio auth tokens, Resend keys, OpenAI keys, passwords, or OAuth tokens.
- Preserve provider IDs when present: Stripe session/invoice/subscription IDs, Twilio `MessageSid`/`CallSid`, Resend event IDs, and Base44 record IDs.
- Keep phone numbers and emails only in approved private storage, because they are customer data.
- Do not share backups in public chats, screenshots, GitHub issues, or unsecured documents.
- Prefer read-only exports over scripts that mutate data.

## Monthly Google Sheets Archive

Use one private spreadsheet per month with one tab per entity:

1. `Orders`
2. `Subscriptions`
3. `ClientProjects`
4. `OnboardingClients`
5. `WebsiteLeads`
6. `Leads`
7. `CommunicationEvents`
8. `AutomationJobs`
9. `AgentLogs`
10. `BackupManifest`

`BackupManifest` must include:

- Export date/time in America/Phoenix.
- Environment: production, staging, or test.
- Export operator.
- Source app ID if known.
- Release commit if tied to a launch.
- Entity row counts.
- Verification sample IDs.
- Any skipped entities and why.

## Verification

For every backup:

1. Confirm each required entity tab/file exists.
2. Confirm row counts are nonzero for active entities or explicitly explain zero-count entities.
3. Spot-check at least three paid/order-related records:
   - Order record.
   - Matching Subscription when present.
   - Matching ClientProject or OnboardingClient.
   - Related CommunicationEvent or AgentLog.
4. Confirm date fields, IDs, and provider IDs remain readable.
5. Record the verification result in `BackupManifest`.

## Restore Principles

- Restore with targeted updates or compensating records, not broad overwrites.
- Do not restore stale provider status over newer Stripe/Twilio/Resend facts.
- Reconcile payment data against Stripe before changing paid/order status.
- Reconcile messaging data against CommunicationEvent/provider IDs before retrying or marking sent.
- Preserve auditability by logging the reason, operator, affected IDs, and verification result.

## Restore Drill

Run a quarterly restore drill in staging or a safe test environment:

1. Pick one Order with linked Subscription, ClientProject, OnboardingClient, and CommunicationEvent records.
2. Load those records from the latest backup into a test-only workspace or staging import.
3. Confirm admin views can find the restored records.
4. Confirm no live SMS, email, payment, or customer-facing action is triggered.
5. Record drill result and any schema gaps.

## Launch-Era Backup Checklist

Use this before a launch or rollback window:

1. Export critical entities before publishing.
2. Record current GitHub release commit.
3. Record current Base44 app ID and publish target.
4. Verify Stripe package IDs and webhook endpoint in the launch preflight, without storing secrets.
5. After launch proof, export newly created test/proof Orders and related records.
6. If rollback occurs, export affected records before and after rollback for reconciliation.

## Escalate Before Action

Ask Nolan before:

- Exporting customer data to a new destination.
- Giving another agent or person access to backups.
- Running scripts that mutate entity data.
- Deleting, overwriting, or bulk-updating records.
- Changing credential, auth, permission, provider, or security settings.
