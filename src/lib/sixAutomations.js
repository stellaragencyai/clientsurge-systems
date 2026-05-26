// Canonical automation definitions — single source of truth.
// id = stable internal key, slug = URL segment used in routes, routePath = full route path.
export const SIX_AUTOMATIONS = [
  {
    id: "missed-call-text-back",
    slug: "missed-call-text-back",
    routePath: "/missed-call-text-back",
    title: "Missed-Call Text-Back Automation",
    shortTitle: "Missed-Call Text-Back",
    icon: "phone",
    summary:
      "When a business misses a call, the system instantly texts the lead so they do not call a competitor.",
    bullets: [
      "Texts missed callers instantly",
      "Captures caller details",
      "Routes replies into follow-up",
    ],
    whatItDoes:
      "Detects missed calls, sends an immediate text-back, captures the lead context, and routes the conversation into follow-up or booking.",
    whoFor:
      "Local service businesses where phone calls, after-hours inquiries, and unanswered calls turn into lost revenue.",
    triggers: ["Missed inbound call", "After-hours call", "Busy-line call", "Qualified phone inquiry"],
    exampleMessages: [
      "Sorry we missed your call. What can we help you with today?",
      "We can still help. Reply here and we will get you the fastest next step.",
    ],
    before: "Callers hit voicemail, hang up, or call the next competitor.",
    after: "Missed callers receive an instant reply and stay in your pipeline.",
    industries: ["HVAC", "Roofing", "Dental", "Med spas", "Contractors", "Chiropractic"],
  },
  {
    id: "lead-capture",
    slug: "lead-capture-automation",
    routePath: "/lead-capture-automation",
    title: "Lead Capture Automation",
    shortTitle: "Lead Capture",
    icon: "inbox",
    summary:
      "Turns website visitors, form fills, ad traffic, and phone inquiries into organized leads inside your CRM or pipeline.",
    bullets: [
      "Captures every inquiry",
      "Tags lead source",
      "Notifies the right person instantly",
    ],
    whatItDoes:
      "Captures every inbound lead source and routes the contact, source, service interest, and next step into one trackable pipeline.",
    whoFor:
      "Service businesses running ads, getting website traffic, taking phone calls, or collecting contact forms.",
    triggers: ["New website form", "Inbound call", "Ad lead form", "Chat request", "Landing page opt-in"],
    exampleMessages: [
      "Thanks for reaching out. We received your request and can help with this.",
      "What service are you interested in, and what is the best time to reach you?",
    ],
    before: "Leads arrive in separate inboxes, spreadsheets, voicemail, ad platforms, and staff notes.",
    after: "Every lead is captured, tagged, routed, and ready for follow-up inside one system.",
    industries: ["Med spas", "Dental offices", "HVAC companies", "Roofers", "Contractors", "Chiropractors"],
  },
  {
    id: "ai-follow-up",
    slug: "ai-lead-follow-up",
    routePath: "/ai-lead-follow-up",
    title: "AI Lead Follow-Up Automation",
    shortTitle: "AI Follow-Up",
    icon: "message",
    summary:
      "Automatically follows up with new leads by SMS and email until they reply, book, or opt out.",
    bullets: [
      "Improves speed-to-lead",
      "Prevents forgotten follow-up",
      "Keeps prospects warm",
    ],
    whatItDoes:
      "Runs a structured follow-up sequence that keeps interested prospects warm without manual chasing.",
    whoFor:
      "Teams that lose leads because staff are busy, inconsistent, or unable to follow up after hours.",
    triggers: ["New lead captured", "No reply after first contact", "Quote sent", "Consultation request"],
    exampleMessages: [
      "Just checking in. Do you still want help with this?",
      "We have openings this week if you want to get this handled.",
    ],
    before: "Staff follow up once or twice, then leads disappear.",
    after: "Every lead gets a consistent sequence until there is a clear outcome.",
    industries: ["Med spas", "Dental", "Chiropractic", "HVAC", "Roofing", "Contractors"],
  },
  {
    id: "appointment-booking",
    slug: "appointment-booking-automation",
    routePath: "/appointment-booking-automation",
    title: "Appointment Booking Automation",
    shortTitle: "Appointment Booking",
    icon: "calendar",
    summary:
      "Helps convert interested leads into booked appointments with reminders, confirmations, qualification, and calendar sync.",
    bullets: [
      "Reduces booking friction",
      "Confirms appointments",
      "Sends reminders automatically",
    ],
    whatItDoes:
      "Moves qualified leads from conversation to scheduled appointment, then confirms and reminds them before the visit.",
    whoFor:
      "Appointment-based teams that need more confirmed consults, estimates, patient visits, or service calls.",
    triggers: ["Lead is ready to book", "Calendar slot selected", "Appointment confirmed", "Reminder window"],
    exampleMessages: [
      "We have openings tomorrow at 2 PM or Friday morning. Which works best?",
      "Confirmed. We will send a reminder before your appointment.",
    ],
    before: "Warm leads need manual scheduling and many fall out before confirming.",
    after: "The system guides them to a time, confirms the booking, and sends reminders.",
    industries: ["Dental", "Med spas", "Chiropractic", "HVAC", "Roofing", "Contractors"],
  },
  {
    id: "review-reputation",
    slug: "review-automation",
    routePath: "/review-automation",
    title: "Review & Reputation Automation",
    shortTitle: "Review Automation",
    icon: "star",
    summary:
      "Requests reviews after completed jobs and helps build stronger Google reputation over time.",
    bullets: [
      "Triggers review requests",
      "Improves review volume",
      "Surfaces unhappy customers earlier",
    ],
    whatItDoes:
      "Sends timely review requests after successful appointments, jobs, or projects while the experience is still fresh.",
    whoFor:
      "Businesses that depend on local search trust, Google reviews, referrals, and social proof.",
    triggers: ["Job completed", "Appointment completed", "Invoice paid", "Positive customer signal"],
    exampleMessages: [
      "Thanks for choosing us today. Would you mind leaving a quick Google review?",
      "Your feedback helps local customers know who to trust.",
    ],
    before: "Review requests are manual, forgotten, or sent too late.",
    after: "Happy customers get a clean review request at the right moment.",
    industries: ["HVAC", "Roofing", "Dental", "Med spas", "Chiropractic", "Contractors"],
  },
  {
    id: "reactivation",
    slug: "customer-reactivation",
    routePath: "/customer-reactivation",
    title: "Reactivation / Win-Back Automation",
    shortTitle: "Customer Reactivation",
    icon: "refresh",
    summary:
      "Re-engages old leads, past customers, no-shows, unbooked quotes, and cold opportunities with targeted campaigns.",
    bullets: [
      "Revives old opportunities",
      "Books past inquiries",
      "Creates revenue from existing contacts",
    ],
    whatItDoes:
      "Finds dormant opportunities and sends relevant win-back messages based on service type, timing, and customer history.",
    whoFor:
      "Businesses with old leads, past customers, missed appointments, or unclosed estimates sitting in the database.",
    triggers: ["Dormant lead", "Past customer due date", "No-show", "Old quote", "Seasonal campaign"],
    exampleMessages: [
      "Are you still looking to get this handled?",
      "We have a few openings this week if you want to revisit your estimate.",
    ],
    before: "Old leads and past customers sit untouched in the CRM.",
    after: "The system brings back qualified opportunities with targeted follow-up.",
    industries: ["HVAC", "Roofing", "Med spas", "Dental", "Chiropractic", "Contractors"],
  },
];

