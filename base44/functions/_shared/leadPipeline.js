import { LEAD_REACTIVATION_SEGMENTS } from "./installPipeline.js";
import {
  getPackageOffer,
  getServiceProductByKey,
} from "../../../src/lib/salesCatalog.js";

export const LEAD_PIPELINE_MAX_FETCH = 25000;

export const LEAD_STATUSES = [
  "New",
  "Contacted",
  "Replied",
  "Qualified",
  "Booking Prompt Sent",
  "Booked",
  "Closed",
];

export const CRM_STAGES = [
  "Not Contacted",
  "Contacted",
  "Opened / Clicked",
  "Replied",
  "Audit Booked",
  "Audit Completed",
  "Proposal Sent",
  "Won Pending Payment",
  "Won",
  "Lost",
  "Follow Up Later",
];

export const LEAD_STATUS_ALIASES = {
  new: "New",
  not_contacted: "New",
  contacted: "Contacted",
  opened_clicked: "Contacted",
  opened: "Contacted",
  clicked: "Contacted",
  replied: "Replied",
  responded: "Replied",
  qualified: "Qualified",
  booking_prompt_sent: "Booking Prompt Sent",
  bookingpromptsent: "Booking Prompt Sent",
  audit_booked: "Booked",
  booked: "Booked",
  audit_completed: "Booked",
  proposal_sent: "Qualified",
  won_pending_payment: "Qualified",
  won: "Closed",
  lost: "Closed",
  follow_up_later: "Contacted",
  closed: "Closed",
};

export const CRM_STAGE_ALIASES = {
  new: "Not Contacted",
  not_contacted: "Not Contacted",
  contacted: "Contacted",
  opened: "Opened / Clicked",
  clicked: "Opened / Clicked",
  opened_clicked: "Opened / Clicked",
  replied: "Replied",
  responded: "Replied",
  qualified: "Replied",
  booking_prompt_sent: "Replied",
  bookingpromptsent: "Replied",
  booked: "Audit Booked",
  audit_booked: "Audit Booked",
  audit_completed: "Audit Completed",
  proposal_sent: "Proposal Sent",
  won_pending_payment: "Won Pending Payment",
  pending_payment: "Won Pending Payment",
  payment_pending: "Won Pending Payment",
  won: "Won",
  client: "Won",
  closed: "Won",
  lost: "Lost",
  rejected: "Lost",
  follow_up_later: "Follow Up Later",
};

export const LEAD_STAGE_GROUPS = {
  New: "new",
  Contacted: "working",
  Replied: "working",
  Qualified: "qualified",
  "Booking Prompt Sent": "working",
  Booked: "booked",
  Closed: "closed",
};

export const LEAD_INTAKE_TYPES = [
  "lead_capture",
  "contact_inquiry",
  "demo_booking",
  "legacy",
];

export const ACTIONABILITY_SEGMENTS = [
  "reactivation",
  "nurture",
  "qualification",
  "follow_up",
  "high_value_outreach",
  "demo_requested",
  "awaiting_close",
];

export const LEAD_ACTIVATION_SEGMENT_DEFINITIONS = {
  reactivation: {
    label: "Reactivation Ready",
    helper: "Dormant leads that are safe candidates for Old Lead Reactivation.",
  },
  nurture: {
    label: "Nurture Ready",
    helper: "Active leads that need consistent follow-up rather than one-off touches.",
  },
  qualification: {
    label: "Qualification Priority",
    helper: "High-intent leads that should be worked quickly toward a booking conversation.",
  },
  follow_up: {
    label: "Follow-Up Due",
    helper: "Leads overdue for the next operator touch based on last activity or scheduled follow-up.",
  },
  high_value_outreach: {
    label: "High-Value Outreach",
    helper: "High-score or high-intent leads worth immediate operator attention.",
  },
  demo_requested: {
    label: "Demo Requested",
    helper: "Demo-booking leads still awaiting qualification, booking, or close follow-up.",
  },
  awaiting_close: {
    label: "Awaiting Close",
    helper: "Demo-booking leads that are booked or otherwise close-ready and need a close-oriented follow-up.",
  },
};

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeWhitespace(value) {
  return cleanString(value).replace(/\s+/g, " ");
}

function toSlug(value) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizeEmail(value) {
  return cleanString(value).toLowerCase();
}

