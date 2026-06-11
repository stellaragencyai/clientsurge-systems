# Core Offer Section Build Spec

Target component:
- `C:\Base44Projects\clientsurge-systems-main-hotfix\src\components\landing\CoreOffer.jsx`

This document is the implementation blueprint for rebuilding the `How the 8-System Flow Works` section.

## Goals

- Explain the 8-system flow in plain English
- Make the systems feel connected, not random
- Reduce cognitive overload
- Improve trust and clarity
- Support both pricing clicks and demo bookings

## Visual Preservation Rules

These rules are non-negotiable for this section:

- Preserve the current ClientSurge color palette and theme direction
- Preserve the current warm premium bronze / gold / neutral visual language
- Preserve the current typography direction and overall upscale tone
- Preserve a broadly similar homepage layout rhythm so this feels like a refinement, not a redesign
- Do not reinterpret this section into a new theme, color system, or branding style
- Do not introduce a new visual language without explicit user approval first
- Treat this rebuild as an evolution of the current section, not a replacement of the site’s look and feel

## Section Stack

Build the section in this exact order:

1. `CoreOfferSection`
2. `CoreOfferHeader`
3. `SystemMap`
4. `SystemGroupList`
5. `SystemDetailPanel`
6. `LaunchTimeline`
7. `CoreOfferCTA`

---

## Component Data Schema

### 1. `coreOfferSectionConfig`

```js
export const coreOfferSectionConfig = {
  eyebrow: "How It Works",
  headline: "How The 8-System Flow Works",
  subheadline:
    "One connected system handles the work that usually gets dropped: fast replies, missed calls, follow-up, booking, organization, and ongoing improvement.",
  helperLine:
    "You do not need eight separate tools. We set up one system that works together for you.",
  primaryCta: {
    label: "See Plans And Pricing",
    target: "#pricing",
    type: "scroll",
  },
  secondaryCta: {
    label: "Free Automation Audit",
    target: "demo-modal",
    type: "modal",
  },
};
```

### 2. `systemMapStages`

```js
export const systemMapStages = [
  {
    id: "lead-in",
    title: "New Lead Comes In",
    summary: "A form is filled out, a message comes in, or a call is missed.",
    systemsIncluded: ["01", "02"],
  },
  {
    id: "respond-fast",
    title: "The System Responds Fast",
    summary: "The lead hears from your business right away instead of waiting.",
    systemsIncluded: ["01", "02", "03"],
  },
  {
    id: "follow-up",
    title: "The Lead Gets Followed Up",
    summary: "If they do not book immediately, the system keeps the conversation moving.",
    systemsIncluded: ["04", "05"],
  },
  {
    id: "booking",
    title: "The Lead Gets Guided Toward Booking",
    summary: "Ready leads get pushed into a cleaner booking path with less friction.",
    systemsIncluded: ["03", "06"],
  },
  {
    id: "organization",
    title: "The Business Stays Organized And Improving",
    summary: "Your pipeline stays cleaner, and we keep tuning the system after launch.",
    systemsIncluded: ["07", "08"],
  },
];
```

### 3. `systemGroups`

```js
export const systemGroups = [
  {
    id: "get-the-lead",
    label: "Get The Lead",
    systems: ["01", "02"],
  },
  {
    id: "move-the-lead",
    label: "Move The Lead",
    systems: ["03", "04", "05"],
  },
  {
    id: "close-and-organize",
    label: "Close And Organize",
    systems: ["06", "07"],
  },
  {
    id: "improve-over-time",
    label: "Improve Over Time",
    systems: ["08"],
  },
];
```

### 4. `systemsById`

