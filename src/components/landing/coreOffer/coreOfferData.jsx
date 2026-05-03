import {
  Zap,
  PhoneCall,
  MessageSquare,
  Send,
  RotateCcw,
  CalendarCheck,
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
  ShoppingCart,
  CreditCard,
  Rocket,
};

export const coreOfferSectionConfig = {
  eyebrow: "How It Works",
  headline: "How The 6 Automation System Works",
  subheadline:
    "One connected automation system handles the real work that usually gets dropped: instant response, missed-call recovery, nurture, booking, reactivation, and review requests.",
  helperLine:
    "You do not need a pile of disconnected tools. We set up one system built around the six automations your business actually uses.",
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
    title: "A Lead Or Call Comes In",
    summary: "A website form is submitted or a call is missed, and the system catches it immediately.",
    systemsIncluded: ["01", "02"],
  },
  {
    id: "respond-fast",
    title: "The Lead Gets A Fast First Response",
    summary: "The business replies quickly instead of letting a new lead sit and cool off.",
    systemsIncluded: ["01", "02"],
  },
  {
    id: "follow-up",
    title: "Follow-Up Keeps The Conversation Moving",
    summary: "If the lead does not book immediately, nurture and reactivation keep working in the background.",
    systemsIncluded: ["03", "05"],
  },
  {
    id: "booking",
    title: "Ready Leads Get Guided Toward Booking",
    summary: "The AI booking flow helps warm leads take the next step with less friction.",
    systemsIncluded: ["04"],
  },
  {
    id: "proof",
    title: "Happy Customers Become Reputation Growth",
    summary: "After the service is complete, the system prompts for reviews and turns good experiences into proof.",
    systemsIncluded: ["06"],
  },
];

export const systemGroups = [
  { id: "capture-and-respond", label: "Capture And Respond", systems: ["01", "02"] },
  { id: "nurture-and-book", label: "Nurture And Book", systems: ["03", "04"] },
  { id: "recover-and-grow", label: "Recover And Grow", systems: ["05", "06"] },
];

