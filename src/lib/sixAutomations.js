// Canonical public automation definitions.
// These six keys mirror the locked Starter / Growth / Pro package catalog.
// AI voice is not part of this core list; it remains an optional consultative add-on.

export const SIX_AUTOMATIONS = [
  {
    id: "lead-capture",
    serviceKey: "instant_lead_response",
    slug: "lead-capture-automation",
    routePath: "/lead-capture-automation",
    title: "Instant Lead Response Automation",
    shortTitle: "Instant Lead Response",
    icon: "inbox",
    summary: "Captures a new inquiry and sends the first approved response while the lead is still active.",
    bullets: ["Captures inbound inquiries", "Records source and contact details", "Starts the approved response workflow"],
    whatItDoes: "Turns website forms and supported inbound sources into organized CRM leads, then starts the configured first-response workflow.",
    whoFor: "Local service businesses that need faster, more consistent response to website and campaign inquiries.",
    triggers: ["New website form", "Landing-page inquiry", "Supported ad lead", "Approved inbound source"],
    exampleMessages: [
      "Thanks for reaching out. We received your request and will help you shortly.",
      "What service are you interested in, and what is the best way to reach you?",
    ],
    before: "New inquiries sit in separate inboxes or wait for a manual response.",
    after: "The inquiry is captured, attributed, and moved into a trackable response workflow.",
    industries: ["HVAC", "Plumbing", "Roofing", "Dental", "Med spas", "Contractors", "Chiropractic"],
  },
  {
    id: "missed-call-text-back",
    serviceKey: "missed_call_text_back",
    slug: "missed-call-text-back",
    routePath: "/missed-call-text-back",
    title: "Missed-Call Text-Back Automation",
    shortTitle: "Missed-Call Text-Back",
    icon: "phone",
    summary: "Sends a configured text after a supported missed-call event so the caller has a clear way to continue the conversation.",
    bullets: ["Responds after missed calls", "Keeps caller context in the CRM", "Routes replies into follow-up"],
    whatItDoes: "Receives a supported missed-call webhook, sends the approved text-back message, and records the outcome for follow-up.",
    whoFor: "Service businesses where unanswered calls can become lost estimates, appointments, or urgent jobs.",
    triggers: ["Missed inbound call", "After-hours call", "Busy-line call", "Configured phone webhook"],
    exampleMessages: [
      "Sorry we missed your call. What can we help you with today?",
      "We can still help. Reply here and we will get you the best next step.",
    ],
    before: "Callers reach voicemail and may contact the next business.",
    after: "Missed callers receive a prompt text and their reply can continue inside the lead workflow.",
    industries: ["HVAC", "Plumbing", "Roofing", "Dental", "Med spas", "Contractors", "Chiropractic"],
  },
  {
    id: "ai-follow-up",
    serviceKey: "nurture_sequence_14d",
    slug: "ai-lead-follow-up",
    routePath: "/ai-lead-follow-up",
    title: "14-Day Lead Nurture Automation",
    shortTitle: "14-Day Nurture",
    icon: "message",
    summary: "Runs an approved SMS and email follow-up sequence until the lead replies, books, opts out, or reaches the sequence limit.",
    bullets: ["Keeps follow-up consistent", "Stops on reply or opt-out", "Records each communication event"],
    whatItDoes: "Schedules approved follow-up steps across SMS and email while respecting reply, booking, bounce, and opt-out stop conditions.",
    whoFor: "Teams that lose opportunities because manual follow-up becomes inconsistent after the first contact.",
    triggers: ["New qualified lead", "No reply after first contact", "Approved nurture enrollment", "Follow-up due"],
    exampleMessages: [
      "Just checking in. Do you still want help with this?",
      "Should we close this request, or would you like the next available step?",
    ],
    before: "Staff follow up once or twice and the opportunity disappears.",
    after: "The lead receives a controlled sequence with a clear recorded outcome.",
    industries: ["HVAC", "Plumbing", "Roofing", "Dental", "Med spas", "Contractors", "Chiropractic"],
  },
  {
    id: "appointment-booking",
    serviceKey: "ai_booking_agent",
    slug: "appointment-booking-automation",
    routePath: "/appointment-booking-automation",
    title: "AI Booking Handoff Automation",
    shortTitle: "AI Booking Handoff",
    icon: "calendar",
    summary: "Collects booking intent and routes the lead to the configured booking link, request workflow, or staff confirmation process.",
    bullets: ["Captures booking intent", "Collects required intake details", "Uses the client’s configured booking process"],
    whatItDoes: "Moves an interested lead toward the client’s approved scheduling process. Actual calendar confirmation depends on the client’s connected booking provider and configuration.",
    whoFor: "Appointment and estimate-based businesses that need a cleaner handoff from interest to a confirmed next step.",
    triggers: ["Lead asks to book", "Qualification completed", "Booking link requested", "Preferred time submitted"],
    exampleMessages: [
      "I can help with the next step. Here is the approved booking link.",
      "What day works best? Our team will confirm the requested time.",
    ],
    before: "Warm leads wait for a manual scheduling response without clear ownership.",
    after: "Booking intent and intake details are routed through the configured confirmation process.",
    industries: ["Dental", "Med spas", "Chiropractic", "HVAC", "Plumbing", "Roofing", "Contractors"],
  },
  {
    id: "reactivation",
    serviceKey: "lead_reactivation",
    slug: "customer-reactivation",
    routePath: "/customer-reactivation",
    title: "Old Lead Reactivation Automation",
    shortTitle: "Old Lead Reactivation",
    icon: "refresh",
    summary: "Re-engages an approved segment of dormant leads or past opportunities through controlled batch messaging.",
    bullets: ["Targets approved CRM segments", "Uses controlled batch limits", "Records replies and opt-outs"],
    whatItDoes: "Selects an approved dormant segment and sends the configured reactivation message while tracking every attempt and response.",
    whoFor: "Businesses with old inquiries, unclosed estimates, no-shows, or past customers that may still have a relevant need.",
    triggers: ["Approved dormant segment", "Old unclosed quote", "Past inquiry", "Configured reactivation campaign"],
    exampleMessages: [
      "Are you still looking to get this handled?",
      "We are checking back on your earlier request. Reply if you still need help.",
    ],
    before: "Old opportunities remain untouched in spreadsheets, inboxes, or the CRM.",
    after: "An approved segment receives controlled outreach with measurable outcomes.",
    industries: ["HVAC", "Plumbing", "Roofing", "Med spas", "Dental", "Chiropractic", "Contractors"],
  },
  {
    id: "review-reputation",
    serviceKey: "review_request",
    slug: "review-automation",
    routePath: "/review-automation",
    title: "Review Request Automation",
    shortTitle: "Review Requests",
    icon: "star",
    summary: "Sends the approved review request after a configured completion signal or manual trigger.",
    bullets: ["Uses the client’s approved review link", "Supports configured SMS or email", "Records request delivery"],
    whatItDoes: "Starts a review-request workflow after the configured service-completion event or an authorized manual trigger.",
    whoFor: "Local businesses that rely on recent customer feedback and want a consistent review-request process.",
    triggers: ["Configured completion event", "Authorized manual trigger", "Eligible customer record", "Approved review link"],
    exampleMessages: [
      "Thanks for choosing us. Would you leave a quick review using this link?",
      "Your feedback helps local customers understand what to expect.",
    ],
    before: "Review requests are manual, inconsistent, or sent too late.",
    after: "Eligible customers receive the approved request at the configured time.",
    industries: ["HVAC", "Plumbing", "Roofing", "Dental", "Med spas", "Chiropractic", "Contractors"],
  },
];

