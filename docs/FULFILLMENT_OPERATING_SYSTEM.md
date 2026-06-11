# Fulfillment Operating System

## Overall Fulfillment Goal

ClientSurge fulfillment turns a paid order into a verified, approved, monitored client system without relying on memory, private chat, or undocumented manual steps. A client is not considered fulfilled because payment cleared; fulfillment is complete only when access is verified, setup is done, QA proof exists, client approval is documented, go-live is controlled, and support cadence is active.

## Client Delivery Lifecycle

| Stage | Trigger | Owner | Required Inputs | Actions | Proof Required | Done Criteria | Blocker Examples |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1. Payment Received | Stripe or order record shows paid status | Admin / billing owner | Order ID, client email, package | Verify order source and package | Paid order record | Payment is confirmed and order is not test/fake data | Failed payment, duplicate order, missing package |
| 2. Order Verified | Payment is received | Admin / billing owner | Order metadata, customer email, selected services | Confirm package, price, email, and business details | Order verification note | Order can safely create fulfillment records | Mismatched package, missing customer email |
| 3. Client Created | Verified paid order | Admin / fulfillment owner | Client name, business name, email, phone | Create or link `Client`, `ClientProject`, and onboarding record | Linked record IDs | Client identity is unambiguous | Duplicate client email, ambiguous portal owner |
| 4. Onboarding Form Sent | Client created | Fulfillment owner | Client email, package, onboarding URL | Send onboarding request through approved channel | Message/email log or admin note | Client has clear intake path | Wrong email, missing portal invite |
| 5. Onboarding Form Submitted | Client submits intake | Fulfillment owner | Intake responses | Review completeness and normalize fields | Submitted onboarding record | Intake is ready for access review | Missing business hours, services, lead sources |
| 6. Access Collected | Intake reviewed | Fulfillment owner | Access checklist items | Request access through secure collection path | Access status checklist | Required access items are received or marked not needed | Client sends passwords in chat, missing DNS/CMS |
| 7. Access Verified | Access received | Fulfillment owner | Credentials, delegated access, screenshots if needed | Confirm logins/delegation work without exposing secrets | Verification note per access item | Required access is usable | 2FA blocks, expired invite, insufficient role |
| 8. System Audit Completed | Required access is verified | Fulfillment owner | Website, forms, CRM/tools, booking, phone, email | Audit current flow and integration needs | Audit summary | Build plan is scoped to purchased package | Broken existing forms, unsupported CRM |
| 9. Automation Build Started | Audit completed | Automation owner | Package services, service configs, client preferences | Start setup in safe admin/provider surfaces | Build start note | Each included automation has owner and setup path | Missing provider access, unclear package scope |
| 10. Automation Setup Completed | Build work finished | Automation owner | Configured providers, templates, routing | Mark setup ready for QA | Setup screenshots/config notes | Automation is configured but not yet live unless approved | Unverified sender, missing booking link |
| 11. Internal QA Started | Setup completed | QA owner | Acceptance criteria, test payloads, test contacts | Run safe local/provider tests | Test run records | QA coverage is underway | No test numbers, provider sandbox unavailable |
| 12. QA Passed | Tests pass | QA owner | Test results, screenshots, logs | Attach proof and mark QA status | QA proof bundle | All included automations meet acceptance criteria | Failed delivery, missing CRM update |
| 13. Client Review Sent | QA passed | Fulfillment owner | Handoff summary, proof, limitations | Send review packet/template only through approved channel | Review sent note | Client can review the system and known limits | Client not reachable, proof incomplete |
| 14. Client Approval Received | Client approves | Fulfillment owner | Written approval | Record approval status and date | Approval note | Go-live can be scheduled | Verbal-only approval, requested change |
| 15. Go-Live Scheduled | Approval recorded | Fulfillment owner | Date, owner, rollback path | Set go-live date and support coverage | Scheduled go-live note | Go-live has owner and fallback | No rollback plan, outside support window |
| 16. Go-Live Completed | Go-live execution finished | Fulfillment owner / automation owner | Final config, QA proof | Turn on approved live flows and verify first live health check | Go-live completion note | System is live and monitored | Live provider error, lead capture down |
| 17. Day 1 Monitoring | Go-live completed | Support owner | Live system status | Run Day 1 checks | Monitoring checklist | Critical lead/booking/notification paths healthy | Client cannot receive leads |
| 18. Day 2 Monitoring | One business day after go-live | Support owner | Day 1 results, new events | Run Day 2 checks | Monitoring checklist | Follow-up paths remain healthy | Follow-up queue stuck |
| 19. Day 3 Monitoring | Three days after go-live | Support owner | Day 1/2 notes | Run Day 3 checks | Monitoring checklist | Nurture/digest/reporting paths are healthy | Nurture not scheduled |
| 20. Day 7 Monitoring | Seven days after go-live | Support owner | Week-one evidence | Run Day 7 checks and close fix log | Week-one monitoring summary | Client can transition to monthly support | Open urgent fix, no client satisfaction check |
| 21. Monthly Support | Day 7 handoff completed | Support owner | Monthly report data, open issue log | Run monthly cadence | Monthly support note/report | Client has current health, open issues, and next actions | Missing metrics, unresolved high-priority issue |

## Go-Live Gate

No client system goes live until:

- Required access is confirmed.
- Automation setup is complete.
- QA proof exists.
- Client approval is documented.
- Rollback/fallback path is documented.

Go-live must be blocked if any required automation lacks proof, if lead capture or booking cannot be verified, if the portal owner is ambiguous, or if the client has not approved the system in writing.

## Monthly Support Cadence

Monthly support includes:

- Monthly health check across active automations, lead capture, booking, notifications, and dashboard visibility.
- Monthly performance summary using real available metrics only.
- Open issue review with owner, priority, current state, and next action.
- Change request review separating included support from paid scope.
- Next-month recommendations grounded in observed system health and client goals.

