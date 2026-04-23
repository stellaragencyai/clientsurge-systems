# Demo Video Operating System

## What this is
This repo now has a lightweight demo-video operating layer for sales, onboarding, and operator training.

It does **not** create a fake video platform.
It does **not** assume hosting that does not exist.
It does **not** create a second admin workflow.

It gives the business:
- one canonical inventory of what demo videos should exist
- a practical production workflow using Loom and Descript
- clear mapping from videos to the actual canonical tracked services
- a low-risk public-facing section that can surface real demos later without pretending they are already published

---

## Repo-Specific Audit

### What already exists
- Strong live-demo booking flow on the public site:
  - `/book`
  - demo booking modal and inline forms
  - confirmation SMS and email backend flows
- Several simulated or transcript-style demo surfaces:
  - [AutomationDemo.jsx](C:/Base44Projects/clientsurge-systems/src/components/landing/AutomationDemo.jsx)
  - [AutomationWalkthrough.jsx](C:/Base44Projects/clientsurge-systems/src/components/landing/AutomationWalkthrough.jsx)
  - [Hero.jsx](C:/Base44Projects/clientsurge-systems/src/components/landing/Hero.jsx)
- Canonical operator/install truth already exists in `/admin`:
  - paid install queue
  - install workspace
  - CommunicationEvent-backed timeline
  - service playbooks in `remoteSetupWorkspace.js`

### What does not exist yet
- No real demo-video inventory
- No canonical mapping of service -> demo asset -> usage
- No published public video links in the repo
- No internal operator training clip inventory
- No repeatable naming/storage workflow for Loom recordings and Descript edits

### Best demo surfaces to support first
1. Homepage
2. Pricing/packages
3. Store/service-selection flow
4. Sales follow-up after a demo request or checkout question
5. Internal operator training for `/admin`

---

## Canonical Demo Video System

### Public-facing assets
1. **Flagship agency demo**
   - One end-to-end walkthrough
   - Shows lead -> response -> follow-up -> booking -> operator visibility
   - Best for homepage, booking page, and sales follow-up

2. **Per-service demo clips**
   - Short clips for each canonical tracked service:
     - Instant Lead Response
     - Missed Call Text-Back
     - 14-Day Nurture Sequence
     - AI Booking Agent
     - Old Lead Reactivation
     - Review Request Automation

3. **Industry cutdowns**
   - Optional edits derived from the flagship demo
   - First target: med spa

### Internal assets
1. **Install workspace overview**
   - How to use `/admin`
   - How to read blockers, readiness, tests, and events

2. **Per-service setup pattern**
   - How every service card works
   - What success looks like in CommunicationEvent

---

## Canonical Mapping To Real Services

The public/self-serve service demo clips should map directly to the current canonical service keys:

- `instant_lead_response`
- `missed_call_text_back`
- `nurture_sequence_14d`
- `ai_booking_agent`
- `lead_reactivation`
- `review_request`

Do **not** record first against quarantined legacy surfaces or deprecated Lead-based dashboards.

Use these canonical surfaces instead:
- `/admin` install queue
- `InstallOrderWorkspace`
- canonical runtime test actions
- CommunicationEvent timeline

---

## Practical Workflow

### Recording tool
Use **Loom** for:
- fast screen capture
- screen + webcam
- internal training clips
- initial sales demo recordings

### Editing tool
Use **Descript** for:
- captions
- dead air removal
- quick trims
- vertical or short cutdowns
- text overlays

### Recommended workflow
1. Record in Loom from the real product state.
2. Export or sync into Descript.
3. Create:
   - full version
   - 60-90 second public cut
   - optional industry-specific cut
4. Publish only when the clip is clean and truthful.
5. Add the public URL into the repo catalog later.

---

## Recording SOP

### 1. Flagship demo

#### Goal
Show the whole system in a way sales prospects can understand in under 6 minutes.

#### Record from
- homepage promise
- canonical `/admin` install workspace
- one or two real canonical service examples
- CommunicationEvent timeline