export const INDUSTRY_AUTOMATION_USE_CASES = {
  "med-spa": [
    "A treatment inquiry becomes a CRM lead with service interest and source attached.",
    "A missed consultation call receives the configured text-back message.",
    "An unbooked inquiry enters the approved nurture sequence.",
    "Booking intent routes to the med spa’s configured booking or confirmation process.",
    "An eligible completed visit can trigger the approved review request.",
    "An approved past-inquiry segment can enter a controlled reactivation campaign.",
  ],
  dental: [
    "A new-patient inquiry is captured with need, urgency, and contact details.",
    "A missed patient call receives the configured text-back message.",
    "An unbooked new-patient inquiry enters the approved nurture sequence.",
    "Booking intent routes to the practice’s configured scheduling process.",
    "An eligible completed appointment can trigger the approved review request.",
    "An approved dormant-patient segment can enter a reactivation campaign.",
  ],
  chiropractic: [
    "A first-visit inquiry is captured with the patient’s request and contact details.",
    "A missed clinic call receives the configured text-back message.",
    "An unbooked inquiry enters the approved nurture sequence.",
    "Booking intent routes to the clinic’s configured scheduling process.",
    "An eligible completed visit can trigger the approved review request.",
    "An approved inactive-patient segment can enter a reactivation campaign.",
  ],
  hvac: [
    "A service request becomes a CRM lead with issue type, urgency, and source.",
    "A missed homeowner call receives the configured text-back message.",
    "An unbooked repair or estimate request enters the approved nurture sequence.",
    "Booking intent routes to the HVAC company’s configured dispatch or scheduling process.",
    "An eligible completed job can trigger the approved review request.",
    "An approved seasonal or dormant-lead segment can enter reactivation.",
  ],
  plumbing: [
    "An urgent plumbing inquiry is captured with issue type, location, and contact details.",
    "A missed homeowner call receives the configured text-back message.",
    "An unbooked repair request enters the approved nurture sequence.",
    "Booking intent routes to the plumbing company’s configured dispatch process.",
    "An eligible completed job can trigger the approved review request.",
    "An approved old-estimate segment can enter reactivation.",
  ],
  roofing: [
    "A storm or inspection inquiry is captured with issue, location, and source.",
    "A missed homeowner call receives the configured text-back message.",
    "An unbooked estimate request enters the approved nurture sequence.",
    "Inspection intent routes to the roofer’s configured confirmation process.",
    "An eligible completed inspection or job can trigger the approved review request.",
    "An approved old-estimate segment can enter reactivation.",
  ],
  contractors: [
    "A project inquiry is captured with job type, location, timeline, and contact details.",
    "A missed estimate call receives the configured text-back message.",
    "An unbooked quote request enters the approved nurture sequence.",
    "Estimate intent routes to the contractor’s configured confirmation process.",
    "An eligible completed project can trigger the approved review request.",
    "An approved old-quote segment can enter reactivation.",
  ],
};

export function getAutomationBySlug(slug) {
  return SIX_AUTOMATIONS.find((automation) => automation.slug === slug) || null;
}

export function getAutomationRoutes() {
  return SIX_AUTOMATIONS.map((automation) => automation.routePath);
}

export function getIndustryAutomationUseCases(industrySlug) {
  return INDUSTRY_AUTOMATION_USE_CASES[industrySlug] || [];
}