```js
export const systemsById = {
  "01": {
    id: "01",
    icon: "Zap",
    title: "Instant Lead Response",
    shortDescription:
      "When a new lead comes in, the system replies right away so they hear from your business while they are still paying attention.",
    badge: "Fast first response",
    mapStageId: "respond-fast",
    detail: {
      summary: "Fast replies stop new leads from going cold.",
      trigger: "A new lead fills out a form, sends a message, or reaches out for the first time.",
      action: "The system sends the first reply automatically right away.",
      leadView: "They hear from your business immediately instead of waiting.",
      businessValue: "Fast replies help you win more conversations before competitors respond.",
      includes: [
        "Replies quickly",
        "Uses lead context",
        "Works after hours",
      ],
    },
  },
  "02": {
    id: "02",
    icon: "PhoneCall",
    title: "Missed Call Text-Back",
    shortDescription:
      "If someone calls and you miss it, the system sends a text back automatically so the conversation does not stop there.",
    badge: "Missed calls get a reply",
    mapStageId: "lead-in",
    detail: {
      summary: "Missed calls turn into a second chance instead of a dead end.",
      trigger: "A call comes in and no one answers.",
      action: "The system sends a text back automatically to reopen the conversation.",
      leadView: "They still get a fast response instead of feeling ignored.",
      businessValue: "Missed calls stop turning into lost opportunities.",
      includes: [
        "Automatic text-back",
        "Fast reply after missed call",
        "Works when staff is busy",
      ],
    },
  },
  "03": {
    id: "03",
    icon: "MessageSquare",
    title: "Booking Conversation",
    shortDescription:
      "When someone is interested, the system helps move the conversation toward booking instead of letting it stall.",
    badge: "Keeps interest moving",
    mapStageId: "booking",
    detail: {
      summary: "Interested leads get guided instead of left hanging.",
      trigger: "A lead shows interest but has not taken the next step yet.",
      action: "The conversation keeps moving toward booking instead of stalling.",
      leadView: "The experience feels guided and responsive.",
      businessValue: "More warm inquiries turn into real appointments.",
      includes: [
        "Keeps conversation moving",
        "Removes dead space",
        "Helps ready leads take action",
      ],
    },
  },
  "04": {
    id: "04",
    icon: "Send",
    title: "Follow-Up Sequence",
    shortDescription:
      "If a lead does not book right away, the system keeps following up so they do not disappear.",
    badge: "Steady follow-up",
    mapStageId: "follow-up",
    detail: {
      summary: "Leads stay warm instead of fading out after first contact.",
      trigger: "A lead goes quiet after the first touchpoint or does not book right away.",
      action: "Timed follow-up messages keep the lead warm.",
      leadView: "They hear from your business consistently without being forgotten.",
      businessValue: "More leads come back and convert instead of dying silently.",
      includes: [
        "Multi-step follow-up",
        "Spaced timing",
        "Keeps leads warm",
      ],
    },
  },
  "05": {
    id: "05",
    icon: "RotateCcw",
    title: "Lead Reactivation",
    shortDescription:
      "If old leads went quiet, the system reaches back out so you can reopen conversations you already paid to get.",
    badge: "Wakes old leads back up",
    mapStageId: "follow-up",
    detail: {
      summary: "Old leads get another chance to become revenue.",
      trigger: "You already have old leads sitting in your list that never converted.",
      action: "It reaches back out with a reconnect message.",
      leadView: "They get a relevant reminder instead of being forgotten forever.",
      businessValue: "Old leads can become fresh opportunities.",
      includes: [
        "Reopens old conversations",
        "Uses reconnect messaging",
        "Helps recover missed value",
      ],
    },
  },
  "06": {
    id: "06",
    icon: "CalendarCheck",
    title: "Booking Flow",
    shortDescription:
      "When someone is ready, the system makes scheduling feel easier and faster.",
    badge: "Less booking friction",
    mapStageId: "booking",
    detail: {
      summary: "Ready leads reach the booking step with less friction.",
      trigger: "A lead is ready to schedule.",
      action: "It pushes them into a cleaner booking path with less back-and-forth.",
      leadView: "Scheduling feels easier, faster, and less frustrating.",
      businessValue: "More ready prospects complete the booking step.",
      includes: [
        "Smoother scheduling path",
        "Less friction",
        "Faster movement to appointment",
      ],
    },
  },
  "07": {
    id: "07",
    icon: "LayoutDashboard",
    title: "Pipeline Organization",
    shortDescription:
      "As leads move, the system keeps things organized so your team does not have to track everything by hand.",
    badge: "Cleaner lead tracking",
    mapStageId: "organization",
    detail: {
      summary: "The business stays more organized behind the scenes.",
      trigger: "A lead replies, changes stage, or needs internal follow-through.",
      action: "The system updates the right information automatically.",
      leadView: "They experience a business that feels organized and on top of things.",
      businessValue: "Your team gets cleaner visibility and fewer workflow gaps.",
      includes: [
        "Keeps lead status organized",
        "Reduces manual tracking",
        "Supports team follow-through",
      ],
    },
  },
  "08": {
    id: "08",
    icon: "HeadphonesIcon",
    title: "Ongoing Support",
    shortDescription:
      "After launch, we keep improving the system so it does not go stale.",
    badge: "Built to get better",
    mapStageId: "organization",
    detail: {
      summary: "The system keeps improving after it goes live.",
      trigger: "The system is live and handling real lead flow.",
      action: "We review performance, tune messaging, and keep improving the setup.",
      leadView: "They keep experiencing a polished system instead of a stale one.",
      businessValue: "The automation keeps getting stronger after launch.",
      includes: [
        "Continued refinement",
        "Post-launch tuning",
        "Ongoing support",
      ],
    },
  },
};
```

