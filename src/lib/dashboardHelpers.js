/**
 * Dashboard Helpers — read-only safety/readiness logic for the client dashboard.
 * No mutations, no external calls, no side effects.
 */

// ── QA / Test / Proof record filter ──────────────────────────────────────────
const INTERNAL_PATTERNS = [
  "QA", "Smoke", "Proof", "Runtime", "Test", "ClientSurge",
  "clientsurge.test", "example.com", "handoff-smoke",
  "stripe-webhook-proof", "live-proof", "Codex", "ignore",
];

export function isInternalRecord(name, email) {
  const check = (value) => {
    if (!value || typeof value !== "string") return false;
    const v = value.toLowerCase();
    return INTERNAL_PATTERNS.some((p) => v.includes(p.toLowerCase()));
  };
  return check(name) || check(email);
}

export function hasInternalFlag(records, field = "business_name") {
  if (!Array.isArray(records)) return false;
  return records.some((r) => isInternalRecord(r?.[field], r?.email));
}

// ── Service / Package helpers ─────────────────────────────────────────────────
const SERVICE_DISPLAY_MAP = {
  instant_lead_response: "Instant Lead Response",
  missed_call_textback: "Missed Call Text-Back",
  missed_call_text_back: "Missed Call Text-Back",
  followup_sequences: "14-Day Nurture Sequence",
  nurture_sequence_14d: "14-Day Nurture Sequence",
  appointment_booking: "AI Booking Agent",
  ai_booking_agent: "AI Booking Agent",
  lead_reactivation: "Lead Reactivation",
  review_request: "Review Request Automation",
  review_automation: "Review Request Automation",
};