export function normalizePhone(value) {
  const digits = cleanString(value).replace(/\D/g, "");
  if (!digits) {
    return "";
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  return value?.startsWith("+") ? value.trim() : `+${digits}`;
}

export function normalizeBusinessName(value) {
  return normalizeWhitespace(value).toLowerCase();
}

function parseNumber(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return numeric;
}

function clampScore(value) {
  const numeric = parseNumber(value, 0);
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function isValidDateString(value) {
  if (!value) {
    return false;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && timestamp > 0;
}

function normalizeDateString(value) {
  if (!isValidDateString(value)) {
    return "";
  }

  return new Date(value).toISOString();
}

function getFieldValue(row, aliases) {
  const keys = Object.keys(row || {});
  const normalized = Object.fromEntries(keys.map((key) => [toSlug(key), row[key]]));

  for (const alias of aliases) {
    const direct = row?.[alias];
    if (direct != null && direct !== "") {
      return direct;
    }

    const slugAlias = toSlug(alias);
    if (normalized[slugAlias] != null && normalized[slugAlias] !== "") {
      return normalized[slugAlias];
    }
  }

  return "";
}

function normalizeLeadStatus(value) {
  const raw = cleanString(value);
  if (!raw) {
    return "New";
  }

  if (LEAD_STATUSES.includes(raw)) {
    return raw;
  }

  return LEAD_STATUS_ALIASES[toSlug(raw)] || "New";
}

export function normalizeCrmStage(value, fallbackStatus = "") {
  const raw = cleanString(value);
  if (CRM_STAGES.includes(raw)) {
    return raw;
  }

  const alias = CRM_STAGE_ALIASES[toSlug(raw)];
  if (alias) {
    return alias;
  }

  return CRM_STAGE_ALIASES[toSlug(fallbackStatus)] || "Not Contacted";
}

export function crmStageToLeadStatus(stage, fallbackStatus = "New") {
  const normalizedStage = normalizeCrmStage(stage, fallbackStatus);
  if (normalizedStage === "Not Contacted") return "New";
  if (normalizedStage === "Contacted" || normalizedStage === "Opened / Clicked" || normalizedStage === "Follow Up Later") return "Contacted";
  if (normalizedStage === "Replied") return "Replied";
  if (normalizedStage === "Audit Booked" || normalizedStage === "Audit Completed") return "Booked";
  if (normalizedStage === "Proposal Sent" || normalizedStage === "Won Pending Payment") return "Qualified";
  if (normalizedStage === "Won" || normalizedStage === "Lost") return "Closed";
  return normalizeLeadStatus(fallbackStatus);
}

function normalizeLeadSource(value) {
  const slug = toSlug(value);
  return slug || "imported";
}

function normalizeLeadIntakeType(value) {
  const slug = toSlug(value);
  if (!slug) {
    return "legacy";
  }

  return LEAD_INTAKE_TYPES.includes(slug) ? slug : "legacy";
}

function buildLeadDedupeKey({ normalized_email, normalized_phone, normalized_business_name }) {
  if (normalized_email) {
    return `email:${normalized_email}`;
  }

  if (normalized_phone) {
    return `phone:${normalized_phone}`;
  }

  if (normalized_business_name) {
    return `business:${normalized_business_name}`;
  }

  return "";
}

export function normalizeImportedLeadRow(row, { importSource = "manual_import" } = {}) {
  const firstName = cleanString(getFieldValue(row, ["first_name", "firstname", "first"]));
  const lastName = cleanString(getFieldValue(row, ["last_name", "lastname", "last"]));
  const fullNameValue = cleanString(getFieldValue(row, ["full_name", "name", "lead_name", "contact_name"]));
  const fullName = fullNameValue || [firstName, lastName].filter(Boolean).join(" ").trim() || "Unknown Lead";

  const businessName = cleanString(
    getFieldValue(row, ["business_name", "company", "company_name", "business", "organization"])
  ) || "Unknown Business";
  const email = normalizeEmail(getFieldValue(row, ["email", "email_address"]));
  const phone = normalizePhone(getFieldValue(row, ["phone", "phone_number", "mobile", "mobile_phone"]));
  const normalizedBusinessName = normalizeBusinessName(businessName);
  const status = normalizeLeadStatus(getFieldValue(row, ["status", "stage", "pipeline_status"]));
  const crmStage = normalizeCrmStage(getFieldValue(row, ["crm_stage", "stage", "pipeline_stage"]), status);
  const source = normalizeLeadSource(getFieldValue(row, ["source", "lead_source", "channel"]) || importSource);
  const intakeType = normalizeLeadIntakeType(getFieldValue(row, ["intake_type", "intake", "form_type"]));
  const businessType = cleanString(getFieldValue(row, ["business_type", "industry", "vertical"])) || "unknown";
  const industry = cleanString(getFieldValue(row, ["industry", "business_type", "niche", "vertical"])) || businessType;
  const problem = cleanString(getFieldValue(row, ["problem", "notes", "pain_point", "need"])) || "Imported lead";
  const leadScore = clampScore(getFieldValue(row, ["lead_score", "score", "priority_score"]));
  const createdDate = normalizeDateString(getFieldValue(row, ["created_date", "created_at", "lead_created_at"])) || new Date().toISOString();
  const lastContactedAt = normalizeDateString(getFieldValue(row, ["last_contacted_at", "last_contacted", "contacted_at"]));
  const nextFollowUpAt = normalizeDateString(getFieldValue(row, ["next_follow_up_at", "follow_up_at", "next_touch_at"]));
  const bookingLinkSentAt = normalizeDateString(getFieldValue(row, ["booking_link_sent_at", "booking_prompt_sent_at"]));
  const bookedAt = normalizeDateString(getFieldValue(row, ["booked_at", "appointment_booked_at"]));
  const aiIntent = cleanString(getFieldValue(row, ["ai_intent", "intent"])) || "other";
  const aiLastClassification = cleanString(getFieldValue(row, ["ai_last_classification", "classification"]));
  const aiConfidence = parseNumber(getFieldValue(row, ["ai_confidence", "classification_confidence"]), 0);

  const normalized = {
    full_name: fullName,
    business_name: businessName,
    email,
    phone,
    business_type: businessType,
    industry,
    city: cleanString(getFieldValue(row, ["city"])),
    state: cleanString(getFieldValue(row, ["state"])),
    problem,
    source,
    source_history: [source || importSource].filter(Boolean),
    intake_type: intakeType,
    status,
    crm_stage: crmStage,
    lead_score: leadScore,
    last_contacted_at: lastContactedAt || undefined,
    last_contacted_date: lastContactedAt || undefined,
    next_follow_up_at: nextFollowUpAt || undefined,
    follow_up_date: nextFollowUpAt || undefined,
    booking_link_sent_at: bookingLinkSentAt || undefined,
    booked_at: bookedAt || undefined,
    ai_intent: aiIntent,
    ai_last_classification: aiLastClassification || undefined,
    ai_confidence: aiConfidence,
    normalized_email: email,
    normalized_phone: phone,
    normalized_business_name: normalizedBusinessName,
    dedupe_key: buildLeadDedupeKey({
      normalized_email: email,
      normalized_phone: phone,
      normalized_business_name: normalizedBusinessName,
    }),
    import_source: source || importSource,
    import_batch_id: undefined,
    last_activity_at:
      bookedAt ||
      nextFollowUpAt ||
      lastContactedAt ||
      bookingLinkSentAt ||
      createdDate,
  };

  return normalized;
}

function getReactivationDormantTimestamp(lead) {
  return lead.last_contacted_at || lead.created_date;
}

export function isDormantDate(value, nowTimestamp) {
  if (!value) {
    return true;
  }

  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return true;
  }

  return nowTimestamp - timestamp >= 1000 * 60 * 60 * 24 * 30;
}

export function leadMatchesReactivationSegment(lead, targetSegment, nowTimestamp) {
  const status = cleanString(lead.status);
  const isDormant = isDormantDate(getReactivationDormantTimestamp(lead), nowTimestamp);

  if (!LEAD_REACTIVATION_SEGMENTS.includes(targetSegment)) {
    return false;
  }

  if (targetSegment === "all_dormant") {
    return isDormant && !["Booked", "Closed"].includes(status);
  }

  if (targetSegment === "contacted_no_reply") {
    return status === "Contacted" && isDormant;
  }

  if (targetSegment === "qualified_unbooked") {
    return status === "Qualified" && !lead.booked_at && isDormant;
  }

  return false;
}

function isHighValueLead(lead) {
  const score = parseNumber(lead.lead_score, 0);
  return (
    score >= 75 ||
    ["pricing_interest", "availability_interest", "booking_ready"].includes(cleanString(lead.ai_intent))
  );
}

function isActiveWorkingStatus(status) {
  return ["New", "Contacted", "Replied", "Qualified", "Booking Prompt Sent"].includes(status);
}

function deriveLeadDemoSignals(lead) {
  const isDemoLead = normalizeLeadIntakeType(lead.intake_type) === "demo_booking";
  const status = normalizeLeadStatus(lead.status);
  const demoRequested = isDemoLead && !["Booked", "Closed"].includes(status);
  const awaitingClose = isDemoLead && status === "Booked";

  let demoStage = "none";
  if (isDemoLead && status === "Closed") {
    demoStage = "closed";
  } else if (awaitingClose) {
    demoStage = "awaiting_close";
  } else if (demoRequested) {
    demoStage = "requested";
  } else if (isDemoLead) {
    demoStage = "in_progress";
  }

  return {
    is_demo_lead: isDemoLead,
    demo_requested: demoRequested,
    awaiting_close: awaitingClose,
    demo_stage: demoStage,
  };
}

export function deriveLeadSegments(lead, now = new Date().toISOString()) {
  const nowTimestamp = new Date(now).getTime();
  const status = normalizeLeadStatus(lead.status);
  const isDormant = isDormantDate(getReactivationDormantTimestamp(lead), nowTimestamp);
  const nextFollowUpAt = lead.next_follow_up_at ? new Date(lead.next_follow_up_at).getTime() : 0;
  const lastTouchedAt = lead.last_contacted_at ? new Date(lead.last_contacted_at).getTime() : 0;
  const followUpDueByStaleTouch =
    isActiveWorkingStatus(status) &&
    !["Booked", "Closed"].includes(status) &&
    (!lastTouchedAt || nowTimestamp - lastTouchedAt >= 1000 * 60 * 60 * 24 * 3);

  const followUpDueByScheduledTouch = nextFollowUpAt > 0 && nextFollowUpAt <= nowTimestamp;
  const demoSignals = deriveLeadDemoSignals(lead);

  return {
    reactivation_eligible: leadMatchesReactivationSegment(lead, "all_dormant", nowTimestamp),
    reactivation_contacted_no_reply: leadMatchesReactivationSegment(lead, "contacted_no_reply", nowTimestamp),
    reactivation_qualified_unbooked: leadMatchesReactivationSegment(lead, "qualified_unbooked", nowTimestamp),
    nurture_eligible: !isDormant && isActiveWorkingStatus(status) && status !== "Booked" && status !== "Closed",
    qualification_priority: status !== "Qualified" && status !== "Booked" && status !== "Closed" && isHighValueLead(lead),
    follow_up_due: followUpDueByScheduledTouch || followUpDueByStaleTouch,
    high_value_outreach: status !== "Booked" && status !== "Closed" && isHighValueLead(lead),
    demo_requested: demoSignals.demo_requested,
    awaiting_close: demoSignals.awaiting_close,
  };
}

export function deriveLeadStage(status) {
  return LEAD_STAGE_GROUPS[normalizeLeadStatus(status)] || "working";
}

function buildActionabilityList(segments) {
  return ACTIONABILITY_SEGMENTS.filter((segment) => {
    if (segment === "reactivation") {
      return segments.reactivation_eligible;
    }
    if (segment === "nurture") {
      return segments.nurture_eligible;
    }
    if (segment === "qualification") {
      return segments.qualification_priority;
    }
    if (segment === "follow_up") {
      return segments.follow_up_due;
    }
    if (segment === "high_value_outreach") {
      return segments.high_value_outreach;
    }
    if (segment === "demo_requested") {
      return segments.demo_requested;
    }
    if (segment === "awaiting_close") {
      return segments.awaiting_close;
    }
    return false;
  });
}

function deriveLastActivityAt(lead) {
  return (
    lead.last_activity_at ||
    lead.booked_at ||
    lead.next_follow_up_at ||
    lead.last_contacted_at ||
    lead.booking_link_sent_at ||
    lead.created_date ||
    null
  );
}

function deriveLeadMovementSummary(lead, now = new Date().toISOString()) {
  if (lead.booked_at) {
    return {
      label: "Booked",
      detail: `Booked ${new Date(lead.booked_at).toLocaleString()}`,
      at: lead.booked_at,
    };
  }

  if (lead.next_follow_up_at) {
    const dueTimestamp = new Date(lead.next_follow_up_at).getTime();
    const nowTimestamp = new Date(now).getTime();
    const isDue = Number.isFinite(dueTimestamp) && dueTimestamp <= nowTimestamp;
    return {
      label: isDue ? "Follow-Up Due" : "Follow-Up Scheduled",
      detail: `${isDue ? "Due" : "Scheduled"} ${new Date(lead.next_follow_up_at).toLocaleString()}`,
      at: lead.next_follow_up_at,
    };
  }

  if (lead.booking_link_sent_at) {
    return {
      label: "Booking Prompt Sent",
      detail: `Booking prompt sent ${new Date(lead.booking_link_sent_at).toLocaleString()}`,
      at: lead.booking_link_sent_at,
    };
  }

  if (lead.last_contacted_at) {
    return {
      label: "Last Contacted",
      detail: `Last contacted ${new Date(lead.last_contacted_at).toLocaleString()}`,
      at: lead.last_contacted_at,
    };
  }

  if (lead.created_date) {
    return {
      label: "Imported / Added",
      detail: `Added ${new Date(lead.created_date).toLocaleString()}`,
      at: lead.created_date,
    };
  }

  return {
    label: "No Movement",
    detail: "No tracked activity yet.",
    at: null,
  };
}

function deriveOutreachStatus(lead, segments) {
  if (lead.status === "Closed") {
    return {
      code: "closed",
      label: "Closed",
      helper: "This lead is already closed and should stay out of active outreach queues.",
    };
  }

  if (lead.status === "Booked") {
    return {
      code: "booked",
      label: "Booked",
      helper: "This lead has booked and is best handled as close follow-up, onboarding, or downstream service fit.",
    };
  }

  if (segments.follow_up_due) {
    return {
      code: "follow_up_due",
      label: "Follow-Up Due",
      helper: "Operator touch is overdue based on the canonical follow-up rules.",
    };
  }

  if (lead.status === "New" && !lead.last_contacted_at) {
    return {
      code: "uncontacted",
      label: "Uncontacted",
      helper: "No outreach has been logged yet.",
    };
  }

  if (lead.status === "Contacted" && !lead.booked_at) {
    return {
      code: "waiting_reply",
      label: "Waiting On Reply",
      helper: "Initial contact went out, but there is no reply or booking outcome yet.",
    };
  }

  if (["Replied", "Qualified", "Booking Prompt Sent"].includes(lead.status)) {
    return {
      code: "engaged",
      label: "Engaged",
      helper: "The lead is active in the sales conversation and should be moved toward booking or close.",
    };
  }

  return {
    code: "working",
    label: "Working",
    helper: "This lead is active but does not currently have an overdue follow-up signal.",
  };
}

function determinePrimaryServiceKey(lead, segments) {
  const aiIntent = cleanString(lead.ai_intent);
  const status = normalizeLeadStatus(lead.status);

  if (segments.reactivation_eligible) {
    return "lead_reactivation";
  }

  if (
    segments.awaiting_close ||
    segments.demo_requested ||
    ["booking_ready", "availability_interest"].includes(aiIntent) ||
    ["Qualified", "Booking Prompt Sent", "Booked"].includes(status)
  ) {
    return "ai_booking_agent";
  }

  if (segments.follow_up_due || segments.nurture_eligible) {
    return "nurture_sequence_14d";
  }

  if (segments.qualification_priority || segments.high_value_outreach) {
    return "instant_lead_response";
  }

  return "instant_lead_response";
}

function determineRecommendedServiceKeys(lead, segments) {
  const serviceKeys = [];
  const primaryServiceKey = determinePrimaryServiceKey(lead, segments);
  const status = normalizeLeadStatus(lead.status);

  serviceKeys.push(primaryServiceKey);

  if (segments.qualification_priority || segments.high_value_outreach) {
    serviceKeys.push("instant_lead_response");
  }

  if (segments.follow_up_due || segments.nurture_eligible) {
    serviceKeys.push("nurture_sequence_14d");
  }

  if (segments.demo_requested || segments.awaiting_close || ["Qualified", "Booking Prompt Sent", "Booked"].includes(status)) {
    serviceKeys.push("ai_booking_agent");
  }

  if (segments.reactivation_eligible) {
    serviceKeys.push("lead_reactivation");
  }

  if (status === "Booked" || status === "Closed") {
    serviceKeys.push("review_request");
  }

  return [...new Set(serviceKeys.filter(Boolean))];
}

function determineRecommendedPackage(serviceKeys, primaryServiceKey) {
  if (serviceKeys.includes("lead_reactivation")) {
    return getPackageOffer("pro_system");
  }

  if (
    serviceKeys.includes("nurture_sequence_14d") &&
    (serviceKeys.includes("instant_lead_response") || serviceKeys.includes("ai_booking_agent"))
  ) {
    return getPackageOffer("growth_system");
  }

  if (["instant_lead_response", "ai_booking_agent"].includes(primaryServiceKey)) {
    return getPackageOffer("starter_system");
  }

  if (primaryServiceKey === "nurture_sequence_14d") {
    return getPackageOffer("growth_system");
  }

  return null;
}

function buildOfferAngle(primaryServiceKey, segments) {
  if (primaryServiceKey === "lead_reactivation") {
    return "Recover dormant leads that already showed prior buying intent.";
  }

  if (primaryServiceKey === "ai_booking_agent") {
    return segments.awaiting_close
      ? "Move engaged leads toward a confirmed booking handoff and close outcome."
      : "Reduce booking friction once the lead is showing intent or requesting a demo.";
  }

  if (primaryServiceKey === "nurture_sequence_14d") {
    return "Keep active leads warm with structured follow-up instead of one-off manual touches.";
  }

  if (primaryServiceKey === "review_request") {
    return "Turn completed bookings into social proof and repeatable referral momentum.";
  }

  return "Respond quickly and qualify inbound demand before it goes cold.";
}

function buildOfferReason(lead, segments) {
  if (segments.reactivation_eligible) {
    return "Dormant lead with prior contact history still fits a recovery workflow.";
  }

  if (segments.awaiting_close) {
    return "Demo-booking lead is already booked and now needs a close-oriented handoff.";
  }

  if (segments.demo_requested) {
    return "Demo-booking lead is still in the request/working stage and should be advanced quickly.";
  }

  if (segments.follow_up_due) {
    return "The next follow-up is overdue, so a consistent follow-up system is the clearest fit.";
  }

  if (segments.qualification_priority || segments.high_value_outreach) {
    return "High-intent or high-score lead should be pushed into a faster response and booking path.";
  }

  return "Lead context supports a practical first-step automation offer.";
}

function buildRecommendationSources(lead, segments) {
  const sources = [];

  if (lead.business_name) {
    sources.push("business_name");
  }
  if (lead.source) {
    sources.push("source");
  }
  if (lead.status) {
    sources.push("status");
  }
  if (lead.intake_type) {
    sources.push("intake_type");
  }
  if (lead.ai_intent) {
    sources.push("ai_intent");
  }
  if (lead.lead_score > 0) {
    sources.push("lead_score");
  }
  if (segments.follow_up_due) {
    sources.push("next_follow_up_at");
  }
  if (lead.last_contacted_at) {
    sources.push("last_contacted_at");
  }

  return [...new Set(sources)];
}

export function deriveLeadRecommendedOffer(lead, segments) {
  const primaryServiceKey = determinePrimaryServiceKey(lead, segments);
  const primaryService = getServiceProductByKey(primaryServiceKey);
  const recommendedServiceKeys = determineRecommendedServiceKeys(lead, segments);
  const recommendedPackage = determineRecommendedPackage(recommendedServiceKeys, primaryServiceKey);

  return {
    primary_service_key: primaryServiceKey,
    primary_service_name: primaryService?.name || "Suggested Service",
    package_key: recommendedPackage?.package_key || null,
    package_name: recommendedPackage?.name || null,
    recommended_service_keys: recommendedServiceKeys,
    angle: buildOfferAngle(primaryServiceKey, segments),
    reason: buildOfferReason(lead, segments),
    source_fields: buildRecommendationSources(lead, segments),
    advisory: true,
  };
}

export function deriveLeadNextAction(lead, segments, now = new Date().toISOString()) {
  const movement = deriveLeadMovementSummary(lead, now);

  if (lead.status === "Closed") {
    return {
      code: "no_action",
      label: "Leave Closed",
      detail: "No further sales action is recommended inside the active lead queue.",
      blocker: null,
      urgency_rank: 0,
    };
  }

  if (segments.awaiting_close) {
    return {
      code: "close_follow_up",
      label: "Follow up to close",
      detail: "Booked demo lead should get a close-oriented follow-up and clear next commitment.",
      blocker: null,
      urgency_rank: 95,
    };
  }

  if (segments.demo_requested) {
    return {
      code: "work_demo_request",
      label: "Work demo request first",
      detail: "Demo-requested lead is waiting on qualification, scheduling, or a clear booking handoff.",
      blocker: null,
      urgency_rank: 90,
    };
  }

  if (segments.follow_up_due) {
    return {
      code: "follow_up_now",
      label: "Follow up now",
      detail: `${movement.detail} This lead is overdue for the next operator touch.`,
      blocker: null,
      urgency_rank: 88,
    };
  }

  if (segments.reactivation_eligible) {
    return {
      code: "queue_reactivation",
      label: "Queue for reactivation",
      detail: "Dormant lead fits the canonical reactivation workflow and should be reviewed for recovery outreach.",
      blocker: null,
      urgency_rank: 82,
    };
  }

  if (segments.qualification_priority || segments.high_value_outreach) {
    return {
      code: "qualify_fast",
      label: "Qualify quickly",
      detail: "High-intent lead should be contacted fast and moved toward booking.",
      blocker: null,
      urgency_rank: 80,
    };
  }

  if (lead.status === "New") {
    return {
      code: "first_touch",
      label: "Send first outreach",
      detail: "No contact is logged yet, so the first touch should happen before this lead cools off.",
      blocker: null,
      urgency_rank: 72,
    };
  }

  return {
    code: "maintain_follow_up",
    label: "Maintain follow-up cadence",
    detail: "Keep the lead moving with the next scheduled outreach step.",
    blocker: null,
    urgency_rank: 60,
  };
}

function deriveActivationPriority(lead, segments, nextAction) {
  let priority = Math.round(parseNumber(lead.lead_score, 0) * 0.2);

  if (segments.awaiting_close) {
    priority += 55;
  }
  if (segments.demo_requested) {
    priority += 45;
  }
  if (segments.follow_up_due) {
    priority += 40;
  }
  if (segments.qualification_priority) {
    priority += 32;
  }
  if (segments.high_value_outreach) {
    priority += 28;
  }
  if (segments.reactivation_eligible) {
    priority += 22;
  }
  if (segments.nurture_eligible) {
    priority += 12;
  }
  if (lead.status === "Booked") {
    priority += 10;
  }

  priority += Math.round((nextAction?.urgency_rank || 0) * 0.25);

  return Math.max(0, Math.min(100, priority));
}

function deriveActivationPriorityLabel(lead, priorityScore) {
  const existing = cleanString(lead.activation_priority);
  if (["Hot", "High", "Medium", "Low"].includes(existing)) {
    return existing;
  }

  if (priorityScore >= 85) {
    return "Hot";
  }
  if (priorityScore >= 70) {
    return "High";
  }
  if (priorityScore >= 45) {
    return "Medium";
  }
  return "Low";
}

export function enrichLeadForPipeline(lead, now = new Date().toISOString()) {
  const normalizedLead = {
    ...lead,
    email: normalizeEmail(lead.email),
    phone: normalizePhone(lead.phone),
    normalized_email: normalizeEmail(lead.normalized_email || lead.email),
    normalized_phone: normalizePhone(lead.normalized_phone || lead.phone),
    normalized_business_name: normalizeBusinessName(lead.normalized_business_name || lead.business_name),
    status: normalizeLeadStatus(lead.status),
    crm_stage: normalizeCrmStage(lead.crm_stage, lead.status),
    source: normalizeLeadSource(lead.source),
    intake_type: normalizeLeadIntakeType(lead.intake_type),
    lead_score: clampScore(lead.lead_score),
  };
  const segments = deriveLeadSegments(normalizedLead, now);
  const actionability = buildActionabilityList(segments);
  const demoSignals = deriveLeadDemoSignals(normalizedLead);
  const outreachStatus = deriveOutreachStatus(normalizedLead, segments);
  const nextAction = deriveLeadNextAction(normalizedLead, segments, now);
  const recommendedOffer = deriveLeadRecommendedOffer(normalizedLead, segments);
  const recentMovement = deriveLeadMovementSummary(normalizedLead, now);
  const activationPriorityScore = deriveActivationPriority(normalizedLead, segments, nextAction);
  const activationPriority = deriveActivationPriorityLabel(normalizedLead, activationPriorityScore);

  return {
    ...normalizedLead,
    stage_group: deriveLeadStage(normalizedLead.status),
    automation_segments: segments,
    demo_stage: demoSignals.demo_stage,
    actionability,
    actionable: actionability.length > 0,
    last_activity_at: deriveLastActivityAt(normalizedLead),
    recent_movement: recentMovement,
    outreach_status: outreachStatus,
    next_action: nextAction,
    recommended_offer: recommendedOffer,
    activation_priority: activationPriority,
    activation_priority_score: activationPriorityScore,
    dedupe_key:
      normalizedLead.dedupe_key ||
      buildLeadDedupeKey({
        normalized_email: normalizedLead.normalized_email,
        normalized_phone: normalizedLead.normalized_phone,
        normalized_business_name: normalizedLead.normalized_business_name,
      }),
  };
}

function recordMatchesLead(record, searchValue) {
  if (!searchValue) {
    return true;
  }

  const haystacks = [
    record.full_name,
    record.business_name,
    record.email,
    record.phone,
    record.source,
    record.status,
  ].map((value) => cleanString(value).toLowerCase());

  return haystacks.some((value) => value.includes(searchValue));
}

function recordMatchesSegment(record, segment) {
  if (!segment || segment === "all") {
    return true;
  }

  if (segment === "reactivation") {
    return record.automation_segments.reactivation_eligible;
  }

  if (segment === "nurture") {
    return record.automation_segments.nurture_eligible;
  }

  if (segment === "qualification") {
    return record.automation_segments.qualification_priority;
  }

  if (segment === "follow_up") {
    return record.automation_segments.follow_up_due;
  }

  if (segment === "high_value_outreach") {
    return record.automation_segments.high_value_outreach;
  }

  if (segment === "demo_requested") {
    return record.automation_segments.demo_requested;
  }

  if (segment === "awaiting_close") {
    return record.automation_segments.awaiting_close;
  }

  return false;
}

function applyLeadFilters(records, filters = {}) {
  const search = cleanString(filters.search).toLowerCase();
  const status = cleanString(filters.status);
  const source = cleanString(filters.source);
  const intakeType = cleanString(filters.intake_type);
  const stageGroup = cleanString(filters.stage_group);
  const segment = cleanString(filters.segment);
  const priority = cleanString(filters.priority);
  const industry = cleanString(filters.industry || filters.business_type);

  return records.filter((record) => {
    if (!recordMatchesLead(record, search)) {
      return false;
    }

    if (status && status !== "all" && record.status !== status) {
      return false;
    }

    if (source && source !== "all" && record.source !== source) {
      return false;
    }

    if (intakeType && intakeType !== "all" && record.intake_type !== intakeType) {
      return false;
    }

    if (stageGroup && stageGroup !== "all" && record.stage_group !== stageGroup) {
      return false;
    }

    if (!recordMatchesSegment(record, segment)) {
      return false;
    }

    if (priority && priority !== "all" && record.activation_priority !== priority) {
      return false;
    }

    if (industry && industry !== "all") {
      const requested = toSlug(industry);
      const tokens = [
        record.industry,
        record.business_type,
        ...(Array.isArray(record.industry_tags) ? record.industry_tags : []),
      ].map(toSlug).filter(Boolean);
      if (!tokens.some((token) => token === requested || token.includes(requested) || requested.includes(token))) {
        return false;
      }
    }

    return true;
  });
}

function sortLeadRecords(records) {
  return [...records].sort((left, right) => {
    const priorityDifference = (right.activation_priority_score || 0) - (left.activation_priority_score || 0);
    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    const rightTimestamp = new Date(right.last_activity_at || right.created_date || 0).getTime();
    const leftTimestamp = new Date(left.last_activity_at || left.created_date || 0).getTime();
    return rightTimestamp - leftTimestamp;
  });
}

function incrementCounter(map, key) {
  map[key] = (map[key] || 0) + 1;
}

export function buildLeadPipelineSnapshot({
  leads = [],
  events = [],
  filters = {},
  limit = 100,
  offset = 0,
  now = new Date().toISOString(),
} = {}) {
  const enriched = sortLeadRecords(leads.map((lead) => enrichLeadForPipeline(lead, now)));
  const recentActivitySorted = [...enriched].sort((left, right) => {
    const rightTimestamp = new Date(right.last_activity_at || right.created_date || 0).getTime();
    const leftTimestamp = new Date(left.last_activity_at || left.created_date || 0).getTime();
    return rightTimestamp - leftTimestamp;
  });
  const filtered = applyLeadFilters(enriched, filters);
  const boundedLimit = Math.max(1, Math.min(Number(limit) || 100, 250));
  const boundedOffset = Math.max(0, Number(offset) || 0);
  const page = filtered.slice(boundedOffset, boundedOffset + boundedLimit);

  const statusCounts = {};
  const crmStageCounts = {};
  const stageCounts = {};
  const sourceCounts = {};
  const intakeCounts = {};
  const industryCounts = {};
  const segmentCounts = {
    reactivation: 0,
    nurture: 0,
    qualification: 0,
    follow_up: 0,
    high_value_outreach: 0,
    demo_requested: 0,
    awaiting_close: 0,
  };
  const outreachCounts = {};
  const recommendedOfferCounts = {
    starter_system: 0,
    growth_system: 0,
    pro_system: 0,
    elite_system: 0,
    single_service: 0,
  };

  for (const lead of enriched) {
    incrementCounter(statusCounts, lead.status);
    incrementCounter(crmStageCounts, lead.crm_stage);
    incrementCounter(stageCounts, lead.stage_group);
    incrementCounter(sourceCounts, lead.source || "unknown");
    incrementCounter(intakeCounts, lead.intake_type || "legacy");
    incrementCounter(industryCounts, lead.industry || lead.business_type || "unknown");

    if (lead.automation_segments.reactivation_eligible) {
      segmentCounts.reactivation += 1;
    }
    if (lead.automation_segments.nurture_eligible) {
      segmentCounts.nurture += 1;
    }
    if (lead.automation_segments.qualification_priority) {
      segmentCounts.qualification += 1;
    }
    if (lead.automation_segments.follow_up_due) {
      segmentCounts.follow_up += 1;
    }
    if (lead.automation_segments.high_value_outreach) {
      segmentCounts.high_value_outreach += 1;
    }
    if (lead.automation_segments.demo_requested) {
      segmentCounts.demo_requested += 1;
    }
    if (lead.automation_segments.awaiting_close) {
      segmentCounts.awaiting_close += 1;
    }

    incrementCounter(outreachCounts, lead.outreach_status?.code || "working");
    const packageKey = lead.recommended_offer?.package_key || "single_service";
    incrementCounter(recommendedOfferCounts, packageKey);
  }

  const recentImports = (events || [])
    .filter((event) => cleanString(event.context_type) === "lead_import")
    .slice(0, 10)
    .map((event) => {
      let metadata = {};
      try {
        metadata = event.metadata_json ? JSON.parse(event.metadata_json) : {};
      } catch {
        metadata = {};
      }

      return {
        id: event.id,
        created_date: event.created_date,
        subject: event.subject,
        status: event.status,
        import_batch_id: metadata.import_batch_id || null,
        import_source: metadata.import_source || null,
        created_count: metadata.created_count || 0,
        updated_count: metadata.updated_count || 0,
        skipped_count: metadata.skipped_count || 0,
      };
    });

  const recentLeadActivity = recentActivitySorted.slice(0, 10).map((lead) => ({
    id: lead.id,
    full_name: lead.full_name,
    business_name: lead.business_name,
    status: lead.status,
    stage_group: lead.stage_group,
    last_activity_at: lead.last_activity_at,
    actionability: lead.actionability,
    next_action: lead.next_action,
    recommended_offer: lead.recommended_offer,
    recent_movement: lead.recent_movement,
  }));

  const priorityQueue = enriched
    .filter((lead) => lead.actionable || lead.demo_stage === "requested" || lead.demo_stage === "awaiting_close")
    .slice(0, 12)
    .map((lead) => ({
      id: lead.id,
      full_name: lead.full_name,
      business_name: lead.business_name,
      status: lead.status,
      actionability: lead.actionability,
      outreach_status: lead.outreach_status,
      next_action: lead.next_action,
      recommended_offer: lead.recommended_offer,
      recent_movement: lead.recent_movement,
      activation_priority: lead.activation_priority,
      activation_priority_score: lead.activation_priority_score,
    }));

  const last7Days = [];
  for (let dayOffset = 6; dayOffset >= 0; dayOffset -= 1) {
    const date = new Date(now);
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - dayOffset);
    const dayEnd = new Date(date);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const createdCount = enriched.filter((lead) => {
      const timestamp = new Date(lead.created_date || 0).getTime();
      return timestamp >= date.getTime() && timestamp < dayEnd.getTime();
    }).length;

    last7Days.push({
      date: date.toISOString().slice(0, 10),
      leads: createdCount,
    });
  }

  return {
    generated_at: now,
    summary: {
      total_leads: enriched.length,
      filtered_leads: filtered.length,
      actionable_leads: enriched.filter((lead) => lead.actionable).length,
      status_counts: statusCounts,
      crm_stage_counts: crmStageCounts,
      stage_counts: stageCounts,
      source_counts: sourceCounts,
      intake_counts: intakeCounts,
      industry_counts: industryCounts,
      segment_counts: segmentCounts,
      outreach_counts: outreachCounts,
      recommended_offer_counts: recommendedOfferCounts,
      recent_imports: recentImports,
      recent_lead_activity: recentLeadActivity,
      priority_queue: priorityQueue,
      activation_segments: Object.entries(LEAD_ACTIVATION_SEGMENT_DEFINITIONS).map(([key, definition]) => ({
        key,
        label: definition.label,
        helper: definition.helper,
        count: segmentCounts[key] || 0,
      })),
      last7Days,
    },
    leads: page,
    pagination: {
      limit: boundedLimit,
      offset: boundedOffset,
      returned: page.length,
      total_filtered: filtered.length,
      has_more: boundedOffset + page.length < filtered.length,
    },
    filter_options: {
      statuses: LEAD_STATUSES,
      crm_stages: CRM_STAGES,
      stage_groups: ["new", "working", "qualified", "booked", "closed"],
      intake_types: LEAD_INTAKE_TYPES,
      segments: ACTIONABILITY_SEGMENTS,
      sources: Object.keys(sourceCounts).sort(),
      industries: Object.keys(industryCounts).sort(),
    },
  };
}

function findMatchingLead(existingLeads, normalizedLead) {
  const emailMatches = normalizedLead.normalized_email
    ? existingLeads.filter((lead) => normalizeEmail(lead.normalized_email || lead.email) === normalizedLead.normalized_email)
    : [];
  const phoneMatches = normalizedLead.normalized_phone
    ? existingLeads.filter((lead) => normalizePhone(lead.normalized_phone || lead.phone) === normalizedLead.normalized_phone)
    : [];

  const combinedMatches = [...new Map([...emailMatches, ...phoneMatches].map((lead) => [lead.id, lead])).values()];

  if (emailMatches.length > 1 || phoneMatches.length > 1 || combinedMatches.length > 1) {
    return {
      type: "ambiguous",
      matches: combinedMatches,
    };
  }

  if (combinedMatches.length === 1) {
    return {
      type: "matched",
      match: combinedMatches[0],
    };
  }

  return {
    type: "new",
    match: null,
  };
}

function mergeLeadImport(existingLead, normalizedLead, { importBatchId }) {
  return {
    ...existingLead,
    ...normalizedLead,
    id: existingLead.id,
    created_date: existingLead.created_date,
    import_batch_id: importBatchId,
    import_source: normalizedLead.import_source,
    last_activity_at:
      normalizedLead.last_activity_at ||
      existingLead.last_activity_at ||
      existingLead.last_contacted_at ||
      existingLead.created_date,
  };
}

export function prepareLeadImport({
  rows = [],
  existingLeads = [],
  importSource = "manual_import",
  importBatchId = `lead_import_${Date.now()}`,
  now = new Date().toISOString(),
} = {}) {
  const existingRecords = existingLeads.map((lead) => enrichLeadForPipeline(lead, now));
  const virtualRecords = [...existingRecords];
  const actions = [];
  const counts = {
    total_rows: rows.length,
    creates: 0,
    updates: 0,
    skipped: 0,
    ambiguous: 0,
    invalid: 0,
  };

  rows.forEach((row, index) => {
    const normalizedLead = normalizeImportedLeadRow(row, { importSource });
    normalizedLead.import_batch_id = importBatchId;

    const warnings = [];
    if (!normalizedLead.normalized_email && !normalizedLead.normalized_phone) {
      warnings.push("No email or phone was provided; dedupe confidence is limited.");
    }
    if (normalizedLead.business_name === "Unknown Business") {
      warnings.push("Business name is missing and should be reviewed after import.");
    }

    const noMeaningfulIdentity =
      normalizedLead.full_name === "Unknown Lead" &&
      normalizedLead.business_name === "Unknown Business" &&
      !normalizedLead.email &&
      !normalizedLead.phone;

    if (noMeaningfulIdentity) {
      actions.push({
        row_index: index,
        action: "invalid",
        reason: "Row is missing all identifying fields.",
        warnings,
        normalized_lead: normalizedLead,
      });
      counts.invalid += 1;
      return;
    }

    const matchResult = findMatchingLead(virtualRecords, normalizedLead);
    if (matchResult.type === "ambiguous") {
      actions.push({
        row_index: index,
        action: "ambiguous",
        reason: "Row matched multiple existing Leads by exact email or phone.",
        warnings,
        normalized_lead: normalizedLead,
        matched_ids: matchResult.matches.map((lead) => lead.id),
      });
      counts.ambiguous += 1;
      return;
    }

    if (matchResult.type === "matched") {
      const mergedLead = mergeLeadImport(matchResult.match, normalizedLead, { importBatchId });
      const virtualIndex = virtualRecords.findIndex((lead) => lead.id === matchResult.match.id);
      if (virtualIndex >= 0) {
        virtualRecords[virtualIndex] = mergedLead;
      }

      actions.push({
        row_index: index,
        action: "update",
        reason: normalizedLead.normalized_email
          ? "Exact email match found."
          : "Exact phone match found.",
        warnings,
        lead_id: matchResult.match.id,
        normalized_lead: mergedLead,
      });
      counts.updates += 1;
      return;
    }

    const createdLead = {
      ...normalizedLead,
      id: `pending_import_${index + 1}`,
      created_date: normalizedLead.created_date || now,
    };
    virtualRecords.push(createdLead);
    actions.push({
      row_index: index,
      action: "create",
      reason: "No exact duplicate found by email or phone.",
      warnings,
      normalized_lead: createdLead,
    });
    counts.creates += 1;
  });

  return {
    import_batch_id: importBatchId,
    import_source: importSource,
    generated_at: now,
    counts,
    actions,
  };
}

export async function applyLeadImport({
  base44,
  rows = [],
  importSource = "manual_import",
  now = new Date().toISOString(),
} = {}) {
  const existingLeads = await base44.asServiceRole.entities.Leads.list("-created_date", LEAD_PIPELINE_MAX_FETCH);
  const plan = prepareLeadImport({
    rows,
    existingLeads,
    importSource,
    now,
  });

  const created = [];
  const updated = [];

  for (const action of plan.actions) {
    if (action.action === "create") {
      const { id, ...createData } = action.normalized_lead;
      const createdLead = await base44.asServiceRole.entities.Leads.create(createData);
      created.push(createdLead);
      continue;
    }

    if (action.action === "update" && action.lead_id) {
      const { id, ...updateData } = action.normalized_lead;
      const updatedLead = await base44.asServiceRole.entities.Leads.update(action.lead_id, updateData);
      updated.push(updatedLead);
    }
  }

  const importEvent = await base44.asServiceRole.entities.CommunicationEvent.create(
    buildLeadImportEvent({
      importBatchId: plan.import_batch_id,
      importSource,
      counts: {
        created_count: created.length,
        updated_count: updated.length,
        skipped_count: plan.counts.ambiguous + plan.counts.invalid,
        total_rows: rows.length,
      },
    })
  );

  return {
    ...plan,
    counts: {
      ...plan.counts,
      creates: created.length,
      updates: updated.length,
      skipped: plan.counts.ambiguous + plan.counts.invalid,
    },
    created,
    updated,
    import_event_id: importEvent.id,
  };
}

export function buildLeadImportEvent({ importBatchId, importSource, counts }) {
  return {
    channel: "internal",
    direction: "system",
    provider: "internal",
    event_type: "workflow_triggered",
    status: "processed",
    subject: "Lead import completed",
    message_body: `Lead import batch ${importBatchId} processed ${counts.total_rows} row(s). Created ${counts.created_count}, updated ${counts.updated_count}, skipped ${counts.skipped_count}.`,
    context_type: "lead_import",
    context_id: importBatchId,
    metadata_json: JSON.stringify({
      context_type: "lead_import",
      import_batch_id: importBatchId,
      import_source: importSource,
      ...counts,
    }),
  };
}

export function buildLeadStatusEvent({ lead, previousStatus, nextStatus, note }) {
  return {
    channel: "internal",
    direction: "system",
    provider: "internal",
    event_type: "status_update",
    status: "processed",
    subject: `Lead status updated: ${nextStatus}`,
    message_body: `${lead.full_name || lead.business_name || lead.id} moved from ${previousStatus || "Unknown"} to ${nextStatus}.${note ? ` Note: ${note}` : ""}`,
    lead_id: lead.id,
    context_type: "lead_pipeline",
    context_id: lead.id,
    metadata_json: JSON.stringify({
      context_type: "lead_pipeline",
      lead_id: lead.id,
      previous_status: previousStatus,
      next_status: nextStatus,
      note: note || "",
    }),
  };
}

export async function listLeadReactivationTargets({
  base44,
  order,
  targetSegment,
  maxBatchSize = 25,
  now = new Date().toISOString(),
}) {
  const leads = await base44.asServiceRole.entities.Leads.list("-created_date", LEAD_PIPELINE_MAX_FETCH);
  const nowTimestamp = new Date(now).getTime();

  return (leads || [])
    .map((lead) => enrichLeadForPipeline(lead, now))
    .filter(
      (lead) =>
        normalizeBusinessName(lead.business_name) === normalizeBusinessName(order.business_name)
    )
    .filter((lead) => leadMatchesReactivationSegment(lead, targetSegment, nowTimestamp))
    .slice(0, Math.max(1, maxBatchSize));
}