### 5. `launchTimelineSteps`

```js
export const launchTimelineSteps = [
  {
    id: "01",
    number: "1",
    title: "Quick Onboarding Call",
    description: "We learn your business, your offers, and how your lead flow works.",
  },
  {
    id: "02",
    number: "2",
    title: "We Build And Configure",
    description: "We set up the messaging, automation logic, follow-up flow, and booking path.",
  },
  {
    id: "03",
    number: "3",
    title: "Launch And Improve",
    description: "You go live, and we keep refining the system as it starts handling real leads.",
  },
];
```

### 6. `coreOfferUiState`

```js
export const coreOfferUiState = {
  defaultSelectedSystemDesktop: "01",
  defaultSelectedSystemMobile: null,
  mobileBehavior: "anchored-panel",
  allowMapHighlight: true,
  allowIndustryHighlight: true,
};
```

---

## Exact Visual Build Prompt / Spec For Code

Use this as the implementation prompt/spec:

> Rebuild the `CoreOffer` section into a calmer, premium, product-like explainer with a strong emphasis on clarity and scan speed. Keep the existing warm bronze/gold palette, but reduce glossy effects and reduce visual overload. The section must contain, in order: a simple centered header, a connected 5-stage system map, grouped 8-system cards, an anchored detail panel that updates in place when a card is clicked, a 3-step launch timeline, and a final CTA block. Do not use modal-first behavior. On desktop, the system map should be horizontal, the cards should be grouped into labeled sections, and the detail panel should appear beneath the grid in a wide two-column layout. On mobile, everything should stack vertically, and the detail panel should be easy to scan without feeling cramped. Use subtle hover/focus states, soft borders, warm-white cards, restrained shadows, and clear selected states. Prioritize readability, premium spacing, and trustworthy presentation over spectacle.

### Visual Intent

- Calm premium product section
- Strong typography
- Warm neutral surfaces
- Bronze/gold accent only where useful
- Clear content hierarchy
- Minimal motion

### Visual Rules

- Avoid heavy glassmorphism
- Avoid multiple stacked gradients per card
- Avoid aggressive hover scaling
- Avoid text overload inside cards
- Avoid flashy badges everywhere

### Desktop Layout Spec

#### Header
- centered
- max width: `760px`
- eyebrow, headline, subheadline, helper line

#### System Map
- 5 horizontal nodes
- thin connector line behind them
- each node:
  - title
  - one short sentence
- selected node highlights when selected system belongs to it

#### Grouped Cards
- groups stacked vertically
- each group has a small uppercase label
- cards displayed in a 2-column grid where appropriate
- card min height around `250px`
- spacing between cards: `20px`
- spacing between groups: `40px`

#### Detail Panel
- anchored below all groups
- wide container
- left intro column
- right 2x2 detail blocks
- included list below
- CTA row below content

#### Launch Timeline
- 3 equal-width cards in a row
- simple connectors or arrows
- lighter visual weight than the main cards

#### CTA
- centered
- one short headline
- one support line
- two buttons

### Mobile Layout Spec

#### Header
- stacked
- tighter spacing
- headline remains strong but shorter

#### System Map
- vertical stack
- one node per row

#### Grouped Cards
- stacked full width
- each group label above cards

#### Detail Panel
- stacked vertically below cards
- no modal
- no cramped multi-column layout

#### Launch Timeline
- vertical 1-2-3 stack

#### CTA
- buttons stacked full width

### Spacing Intent

Use a clean rhythm:

- `8px` micro spacing
- `12px` small spacing
- `16px` regular spacing
- `24px` block spacing
- `40px` group spacing
- `56px-64px` major section spacing