#### Sequence
1. Start with the business problem:
   - slow lead response
   - missed calls
   - weak follow-up
2. Show one lead arriving.
3. Show instant response.
4. Show follow-up or nurture.
5. Show booking handoff.
6. Show how `/admin` controls setup and validation.
7. End with what is real today vs what is still placeholder.

#### Success criteria
- no fake stats
- no fake delivery claims
- no unsupported integrations shown as live
- clearly uses the real canonical operator surfaces

### 2. Per-service demo clips

#### Format
- 45 to 90 seconds
- one service, one promise, one proof point

#### Template
1. Show the trigger
2. Show the operator config surface
3. Show the test action
4. Show the timeline proof
5. Show the business outcome

#### Service-specific emphasis

**Instant Lead Response**
- trigger: new lead
- proof: Send Test Lead
- confirmation: `provider_send_succeeded`

**Missed Call Text-Back**
- trigger: missed call
- proof: Simulate Missed Call
- confirmation: provider send success in timeline

**14-Day Nurture Sequence**
- show sequence builder
- show first-step runtime test
- clearly say scheduler remains placeholder until real cron/live scheduling is added

**AI Booking Agent**
- show booking link + intake fields
- show booking-agent test
- clearly say this is a booking simulation / placeholder runtime if no real external booking creation exists yet

**Old Lead Reactivation**
- show segment + target-size preview
- run reactivation test
- show per-lead and batch summary events

**Review Request Automation**
- show trigger, channel, review link
- run review-request test
- clearly say no fake always-running state exists

### 3. Internal operator clips

#### Workspace overview
Record:
1. open paid order
2. verify purchased services
3. review required actions
4. save config
5. move to Testing
6. run test
7. inspect CommunicationEvent
8. move to Live only when allowed

#### Per-service setup pattern
Record the repeated structure:
1. what to do next
2. required actions
3. config
4. test
5. go-live readiness
6. last result
7. timeline relevance

---

## Naming And Storage SOP

### Recommended folder structure outside the repo
Use one shared cloud folder, for example:

`ClientSurge Systems / Demo Videos /`

Subfolders:
- `01-Flagship`
- `02-Service-Clips`
- `03-Industry-Cutdowns`
- `04-Internal-Operator`
- `05-Exports-Published`

### Recommended naming convention
`YYYY-MM-DD_audience_topic_version`

Examples:
- `2026-04-22_public_flagship-agency-demo_v1`
- `2026-04-22_public_instant-lead-response_v1`
- `2026-04-22_internal_install-workspace-overview_v1`
- `2026-04-22_public_medspa-flagship-cutdown_v1`

### Recommended asset flow
- Loom raw recording
- Descript project
- exported MP4
- hosted share link if published

Do not store large video files in the repo.
Store the inventory, metadata, and URLs in the repo instead.

---

## Website And Sales Usage

### Homepage
Use:
- flagship demo first
- service clip previews second

### Pricing page
Use:
- short service clips tied to what is being sold
- keep package language aligned with canonical services

### Store
Use:
- short service clips only
- no autoplay complexity required

### Book / sales follow-up
Use:
- flagship demo in confirmation/follow-up sequence
- one or two service clips based on what the prospect asked about

### Internal onboarding / operator training
Use:
- workspace overview clip
- per-service pattern clip

---

## What should stay manual for now
- deciding whether a clip is polished enough to publish
- final compliance review of outbound-message examples shown on video
- any claims about real Twilio production delivery while EIN/account restoration is unresolved
- any final customer-facing statement that implies live calendar sync, live scheduler execution, or live review-platform attribution when those are still placeholder/not proven

---

## Current repo support

Current demo-video support now lives in:
- [demoVideoCatalog.js](C:/Base44Projects/clientsurge-systems/src/lib/demoVideoCatalog.js)
- [DemoVideoSection.jsx](C:/Base44Projects/clientsurge-systems/src/components/landing/DemoVideoSection.jsx)

Those files give the business:
- a real inventory
- a homepage-ready section
- clean future support for adding Loom/Descript-published links later
