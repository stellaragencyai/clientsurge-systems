export const LAUNCH_GATE_STATUSES = [
  "locked",
  "blocked",
  "partial",
  "ready_for_proof",
  "proof_running",
  "proof_failed",
  "proof_passed",
  "approved",
  "waived",
];

export const LAUNCH_GATE_SEVERITIES = ["advisory", "launch_blocker", "critical_blocker"];

export const APPROVAL_REQUIRED_ACTIONS = [
  "production_deploy",
  "real_campaign_send",
  "crm_dedupe_merge_delete",
  "stripe_live_action",
  "dns_change",
  "base44_production_env_change",
  "real_customer_email",
  "checkout_payment_logic_change",
  "provider_credential_change",
  "auth_security_behavior_change",
];

export const ALLOWED_AUTOMATIC_ACTIONS = [
  "read_only_scan",
  "local_test",
  "source_audit",
  "dry_run_preview",
  "create_github_issue",
  "create_proof_record",
  "update_dashboard_status_from_evidence",
];

export const GATE_KEYS = {
  businessFoundation: "business_foundation",
  websiteProduction: "website_production",
  domainDns: "domain_dns",
  emailResend: "email_resend",
  stripePayments: "stripe_payments",
  crmLeads: "crm_leads",
  bookingCalendar: "booking_calendar",
  outreachCampaign: "outreach_campaign",
  clientOnboarding: "client_onboarding",
  securityCompliance: "security_compliance",
  fulfillmentSupport: "fulfillment_support",
  commandCenter: "command_center",
  first25LeadCampaign: "first_25_lead_campaign",
};

export const FULL_CAMPAIGN_REQUIRED_PROOFS = [
  "first_25_lead_campaign_gate",
  "first_50_lead_campaign_gate",
];

const launchBlocker = "launch_blocker";
const criticalBlocker = "critical_blocker";

function proof(key, label, source, nextAction) {
  return { key, label, source, nextAction };
}