export const systemsById = {
  "01": {
    id: "01",
    service_key: "instant_lead_response",
    icon: "Zap",
    title: "Instant Lead Response",
    shortDescription:
      "The moment a new lead comes in, the system sends the first response automatically so speed is no longer dependent on staff availability.",
    badge: "Fast first touch",
    mapStageId: "respond-fast",
    detail: {
      summary: "New leads hear from your business right away instead of waiting around.",
      trigger: "A website form or new lead source creates a fresh inquiry.",
      action: "The system sends an immediate first response by text or email using your configured messaging.",
      leadView: "They get a quick reply while they are still interested.",
      businessValue: "Faster response usually means more conversations and more booked opportunities.",
      includes: ["Immediate first touch", "SMS or email delivery", "Reduced lead drop-off"],
    },
  },
  "02": {
    id: "02",
    service_key: "missed_call_text_back",
    icon: "PhoneCall",
    title: "Missed Call Text-Back",
    shortDescription:
      "If someone calls and nobody answers, the system texts back automatically so the missed call still becomes a live lead opportunity.",
    badge: "Recovers missed calls",
    mapStageId: "respond-fast",
    detail: {
      summary: "A missed call becomes a conversation instead of a lost chance.",
      trigger: "An inbound call is not answered.",
      action: "The system sends a fast recovery text and invites the caller to reply or book.",
      leadView: "They get acknowledged quickly instead of feeling ignored.",
      businessValue: "More missed calls get recovered into real pipeline activity.",
      includes: ["Automatic text-back", "Caller recovery", "Booking or reply handoff"],
    },
  },
  "03": {
    id: "03",
    service_key: "nurture_sequence_14d",
    icon: "Send",
    title: "14-Day Nurture Sequence",
    shortDescription:
      "If a lead does not book right away, the system keeps following up over time so warm interest does not quietly disappear.",
    badge: "Steady follow-up",
    mapStageId: "follow-up",
    detail: {
      summary: "Warm leads stay warm instead of going cold after the first contact.",
      trigger: "A lead enters follow-up without booking immediately.",
      action: "Timed nurture messages continue the conversation over the next two weeks.",
      leadView: "They hear from your business consistently without needing manual chasing.",
      businessValue: "More leads return and convert because follow-up does not depend on memory.",
      includes: ["Timed sequence", "Multi-touch nurture", "Reduced lead decay"],
    },
  },
  "04": {
    id: "04",
    service_key: "ai_booking_agent",
    icon: "CalendarCheck",
    title: "AI Booking Agent",
    shortDescription:
      "When a lead is ready, the booking flow helps move them into the next available step without unnecessary back-and-forth.",
    badge: "Books more smoothly",
    mapStageId: "booking",
    detail: {
      summary: "Ready leads get pushed into a clearer booking path.",
      trigger: "A lead is ready for pricing, availability, or scheduling.",
      action: "The automation shares the next step, booking link, or confirmation path automatically.",
      leadView: "Scheduling feels easier and faster.",
      businessValue: "Less friction means more qualified leads actually book.",
      includes: ["Booking handoff", "Less back-and-forth", "Confirmation support"],
    },
  },
  "05": {
    id: "05",
    service_key: "lead_reactivation",
    icon: "RotateCcw",
    title: "Lead Reactivation",
    shortDescription:
      "Old leads that never converted can be re-engaged automatically so your past ad spend still has a chance to produce revenue.",
    badge: "Reopens old leads",
    mapStageId: "follow-up",
    detail: {
      summary: "Old leads get another chance to turn into revenue.",
      trigger: "You have older leads sitting idle in the database.",
      action: "The system sends a reconnect message to reopen the conversation.",
      leadView: "They get a timely reminder instead of being forgotten forever.",
      businessValue: "You can recover value from leads you already paid to get.",
      includes: ["Reconnect outreach", "Old lead recovery", "Revived pipeline opportunities"],
    },
  },
  "06": {
    id: "06",
    service_key: "review_request",
    icon: "MessageSquare",
    title: "Review Request Automation",
    shortDescription:
      "Once the customer experience is complete, the system sends a review request so good outcomes turn into public proof more consistently.",
    badge: "Builds reputation",
    mapStageId: "proof",
    detail: {
      summary: "Strong customer experiences get turned into public proof more consistently.",
      trigger: "A job is complete or a manual review trigger is fired.",
      action: "The system sends a review request by SMS or email using the configured review link.",
      leadView: "They get a simple, well-timed prompt instead of a random ask later.",
      businessValue: "More reviews can improve trust and conversion for future leads.",
      includes: ["SMS or email delivery", "Review-link support", "Timed reputation prompt"],
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
    description: "Pick the automations you need from the AI Store.",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80",
    bullets: [
      "Explore the automations in the AI Store",
      "Watch quick demo videos for each automation",
      "See exactly what each service does and when it runs",
      "Build your stack around the workflows you actually need",
    ],
  },
  {
    id: "02",
    number: "2",
    icon: "CreditCard",
    title: "Quick Signup & Checkout",
    duration: "5 min",
    description: "Create your account, choose your stack, and pay securely.",
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=80",
    bullets: [
      "Sign up in about a minute",
      "Add the selected automations to cart",
      "Review setup and recurring costs clearly",
      "Pay securely through Stripe",
    ],
  },
  {
    id: "03",
    number: "3",
    icon: "Zap",
    title: "Install Queue & Setup",
    duration: "1-2 hours",
    description: "Your order enters the install workflow and the system gets configured behind the scenes.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80",
    bullets: [
      "Order enters the install queue",
      "Integrations and messaging rails get configured",
      "Automation logic is activated for the purchased stack",
      "Operator visibility stays tied to the admin workspace",
    ],
  },
  {
    id: "04",
    number: "4",
    icon: "Rocket",
    title: "Go Live",
    duration: "After setup",
    description: "Your automation stack starts handling real leads and customer touchpoints.",
    image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80",
    bullets: [
      "Lead response flows go live",
      "Missed-call recovery and nurture begin running",
      "Booking and review workflows are ready to trigger",
      "The admin side can monitor install and automation progress",
    ],
  },
];
