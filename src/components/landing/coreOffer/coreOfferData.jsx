import {
  Zap,
  PhoneCall,
  MessageSquare,
  Send,
  RotateCcw,
  CalendarCheck,
  LayoutDashboard,
  HeadphonesIcon,
  ShoppingCart,
  CreditCard,
  Rocket,
} from "lucide-react";

export const iconMap = {
  Zap,
  PhoneCall,
  MessageSquare,
  Send,
  RotateCcw,
  CalendarCheck,
  LayoutDashboard,
  HeadphonesIcon,
  ShoppingCart,
  CreditCard,
  Rocket,
};

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
    systemsIncluded: ["02", "03"],
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
  { id: "get-the-lead", label: "Get The Lead", systems: ["02"] },
  { id: "move-the-lead", label: "Move The Lead", systems: ["03", "04", "05"] },
  { id: "close-and-organize", label: "Close And Organize", systems: ["06", "07"] },
  { id: "improve-over-time", label: "Improve Over Time", systems: ["08"] },
];

export const systemsById = {
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
      includes: ["Automatic text-back", "Fast reply after missed call", "Works when staff is busy"],
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
      includes: ["Keeps conversation moving", "Removes dead space", "Helps ready leads take action"],
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
      trigger: "A lead goes quiet after the first touchpoint or does not book right away.",
      action: "Timed follow-up messages keep the lead warm.",
      leadView: "They hear from your business consistently without being forgotten.",
      businessValue: "More leads come back and convert instead of dying silently.",
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
      leadView: "They get a relevant reminder instead of being forgotten forever.",
      businessValue: "Old leads can become fresh opportunities.",
      includes: ["Reopens old conversations", "Uses reconnect messaging", "Helps recover missed value"],
    },
  },
  "06": {
    id: "06",
    service_key: "ai_booking_agent",
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
      includes: ["Smoother scheduling path", "Less friction", "Faster movement to appointment"],
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
      trigger: "A lead replies, changes stage, or needs internal follow-through.",
      action: "The system updates the right information automatically.",
      leadView: "They experience a business that feels organized and on top of things.",
      businessValue: "Your team gets cleaner visibility and fewer workflow gaps.",
      includes: ["Keeps lead status organized", "Reduces manual tracking", "Supports team follow-through"],
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
      action: "We review performance, tune messaging, and keep improving the setup.",
      leadView: "They keep experiencing a polished system instead of a stale one.",
      businessValue: "The automation keeps getting stronger after launch.",
      includes: ["Continued refinement", "Post-launch tuning", "Ongoing support"],
    },
  },
};

export const launchTimelineSteps = [
  {
    id: "01",
    number: "1",
    icon: "ShoppingCart",
    title: "Browse & Select",
    duration: "5-10 min",
    description: "Pick the automations you need from our AI Store.",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80",
    bullets: [
      "Explore 12+ automation services in the AI Store",
      "Watch 2-3 minute demo videos for each automation",
      "See exactly what each service does and when it runs",
      "Build your custom stack—only pay for what you need",
    ],
  },
  {
    id: "02",
    number: "2",
    icon: "CreditCard",
    title: "Quick Signup & Checkout",
    duration: "5 min",
    description: "Create account, add to cart, and pay securely.",
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=80",
    bullets: [
      "Sign up with email and password in 60 seconds",
      "Add your selected automations to cart",
      "Review total setup fee and monthly cost",
      "Pay securely via Stripe—done",
    ],
  },
  {
    id: "03",
    number: "3",
    icon: "LayoutDashboard",
    title: "Instant Dashboard Access",
    duration: "Immediate",
    description: "You're in the system right now with everything ready.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
    bullets: [
      "Access your private dashboard immediately after payment",
      "Download setup guides and integration docs",
      "Watch video tutorials for each automation",
      "See real-time status of your services",
    ],
  },
  {
    id: "04",
    number: "4",
    icon: "Zap",
    title: "We Install Everything",
    duration: "1-2 hours",
    description: "Our system configures everything in the background while you watch.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80",
    bullets: [
      "Automated setup connects your integrations",
      "Your messaging and automation logic configured instantly",
      "All follow-up sequences and booking flows activated",
      "You don't have to do anything—we handle it all",
    ],
  },
  {
    id: "05",
    number: "5",
    icon: "Rocket",
    title: "You're Live & We Notify You",
    duration: "Fully automated",
    description: "Your automations are running and generating value now.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
    bullets: [
      "All services live and actively handling leads",
      "Real-time dashboard shows leads coming through",
      "We send you a notification and onboarding session invite",
      "We optimize your setup based on your actual lead flow",
    ],
  },
];