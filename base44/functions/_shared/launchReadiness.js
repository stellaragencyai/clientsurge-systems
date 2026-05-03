import { PROVIDER_DEPLOYMENT_STATUS } from "./providerProof.js";

const SECTION_STATUS = {
  READY: "ready",
  WARNING: "warning",
  BLOCKED: "blocked",
};

const GUARDED_AUTOMATION_RUNNERS = [
  { key: "process_nurture_campaigns", label: "14-Day Nurture Scheduler" },
  { key: "send_daily_digest", label: "Daily Digest Scheduler" },
  { key: "score_leads", label: "Lead Scoring Runner" },
  { key: "calculate_lead_score", label: "Lead Score Webhook Hook" },
  { key: "analyze_reply_sentiment", label: "Reply Sentiment Automation" },
  { key: "send_admin_lead_notification", label: "Admin Lead Notification Automation" },
  { key: "stamp_follow_up_at", label: "Follow-Up Timestamp Automation" },
  { key: "start_nurture_campaign", label: "Nurture Enrollment Automation" },
  { key: "update_metrics_snapshot", label: "Metrics Snapshot Scheduler" },
];

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toTimestamp(value) {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function parseEventMetadata(event) {
  if (!event) {
    return {};
  }

  if (event.metadata && typeof event.metadata === "object") {
    return event.metadata;
  }

  if (typeof event.metadata_json !== "string" || !event.metadata_json) {
    return {};
  }

  try {
    return JSON.parse(event.metadata_json);
  } catch {
    return {};
  }
}

function getAutomationSharedSecretConfigured(environment = null) {
  if (environment && typeof environment.automation_shared_secret_configured === "boolean") {
    return environment.automation_shared_secret_configured;
  }

  try {
    if (typeof Deno !== "undefined" && Deno?.env && typeof Deno.env.get === "function") {
      return Boolean(cleanString(Deno.env.get("AUTOMATION_SHARED_SECRET")));
    }
  } catch {
    return false;
  }

  return false;
}

function buildSection({
  key,
  label,
  status,
  summary,
  detail,
  blockers = [],
  metrics = [],
  notes = [],
}) {
  return {
    key,
    label,
    status,
    summary,
    detail,
    blockers,
    metrics,
    notes,
  };
}

function summarizeStatusFromBlockers(blockers = [], warnings = []) {
  if (blockers.length > 0) {
    return SECTION_STATUS.BLOCKED;
  }

  if (warnings.length > 0) {
    return SECTION_STATUS.WARNING;
  }

  return SECTION_STATUS.READY;
}

function metric(label, value, helper = "") {
  return {
    label,
    value,
    helper,
  };
}

function getPurchasedServiceKeys(order = null) {
  return [
    ...new Set(
      (Array.isArray(order?.items) ? order.items : [])
        .filter((item) => item?.tracking_enabled !== false)
        .map((item) => cleanString(item?.service_key))
        .filter(Boolean)
    ),
  ];
}

function hasActiveCredentialSetup(leadIngestionSetup) {
  return Boolean(
    leadIngestionSetup?.credentials?.has_api_key &&
    leadIngestionSetup?.credentials?.has_webhook_secret &&
    !leadIngestionSetup?.credentials?.revoked_at
  );
}

function buildLeadCaptureSection({
  leadIngestionSetup,
  providerProof,
  orderLeads,
}) {
  const blockers = [];
  const warnings = [];
  const automationReadiness = Array.isArray(leadIngestionSetup?.automation_readiness)
    ? leadIngestionSetup.automation_readiness
    : [];
  const purchasedAutomationNotReady = automationReadiness.filter((service) => service.included && !service.ready);
  const credentialsActive = hasActiveCredentialSetup(leadIngestionSetup);
  const webhookProofLive =
    providerProof?.webhook?.derived_status === PROVIDER_DEPLOYMENT_STATUS.LIVE_PROVIDER_PROOFED;
  const instantLeadResponsePurchased = automationReadiness.some(
    (service) => service.service_key === "instant_lead_response" && service.included
  );
  const twilioProofLive =
    providerProof?.twilio?.derived_status === PROVIDER_DEPLOYMENT_STATUS.LIVE_PROVIDER_PROOFED;
  const twilioDeliveryCallbackSeen = Boolean(providerProof?.twilio?.last_delivery_callback);
  const lastLeadEventSeen = Boolean(providerProof?.webhook?.last_ingestion_event);

  if (!credentialsActive) {
    blockers.push("Lead ingestion credentials are not active for this paid order.");
  }

  if (!webhookProofLive) {
    blockers.push("The canonical webhook lead-capture path has not been live-proven yet.");
  }

  if (instantLeadResponsePurchased && !twilioProofLive) {
    blockers.push("Instant Lead Response still lacks live Twilio proof for this paid order.");
  }

  if (instantLeadResponsePurchased && !twilioDeliveryCallbackSeen) {
    blockers.push("Twilio delivery callback evidence has not been captured for the lead-response path.");
  }

  if (!lastLeadEventSeen && (orderLeads?.length || 0) === 0) {
    warnings.push("No customer lead has been ingested for this paid order yet.");
  }

  if (purchasedAutomationNotReady.length > 0) {
    warnings.push(
      `Some purchased lead automations are not fully ready: ${purchasedAutomationNotReady.map((service) => service.label).join(", ")}.`
    );
  }

  const status = summarizeStatusFromBlockers(blockers, warnings);

  return buildSection({
    key: "lead_capture",
    label: "Lead Capture Certification",
    status,
    summary:
      status === SECTION_STATUS.READY
        ? "Canonical webhook lead capture and immediate response are ready for this paid order."
        : "Lead capture still has launch blockers or missing real-world proof.",
    detail:
      "This section audits the order-backed webhook path, issued credentials, webhook proof, and the first-response runtime evidence.",
    blockers,
    metrics: [
      metric("Credential Status", leadIngestionSetup?.credential_status || "unknown"),
      metric(
        "Webhook Proof",
        webhookProofLive ? "Live proven" : "Not live proven",
        providerProof?.webhook?.status_reason || ""
      ),
      metric(
        "Order Leads",
        String(orderLeads?.length || 0),
        lastLeadEventSeen ? "At least one canonical lead-ingestion event exists." : "No canonical lead-ingestion event recorded yet."
      ),
      metric(
        "Twilio Delivery Callback",
        twilioDeliveryCallbackSeen ? "Observed" : "Missing",
        providerProof?.twilio?.last_delivery_callback?.subject || ""
      ),
    ],
    notes: warnings,
  });
}

function buildServiceProofSection({
  order,
  providerProof,
}) {
  const blockers = [];
  const warnings = [];
  const purchasedServiceKeys = getPurchasedServiceKeys(order);
  const instantIncluded = purchasedServiceKeys.includes("instant_lead_response");
  const missedCallIncluded = purchasedServiceKeys.includes("missed_call_text_back");
  const bookingIncluded = purchasedServiceKeys.includes("ai_booking_agent");
  const reviewIncluded = purchasedServiceKeys.includes("review_request");

  if (instantIncluded && providerProof?.twilio?.derived_status !== PROVIDER_DEPLOYMENT_STATUS.LIVE_PROVIDER_PROOFED) {
    blockers.push("Instant Lead Response still lacks real Twilio outbound proof for this paid order.");
  }

  if (missedCallIncluded && !providerProof?.twilio?.last_missed_call_live_webhook) {
    blockers.push("Missed Call Text-Back still lacks a real Twilio missed-call webhook on the canonical runtime path.");
  }

  if (bookingIncluded && providerProof?.booking?.derived_status !== PROVIDER_DEPLOYMENT_STATUS.LIVE_PROVIDER_PROOFED) {
    blockers.push("AI Booking Agent still lacks real external calendar proof.");
  }

  if (reviewIncluded && providerProof?.review?.derived_status !== PROVIDER_DEPLOYMENT_STATUS.LIVE_PROVIDER_PROOFED) {
    blockers.push("Review Request Automation still lacks a real completion-trigger proof.");
  }

  if (
    reviewIncluded &&
    cleanString(providerProof?.review?.channel) === "email" &&
    providerProof?.resend?.configured &&
    providerProof?.resend?.derived_status !== PROVIDER_DEPLOYMENT_STATUS.LIVE_PROVIDER_PROOFED
  ) {
    warnings.push("Review requests are email-based, but outbound email provider proof is still incomplete.");
  }

  const status = summarizeStatusFromBlockers(blockers, warnings);

  return buildSection({
    key: "service_proof",
    label: "Service Proof Certification",
    status,
    summary:
      status === SECTION_STATUS.READY
        ? "Purchased automations have the provider-side live proof needed for honest go-live claims."
        : "One or more purchased automations still lack real provider-side proof.",
    detail:
      "This section tracks the highest-value external proof checkpoints for Twilio lead response, missed-call recovery, AI booking, and review-trigger automation.",
    blockers,
    metrics: [
      metric("Tracked Services", String(purchasedServiceKeys.length)),
      metric("Twilio Lead Proof", instantIncluded ? (providerProof?.twilio?.derived_status === PROVIDER_DEPLOYMENT_STATUS.LIVE_PROVIDER_PROOFED ? "Live proven" : "Missing") : "Not purchased"),
      metric("Missed-Call Webhook", missedCallIncluded ? (providerProof?.twilio?.last_missed_call_live_webhook ? "Observed" : "Missing") : "Not purchased"),
      metric("Booking / Review Proof", `${bookingIncluded && providerProof?.booking?.derived_status === PROVIDER_DEPLOYMENT_STATUS.LIVE_PROVIDER_PROOFED ? "Booking ready" : bookingIncluded ? "Booking missing" : "Booking n/a"} / ${reviewIncluded && providerProof?.review?.derived_status === PROVIDER_DEPLOYMENT_STATUS.LIVE_PROVIDER_PROOFED ? "Review ready" : reviewIncluded ? "Review missing" : "Review n/a"}`),
    ],
    notes: warnings,
  });
}

function buildBillingSection({
  order,
  subscription,
  orderEvents,
}) {
  const blockers = [];
  const warnings = [];
  const recurringPlan = Number(order?.total_monthly || 0) > 0;
  const latestStripeWebhookEvent = [...(orderEvents || [])]
    .sort((left, right) => toTimestamp(right.created_date) - toTimestamp(left.created_date))
    .find((event) => {
      if (event?.provider !== "stripe") {
        return false;
      }

      const metadata = parseEventMetadata(event);
      return (
        (event.event_type === "order_paid" && cleanString(metadata.event_source).startsWith("stripe.")) ||
        Boolean(cleanString(metadata.stripe_event_type)) ||
        Boolean(cleanString(metadata.stripe_event_id))
      );
    }) || null;

  if (order?.payment_status !== "paid") {
    blockers.push("The order is not marked paid.");
  }

  if (!cleanString(order?.stripe_customer_id)) {
    blockers.push("Stripe customer linkage is missing on the order.");
  }

  if (!cleanString(order?.stripe_session_id)) {
    warnings.push("Stripe checkout session id is missing from the order record.");
  }

  if (recurringPlan && !cleanString(order?.stripe_subscription_id) && !cleanString(subscription?.id)) {
    blockers.push("Recurring billing is expected, but no Stripe subscription is linked.");
  }

  if (["past_due", "canceled", "unpaid"].includes(cleanString(order?.billing_status || order?.subscription_status))) {
    blockers.push(`Billing state is ${cleanString(order?.billing_status || order?.subscription_status)}.`);
  }

  if (!cleanString(order?.client_project_id)) {
    blockers.push("The paid order is not linked to a client project.");
  }

  if (!cleanString(order?.client_id)) {
    blockers.push("The paid order is not linked to a client record.");
  }

  if (!cleanString(order?.onboarding_client_id)) {
    blockers.push("The paid order is not linked to an onboarding record for portal/setup continuity.");
  }

  if (order?.payment_status === "paid" && !latestStripeWebhookEvent) {
    blockers.push("No canonical Stripe webhook evidence has been recorded for this paid order.");
  }

  const status = summarizeStatusFromBlockers(blockers, warnings);

  return buildSection({
    key: "billing",
    label: "Billing Certification",
    status,
    summary:
      status === SECTION_STATUS.READY
        ? "Stripe payment and subscription linkage are present for this paid order."
        : "Billing still has missing linkage or unsafe states that would block a launch claim.",
    detail:
      "This section checks the canonical order payment state, Stripe linkage, real webhook evidence, recurring subscription presence, and portal-safe client-project linkage.",
    blockers,
    metrics: [
      metric("Payment Status", order?.payment_status || "unknown"),
      metric("Billing Status", cleanString(order?.billing_status || order?.subscription_status) || "unknown"),
      metric("Stripe Customer", cleanString(order?.stripe_customer_id) ? "Linked" : "Missing"),
      metric("Stripe Subscription", cleanString(order?.stripe_subscription_id || subscription?.id) ? "Linked" : recurringPlan ? "Missing" : "Not required"),
      metric(
        "Stripe Webhook Evidence",
        latestStripeWebhookEvent ? "Observed" : "Missing",
        latestStripeWebhookEvent?.subject || latestStripeWebhookEvent?.event_type || "No checkout or billing webhook event is recorded on the order timeline."
      ),
      metric("Portal Linkage", cleanString(order?.client_id) && cleanString(order?.client_project_id) && cleanString(order?.onboarding_client_id) ? "Linked" : "Incomplete"),
    ],
    notes: warnings,
  });
}

function buildAutomationSecuritySection({
  workspaceSummary,
  environment,
}) {
  const blockers = [];
  const warnings = [];
  const configured = getAutomationSharedSecretConfigured(environment);

  if (!configured) {
    blockers.push("AUTOMATION_SHARED_SECRET is not configured, so anonymous scheduler endpoints are not fully locked down.");
  }

  if ((workspaceSummary?.counts?.blockers || 0) > 0) {
    warnings.push("Order-level install blockers still exist even if scheduler auth is configured.");
  }

  const status = summarizeStatusFromBlockers(blockers, warnings);

  return buildSection({
    key: "automation_security",
    label: "Automation Security",
    status,
    summary:
      status === SECTION_STATUS.READY
        ? "Shared-secret protection is configured for the critical automation runner surface."
        : "Anonymous scheduler security still has launch risk.",
    detail:
      "This section tracks whether the shared automation secret is configured for the runner surface that powers schedulers and automation hooks.",
    blockers,
    metrics: [
      metric("Shared Secret", configured ? "Configured" : "Missing"),
      metric("Guarded Runners", String(GUARDED_AUTOMATION_RUNNERS.length), "Critical scheduled or automation-triggered endpoints that should expect the shared secret."),
    ],
    notes: [
      ...warnings,
      ...GUARDED_AUTOMATION_RUNNERS.map((runner) => runner.label),
    ],
  });
}

function buildLeadOwnershipSection({
  order,
  orderLeads,
  projectLeads,
}) {
  const blockers = [];
  const warnings = [];
  const expectedProjectId = cleanString(order?.client_project_id);
  const expectedOrderId = cleanString(order?.id);
  const mismatchedOrderLeads = (orderLeads || []).filter(
    (lead) =>
      cleanString(lead.order_id) !== expectedOrderId ||
      cleanString(lead.client_project_id) !== expectedProjectId
  );
  const projectLeadsWithoutOrderLink = (projectLeads || []).filter(
    (lead) => cleanString(lead.client_project_id) === expectedProjectId && !cleanString(lead.order_id)
  );

  if (!expectedProjectId) {
    blockers.push("This paid order is missing client_project_id, so portal lead scoping cannot be trusted.");
  }

  if (mismatchedOrderLeads.length > 0) {
    blockers.push("Some order-linked Leads records do not carry the expected project ownership fields.");
  }

  if (projectLeadsWithoutOrderLink.length > 0) {
    warnings.push("Some project Leads records still do not carry an order link.");
  }

  if ((projectLeads || []).length === 0 && (orderLeads || []).length === 0) {
    warnings.push("No Leads records are linked to this order or client project yet.");
  }

  const status = summarizeStatusFromBlockers(blockers, warnings);

  return buildSection({
    key: "lead_ownership",
    label: "Lead Ownership Safety",
    status,
    summary:
      status === SECTION_STATUS.READY
        ? "Leads linked to this order carry the expected client-project ownership fields."
        : "Lead/project ownership still has gaps that could weaken portal or export scoping.",
    detail:
      "This section checks the canonical Leads data for order linkage and client-project ownership consistency.",
    blockers,
    metrics: [
      metric("Order Leads", String(orderLeads?.length || 0)),
      metric("Project Leads", String(projectLeads?.length || 0)),
      metric("Ownership Mismatches", String(mismatchedOrderLeads.length)),
      metric("Project Leads Without Order", String(projectLeadsWithoutOrderLink.length)),
    ],
    notes: warnings,
  });
}

function buildMonitoringSection({
  providerProof,
  workspaceSummary,
  orderEvents,
}) {
  const blockers = [];
  const warnings = [];
  const recentFailures = (orderEvents || []).filter((event) => {
    const failed =
      event?.status === "failed" ||
      ["runtime_attempt_blocked", "service_transition_blocked", "provider_send_failed"].includes(event?.event_type);
    if (!failed) {
      return false;
    }
    return toTimestamp(event.created_date) >= Date.now() - 7 * 24 * 60 * 60 * 1000;
  });
  const proofGapCount = providerProof?.missing_live_proof_items?.length || 0;
  const workspaceBlockers = workspaceSummary?.counts?.blockers || 0;
  const latestFailures = [...recentFailures]
    .sort((left, right) => toTimestamp(right.created_date) - toTimestamp(left.created_date))
    .slice(0, 3);

  if (recentFailures.length > 0) {
    blockers.push("Recent runtime or provider failures exist on the canonical order timeline.");
  }

  if (proofGapCount > 0) {
    blockers.push("Provider proof gaps remain open for this order.");
  }

  if (workspaceBlockers > 0) {
    warnings.push("The remote setup workspace still reports active blockers.");
  }

  const status = summarizeStatusFromBlockers(blockers, warnings);

  return buildSection({
    key: "monitoring",
    label: "Monitoring And Alerts",
    status,
    summary:
      status === SECTION_STATUS.READY
        ? "No recent failures or unresolved launch-proof gaps are currently derived for this order."
        : "Monitoring still shows live issues or unresolved proof gaps that need attention.",
    detail:
      "This section condenses recent canonical failures, open provider-proof gaps, and workspace blockers into a launch triage signal.",
    blockers,
    metrics: [
      metric("Recent Failures (7d)", String(recentFailures.length)),
      metric("Provider Proof Gaps", String(proofGapCount)),
      metric("Workspace Blockers", String(workspaceBlockers)),
      metric("Latest Failure", latestFailures[0]?.event_type || "None", latestFailures[0]?.subject || latestFailures[0]?.message_body || ""),
    ],
    notes: [
      ...warnings,
      ...latestFailures.map((event) => event.subject || event.message_body || event.event_type).filter(Boolean),
      ...(providerProof?.missing_live_proof_items || []),
    ],
  });
}

export function buildLaunchReadinessAudit({
  order,
  subscription = null,
  leadIngestionSetup = null,
  providerProof = null,
  workspaceSummary = null,
  orderLeads = [],
  projectLeads = [],
  orderEvents = [],
  environment = null,
}) {
  const sections = [
    buildLeadCaptureSection({
      leadIngestionSetup,
      providerProof,
      orderLeads,
    }),
    buildServiceProofSection({
      order,
      providerProof,
    }),
    buildBillingSection({
      order,
      subscription,
      orderEvents,
    }),
    buildAutomationSecuritySection({
      workspaceSummary,
      environment,
    }),
    buildLeadOwnershipSection({
      order,
      orderLeads,
      projectLeads,
    }),
    buildMonitoringSection({
      providerProof,
      workspaceSummary,
      orderEvents,
    }),
  ];

  const counts = {
    ready: sections.filter((section) => section.status === SECTION_STATUS.READY).length,
    warning: sections.filter((section) => section.status === SECTION_STATUS.WARNING).length,
    blocked: sections.filter((section) => section.status === SECTION_STATUS.BLOCKED).length,
  };

  const launchBlockers = sections.flatMap((section) =>
    section.blockers.map((blocker) => ({
      section_key: section.key,
      section_label: section.label,
      message: blocker,
    }))
  );

  return {
    generated_at: new Date().toISOString(),
    counts,
    sections,
    launch_blockers: launchBlockers,
  };
}