export const LAUNCH_GATE_DEFINITIONS = [
  {
    gate_key: GATE_KEYS.businessFoundation,
    gate_name: "Business Foundation Gate",
    section_label: "Foundation",
    severity: launchBlocker,
    approval_required: false,
    required_categories: ["D10_Launch_Checklist"],
    required_tasks: ["offer_approved", "pricing_approved", "legal_pages_reviewed", "support_owner_confirmed"],
    required_proofs: [
      proof("business_offer_approved", "Offer, pricing, and packaging are owner approved", "docs/BUSINESS_STRATEGY_LAUNCH_READINESS.md", "Record owner approval for package, pricing, and public offer terms."),
      proof("legal_pages_reviewed", "Privacy, terms, and compliance copy reviewed", "docs/LEGAL_TCPA_REVIEW_2026-05-21.md", "Finish legal/compliance review before launch unlock."),
      proof("support_owner_confirmed", "Support ownership and escalation path confirmed", "docs/CLIENT_SUPPORT_WORKFLOW.md", "Confirm support inbox and escalation owner."),
    ],
  },
  {
    gate_key: GATE_KEYS.websiteProduction,
    gate_name: "Website Production Gate",
    section_label: "Website",
    severity: criticalBlocker,
    approval_required: false,
    required_categories: ["D05_SEO_Marketing", "D07_Frontend_Visuals"],
    required_tasks: ["public_route_smoke", "cta_copy_audit", "coming_soon_audit"],
    required_proofs: [
      proof("homepage_returns_200", "Homepage returns 200", "scripts/public-route-smoke.mjs", "Run a read-only public route smoke check."),
      proof("book_returns_200", "/book returns 200", "scripts/public-route-smoke.mjs", "Run a read-only public route smoke check."),
      proof("contact_returns_200", "/contact returns 200", "scripts/public-route-smoke.mjs", "Run a read-only public route smoke check."),
      proof("store_returns_200", "/store returns 200", "scripts/public-route-smoke.mjs", "Run a read-only public route smoke check."),
      proof("roofing_returns_200", "/roofing returns 200", "scripts/public-route-smoke.mjs", "Run a read-only public route smoke check."),
      proof("hvac_returns_200", "/hvac returns 200", "scripts/public-route-smoke.mjs", "Run a read-only public route smoke check."),
      proof("dental_returns_200", "/dental returns 200", "scripts/public-route-smoke.mjs", "Run a read-only public route smoke check."),
      proof("no_public_coming_soon", "No public Coming Soon copy on launch pages", "tests/websiteFrontendReadiness.test.js", "Attach route audit evidence showing no launch page uses Coming Soon copy."),
      proof("free_automation_audit_cta", "Public CTA says Free Automation Audit", "tests/ctaCopyConsistency.test.js", "Attach CTA consistency test evidence."),
    ],
  },
  {
    gate_key: GATE_KEYS.domainDns,
    gate_name: "Domain / DNS Gate",
    section_label: "Domain",
    severity: criticalBlocker,
    approval_required: true,
    required_categories: ["D09_DevOps_Monitoring", "D10_Launch_Checklist"],
    required_tasks: ["domain_reachable", "dns_owner_confirmed", "worker_route_confirmed"],
    required_proofs: [
      proof("domain_https_reachable", "clientsurgesystems.com resolves over HTTPS", "scripts/verify-production-security.mjs", "Run the production security verifier and attach the route evidence."),
      proof("dns_control_plane_confirmed", "DNS control plane is confirmed", "docs/EMAIL_DELIVERABILITY_LAUNCH_PROOF.md", "Confirm DNS owner/control plane without changing records."),
      proof("worker_security_route_verified", "Security edge route is verified", "scripts/verify-production-security.mjs", "Attach current verifier evidence for edge headers and route status."),
    ],
  },
  {
    gate_key: GATE_KEYS.emailResend,
    gate_name: "Email / Resend Gate",
    section_label: "Email",
    severity: criticalBlocker,
    approval_required: true,
    required_categories: ["D03_Automation", "D10_Launch_Checklist"],
    required_tasks: ["dns_email_readiness", "safe_email_test", "provider_delivery_confirmation"],
    required_proofs: [
      proof("spf_exists", "SPF exists", "scripts/email/dns-email-readiness.mjs", "Run DNS email readiness and attach SPF evidence."),
      proof("mx_exists", "MX exists", "scripts/email/dns-email-readiness.mjs", "Run DNS email readiness and attach MX evidence."),
      proof("dmarc_exists", "DMARC exists", "scripts/email/dns-email-readiness.mjs", "Run DNS email readiness and attach DMARC evidence."),
      proof("google_dkim_exists", "Google DKIM exists", "scripts/email/dns-email-readiness.mjs", "Attach Google Admin or DNS selector evidence."),
      proof("resend_dkim_exists", "Resend DKIM exists", "scripts/email/dns-email-readiness.mjs", "Attach Resend DKIM evidence."),
      proof("resend_txt_exists", "Resend _resend TXT exists", "scripts/email/dns-email-readiness.mjs", "Attach Resend verification TXT evidence or provider note."),
      proof("resend_api_key_present_secure_env", "RESEND_API_KEY present in secure env without printing value", "docs/EMAIL_DELIVERABILITY_LAUNCH_PROOF.md", "Confirm env presence by name only."),
      proof("safe_test_email_sent", "Safe test email sent", "scripts/email/safe-email-test-harness.mjs", "Run the approved safe test only after owner recipient approval."),
      proof("provider_delivery_confirmed", "Provider delivery confirmed", "docs/EMAIL_DELIVERABILITY_LAUNCH_PROOF.md", "Attach Resend delivery/log proof."),
    ],
  },
  {
    gate_key: GATE_KEYS.stripePayments,
    gate_name: "Stripe / Payments Gate",
    section_label: "Payments",
    severity: criticalBlocker,
    approval_required: true,
    required_categories: ["D01_Stripe", "D10_Launch_Checklist"],
    required_tasks: ["stripe_business_verification", "test_checkout", "webhook_order_client_onboarding"],
    required_proofs: [
      proof("stripe_business_verified_manual", "Stripe business verification confirmed manually", "docs/STRIPE_ONBOARDING_LAUNCH_PROOF.md", "Attach Stripe dashboard verification proof."),
      proof("stripe_bank_connected_manual", "Bank connected confirmed manually", "docs/STRIPE_ONBOARDING_LAUNCH_PROOF.md", "Attach Stripe dashboard bank connection proof."),
      proof("test_checkout_completed", "Test checkout completed", "scripts/stripe/verify-test-checkout.mjs", "Run test-mode checkout proof before any live action."),
      proof("stripe_webhook_received", "Webhook received", "base44/functions/stripePaymentWebhook/entry.ts", "Attach webhook event and function proof."),
      proof("order_created", "Order created", "base44/entities/Order.jsonc", "Attach test Order record ID from proof workspace."),
      proof("client_created", "Client created", "base44/entities/Client.jsonc", "Attach test Client record ID from proof workspace."),
      proof("onboarding_client_created", "OnboardingClient created", "base44/entities/OnboardingClient.jsonc", "Attach test OnboardingClient record ID from proof workspace."),
      proof("failed_payment_path_tested", "Failed payment path tested", "tests/paymentRecoveryEmail.test.js", "Attach failed-payment proof or regression evidence."),
      proof("no_live_payment_without_approval", "No live payment test until approved", "docs/live-provider-approval-packet-2026-05-21.md", "Keep live payment blocked until explicit approval exists."),
    ],
  },
  {
    gate_key: GATE_KEYS.crmLeads,
    gate_name: "CRM / Leads Gate",
    section_label: "CRM",
    severity: criticalBlocker,
    approval_required: false,
    required_categories: ["D02_Lead_Pipeline", "D10_Launch_Checklist"],
    required_tasks: ["lead_schema_verified", "lead_counts", "duplicate_dry_run", "first_25_preview"],
    required_proofs: [
      proof("leads_schema_verified", "Leads schema verified", "base44/entities/Leads.jsonc", "Attach source/test evidence for lead schema."),
      proof("lead_count_calculated", "Lead count calculated", "scripts/crm/crm-launch-repair-dry-run.mjs", "Run read-only/dry-run CRM count proof."),
      proof("usable_lead_count_calculated", "Usable lead count calculated", "scripts/crm/crm-launch-repair-dry-run.mjs", "Attach usable lead count proof."),
      proof("duplicate_dry_run_completed", "Duplicate dry-run completed", "scripts/crm/crm-launch-repair-dry-run.mjs", "Attach duplicate dry-run report."),
      proof("suppression_fields_verified", "Suppression fields verified", "tests/outreachCampaignReadiness.test.js", "Attach suppression-field test evidence."),
      proof("first_25_preview_dry_run_completed", "First 25-lead preview dry-run completed", "tests/outreachCampaignReadiness.test.js", "Attach reviewed 25-lead preview proof."),
    ],
  },
  {
    gate_key: GATE_KEYS.bookingCalendar,
    gate_name: "Booking / Calendar Gate",
    section_label: "Booking",
    severity: criticalBlocker,
    approval_required: true,
    required_categories: ["D03_Automation", "D10_Launch_Checklist"],
    required_tasks: ["book_route_visible", "booking_crm_stage", "booking_confirmations"],
    required_proofs: [
      proof("book_scheduler_visible", "/book production scheduler visible", "scripts/audit/booking-live-route-scan.mjs", "Run booking route scan and attach evidence."),
      proof("booking_captures_required_fields", "Booking captures required fields", "tests/bookingReadiness.test.js", "Attach booking readiness test evidence."),
      proof("crm_stage_audit_booked", "CRM stage becomes Audit Booked", "base44/functions/scheduleDemoBooking/entry.ts", "Attach booking-to-CRM proof."),
      proof("confirmation_email_proof", "Confirmation email proof", "base44/functions/sendDemoConfirmationEmail/entry.ts", "Attach safe confirmation email proof."),
      proof("admin_alert_proof", "Admin alert proof", "base44/functions/sendAdminDemoNotification/entry.ts", "Attach admin alert proof."),
      proof("sms_calendar_proof_if_configured", "SMS/calendar proof if configured", "docs/BOOKING_PRODUCTION_READINESS.md", "Attach SMS/calendar proof or mark not configured with evidence."),
    ],
  },
  {
    gate_key: GATE_KEYS.outreachCampaign,
    gate_name: "Outreach / Campaign Gate",
    section_label: "Outreach",
    severity: criticalBlocker,
    approval_required: true,
    required_categories: ["D02_Lead_Pipeline", "D03_Automation", "D10_Launch_Checklist"],
    required_tasks: ["segmented_preview", "suppression_enforcement", "campaign_send_approval"],
    required_proofs: [
      proof("unsegmented_sends_rejected", "Unsegmented sends rejected", "tests/outreachCampaignReadiness.test.js", "Attach unsegmented-send rejection test evidence."),
      proof("max_50_cap_enforced", "Max 50 cap enforced", "tests/outreachCampaignReadiness.test.js", "Attach max-recipient test evidence."),
      proof("twenty_five_lead_preview_works", "25-lead preview works", "src/components/admin/email-campaigns/CreateCampaignModal.jsx", "Attach reviewed preview evidence."),
      proof("dnc_suppression", "DNC suppression", "tests/outreachCampaignReadiness.test.js", "Attach DNC suppression test evidence."),
      proof("unsubscribe_suppression", "Unsubscribe suppression", "tests/outreachCampaignReadiness.test.js", "Attach unsubscribe suppression test evidence."),
      proof("bounce_suppression", "Bounce suppression", "tests/outreachCampaignReadiness.test.js", "Attach bounce suppression test evidence."),
      proof("closed_won_lost_suppression", "Closed/won/lost suppression", "tests/outreachCampaignReadiness.test.js", "Attach terminal status suppression evidence."),
      proof("list_unsubscribe_headers", "List-Unsubscribe headers", "tests/outreachCampaignReadiness.test.js", "Attach List-Unsubscribe test evidence."),
      proof("no_real_campaign_without_approval", "No real campaign send without approval", "base44/functions/sendEmailCampaign/entry.ts", "Keep campaign send blocked until approval and proof gates pass."),
    ],
  },
  {
    gate_key: GATE_KEYS.clientOnboarding,
    gate_name: "Client Onboarding Gate",
    section_label: "Onboarding",
    severity: launchBlocker,
    approval_required: false,
    required_categories: ["D08_Client_Portal_Admin", "D10_Launch_Checklist"],
    required_tasks: ["paid_order_required", "portal_access", "client_handoff"],
    required_proofs: [
      proof("paid_order_required_for_onboarding", "Paid/manual order required for onboarding", "tests/clientOnboardingAccess.test.js", "Attach onboarding access test evidence."),
      proof("portal_access_ownership_scoped", "Portal access ownership scoped", "tests/portalOwnership.test.js", "Attach portal ownership test evidence."),
      proof("client_handoff_template_ready", "Client handoff template ready", "docs/CLIENT_HANDOFF_TEMPLATE.md", "Attach handoff doc and owner decision proof."),
    ],
  },
  {
    gate_key: GATE_KEYS.securityCompliance,
    gate_name: "Security / Compliance Gate",
    section_label: "Security",
    severity: criticalBlocker,
    approval_required: true,
    required_categories: ["D04_Security_Legal", "D09_DevOps_Monitoring", "D10_Launch_Checklist"],
    required_tasks: ["production_security_headers", "route_noindex_rules", "tcpa_review"],
    required_proofs: [
      proof("production_security_verifier_passed", "Production security verifier passed", "scripts/verify-production-security.mjs", "Run the production security verifier and attach current output."),
      proof("sensitive_routes_noindex", "Sensitive routes noindex/no-store", "tests/websiteFrontendReadiness.test.js", "Attach route security regression evidence."),
      proof("frontend_secret_exposure_scan", "Frontend secret exposure scan", "tests/frontendSecretExposure.test.js", "Attach secret exposure test evidence."),
      proof("tcpa_legal_review", "TCPA/legal review complete", "docs/LEGAL_TCPA_REVIEW_2026-05-21.md", "Attach legal review proof before launch."),
    ],
  },
  {
    gate_key: GATE_KEYS.fulfillmentSupport,
    gate_name: "Fulfillment / Support Gate",
    section_label: "Fulfillment",
    severity: launchBlocker,
    approval_required: false,
    required_categories: ["D08_Client_Portal_Admin", "D10_Launch_Checklist"],
    required_tasks: ["fulfillment_sop", "support_workflow", "post_launch_monitoring"],
    required_proofs: [
      proof("fulfillment_sop_ready", "Fulfillment SOP ready", "docs/FULFILLMENT_OPERATING_SYSTEM.md", "Attach fulfillment operating system doc evidence."),
      proof("support_workflow_ready", "Support workflow ready", "docs/CLIENT_SUPPORT_WORKFLOW.md", "Attach support workflow proof."),
      proof("post_launch_monitoring_ready", "Post-launch monitoring ready", "docs/POST_LAUNCH_MONITORING_CHECKLIST.md", "Attach monitoring checklist proof."),
    ],
  },
  {
    gate_key: GATE_KEYS.commandCenter,
    gate_name: "Command Center Gate",
    section_label: "Command Center",
    severity: criticalBlocker,
    approval_required: false,
    required_categories: ["D10_Launch_Checklist"],
    required_tasks: ["launch_gates_page", "approval_model", "verdict_logic"],
    required_proofs: [
      proof("launch_gates_page_exists", "Launch Gates dashboard exists", "src/components/admin/LaunchGatesPanel.jsx", "Ship the read-only Launch Gates dashboard."),
      proof("approval_model_exists", "Approval model exists", "base44/entities/LaunchApproval.jsonc", "Ship LaunchApproval schema."),
      proof("launch_verdict_logic_exists", "Launch verdict logic exists", "src/lib/launchGates.js", "Ship tested launch verdict logic."),
    ],
  },
  {
    gate_key: GATE_KEYS.first25LeadCampaign,
    gate_name: "First 25-Lead Campaign Gate",
    section_label: "First Campaign",
    severity: criticalBlocker,
    approval_required: true,
    required_categories: ["D02_Lead_Pipeline", "D03_Automation", "D10_Launch_Checklist"],
    required_tasks: ["first_25_preview", "approval_recorded", "results_reviewed"],
    required_proofs: [
      proof("first_25_lead_campaign_gate", "First 25-lead test passed", "docs/LAUNCH_CAMPAIGN_KIT.md", "Attach reviewed send proof, delivery proof, and CRM impact summary."),
      proof("first_25_campaign_approval", "First 25-lead test was approved", "base44/entities/LaunchApproval.jsonc", "Record manual approval before any real send."),
      proof("first_25_results_reviewed", "First 25-lead results reviewed", "docs/LAUNCH_CAMPAIGN_KIT.md", "Attach results review and next-action decision."),
    ],
  },
];