export const INDUSTRY_AUTOMATION_USE_CASES = {
  "med-spa": [
    "New treatment inquiry becomes a captured CRM lead with service interest attached.",
    "Missed Botox or filler call gets an instant text-back before the lead books elsewhere.",
    "Consultation request receives AI follow-up until they book or opt out.",
    "Interested lead gets guided to a consultation time with reminders.",
    "Completed visit triggers a review request while the experience is fresh.",
    "Past clients receive targeted reactivation for seasonal treatments and maintenance visits.",
  ],
  dental: [
    "New patient form or emergency request is organized by need, urgency, and contact details.",
    "Missed patient call receives an immediate text-back with next available appointment options.",
    "Unbooked new patient inquiry gets follow-up by SMS and email.",
    "Ready patient gets appointment options, confirmation, and reminders.",
    "Completed appointment triggers a reputation request for Google reviews.",
    "Dormant patients and unscheduled treatment plans get reactivation campaigns.",
  ],
  chiropractic: [
    "Insurance or first-visit inquiry is captured with patient needs and contact details.",
    "Missed clinic call gets a fast text-back with availability and intake direction.",
    "New patient lead receives follow-up until they schedule or decline.",
    "Interested patient gets available visit times, confirmation, and reminders.",
    "Completed visit triggers a review request for local search visibility.",
    "Past patients receive reactivation for maintenance care or unfinished treatment plans.",
  ],
  hvac: [
    "Estimate request becomes a CRM lead with service type, urgency, and address details.",
    "Missed call from a homeowner gets an instant text-back before they call a competitor.",
    "Repair or quote request receives AI follow-up until the homeowner responds.",
    "Booked service call receives confirmation, reminder, and calendar sync.",
    "Completed repair triggers a review request.",
    "Seasonal tune-up list receives a reactivation campaign.",
  ],
  roofing: [
    "Storm damage inquiry is captured with roof issue, location, and inspection need.",
    "Missed homeowner call gets immediate text-back during high-volume storm windows.",
    "Estimate lead receives follow-up with inspection next steps and insurance guidance.",
    "Inspection appointment gets confirmed and reminded automatically.",
    "Completed inspection or job triggers a review request.",
    "Old storm leads and unclosed estimates get targeted win-back campaigns.",
  ],
  contractors: [
    "Project inquiry is captured with job type, location, budget range, and photos if available.",
    "Missed estimate call gets instant text-back while the contractor is on-site.",
    "Quote request receives follow-up until the prospect books, responds, or opts out.",
    "Estimate visit gets confirmed, reminded, and synced to the calendar.",
    "Completed project triggers a reputation request.",
    "Old quotes and past customers receive reactivation for future projects.",
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