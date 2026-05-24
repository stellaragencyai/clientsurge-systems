// All CoreOffer constants extracted into single source of truth
// This allows easy updates to system definitions without touching component files

export const coreOfferSectionConfig = {
  eyebrow: "How It Works",
  headline: "How The 8-System Flow Works",
  subheadline:
    "One connected system handles the work that usually gets dropped: fast replies, missed calls, follow-up, booking, organization, and ongoing improvement.",
  helperLine:
    "You do not need eight separate tools. We set up one system that works together for you.",
  primaryCta: {
    label: "See Plans And Pricing",
    href: "#pricing",
  },
  secondaryCta: {
    label: "Book Your Free Demo",
  },
};

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

export const systemGroups = [
  { id: "get-the-lead", label: "Get The Lead", systems: ["01", "02"] },
  { id: "move-the-lead", label: "Move The Lead", systems: ["03", "04", "05"] },
  { id: "close-and-organize", label: "Close And Organize", systems: ["06", "07"] },
  { id: "improve-over-time", label: "Improve Over Time", systems: ["08"] },
];

export const systemsById = {
  "01": {
    id: "01",
    service_key: "instant_lead_response",
    icon: "Zap",
    title: "Instant Lead Response",
    shortDescription:
      "When a new lead comes in, the system replies right away so they hear from your business while they are still paying attention.",
    badge: "Fast first response",
    mapStageId: "respond-fast",
    detail: {
      summary: "Fast replies stop new leads from going cold.",
      trigger:
        "A new lead fills out a form, sends a message, or reaches out for the first time.",
      action: "The system sends the first reply automatically right away.",
      leadView: "They hear from your business immediately instead of waiting.",
      businessValue:
        "Fast replies help you win more conversations before competitors respond.",
      includes: ["Replies quickly", "Uses lead context", "Works after hours"],
    },
  },
  "02": {
    id: "02",
    service_key: "missed_call_text_back",
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
    service_key: "ai_booking_agent",
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
    service_key: "nurture_sequence_14d",
    icon: "Send",
    title: "Follow-Up Sequence",
    shortDescription:
      "If a lead does not book right away, the system keeps following up so they do not disappear.",
    badge: "Steady follow-up",
    mapStageId: "follow-up",
    detail: {
      summary: "Leads stay warm instead of fading out after first contact.",
      trigger:
        "A lead goes quiet after the first touchpoint or does not book right away.",
      action: "Timed follow-up messages keep the lead warm.",
      leadView: "They hear from your business consistently without being forgotten.",
      businessValue:
        "More leads come back and convert instead of dying silently.",
      includes: ["Multi-step follow-up", "Spaced timing", "Keeps leads warm"],
    },
  },
  "05": {
    id: "05",
    service_key: "lead_reactivation",
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
      leadView:
        "They get a relevant reminder instead of being forgotten forever.",
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
    service_key: "booking_flow",
    icon: "CalendarCheck",
    title: "Booking Flow",
    shortDescription:
      "When someone is ready, the system makes scheduling feel easier and faster.",
    badge: "Less booking friction",
    mapStageId: "booking",
    detail: {
      summary: "Ready leads reach the booking step with less friction.",
      trigger: "A lead is ready to schedule.",
      action:
        "It pushes them into a cleaner booking path with less back-and-forth.",
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
    service_key: "pipeline_organization",
    icon: "LayoutDashboard",
    title: "Pipeline Organization",
    shortDescription:
      "As leads move, the system keeps things organized so your team does not have to track everything by hand.",
    badge: "Cleaner lead tracking",
    mapStageId: "organization",
    detail: {
      summary: "The business stays more organized behind the scenes.",
      trigger:
        "A lead replies, changes stage, or needs internal follow-through.",
      action: "The system updates the right information automatically.",
      leadView:
        "They experience a business that feels organized and on top of things.",
      businessValue:
        "Your team gets cleaner visibility and fewer workflow gaps.",
      includes: [
        "Keeps lead status organized",
        "Reduces manual tracking",
        "Supports team follow-through",
      ],
    },
  },
  "08": {
    id: "08",
    service_key: "ongoing_support",
    icon: "HeadphonesIcon",
    title: "Ongoing Support",
    shortDescription:
      "After launch, we keep improving the system so it does not go stale.",
    badge: "Built to get better",
    mapStageId: "organization",
    detail: {
      summary: "The system keeps improving after it goes live.",
      trigger: "The system is live and handling real lead flow.",
      action:
        "We review performance, tune messaging, and keep improving the setup.",
      leadView:
        "They keep experiencing a polished system instead of a stale one.",
      businessValue: "The automation keeps getting stronger after launch.",
      includes: [
        "Continued refinement",
        "Post-launch tuning",
        "Ongoing support",
      ],
    },
  },
};

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
    description:
      "We set up the messaging, automation logic, follow-up flow, and booking path.",
  },
  {
    id: "03",
    number: "3",
    title: "Launch And Improve",
    description:
      "You go live, and we keep refining the system as it starts handling real leads.",
  },
];

// Visual constants
export const coreOfferStyles = {
  flowSurface:
    "linear-gradient(180deg, rgba(252,247,241,0.99) 0%, rgba(246,238,228,0.97) 100%)",
  flowSurfaceStrong:
    "linear-gradient(180deg, rgba(255,250,245,1) 0%, rgba(248,240,230,0.99) 100%)",
  flowBorder: "1.5px solid rgba(212, 184, 142, 0.42)",
  flowBorderActive: "1.5px solid rgba(222, 194, 152, 0.72)",
  flowShadow: "0 16px 34px rgba(111,67,31,0.08), 0 2px 12px rgba(111,67,31,0.05)",
  flowShadowActive:
    "0 22px 48px rgba(122,72,37,0.16), 0 8px 22px rgba(154,92,46,0.1)",
  flowBrown:
    "linear-gradient(135deg, #6b3f1f 0%, #9a5c2e 40%, #7a4825 100%)",
  flowBrownSoft:
    "linear-gradient(135deg, #7a4825 0%, #b1723b 42%, #8a542b 100%)",
  flowTextLight: "rgba(252, 241, 222, 0.98)",
  flowTextMuted: "rgba(247, 225, 194, 0.92)",
  flowChipBg: "rgba(245, 217, 168, 0.14)",
  flowChipBorder: "1px solid rgba(238, 204, 157, 0.4)",
  flowTopText: "rgba(184, 129, 72, 0.92)",
  flowIconColor: "#9a5c2e",
  flowIconGlow:
    "0 0 0 1px rgba(255,255,255,0.18), 0 0 28px rgba(245,217,168,0.24)",
};