function normalizeProofInput(input) {
  if (input === true) {
    return { status: "proof_passed", evidence_summary: "Boolean pass supplied by caller." };
  }

  if (!input) return null;

  if (typeof input === "string") {
    return { status: input };
  }

  return {
    status: input.status || input.verdict || input.result,
    evidence_summary: input.evidence_summary || input.evidence || input.source || input.artifact || "",
    checked_at: input.checked_at || input.last_checked_at || input.timestamp || "",
    blocker: input.blocker || input.current_blocker || "",
  };
}

function hasEvidence(input) {
  return Boolean(input?.evidence_summary && String(input.evidence_summary).trim().length > 0);
}

export function evaluateProof(proofDefinition, proofInputs = {}) {
  const input = normalizeProofInput(proofInputs[proofDefinition.key]);

  if (!input) {
    return {
      ...proofDefinition,
      status: "ready_for_proof",
      passed: false,
      evidence_summary: "",
      current_blocker: "No evidence attached.",
      next_action: proofDefinition.nextAction,
    };
  }

  const normalizedStatus = String(input.status || "").toLowerCase();
  const passedStatus = ["passed", "proof_passed", "approved", "verified", "success"].includes(normalizedStatus);
  const failedStatus = ["failed", "proof_failed", "error"].includes(normalizedStatus);
  const runningStatus = ["proof_running", "running", "in_progress"].includes(normalizedStatus);

  if (passedStatus && hasEvidence(input)) {
    return {
      ...proofDefinition,
      status: "proof_passed",
      passed: true,
      evidence_summary: input.evidence_summary,
      checked_at: input.checked_at,
      current_blocker: "",
      next_action: "Review approval boundary before any launch-sensitive action.",
    };
  }

  if (passedStatus && !hasEvidence(input)) {
    return {
      ...proofDefinition,
      status: "blocked",
      passed: false,
      evidence_summary: "",
      checked_at: input.checked_at,
      current_blocker: "Pass status supplied without evidence.",
      next_action: proofDefinition.nextAction,
    };
  }

  if (failedStatus) {
    return {
      ...proofDefinition,
      status: "proof_failed",
      passed: false,
      evidence_summary: input.evidence_summary,
      checked_at: input.checked_at,
      current_blocker: input.blocker || "Proof failed.",
      next_action: proofDefinition.nextAction,
    };
  }

  if (runningStatus) {
    return {
      ...proofDefinition,
      status: "proof_running",
      passed: false,
      evidence_summary: input.evidence_summary,
      checked_at: input.checked_at,
      current_blocker: "Proof is still running.",
      next_action: proofDefinition.nextAction,
    };
  }

  return {
    ...proofDefinition,
    status: "ready_for_proof",
    passed: false,
    evidence_summary: input.evidence_summary,
    checked_at: input.checked_at,
    current_blocker: input.blocker || "Proof has not passed.",
    next_action: proofDefinition.nextAction,
  };
}

