import {
  PUBLIC_STORE_PRODUCTS,
  getPackageOffer,
  getServiceProductByKey,
} from "./salesCatalog";

export const INDUSTRY_SELECTION_STORAGE_KEY = "clientsurge:selected-industry";

const INDUSTRY_CONFIG = [
  {
    id: "med-spa",
    name: "Med Spas & Aesthetic Clinics",
    shortName: "Med Spas",
    recommendedPackageKey: "pro_system",
    priorityServiceKeys: [
      "instant_lead_response",
      "ai_booking_agent",
      "review_request",
    ],
    summary:
      "Best when fast replies, booking momentum, reactivation, and review growth all need to work together.",
    whyItWorks:
      "Med spas usually win when speed, no-show recovery, and repeat bookings all get handled consistently.",
    pressurePoints: [
      "Consultation leads go cold fast if nobody replies quickly.",
      "High-value prospects need follow-up that feels polished, not pushy.",
      "Reviews and repeat visits strongly affect trust and revenue.",
    ],
    recommendedServiceKeys: [
      "instant_lead_response",
      "missed_call_text_back",
      "nurture_sequence_14d",
      "ai_booking_agent",
      "lead_reactivation",
      "review_request",
    ],
    serviceReasons: {
      instant_lead_response:
        "Gets consultation inquiries answered right away while the prospect is still excited.",
      missed_call_text_back:
        "Protects high-intent callers who reach out between treatments or after hours.",
      nurture_sequence_14d:
        "Keeps treatment shoppers engaged while they compare pricing, timing, and providers.",
      ai_booking_agent:
        "Moves serious leads toward a consultation without forcing your front desk to chase every inquiry manually.",
      lead_reactivation:
        "Reopens older consultation leads and brings quiet prospects back into the conversation.",
      review_request:
        "Builds public trust after a positive appointment so more new prospects feel safe booking.",
    },
    addOnProductIds: ["prod_UNi5Df5KWsS4lW", "prod_UNi5Li4ZFZGRIc"],
  },
  {
    id: "dental",
    name: "Dental & Orthodontics",
    shortName: "Dental",
    recommendedPackageKey: "pro_system",
    priorityServiceKeys: [
      "instant_lead_response",
      "nurture_sequence_14d",
      "review_request",
    ],
    summary:
      "Best when response speed, treatment follow-up, reactivation, and review consistency all matter.",
    whyItWorks:
      "Dental practices lose value when new patient inquiries sit, treatment plans stall, and recall opportunities go untouched.",
    pressurePoints: [
      "New patient leads often compare multiple offices at once.",
      "Treatment interest can fade if follow-up feels slow or inconsistent.",
      "Long-term growth depends on reviews, retention, and recall behavior.",
    ],
    recommendedServiceKeys: [
      "instant_lead_response",
      "missed_call_text_back",
      "nurture_sequence_14d",
      "ai_booking_agent",
      "lead_reactivation",
      "review_request",
    ],
    serviceReasons: {
      instant_lead_response:
        "Gets new patient inquiries answered before they book with another practice.",
      missed_call_text_back:
        "Catches patients who call during busy clinical hours and keeps them from dropping off.",
      nurture_sequence_14d:
        "Supports treatment consideration and recall-style follow-up when patients do not book immediately.",
      ai_booking_agent:
        "Creates a smoother handoff from inquiry to appointment request.",
      lead_reactivation:
        "Reconnects with older patients or leads who never finished the booking process.",
      review_request:
        "Encourages satisfied patients to leave social proof that helps new patients choose you.",
    },
    addOnProductIds: ["prod_UNi5ybXQSG6QkX", "prod_UNi5Li4ZFZGRIc"],
  },
  {
    id: "chiro-pt",
    name: "Chiropractic & Physical Therapy",
    shortName: "Chiro & PT",
    recommendedPackageKey: "growth_system",
    priorityServiceKeys: [
      "instant_lead_response",
      "nurture_sequence_14d",
      "ai_booking_agent",
    ],
    summary:
      "Best when consistent follow-up and easier booking matter more than flashy complexity.",
    whyItWorks:
      "These clinics depend on fast intake, fewer no-shows, and steady follow-up for leads who need time before committing.",
    pressurePoints: [
      "Patients often ask questions first and book later.",
      "Missed calls and delayed replies create easy drop-off points.",
      "Schedules depend on repeat visits, not just one-time bookings.",
    ],
    recommendedServiceKeys: [
      "instant_lead_response",
      "missed_call_text_back",
      "nurture_sequence_14d",
      "ai_booking_agent",
    ],
    serviceReasons: {
      instant_lead_response:
        "Answers first-touch inquiries quickly while the patient is still looking for care.",
      missed_call_text_back:
        "Keeps phone inquiries alive when staff is in treatment or away from the desk.",
      nurture_sequence_14d:
        "Gives hesitant prospects a gentle follow-up path instead of letting them disappear.",
      ai_booking_agent:
        "Makes the move from interest to appointment feel simple and guided.",
    },
    addOnProductIds: ["prod_UNi5ybXQSG6QkX", "prod_UNi5Df5KWsS4lW"],
  },
  {
    id: "hvac",
    name: "HVAC, Plumbing & Home Services",
    shortName: "Home Services",
    recommendedPackageKey: "growth_system",
    priorityServiceKeys: [
      "missed_call_text_back",
      "instant_lead_response",
      "ai_booking_agent",
    ],
    summary:
      "Best when missed calls, speed-to-lead, and booking handoff are the biggest revenue leaks.",
    whyItWorks:
      "Home service businesses live and die on response speed, especially when callers are comparing multiple providers right now.",
    pressurePoints: [
      "Missed calls often become lost jobs within minutes.",
      "Urgent leads need immediate next steps, not a voicemail black hole.",
      "Busy teams need automation that keeps work moving while they are in the field.",
    ],
    recommendedServiceKeys: [
      "instant_lead_response",
      "missed_call_text_back",
      "nurture_sequence_14d",
      "ai_booking_agent",
    ],
    serviceReasons: {
      instant_lead_response:
        "Gets new service inquiries acknowledged immediately, even when the team is on jobs.",
      missed_call_text_back:
        "Protects the highest-intent leads by texting back fast after a missed call.",
      nurture_sequence_14d:
        "Keeps estimate and quote leads warm until they are ready to commit.",
      ai_booking_agent:
        "Pushes ready prospects into a cleaner scheduling handoff instead of endless back-and-forth.",
    },
    addOnProductIds: ["prod_UNi5nfHZ3XKzzZ", "prod_UNi53DY2nkRTuM"],
  },
  {
    id: "roofing",
    name: "Roofing & Restoration",
    shortName: "Roofing",
    recommendedPackageKey: "pro_system",
    priorityServiceKeys: [
      "instant_lead_response",
      "lead_reactivation",
      "ai_booking_agent",
    ],
    summary:
      "Best when long-cycle leads need follow-up discipline and old opportunities still have real value.",
    whyItWorks:
      "Roofing and restoration sales often take longer to close, so response speed and reactivation both matter more than a single message blast.",
    pressurePoints: [
      "Storm and inspection leads cool off fast if you do not reply immediately.",
      "Large-ticket jobs often need longer nurture before a quote turns into a close.",
      "Old estimate leads can still convert if re-engaged at the right time.",
    ],
    recommendedServiceKeys: [
      "instant_lead_response",
      "missed_call_text_back",
      "nurture_sequence_14d",
      "ai_booking_agent",
      "lead_reactivation",
      "review_request",
    ],
    serviceReasons: {
      instant_lead_response:
        "Responds fast while the homeowner is still actively requesting estimates.",
      missed_call_text_back:
        "Protects urgent inbound calls that would otherwise go to the next contractor.",
      nurture_sequence_14d:
        "Keeps quote-stage leads warm through a longer decision cycle.",
      ai_booking_agent:
        "Moves inspection-ready prospects toward the next step faster.",
      lead_reactivation:
        "Brings older estimate leads back into view instead of leaving money buried in the CRM.",
      review_request:
        "Supports trust-building after completed jobs so future homeowners feel safer choosing you.",
    },
    addOnProductIds: ["prod_UNi5nfHZ3XKzzZ", "prod_UNi5Li4ZFZGRIc"],
  },
  {
    id: "contractors",
    name: "Contractors & Trades",
    shortName: "Trades",
    recommendedPackageKey: "growth_system",
    priorityServiceKeys: [
      "missed_call_text_back",
      "instant_lead_response",
      "nurture_sequence_14d",
    ],
    summary:
      "Best when field teams need lead coverage, follow-up, and booking help without extra admin work.",
    whyItWorks:
      "Contractors often lose leads while working in the field, so the biggest win is fast response plus consistent follow-up.",
    pressurePoints: [
      "Owners and techs are often too busy to answer every inquiry live.",
      "Leads fall through the cracks when follow-up depends on memory.",
      "Basic organization and fast response usually outperform complicated software stacks.",
    ],
    recommendedServiceKeys: [
      "instant_lead_response",
      "missed_call_text_back",
      "nurture_sequence_14d",
      "ai_booking_agent",
    ],
    serviceReasons: {
      instant_lead_response:
        "Answers new inquiries immediately while the crew is on-site or driving between jobs.",
      missed_call_text_back:
        "Saves high-intent callers from giving up after one missed ring.",
      nurture_sequence_14d:
        "Keeps the job lead alive while the customer compares timing, pricing, and scope.",
      ai_booking_agent:
        "Gives ready prospects an easier path to the next call, quote, or appointment.",
    },
    addOnProductIds: ["prod_UNi5nfHZ3XKzzZ", "prod_UNi5aQjPk58U4o"],
  },
  {
    id: "veterinary",
    name: "Veterinary Clinics",
    shortName: "Veterinary",
    recommendedPackageKey: "growth_system",
    priorityServiceKeys: [
      "missed_call_text_back",
      "instant_lead_response",
      "ai_booking_agent",
    ],
    summary:
      "Best when missed calls, after-hours inquiries, appointment reminders, and follow-up all need to work together for pet owners.",
    whyItWorks:
      "Veterinary practices depend on fast response to appointment requests, reliable reminders, and consistent follow-up to keep schedules full and pets healthy.",
    pressurePoints: [
      "After-hours calls about sick or injured pets often go unanswered.",
      "Missed calls mean missed appointments — pet owners move on to the next clinic.",
      "Manual reminders and follow-up don't scale, leading to no-shows and patient drop-off.",
    ],
    recommendedServiceKeys: [
      "instant_lead_response",
      "missed_call_text_back",
      "nurture_sequence_14d",
      "ai_booking_agent",
    ],
    serviceReasons: {
      instant_lead_response:
        "Responds to new appointment inquiries immediately, even when the front desk is busy with patients.",
      missed_call_text_back:
        "Captures pet owners who call when lines are busy or after hours, preventing them from going elsewhere.",
      nurture_sequence_14d:
        "Keeps undecided pet owners engaged with helpful follow-up until they are ready to book.",
      ai_booking_agent:
        "Moves ready-to-book pet owners toward an appointment without requiring front-desk phone tag.",
    },
    addOnProductIds: ["prod_UNi5ybXQSG6QkX", "prod_UNi5Df5KWsS4lW"],
  },
];