### Interaction Rules

#### Card click
- selects a system
- updates detail panel below
- selected card gets stronger border and subtle highlight

#### Card hover
- slight lift only
- stronger border only
- no dramatic zoom or glow

#### Focus
- all interactive elements need visible focus ring

#### Motion
- soft fade/slide when detail panel changes
- respect reduced-motion preference

### Trust Rules

- no unsupported performance claims
- no hard revenue claims unless proven
- plain-English descriptions only
- mechanism before hype

---

## Component State Behavior

### `selectedSystemId`

- desktop default: `"01"`
- mobile default: `null` if accordion behavior is chosen later, otherwise `"01"`

### On card click

- update `selectedSystemId`
- highlight system card
- update detail panel
- highlight related system map stage

### On node click

- optional:
  - scroll/focus to first related system
  - highlight related systems

### On industry personalization

If industry context is available later:
- highlight 2-3 recommended systems
- add tiny “Best fit” indicator
- do not rewrite the whole section

---

## Exact Component List

### `CoreOfferSection`
- owns layout and state

### `CoreOfferHeader`
- eyebrow
- headline
- subheadline
- helper line

### `SystemMap`
- renders `SystemMapNode[]`

### `SystemMapNode`
- title
- summary
- connected state
- highlighted state

### `SystemGroupList`
- renders `SystemGroup[]`

### `SystemGroup`
- label
- list of `SystemCard`

### `SystemCard`
- step
- icon
- title
- description
- badge
- selected state

### `SystemDetailPanel`
- selected title
- summary
- 4 detail blocks
- include list
- CTA row

### `DetailBlock`
- label
- paragraph

### `DetailIncludesList`
- up to 3 included behaviors

### `LaunchTimeline`
- renders `LaunchStepCard[]`

### `LaunchStepCard`
- number
- title
- description

### `CoreOfferCTA`
- final headline
- support line
- pricing CTA
- demo CTA

---

## Build Order

1. Replace data model with the schemas above
2. Build `CoreOfferHeader`
3. Build `SystemMap`
4. Build `SystemGroupList`
5. Build `SystemDetailPanel`
6. Remove modal-first behavior from the section
7. Build `LaunchTimeline`
8. Build `CoreOfferCTA`
9. Add responsive behavior
10. Add personalization hooks later

---

## Implementation Notes For Base44

Best way to implement this in Base44-connected workflow:

- Make the code change locally in Git first
- Keep the data schema inside the repo as JS config, not hardcoded all over the component
- Merge/push to `main` for Base44 to pick it up, because Base44’s official GitHub sync docs say GitHub changes sync from the connected repository and branch setup, and your current live flow is reading `main`
- Then verify inside Base44 preview and published view

Sources:
- GitHub sync: https://docs.base44.com/developers/app-code/local-development/github
- Connectors: https://docs.base44.com/Integrations/Connectors
- Stripe setup: https://docs.base44.com/documentation/setting-up-your-app/setting-up-payments

---

## Recommended Integrations To Start Using Today

Based on Base44’s current official integration support and what your codebase already truly supports, the best 3 to use now are:

1. **Twilio**
- already deeply wired into your platform for SMS, missed-call flows, routing, follow-up, and status webhooks
- Base44 officially supports Twilio SMS integration
- best immediate business value for lead response and missed-call recovery

2. **Stripe**
- already canonical in your order and subscription architecture
- Base44 officially supports Stripe setup and testing flows
- directly tied to revenue and paid customer flow

3. **Google Calendar**
- Base44 officially supports Google Calendar connectors
- your product messaging repeatedly promises booking/calendar flow
- this is the cleanest next step to make booking feel truly real instead of abstract

Why not choose Zapier as a top 3 starting today:
- useful, but broader and less core than Twilio/Stripe/Google Calendar
- best used after your first-party revenue, messaging, and booking stack is locked

Why not choose Slack as a top 3 starting today:
- useful internally, but less customer-facing and less revenue-critical than Google Calendar

Official sources:
- Twilio: https://base44.com/integrations
- Resend: https://base44.com/integrations
- Google Calendar connector: https://docs.base44.com/Integrations/Connectors
- Stripe: https://docs.base44.com/documentation/setting-up-your-app/setting-up-payments