function findApprovalForGate(gateKey, approvalInputs = {}) {
  if (Array.isArray(approvalInputs)) {
    return approvalInputs.find((approval) => approval.gate_key === gateKey) || null;
  }

  return approvalInputs[gateKey] || null;
}

function isApproved(approval) {
  return approval?.status === "approved" && Boolean(approval.approved_by || approval.approved_at);
}

function isWaived(approval) {
  return approval?.status === "waived" && Boolean(approval.waiver_reason || approval.notes);
}

export function isGateLaunchUnlocked(gate) {
  return ["proof_passed", "approved", "waived"].includes(gate?.status);
}

export function buildGateVerdict(gateDefinition, proofInputs = {}, approvalInputs = {}) {
  const proofs = gateDefinition.required_proofs.map((proofDefinition) => evaluateProof(proofDefinition, proofInputs));
  const passedCount = proofs.filter((item) => item.passed).length;
  const proofPercent = proofs.length ? Math.round((passedCount / proofs.length) * 100) : 0;
  const firstBlockingProof = proofs.find((item) => !item.passed);
  const approval = findApprovalForGate(gateDefinition.gate_key, approvalInputs);
  const allProofsPassed = proofs.length > 0 && passedCount === proofs.length;

  let status = "ready_for_proof";
  if (isWaived(approval)) status = "waived";
  else if (isApproved(approval) && allProofsPassed) status = "approved";
  else if (allProofsPassed) status = "proof_passed";
  else if (proofs.some((item) => item.status === "proof_failed")) status = "proof_failed";
  else if (proofs.some((item) => item.status === "proof_running")) status = "proof_running";
  else if (passedCount > 0) status = "partial";
  else if (gateDefinition.severity === criticalBlocker) status = "locked";
  else status = "blocked";

  const evidenceSummary = allProofsPassed
    ? proofs.map((item) => `${item.label}: ${item.evidence_summary}`).join(" | ")
    : proofs.filter((item) => item.passed).map((item) => `${item.label}: ${item.evidence_summary}`).join(" | ");

  return {
    gate_key: gateDefinition.gate_key,
    gate_name: gateDefinition.gate_name,
    section_label: gateDefinition.section_label,
    status,
    severity: gateDefinition.severity,
    completion_percent: proofPercent,
    proof_percent: proofPercent,
    required_categories: gateDefinition.required_categories,
    required_tasks: gateDefinition.required_tasks,
    required_proofs: gateDefinition.required_proofs.map((item) => item.key),
    proof_results: proofs,
    current_blocker: status === "approved" || status === "proof_passed" || status === "waived"
      ? ""
      : firstBlockingProof?.current_blocker || "Gate is waiting on proof evidence.",
    next_action: status === "approved" || status === "proof_passed" || status === "waived"
      ? "Keep evidence attached; do not perform approval-sensitive actions without matching approval scope."
      : firstBlockingProof?.next_action || "Attach evidence for the next required proof.",
    approval_required: gateDefinition.approval_required,
    approved_by: approval?.approved_by || "",
    approved_at: approval?.approved_at || "",
    waived_by: approval?.waived_by || "",
    waived_at: approval?.waived_at || "",
    waiver_reason: approval?.waiver_reason || approval?.notes || "",
    last_checked_at: new Date().toISOString(),
    evidence_summary: evidenceSummary,
    unlock_condition_summary: gateDefinition.required_proofs.map((item) => item.label).join("; "),
    last_verdict: status,
  };
}