function getProductById(productId) {
  return PUBLIC_STORE_PRODUCTS.find((product) => product.product_id === productId) || null;
}

function enrichIndustry(config) {
  return {
    ...config,
    recommendedPackage: getPackageOffer(config.recommendedPackageKey),
    recommendedServices: config.recommendedServiceKeys
      .map((serviceKey) => {
        const product = getServiceProductByKey(serviceKey);
        if (!product) {
          return null;
        }

        return {
          ...product,
          whyThisMatters: config.serviceReasons[serviceKey] || "",
        };
      })
      .filter(Boolean),
    addOnsByReview: config.addOnProductIds.map(getProductById).filter(Boolean),
  };
}

export const INDUSTRY_RECOMMENDATIONS = INDUSTRY_CONFIG.map(enrichIndustry);

export const INDUSTRY_RECOMMENDATIONS_BY_ID = Object.fromEntries(
  INDUSTRY_RECOMMENDATIONS.map((industry) => [industry.id, industry])
);

export function getIndustryRecommendation(industryId) {
  return INDUSTRY_RECOMMENDATIONS_BY_ID[industryId] || null;
}

export function getSelectedIndustryId() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage.getItem(INDUSTRY_SELECTION_STORAGE_KEY);
}

export function getSelectedIndustryRecommendation() {
  const industryId = getSelectedIndustryId();
  return industryId ? getIndustryRecommendation(industryId) : null;
}