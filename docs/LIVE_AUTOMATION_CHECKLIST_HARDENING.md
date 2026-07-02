# Live Automation Checklist Dashboard Hardening

## Objective
Turn the admin Install Checklists page from a manual checklist into a live evidence dashboard.

A green check must come from one of these sources:

1. `AutomationChecklistStep.status = complete`
2. A relevant `CommunicationEvent` record tied to the order/service
3. A provider callback/event that was persisted into `CommunicationEvent`

Manual overrides are allowed only as operational annotations. They are not proof.

## Current implementation

### Frontend
`src/components/admin/AutomationInstallChecklist.jsx`

Adds:
- `Live Automation Checklist Dashboard` title
- 30-second auto-refresh
- `Blocked` status chip
- proof counts for events and DB steps
- legacy service-key warning badges
- `Live Proof Reconciliation` panel
- dry-run button for `reconcileLiveAutomationChecklist`
- confirmation-gated write-mode button

### Backend
`base44/functions/reconcileLiveAutomationChecklist/entry.ts`

Adds:
- admin-only access
- dry-run default
- write-mode confirmation string: `RECONCILE_LIVE_AUTOMATION_CHECKLIST`
- legacy service-key normalization
- missing step creation
- DB step updates from live events
- blocked truth status when proof is missing or unsupported
- internal `CommunicationEvent` audit log on write mode

## Legacy service-key migration map

| Legacy key | Canonical key |
|---|---|
| `missed_call_textback` | `missed_call_text_back` |
| `appointment_booking` | `ai_booking_agent` |
| `followup_sequences` | `nurture_sequence_14d` |

## Current service proof map

| Step ID | Evidence event types |
|---|---|
| `lead_form` | `lead_created` |
| `test_lead` | `lead_created`, `booking_simulation_created` |
| `sms_received` | `sms_sent`, `sms_delivered`, `provider_send_succeeded` |
| `step1_sent` | `sms_sent`, `email_sent`, `provider_send_succeeded` |
| `step2_sent` | `email_sent`, `sms_sent` |
| `comm_event_logged` | any relevant `CommunicationEvent` |
| `lead_status_updated` | `status_update`, `workflow_triggered`, `service_status_changed` |
| `twilio_sid` | `sms_sent`, `sms_delivered`, `provider_send_succeeded`, `voice_call_completed`, `voice_call_no_answer` |
| `resend_key` | `email_sent`, `provider_send_succeeded` |
| `twilio_webhook` | `voice_call_no_answer`, `voice_call_completed`, `sms_received` |
| `status_callback` | `sms_delivered`, `provider_send_succeeded`, `provider_send_failed` |
| `test_call` | `voice_call_no_answer`, `voice_call_completed` |
| `automation_schedule` | `workflow_triggered`, `sms_sent`, `email_sent`, `service_status_changed` |
| `stop_on_reply` | `sms_received` |
| `stop_on_reply_verified` | `sms_received` |
| `qualified_trigger` | `workflow_triggered`, `booking_simulation_created`, `sms_sent`, `email_sent`, `service_status_changed` |
| `test_booking` | `booking_simulation_created`, `booking_created` |
| `booking_link_in_sms` | `sms_sent`, `sms_delivered` |
| `test_batch` | `lead_reactivation_batch_completed` |
| `review_link` | `review_request_trigger_simulated` |
| `review_link_saved` | `review_request_trigger_simulated` |
| `test_request` | `review_request_trigger_simulated` |

## Known gaps / next hardening steps

1. Frontend cards should load order-scoped events, not only service-specific events, so order-level proof appears in the expanded event feed.
2. Provider callbacks should write more specific `CommunicationEvent` records where possible. Generic `service_status_changed` is useful, but too broad to prove every checklist step.
3. Stripe proof should be linked through `stripe_session_id`, `stripe_customer_id`, `stripe_event_id`, or metadata when available. Current sample Base44 orders did not match Stripe search by order metadata.
4. QA/test records should either be marked `dashboard_excluded = true` or clearly labeled as QA so they do not pollute production proof counts.
5. Reconciliation write mode should be run only after reviewing dry-run output.

## Safety rules

- Do not delete production records.
- Do not mark dashboard proof trusted unless evidence exists.
- Do not mutate Stripe live objects from this workflow.
- Run dry-run before write mode.
- Treat manual overrides as annotations, not proof.