export function buildLaunchGateVerdicts({ proofInputs = {}, approvalInputs = {} } = {}) {
  return LAUNCH_GATE_DEFINITIONS.map((gateDefinition) => buildGateVerdict(gateDefinition, proofInputs, approvalInputs));
}

function allNamedGatesUnlocked(gatesByKey, gateKeys) {
  return gateKeys.every((key) => isGateLaunchUnlocked(gatesByKey.get(key)));
}

function proofPassed(proofInputs, proofKey) {
  const evaluated = evaluateProof({ key: proofKey, label: proofKey, source: "", nextAction: "" }, proofInputs);
  return evaluated.passed;
}

export function buildLaunchVerdict(gates, { fullCampaignProofInputs = {} } = {}) {
  const gatesByKey = new Map(gates.map((gate) => [gate.gate_key, gate]));
  const criticalLocked = gates.filter(
    (gate) => gate.severity === criticalBlocker && !isGateLaunchUnlocked(gate)
  );

  const readyFor25LeadTest = allNamedGatesUnlocked(gatesByKey, [
    GATE_KEYS.emailResend,
    GATE_KEYS.bookingCalendar,
    GATE_KEYS.crmLeads,
    GATE_KEYS.outreachCampaign,
    GATE_KEYS.websiteProduction,
    GATE_KEYS.securityCompliance,
  ]);

  const stripeGate = gatesByKey.get(GATE_KEYS.stripePayments);
  const readyForLivePayments = stripeGate?.status === "approved" && stripeGate.proof_percent === 100;

  const readyForFullCampaign = FULL_CAMPAIGN_REQUIRED_PROOFS.every((proofKey) =>
    proofPassed(fullCampaignProofInputs, proofKey)
  );

  if (criticalLocked.length > 0) {
    return {
      verdict: "LAUNCH LOCKED",
      launch_locked: true,
      ready_for_25_lead_test: false,
      ready_for_live_payments: false,
      ready_for_full_campaign: false,
      blockers: criticalLocked.map((gate) => gate.gate_name),
      next_action: criticalLocked[0]?.next_action || "Attach missing critical proof evidence.",
    };
  }

  if (readyForFullCampaign) {
    return {
      verdict: "READY FOR FULL CAMPAIGN",
      launch_locked: false,
      ready_for_25_lead_test: readyFor25LeadTest,
      ready_for_live_payments: readyForLivePayments,
      ready_for_full_campaign: true,
      blockers: [],
      next_action: "Review campaign approval scope before any real send.",
    };
  }

  if (readyForLivePayments) {
    return {
      verdict: "READY FOR LIVE PAYMENTS",
      launch_locked: false,
      ready_for_25_lead_test: readyFor25LeadTest,
      ready_for_live_payments: true,
      ready_for_full_campaign: false,
      blockers: [],
      next_action: "Use only the approved live payment proof scope.",
    };
  }

  if (readyFor25LeadTest) {
    return {
      verdict: "READY FOR 25-LEAD TEST",
      launch_locked: false,
      ready_for_25_lead_test: true,
      ready_for_live_payments: readyForLivePayments,
      ready_for_full_campaign: false,
      blockers: [],
      next_action: "Record manual campaign approval before any real campaign send.",
    };
  }

  return {
    verdict: "LAUNCH GATES READY FOR OWNER REVIEW",
    launch_locked: false,
    ready_for_25_lead_test: false,
    ready_for_live_payments: false,
    ready_for_full_campaign: false,
    blockers: [],
    next_action: "Review remaining launch blocker gates before unlocking a test.",
  };
}

export function buildLaunchCommandCenterSnapshot(options = {}) {
  const gates = buildLaunchGateVerdicts(options);
  return {
    verdict: buildLaunchVerdict(gates, options),
    gates,
    approval_required_actions: APPROVAL_REQUIRED_ACTIONS,
    allowed_automatic_actions: ALLOWED_AUTOMATIC_ACTIONS,
    generated_at: new Date().toISOString(),
  };
}