export function getDisplayServiceName(serviceKey) {
  if (!serviceKey) return "Unknown Service";
  const key = String(serviceKey).toLowerCase().replace(/[\s-]+/g, "_");
  return SERVICE_DISPLAY_MAP[key] || serviceKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Package-based automations ─────────────────────────────────────────────────
const PACKAGE_AUTOMATIONS = {
  starter_system: [
    { key: "instant_lead_response", label: "Instant Lead Response" },
    { key: "missed_call_text_back", label: "Missed Call Text-Back" },
  ],
  growth_system: [
    { key: "instant_lead_response", label: "Instant Lead Response" },
    { key: "missed_call_text_back", label: "Missed Call Text-Back" },
    { key: "nurture_sequence_14d", label: "14-Day Nurture Sequence" },
    { key: "ai_booking_agent", label: "AI Booking Agent" },
  ],
  pro_system: [
    { key: "instant_lead_response", label: "Instant Lead Response" },
    { key: "missed_call_text_back", label: "Missed Call Text-Back" },
    { key: "nurture_sequence_14d", label: "14-Day Nurture Sequence" },
    { key: "ai_booking_agent", label: "AI Booking Agent" },
    { key: "lead_reactivation", label: "Lead Reactivation" },
    { key: "review_request", label: "Review Request Automation" },
  ],
};

export function getPackageAutomations(packageKey) {
  if (!packageKey) return PACKAGE_AUTOMATIONS.starter_system;
  let key = String(packageKey).toLowerCase().replace(/[\s-]+/g, "_");
  // Normalize aliases
  if (key === "starter") key = "starter_system";
  if (key === "growth") key = "growth_system";
  if (key === "pro" || key === "pro_system") key = "pro_system";
  return PACKAGE_AUTOMATIONS[key] || PACKAGE_AUTOMATIONS.starter_system;
}

// ── Readiness computation ─────────────────────────────────────────────────────
export function computeReadiness(order, project, events = []) {
  if (!order && !project) {
    return {
      status: "Setup In Progress",
      label: "Setup In Progress",
      percent: 0,
      nextMilestone: "Payment confirmation",
      actionRequired: "Complete payment and onboarding",
      canGoLive: false,
    };
  }

  let total = 0;
  let done = 0;

  // 1. Payment confirmed
  total++;
  if (order?.payment_status === "paid") done++;

  // 2. Onboarding completed
  total++;
  if (project?.onboarding_completed === true || project?.quick_start_completed === true) done++;

  // 3. Install configured
  total++;
  const services = order?.services || order?.items || [];
  const anyConfigured = services.some((s) => s.install_status && s.install_status !== "Paid");
  if (anyConfigured) done++;

  // 4. QA/testing passed (no recent critical failures)
  total++;
  const recentFailed = (events || []).filter(
    (e) =>
      e.status === "failed" &&
      e.event_type &&
      !e.event_type.includes("simulation") &&
      !e.event_type.includes("test")
  );
  if (recentFailed.length === 0) done++;

  // 5. Approval
  total++;
  if (project?.launch_approved === true) done++;

  const percent = Math.round((done / total) * 100);
  const allLive = services.length > 0 && services.every((s) => s.install_status === "Live");

  let status, nextMilestone, actionRequired, canGoLive;

  if (allLive && recentFailed.length === 0 && done === total) {
    status = "Live";
    nextMilestone = "Ongoing monitoring";
    actionRequired = "No client action required";
    canGoLive = true;
  } else if (recentFailed.length > 0) {
    status = "Needs Attention";
    nextMilestone = "Resolve failed events";
    actionRequired = "Review failed system events";
    canGoLive = false;
  } else if (percent >= 75) {
    status = "Testing";
    nextMilestone = "Final approval";
    actionRequired = "Await QA sign-off";
    canGoLive = false;
  } else if (percent >= 40) {
    status = "Setup In Progress";
    nextMilestone = "Configuration complete";
    actionRequired = "Complete onboarding steps";
    canGoLive = false;
  } else {
    status = "Setup In Progress";
    nextMilestone = "Onboarding form";
    actionRequired = "Complete payment and onboarding";
    canGoLive = false;
  }

  return { status, label: status, percent, nextMilestone, actionRequired, canGoLive };
}

// ── Event grouping helpers for panels ─────────────────────────────────────────
export function groupFailedEventsByCategory(events) {
  if (!Array.isArray(events)) return [];
  const failed = events.filter((e) => e.status === "failed");

  const groups = {
    sms: [],
    email: [],
    workflow: [],
    billing: [],
    provider: [],
    other: [],
  };

  for (const e of failed) {
    const channel = (e.channel || "").toLowerCase();
    const type = (e.event_type || "").toLowerCase();
    const provider = (e.provider || "").toLowerCase();

    if (channel === "sms" || type.includes("sms")) {
      groups.sms.push(e);
    } else if (channel === "email" || type.includes("email") || provider === "resend") {
      groups.email.push(e);
    } else if (type.includes("booking") || type.includes("calendar") || type.includes("workflow")) {
      groups.workflow.push(e);
    } else if (type.includes("order") || type.includes("payment") || type.includes("invoice") || provider === "stripe") {
      groups.billing.push(e);
    } else if (provider && provider !== "internal") {
      groups.provider.push(e);
    } else {
      groups.other.push(e);
    }
  }

  return [
    { category: "Email issue", icon: "mail", count: groups.email.length, events: groups.email },
    { category: "SMS issue", icon: "message-square", count: groups.sms.length, events: groups.sms },
    { category: "Calendar/Workflow issue", icon: "calendar", count: groups.workflow.length, events: groups.workflow },
    { category: "Billing/Webhook issue", icon: "credit-card", count: groups.billing.length, events: groups.billing },
    { category: "Provider issue", icon: "plug", count: groups.provider.length, events: groups.provider },
    { category: "Other issue", icon: "alert-triangle", count: groups.other.length, events: groups.other },
  ].filter((g) => g.count > 0);
}

export function getFriendlyEventLabel(event) {
  const type = (event?.event_type || "").toLowerCase();
  const status = (event?.status || "").toLowerCase();

  if (type.includes("lead") && type.includes("created")) return "Lead captured";
  if (type.includes("sms") && (status === "sent" || status === "delivered")) return "SMS sent/delivered";
  if (type.includes("email") && status === "sent") return "Email sent";
  if (type.includes("booking") && type.includes("created")) return "Booking created";
  if (type.includes("order") && type.includes("paid")) return "Order paid";
  if (type.includes("install") && type.includes("initialized")) return "Install initialized";
  if (type.includes("sms") && status === "failed") return "SMS delivery failed";
  if (type.includes("email") && status === "failed") return "Email delivery failed";

  return (event?.event_type || "Event").replace(/_/g, " ");
}

export function isAdminUser(user) {
  if (!user) return false;
  const role = (user?.role || "").toLowerCase();
  return role === "admin" || role === "super_admin";
}