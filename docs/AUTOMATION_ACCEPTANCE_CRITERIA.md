# Automation Acceptance Criteria

Do not claim proof exists unless the proof actually exists. Safe tests should use mocks, local records, provider test events, clearly labeled QA records, or admin-owned test destinations. Do not trigger real automations for real clients during acceptance testing.

| Automation | Purpose | Trigger | Required Setup | Expected Action | CRM Update | Client Notification | Customer-Facing Behavior | Failure Behavior | Proof Required | Safe Test Script | Handoff Criteria | Go-Live Criteria |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Instant Lead Response | Reply quickly to new inbound leads | New website/CRM lead | Lead source, message template, opt-out language, sender | Send approved initial response | Lead status/activity records response attempt | Admin alert or digest if configured | Lead receives approved response with compliant language | Log failure and alert admin; do not retry endlessly | Screenshot, mocked payload, local/provider test result, CRM record proof | `npm test -- tests/automationStatus.test.js` plus provider test where approved | Client receives template, routing, proof, and limits | Sender verified, lead capture verified, QA proof attached, client approval recorded |
| Missed Call Text Back | Recover missed calls with SMS | Missed-call webhook/provider event | Phone/Twilio routing, recovery template, quiet-hour rules | Send missed-call text if compliant | Communication event or lead activity updated | Admin notification if configured | Caller receives callback text | Log provider failure and suppress unsafe sends | Mocked webhook payload, provider test event, admin notification proof | Client knows call source and reply expectations | Twilio/phone access verified, test event passed, approval recorded |
| 14-Day Nurture Sequence | Follow up with qualified leads over time | Lead enters nurture segment | Sequence content, timing, opt-out, lead statuses | Schedule/send approved follow-up sequence | Lead stage and follow-up timestamp updated | Digest/report if configured | Lead receives approved follow-up steps | Failed step logs and pauses if required setup missing | Local test result, scheduled-job proof, sample CRM activity | Client approves sequence and cadence | All steps QA tested, opt-out behavior documented, client approval recorded |
| AI Booking Agent | Help convert leads into appointments | Lead asks to book or qualifies for booking | Booking link/calendar, service rules, business hours, escalation copy | Provide booking path and handoff | Lead booking intent/status updated | Admin/client notification for booked/qualified lead | Lead gets correct booking path or fallback | Escalate ambiguous or unsupported questions | Test conversation transcript, booking-link proof, CRM proof | Client receives booking rules and escalation limits | Booking flow verified, business hours verified, client approval recorded |
| Daily Lead Digest | Summarize daily lead movement | Scheduled daily job | Recipient, included lead statuses, summary template | Send digest to approved recipient | None required unless digest event is logged | Daily digest email/message | No direct customer behavior | Log failure and alert admin/support owner | Local dry run, admin notification proof, digest screenshot | Client knows frequency and recipient | Recipient verified, sample digest approved, failure path documented |
| Inbound SMS Assistant | Respond or route inbound SMS | Inbound SMS webhook | Twilio inbound config, assistant rules, escalation, opt-out | Reply or route safely based on rules | Communication event and lead context updated | Admin alert for escalation | Sender receives approved response or human handoff | Suppress unsafe reply and alert admin | Mocked inbound SMS payload, provider test event, CRM proof | Client knows assistant scope and escalation path | Inbound webhook verified, opt-out behavior verified, approval recorded |
| AI Voice Receptionist if included | Answer or route calls with approved voice behavior | Inbound voice call | Phone routing, script, business hours, fallback, consent notes | Answer, qualify, route, or take message | Call summary or lead record created | Admin/client notification if configured | Caller hears approved script and handoff | Fallback to voicemail/human route and alert admin | Provider test call, transcript/summary proof, admin notification proof | Client receives script, routing, and limitation summary | Phone routing verified, fallback verified, client approval recorded |

## Proof Examples

- Screenshot.
- Mocked test payload.
- Local test result.
- Provider test event.
- Admin notification proof.
- CRM record proof.
- Client approval note.

## Acceptance Rules

- Setup complete is not QA passed.
- QA passed is not live.
- Client approval must be recorded before go-live.
- Failed tests must be logged with severity, owner, impact, and retest proof.

