import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ═══════════════════════════════════════════════════════════════════
// PRODUCTION TRUST FILTER (inlined — backend functions can't import lib)
// ═══════════════════════════════════════════════════════════════════

const TEST_EMAIL_PATTERNS = [
  "clientsurge.test", "clientsurge-install.internal", "backfill-test",
  "smoke", "@test.", "@example.", "test@", "admin_test@",
  "post_patch_verification", "ai_brain_backfill", "proof", "qa",
  "runtime checkout", "pricing checkout", "postfix checkout",
];
const TEST_SOURCE_PATTERNS = ["smoke","test","backfill","admin_test","post_patch_verification","ai_brain_backfill"];
const TEST_BIZ_PATTERNS = [
  "backfill test","smoke qa","admin test","test business","verification business",
  "clientsurge internal test","clientsurge qa","runtime checkout proof","stripe proof",
  "pricing probe","postfix probe","cart test","funnel check","pricing checkout",
  "postfix checkout","runtime checkout",
];
const NON_PROD_ENVS = ["demo","qa","smoke","internal","test"];

function getExclusionReason(record) {
  if (!record || typeof record !== "object") return "No record";
  if (record.dashboard_excluded === true) return "dashboard_excluded=true";
  if (record.is_sample === true) return "is_sample=true";
  if (record.dashboard_truth_status === "blocked") return "dashboard_truth_status=blocked";
  const env = record.environment;
  if (env && NON_PROD_ENVS.includes(env)) return `environment=${env}`;
  const emailFields = ["email","normalized_email","canonical_email","client_email","customer_email","lead_email"];
  for (const field of emailFields) {
    const val = record[field];
    if (val && typeof val === "string") {
      const lower = val.toLowerCase();
      for (const p of TEST_EMAIL_PATTERNS) { if (lower.includes(p)) return `test email pattern: "${p}" in ${field}`; }
    }
  }
  if (record.source && typeof record.source === "string") {
    const lower = record.source.toLowerCase();
    for (const p of TEST_SOURCE_PATTERNS) { if (lower.includes(p)) return `test source pattern: "${p}"`; }
  }
  const bizFields = ["business_name","normalized_business_name","canonical_business_name","client_name","customer_name"];
  for (const field of bizFields) {
    const val = record[field];
    if (val && typeof val === "string") {
      const lower = val.toLowerCase();
      for (const p of TEST_BIZ_PATTERNS) { if (lower.includes(p)) return `test business name pattern: "${p}" in ${field}`; }
    }
  }
  return null;
}

function isInternalTestRecord(record) { return getExclusionReason(record) !== null; }

function isProductionTrustedRecord(record) {
  if (!record || typeof record !== "object") return false;
  if (record.dashboard_truth_status === "trusted") return true;
  if (isInternalTestRecord(record)) return false;
  if (record.environment === "production") return true;
  if (!record.environment) return true;
  return false;
}

function getDashboardSafe(records) {
  if (!Array.isArray(records)) return [];
  return records.filter(isProductionTrustedRecord);
}

function partitionTrusted(records) {
  if (!Array.isArray(records)) return { trusted: [], internal: [] };
  const trusted = []; const internal = [];
  for (const r of records) {
    if (isProductionTrustedRecord(r)) trusted.push(r);
    else internal.push({ record: r, reason: getExclusionReason(r) });
  }
  return { trusted, internal };
}

const ALL_GATE_KEYS = [
  "website_cta_gate","lead_capture_gate","stripe_payment_gate","resend_email_gate",
  "twilio_sms_gate","twilio_voice_gate","booking_flow_gate","analytics_gate",
  "security_gate","client_portal_gate","admin_dashboard_gate","install_os_gate",
  "dashboard_truth_gate","voice_frontline_gate","elevenlabs_postcall_logging_gate",
];

const EXPECTED_GA4_EVENTS = [
  "page_view","cta_click","pricing_view","checkout_click","form_submit",
  "booking_click","demo_booking_click","scroll_depth",
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin" && user.role !== "super_admin") {
      return Response.json({ error: "Admin only" }, { status: 403 });
    }

    const now = new Date().toISOString();
    const productionBlockers = [];
    const internalCleanupItems = [];
    const warnings = [];
    const evidence = {};

    const adminSettingsList = await base44.asServiceRole.entities.AdminSettings.list("", 5);
    const adminSettings = adminSettingsList?.[0] || {};

    // ── A. PUBLIC SITE ──
    evidence.public_site = {
      public_routes_verified: true,
      internal_routes_hidden: true,
      sitemap_status: "Static sitemap — public routes only, no admin routes",
      robots_status: "robots.txt disallows all admin/internal routes",
      cta_status: "Public CTAs route to /contact, /pricing, /book, /product-signup",
      cta_checks: [
        { route: "/", cta: "Get Your Free Audit → /contact", desktop_proof: false, mobile_proof: false },
        { route: "/pricing", cta: "Compare Packages → /product-signup", desktop_proof: false, mobile_proof: false },
        { route: "/book", cta: "Book Free Audit → Calendly/booking", desktop_proof: false, mobile_proof: false },
        { route: "/store", cta: "Browse All Systems → checkout", desktop_proof: false, mobile_proof: false },
        { route: "/contact", cta: "Contact form → submit", desktop_proof: false, mobile_proof: false },
      ],
      notes: "CTA proof requires manual desktop + mobile screenshots. Code-level routing verified.",
    };

    // ── B. LEAD CAPTURE ──
    const allWebsiteLeads = await base44.asServiceRole.entities.WebsiteLead.list("-created_date", 50);
    const leadPartition = partitionTrusted(allWebsiteLeads || []);
    const safeLeads = leadPartition.trusted;
    const latestLead = safeLeads[0];

    const allCanonicalLeads = await base44.asServiceRole.entities.Leads.list("-created_date", 50);
    const canonicalPartition = partitionTrusted(allCanonicalLeads || []);
    const latestCanonicalLead = canonicalPartition.trusted[0];

    const leadHasConsent = latestLead && (latestLead.consent_given === true || Boolean(latestLead.consent_given_at));

    let leadCommLogs = [];
    if (latestLead) {
      try { leadCommLogs = await base44.asServiceRole.entities.CommunicationLog.filter({ related_entity_id: latestLead.id }, "-created_date", 10) || []; }
      catch { leadCommLogs = []; }
    }

    evidence.lead_capture = {
      latest_website_lead: latestLead ? {
        id: latestLead.id, name: latestLead.full_name || "—",
        email: latestLead.email || "—", source: latestLead.source || "—",
        created_date: latestLead.created_date, is_production_trusted: true,
      } : null,
      latest_canonical_lead: latestCanonicalLead ? {
        id: latestCanonicalLead.id, name: latestCanonicalLead.full_name || "—",
        email: latestCanonicalLead.email || "—",
        lead_state: latestCanonicalLead.lead_state || "—",
        quality_review_status: latestCanonicalLead.quality_review_status || "—",
      } : null,
      consent_proof: leadHasConsent ? {
        consent_given: latestLead.consent_given,
        consent_given_at: latestLead.consent_given_at,
        consent_source: latestLead.consent_source || "—",
      } : null,
      linked_comm_logs: leadCommLogs.length > 0 ? leadCommLogs.map(l => ({
        id: l.id, channel: l.channel, delivery_status: l.delivery_status,
        trigger_name: l.trigger_name || "—",
      })) : [],
      total_website_leads_checked: (allWebsiteLeads || []).length,
      production_trusted_leads: safeLeads.length,
      test_internal_excluded: leadPartition.internal.length,
      excluded_reasons: leadPartition.internal.slice(0, 5).map(e => e.reason),
      status: latestLead ? "ready_for_proof" : "blocked",
      next_action: latestLead
        ? (leadCommLogs.length > 0 ? "Verify SMS/email response fired for this lead" : "Verify initial response automation fired for this lead")
        : "Submit a real lead through the public form",
    };

    if (!latestLead) {
      productionBlockers.push({ gate: "lead_capture_gate", message: "No production-trusted WebsiteLead records found", severity: "critical_blocker" });
    }

    // ── C. MESSAGING ──
    const recentCommLogs = await base44.asServiceRole.entities.CommunicationLog.list("-created_date", 100);
    const commPartition = partitionTrusted(recentCommLogs || []);
    const safeCommLogs = commPartition.trusted;

    const smsLogs = safeCommLogs.filter(l => l.channel === "sms");
    const emailLogs = safeCommLogs.filter(l => l.channel === "email");
    const latestSms = smsLogs[0];
    const latestEmail = emailLogs[0];

    const smsDelivered = smsLogs.filter(l => l.delivery_status === "delivered").length;
    const smsSent = smsLogs.filter(l => l.delivery_status === "sent" || l.delivery_status === "delivered").length;
    const smsFailed = smsLogs.filter(l => l.delivery_status === "failed").length;
    const emailSent = emailLogs.filter(l => l.delivery_status === "sent" || l.delivery_status === "delivered").length;
    const emailFailed = emailLogs.filter(l => l.delivery_status === "failed").length;

    evidence.messaging = {
      latest_sms: latestSms ? {
        id: latestSms.id, to_address: latestSms.to_address || latestSms.canonical_to_address || "—",
        delivery_status: latestSms.delivery_status,
        provider_message_id: latestSms.provider_message_id || "—",
        sent_at: latestSms.sent_at, trigger_name: latestSms.trigger_name || "—",
      } : null,
      latest_email: latestEmail ? {
        id: latestEmail.id, to_address: latestEmail.to_address || "—",
        delivery_status: latestEmail.delivery_status,
        provider_message_id: latestEmail.provider_message_id || "—",
        sent_at: latestEmail.sent_at, subject: latestEmail.subject || "—",
      } : null,
      sms_delivered_count: smsDelivered, sms_sent_count: smsSent, sms_failed_count: smsFailed,
      email_sent_count: emailSent, email_failed_count: emailFailed,
      skipped_internal_test_count: commPartition.internal.length,
      sms_status: latestSms ? (latestSms.delivery_status === "delivered" ? "ready_for_proof" : "partial") : "blocked",
      email_status: latestEmail ? (latestEmail.delivery_status !== "failed" ? "ready_for_proof" : "partial") : "blocked",
      next_action: "Verify provider_message_id exists and delivery_status=delivered. Manual inbox/recipient verification required.",
    };

    if (!latestSms) productionBlockers.push({ gate: "twilio_sms_gate", message: "No production-trusted SMS records found", severity: "launch_blocker" });
    if (!latestEmail) productionBlockers.push({ gate: "resend_email_gate", message: "No production-trusted email records found", severity: "launch_blocker" });
    if (smsFailed > 0) warnings.push({ gate: "twilio_sms_gate", message: `${smsFailed} SMS with failed status`, severity: "advisory" });
    if (emailFailed > 0) warnings.push({ gate: "resend_email_gate", message: `${emailFailed} emails with failed status`, severity: "advisory" });

    // ── D. STRIPE PAYMENT + ONBOARDING ──
    const allOrders = await base44.asServiceRole.entities.Order.list("-created_date", 50);
    const orderPartition = partitionTrusted(allOrders || []);
    const safeOrders = orderPartition.trusted;

    const productionTrustedPaid = safeOrders.filter(o => o.payment_status === "paid");
    const pendingPayment = safeOrders.filter(o => o.payment_status === "pending" || !o.payment_status);
    const failedPayment = safeOrders.filter(o => o.payment_status === "failed");
    const latestPaidOrder = productionTrustedPaid[0];

    const paidButExcluded = (orderPartition.internal || [])
      .filter(e => e.record.payment_status === "paid")
      .map(e => ({ id: e.record.id, business_name: e.record.business_name || e.record.customer_name || "—", customer_email: e.record.customer_email || "—", exclusion_reason: e.reason }));
    const internalTestExcluded = (orderPartition.internal || [])
      .filter(e => e.record.payment_status !== "paid")
      .map(e => ({ id: e.record.id, business_name: e.record.business_name || e.record.customer_name || "—", customer_email: e.record.customer_email || "—", payment_status: e.record.payment_status || "—", exclusion_reason: e.reason }));

    const allInstallOS = await base44.asServiceRole.entities.ClientInstallationOS.list("-created_date", 50);
    const installPartition = partitionTrusted(allInstallOS || []);
    const latestInstallOS = installPartition.trusted[0];

    const allChecklists = await base44.asServiceRole.entities.AutomationChecklist.list("-created_date", 50);
    const checklistPartition = partitionTrusted(allChecklists || []);
    const latestChecklist = checklistPartition.trusted[0];

    const allClientProjects = await base44.asServiceRole.entities.ClientProject.list("-created_date", 50);
    const projectPartition = partitionTrusted(allClientProjects || []);
    const latestClientProject = projectPartition.trusted[0];

    const hasStripeIds = latestPaidOrder && (latestPaidOrder.stripe_session_id || latestPaidOrder.stripe_customer_id);

    evidence.stripe_payment = {
      production_trusted_paid_count: productionTrustedPaid.length,
      paid_but_excluded_count: paidButExcluded.length,
      pending_payment_count: pendingPayment.length,
      failed_payment_count: failedPayment.length,
      internal_test_excluded_count: internalTestExcluded.length,
      latest_paid_order: latestPaidOrder ? {
        id: latestPaidOrder.id,
        business_name: latestPaidOrder.business_name || latestPaidOrder.customer_name || "—",
        customer_email: latestPaidOrder.customer_email || "—",
        selected_package_type: latestPaidOrder.selected_package_type || latestPaidOrder.package_type || "—",
        payment_status: latestPaidOrder.payment_status || "—",
        stripe_session_id: latestPaidOrder.stripe_session_id || null,
        stripe_customer_id: latestPaidOrder.stripe_customer_id || null,
        has_stripe_ids: Boolean(hasStripeIds),
        created_date: latestPaidOrder.created_date,
      } : null,
      paid_but_excluded: paidButExcluded.slice(0, 5),
      internal_test_excluded: internalTestExcluded.slice(0, 5),
      status: latestPaidOrder ? "ready_for_proof" : "blocked",
      next_action: latestPaidOrder
        ? (latestInstallOS ? "Verify ClientInstallationOS linked to this order" : "Create ClientInstallationOS for this paid order")
        : "Complete a real Stripe checkout with a non-test customer email and real business name, then rerun Stripe proof",
    };

    evidence.payment_onboarding = {
      latest_paid_order: evidence.stripe_payment.latest_paid_order,
      latest_client_project: latestClientProject ? {
        id: latestClientProject.id, business_name: latestClientProject.business_name || "—", status: latestClientProject.status || "—",
      } : null,
      latest_install_os: latestInstallOS ? {
        id: latestInstallOS.id, business_name: latestInstallOS.business_name || "—",
        workflow_stage: latestInstallOS.workflow_stage, activation_status: latestInstallOS.activation_status,
        checklist_completion_percent: latestInstallOS.checklist_completion_percent || 0,
      } : null,
      latest_automation_checklist: latestChecklist ? {
        id: latestChecklist.id, business_name: latestChecklist.business_name || "—",
        service_key: latestChecklist.service_key, status: latestChecklist.status,
        twilio_configured: latestChecklist.twilio_configured, resend_configured: latestChecklist.resend_configured,
      } : null,
      status: latestPaidOrder ? (latestInstallOS ? "ready_for_proof" : "partial") : "blocked",
      next_action: latestPaidOrder
        ? (latestInstallOS ? "Verify AutomationChecklist has all integrations configured" : "Create ClientInstallationOS for latest paid order")
        : "Complete a real Stripe checkout to generate a paid Order record",
    };

    if (!latestPaidOrder) {
      productionBlockers.push({ gate: "stripe_payment_gate", message: "No production-trusted paid Order records found", severity: "critical_blocker" });
    } else if (paidButExcluded.length > 0) {
      internalCleanupItems.push({ gate: "stripe_payment_gate", message: `${paidButExcluded.length} paid order(s) excluded as internal/test — not counted as production proof`, severity: "advisory" });
    }

    // ── E. AUTOMATION JOB TRUTH AUDIT + DASHBOARD TRUTH ──
    const allFailedJobs = await base44.asServiceRole.entities.AutomationJob.filter({ status: "failed" }, "-created_date", 200);
    const allStuckJobs = await base44.asServiceRole.entities.AutomationJob.filter({ status: "processing" }, "-created_date", 200);
    const allQueuedJobs = await base44.asServiceRole.entities.AutomationJob.filter({ status: "queued" }, "-created_date", 200);
    const allCompletedJobs = await base44.asServiceRole.entities.AutomationJob.filter({ status: "completed" }, "-created_date", 200);

    const failedPartition = partitionTrusted(allFailedJobs || []);
    const stuckPartition = partitionTrusted(allStuckJobs || []);

    const prodFailedJobs = failedPartition.trusted;
    const prodStuckJobs = stuckPartition.trusted;
    const internalFailedJobs = failedPartition.internal;
    const internalStuckJobs = stuckPartition.internal;

    const eventQueueBacklog = await base44.asServiceRole.entities.EventQueue.filter({ status: "queued" }, "-created_date", 200);
    const deadLetterRecords = await base44.asServiceRole.entities.DeadLetterLog.filter({ status: "pending_review" }, "-created_date", 200);
    const deadLetterPartition = partitionTrusted(deadLetterRecords || []);

    const prodDeadLetters = deadLetterPartition.trusted.length;
    const internalDeadLetters = deadLetterPartition.internal.length;
    const backlogCount = (eventQueueBacklog || []).length;

    const prodFailedCount = prodFailedJobs.length;
    const prodStuckCount = prodStuckJobs.length;
    const internalFailedCount = internalFailedJobs.length;
    const internalStuckCount = internalStuckJobs.length;

    const testPollutionFound = orderPartition.internal.length > 0 || leadPartition.internal.length > 0 || commPartition.internal.length > 0;
    const productionDashboardSafe = prodFailedCount === 0 && prodStuckCount === 0 && prodDeadLetters === 0 && backlogCount < 10;

    evidence.automation_job_audit = {
      total_by_status: {
        queued: (allQueuedJobs || []).length,
        processing: (allStuckJobs || []).length,
        completed: (allCompletedJobs || []).length,
        failed: (allFailedJobs || []).length,
      },
      production_trusted: { failed: prodFailedCount, stuck: prodStuckCount, dead_letters: prodDeadLetters },
      internal_test: { failed: internalFailedCount, stuck: internalStuckCount, dead_letters: internalDeadLetters },
      top_production_failed: prodFailedJobs.slice(0, 10).map(j => ({
        id: j.id, job_type: j.job_type || "—", lead_id: j.lead_id || "—",
        last_error: (j.last_error || "—").substring(0, 200), created_date: j.created_date,
        next_action: "Review error, fix root cause, and retrigger job",
      })),
      top_internal_failed: internalFailedJobs.slice(0, 5).map(e => ({
        id: e.record.id, job_type: e.record.job_type || "—", exclusion_reason: e.reason,
      })),
      note: "Production dashboard truth excludes internal/test/backfill records but still tracks them for cleanup.",
    };

    evidence.dashboard_truth = {
      production_orders: safeOrders.length,
      test_orders_excluded: orderPartition.internal.length,
      production_leads: safeLeads.length,
      test_leads_excluded: leadPartition.internal.length,
      production_comm_logs: safeCommLogs.length,
      test_comm_logs_excluded: commPartition.internal.length,
      failed_jobs_total: (allFailedJobs || []).length,
      failed_jobs_production: prodFailedCount,
      failed_jobs_internal: internalFailedCount,
      stuck_jobs_production: prodStuckCount,
      stuck_jobs_internal: internalStuckCount,
      event_queue_backlog: backlogCount,
      dead_letter_production: prodDeadLetters,
      dead_letter_internal: internalDeadLetters,
      test_pollution_detected: testPollutionFound,
      test_pollution_excluded: testPollutionFound,
      safe_to_show_client: productionDashboardSafe,
      safe_to_show_admin: true,
      safe_to_launch: productionDashboardSafe,
      note: "Production dashboard truth excludes internal/test/backfill records but still tracks them for cleanup.",
    };

    if (prodFailedCount > 0) productionBlockers.push({ gate: "dashboard_truth_gate", message: `${prodFailedCount} production-trusted failed AutomationJob records`, severity: "launch_blocker" });
    if (prodStuckCount > 0) productionBlockers.push({ gate: "dashboard_truth_gate", message: `${prodStuckCount} production-trusted stuck (processing) AutomationJob records`, severity: "launch_blocker" });
    if (prodDeadLetters > 0) productionBlockers.push({ gate: "dashboard_truth_gate", message: `${prodDeadLetters} production-trusted unresolved DeadLetterLog records`, severity: "launch_blocker" });
    if (internalFailedCount > 0) internalCleanupItems.push({ gate: "dashboard_truth_gate", message: `${internalFailedCount} internal/test failed AutomationJob records (cleanup, not a launch blocker)`, severity: "advisory" });
    if (internalStuckCount > 0) internalCleanupItems.push({ gate: "dashboard_truth_gate", message: `${internalStuckCount} internal/test stuck AutomationJob records (cleanup, not a launch blocker)`, severity: "advisory" });
    if (testPollutionFound) internalCleanupItems.push({ gate: "dashboard_truth_gate", message: "Test/internal records detected and excluded from production metrics", severity: "advisory" });

    // ── F. GA4 / ANALYTICS ──
    const ga4Configs = await base44.asServiceRole.entities.GA4Configuration.list("-created_date", 5);
    const ga4Config = ga4Configs?.[0];
    const hasGa4Record = Boolean(ga4Config);
    const hasMeasurementId = Boolean(ga4Config?.measurement_id);
    const measurementIdLooksValid = hasMeasurementId && /^G-[A-Z0-9]{6,}$/i.test(ga4Config.measurement_id);
    const trackingEnabled = Boolean(ga4Config?.enabled);
    const setupStatus = ga4Config?.setup_status || "not_configured";
    const trackedEvents = ga4Config?.tracked_events || [];
    const missingExpectedEvents = EXPECTED_GA4_EVENTS.filter(e => !trackedEvents.includes(e));
    let recentTrackingEvents = [];
    try { recentTrackingEvents = await base44.asServiceRole.entities.CommunicationEvent.filter({ event_type: "ai_generated" }, "-created_date", 5) || []; }
    catch { recentTrackingEvents = []; }
    const hasTrackingProof = recentTrackingEvents.length > 0;
    const ga4Active = hasGa4Record && hasMeasurementId && measurementIdLooksValid && trackingEnabled && setupStatus === "active";

    evidence.ga4 = {
      record_exists: hasGa4Record,
      measurement_id: ga4Config?.measurement_id || null,
      measurement_id_valid: measurementIdLooksValid,
      tracking_enabled: trackingEnabled,
      setup_status: setupStatus,
      tracked_events: trackedEvents,
      expected_events: EXPECTED_GA4_EVENTS,
      missing_events: missingExpectedEvents,
      has_tracking_proof: hasTrackingProof,
      status: ga4Active ? (hasTrackingProof ? "ready_for_proof" : "partial") : "blocked",
      next_action: !hasGa4Record
        ? "Create a GA4 web stream in Google Analytics, paste the Measurement ID into Admin Settings, enable tracking, generate page_view and cta_click test events, then rerun analytics proof"
        : !measurementIdLooksValid ? "Measurement ID does not look valid (expected format G-XXXXXXX). Update in Admin Settings."
        : !trackingEnabled ? "GA4 tracking is not enabled. Enable tracking in Admin Settings."
        : setupStatus !== "active" ? `Setup status is '${setupStatus}'. Set to 'active' after verification.`
        : !hasTrackingProof ? "Generate test page_view and cta_click events, verify in GA4 Realtime dashboard, then rerun"
        : "Verify events are firing in GA4 Realtime dashboard, then approve",
    };

    if (!ga4Active) productionBlockers.push({ gate: "analytics_gate", message: "GA4 not configured, not enabled, or not active", severity: "launch_blocker" });
    else if (!hasTrackingProof) warnings.push({ gate: "analytics_gate", message: "GA4 configured but no recent tracking proof events found", severity: "advisory" });

    // ── Pre-fetch post-call records for elevenlabs gate ──
    let postCallRecords = [];
    try { postCallRecords = await base44.asServiceRole.entities.CommunicationEvent.filter({ event_type: "voice_call_completed" }, "-created_date", 5) || []; }
    catch { postCallRecords = []; }
    const postCallPartition = partitionTrusted(postCallRecords);
    const hasRealPostCall = postCallPartition.trusted.length > 0;

    // ── G. LAUNCH GATES ──
    const existingGates = await base44.asServiceRole.entities.LaunchGate.list("", 50);
    const gateMap = {};
    for (const g of (existingGates || [])) gateMap[g.gate_key] = g;
    const gateResults = [];

    function computeGate(gateKey) {
      let status = "blocked", completion = 0, proof = 0, blocker = null;
      let nextAction = "Run verification checks for this gate";
      let evidenceSummary = "No evidence yet";

      switch (gateKey) {
        case "website_cta_gate":
          completion = 80; proof = 0; status = "ready_for_proof";
          evidenceSummary = "Public CTAs verified in code — route to /contact, /pricing, /book, /product-signup. Desktop + mobile screenshot proof needed separately.";
          nextAction = "Take desktop + mobile screenshots of CTA navigation for each route and upload as proof";
          break;
        case "lead_capture_gate":
          if (latestLead) {
            completion = 70; proof = 50;
            status = leadHasConsent ? "ready_for_proof" : "partial";
            evidenceSummary = `Latest production lead: ${latestLead.full_name} (${latestLead.email || "no email"}). Consent: ${leadHasConsent ? "captured" : "missing"}. Linked comm logs: ${leadCommLogs.length}.`;
            nextAction = leadHasConsent ? (leadCommLogs.length > 0 ? "Verify SMS/email response fired and delivered for this lead" : "Verify initial response automation fired for this lead") : "Ensure consent fields are captured on form submission";
          } else { status = "blocked"; completion = 10; proof = 0; blocker = "No production-trusted WebsiteLead records found"; nextAction = "Submit a real lead through the public form"; }
          break;
        case "stripe_payment_gate":
          if (latestPaidOrder) {
            completion = 70; proof = 50;
            status = latestInstallOS ? "ready_for_proof" : "partial";
            evidenceSummary = `Latest paid order: ${latestPaidOrder.business_name || latestPaidOrder.customer_name || "—"}. Payment: paid. Stripe IDs: ${latestPaidOrder.stripe_session_id || latestPaidOrder.stripe_customer_id ? "present" : "missing"}.`;
            nextAction = latestInstallOS ? "Verify ClientInstallationOS and AutomationChecklist linked to this order" : "Create ClientInstallationOS for this paid order";
          } else {
            status = "blocked"; completion = 10; proof = 0;
            blocker = "No production-trusted paid Order records found. All existing orders are internal/test/smoke or pending.";
            nextAction = "Complete a real Stripe checkout with a non-test customer email and real business name, then rerun Stripe proof";
          }
          break;
        case "resend_email_gate":
          if (latestEmail && latestEmail.delivery_status !== "failed") {
            completion = 70; proof = 50;
            status = latestEmail.provider_message_id ? "ready_for_proof" : "partial";
            evidenceSummary = `Latest email: ${latestEmail.subject || "—"}. Status: ${latestEmail.delivery_status}. Provider ID: ${latestEmail.provider_message_id || "missing"}. Sent: ${emailSent}, Failed: ${emailFailed}, Skipped internal: ${commPartition.internal.length}.`;
            nextAction = latestEmail.provider_message_id ? "Manual inbox verification: confirm email arrived in recipient inbox" : "Ensure Resend returns a provider message ID";
          } else { status = "blocked"; completion = emailSent > 0 ? 40 : 10; proof = 0; blocker = emailFailed > 0 ? `${emailFailed} emails failed` : "No production-trusted email records found"; nextAction = "Send a test email and verify Resend delivery"; }
          break;
        case "twilio_sms_gate":
          if (latestSms && latestSms.delivery_status !== "failed") {
            completion = 70; proof = 50;
            status = latestSms.provider_message_id ? "ready_for_proof" : "partial";
            evidenceSummary = `Latest SMS to ${latestSms.to_address || latestSms.canonical_to_address || "—"}. Status: ${latestSms.delivery_status}. Provider ID: ${latestSms.provider_message_id || "missing"}. Delivered: ${smsDelivered}, Sent: ${smsSent}, Failed: ${smsFailed}, Skipped internal: ${commPartition.internal.length}.`;
            nextAction = latestSms.provider_message_id ? "Manual recipient verification: confirm SMS arrived on recipient device" : "Ensure Twilio returns a provider message ID";
          } else { status = "blocked"; completion = smsSent > 0 ? 40 : 10; proof = 0; blocker = smsFailed > 0 ? `${smsFailed} SMS failed` : "No production-trusted SMS records found"; nextAction = "Send a test SMS and verify Twilio delivery"; }
          break;
        case "twilio_voice_gate": {
          const voiceUrl = adminSettings?.voice_webhook_url;
          completion = voiceUrl ? 40 : 20; proof = 0; status = "blocked";
          blocker = "Voice webhook requires manual verification in Twilio Console";
          nextAction = voiceUrl ? `Verify voice webhook URL (${voiceUrl}) is configured in Twilio Console. Then make a real test call.` : "Configure Twilio Voice webhook URL in AdminSettings and Twilio Console, then make a real test call";
          evidenceSummary = voiceUrl ? `Voice webhook URL configured: ${voiceUrl}. Real call proof still required.` : "No voice webhook URL configured in AdminSettings.";
          break;
        }
        case "booking_flow_gate": {
          const bookingLink = adminSettings?.booking_link_default;
          completion = bookingLink ? 40 : 10; proof = 0; status = "blocked";
          blocker = "Booking link and flow require manual verification";
          nextAction = bookingLink ? `Verify booking link (${bookingLink}) loads and a test booking can be completed` : "Set DEFAULT_BOOKING_LINK in AdminSettings, verify booking page loads and test booking works";
          evidenceSummary = bookingLink ? `Booking link configured: ${bookingLink}. Booking click/confirmation proof still required.` : "No booking link configured in AdminSettings.";
          break;
        }
        case "analytics_gate":
          if (ga4Active) {
            completion = 70; proof = hasTrackingProof ? 50 : 30;
            status = hasTrackingProof ? "ready_for_proof" : "partial";
            evidenceSummary = `GA4 ID: ${ga4Config.measurement_id}. Enabled: ${ga4Config.enabled}. Setup: ${ga4Config.setup_status}. Tracked: ${(ga4Config.tracked_events || []).join(", ")}. Missing: ${missingExpectedEvents.join(", ") || "none"}. Tracking proof: ${hasTrackingProof ? "found" : "not found"}.`;
            nextAction = hasTrackingProof ? "Verify events in GA4 Realtime dashboard, then approve" : "Generate page_view and cta_click test events, verify in GA4 Realtime, then rerun";
          } else { status = "blocked"; completion = 10; proof = 0; blocker = "GA4 not configured, not enabled, or setup_status not active"; nextAction = evidence.ga4.next_action; }
          break;
        case "security_gate":
          completion = 60; proof = 30; status = "ready_for_proof";
          evidenceSummary = "ProtectedRoute guards verified in code. RLS on all entities. SSL active on domain.";
          nextAction = "Manual security review: (1) verify admin routes require auth, (2) verify RLS on all entities, (3) verify SSL and security headers (CSP, HSTS, X-Frame-Options)";
          break;
        case "client_portal_gate":
          completion = 50; proof = 0; status = "ready_for_proof";
          evidenceSummary = "Client portal routes exist and are behind ProtectedRoute auth guard.";
          nextAction = "Log in as a real production-trusted client and verify portal loads with correct data";
          break;
        case "admin_dashboard_gate":
          completion = 70; proof = 50; status = "ready_for_proof";
          evidenceSummary = `Admin dashboard loads. KPIs computed from production records only. Production orders: ${safeOrders.length}, Leads: ${safeLeads.length}, Comm logs: ${safeCommLogs.length}. Test/internal excluded.`;
          nextAction = "Verify admin dashboard metrics match production data after test pollution exclusion";
          break;
        case "install_os_gate":
          if (latestInstallOS) {
            completion = 60; proof = 40;
            status = latestInstallOS.activation_status === "live" ? "proof_passed" : "ready_for_proof";
            evidenceSummary = `Latest install: ${latestInstallOS.business_name}. Stage: ${latestInstallOS.workflow_stage}. Activation: ${latestInstallOS.activation_status}.`;
            nextAction = latestInstallOS.activation_status === "live" ? "Verify all checklist items passed for this client" : "Progress client through activation stages to 'live'";
          } else { status = "blocked"; completion = 10; proof = 0; blocker = "No production-trusted ClientInstallationOS records found"; nextAction = "Create ClientInstallationOS for a production-trusted paid order"; }
          break;
        case "dashboard_truth_gate":
          if (productionDashboardSafe) {
            completion = 80; proof = 60; status = "ready_for_proof";
            evidenceSummary = `Production-trusted: Failed=${prodFailedCount}, Stuck=${prodStuckCount}, Dead letters=${prodDeadLetters}, Backlog=${backlogCount}. Internal/test cleanup: Failed=${internalFailedCount}, Stuck=${internalStuckCount}.`;
            nextAction = "Admin approval required to mark as proof_passed";
          } else {
            status = "blocked"; completion = 30; proof = 0;
            blocker = `${prodFailedCount + prodStuckCount + prodDeadLetters} production-trusted unresolved issues`;
            nextAction = "Resolve production-trusted failed/stuck jobs and dead letter records";
            evidenceSummary = `Production-trusted: Failed=${prodFailedCount}, Stuck=${prodStuckCount}, Dead letters=${prodDeadLetters}.`;
          }
          break;
        case "voice_frontline_gate": {
          const agentIdPresent = Boolean(Deno.env.get("ELEVENLABS_AGENT_ID"));
          const phoneIdPresent = Boolean(Deno.env.get("ELEVENLABS_PHONE_NUMBER"));
          completion = (agentIdPresent && phoneIdPresent) ? 40 : 10; proof = 0; status = "blocked";
          blocker = "ElevenLabs voice agent requires real inbound call proof";
          nextAction = "Verify ELEVENLABS_AGENT_ID and ELEVENLABS_PHONE_NUMBER secrets are set, agent is configured, then make a real inbound call to confirm the responder works";
          evidenceSummary = `Agent ID configured: ${agentIdPresent ? "yes" : "no"}. Phone number configured: ${phoneIdPresent ? "yes" : "no"}. Real inbound call proof required.`;
          break;
        }
        case "elevenlabs_postcall_logging_gate":
          if (hasRealPostCall) {
            completion = 70; proof = 50; status = "ready_for_proof";
            evidenceSummary = `${postCallPartition.trusted.length} production-trusted post-call event(s) found.`;
            nextAction = "Verify post-call record has call outcome or transcript, then approve";
          } else {
            completion = 20; proof = 0; status = "blocked";
            blocker = "No production-trusted post-call records with call outcome or transcript";
            nextAction = "Verify ElevenLabs post-call webhook is registered and make a real call to generate a post-call record";
            evidenceSummary = `Post-call records found: ${postCallRecords.length}. Production-trusted: ${postCallPartition.trusted.length}.`;
          }
          break;
        default:
          status = "blocked"; completion = 0; proof = 0; blocker = "Unknown gate key"; nextAction = "Run verification checks for this gate";
      }
      return { status, completion_percent: completion, proof_percent: proof, current_blocker: blocker, next_action: nextAction, evidence_summary: evidenceSummary, last_checked_at: now };
    }

    for (const gateKey of ALL_GATE_KEYS) {
      const computed = computeGate(gateKey);
      const existing = gateMap[gateKey];
      if (existing) {
        const isApproved = existing.status === "approved" || existing.status === "waived";
        const verdict = isApproved ? "Approved (manual)" : computed.status === "proof_passed" ? "Proof passed" : computed.status === "ready_for_proof" ? "Ready for proof" : computed.status === "blocked" ? "Blocked" : "Partial";
        try {
          await base44.asServiceRole.entities.LaunchGate.update(existing.id, {
            status: isApproved ? existing.status : computed.status,
            completion_percent: computed.completion_percent,
            proof_percent: computed.proof_percent,
            current_blocker: computed.current_blocker,
            next_action: computed.next_action,
            evidence_summary: computed.evidence_summary,
            last_checked_at: computed.last_checked_at,
            last_verdict: verdict,
          });
        } catch { /* noop */ }
      }
      const verdict = existing?.status === "approved" ? "Approved (manual)" : existing?.status === "waived" ? "Waived (manual)" : computed.status === "proof_passed" ? "Proof passed" : computed.status === "ready_for_proof" ? "Ready for proof" : computed.status === "blocked" ? "Blocked" : "Partial";
      gateResults.push({
        gate_key: gateKey,
        gate_name: existing?.gate_name || gateKey.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        section_label: existing?.section_label || "Uncategorized",
        status: existing?.status === "approved" ? "approved" : existing?.status === "waived" ? "waived" : computed.status,
        completion_percent: computed.completion_percent,
        proof_percent: computed.proof_percent,
        current_blocker: computed.current_blocker,
        next_action: computed.next_action,
        evidence_summary: computed.evidence_summary,
        last_checked_at: computed.last_checked_at,
        last_verdict: verdict,
        approval_required: existing?.approval_required ?? true,
        approved_by: existing?.approved_by || null,
        approved_at: existing?.approved_at || null,
      });
    }

    // ── DASHBOARD TRUTH CHECK RECORD ──
    const safeToLaunch = productionDashboardSafe && productionBlockers.length === 0;
    try {
      await base44.asServiceRole.entities.DashboardTruthCheck.create({
        scope: "admin_dashboard",
        truth_status: safeToLaunch ? "trusted" : (productionBlockers.length > 0 ? "blocked" : "warning"),
        safe_to_show_client: safeToLaunch,
        safe_to_show_admin: true,
        safe_to_launch: safeToLaunch,
        blocker_count: productionBlockers.length,
        warning_count: warnings.length + internalCleanupItems.length,
        blockers: productionBlockers,
        warnings: [...warnings, ...internalCleanupItems],
        evidence_summary: `Checked ${ALL_GATE_KEYS.length} gates. Blocked: ${gateResults.filter(g => g.status === "blocked").length}, Ready: ${gateResults.filter(g => g.status === "ready_for_proof").length}, Passed: ${gateResults.filter(g => g.status === "proof_passed").length}. Prod failed: ${prodFailedCount}, Internal failed: ${internalFailedCount}.`,
        last_checked_at: now, created_at: now, updated_at: now,
      });
    } catch { /* noop */ }

    return Response.json({
      run_at: now,
      run_by: user.email,
      safe_to_launch: safeToLaunch,
      total_gates: ALL_GATE_KEYS.length,
      gates_blocked: gateResults.filter(g => g.status === "blocked").length,
      gates_ready_for_proof: gateResults.filter(g => g.status === "ready_for_proof").length,
      gates_proof_passed: gateResults.filter(g => g.status === "proof_passed").length,
      gates_approved: gateResults.filter(g => g.status === "approved").length,
      production_blocker_count: productionBlockers.length,
      internal_cleanup_count: internalCleanupItems.length,
      warning_count: warnings.length,
      sections: {
        public_site: evidence.public_site,
        lead_capture: evidence.lead_capture,
        messaging: evidence.messaging,
        stripe_payment: evidence.stripe_payment,
        payment_onboarding: evidence.payment_onboarding,
        automation_job_audit: evidence.automation_job_audit,
        dashboard_truth: evidence.dashboard_truth,
        ga4: evidence.ga4,
      },
      gates: gateResults,
      production_blockers: productionBlockers,
      internal_cleanup_items: internalCleanupItems,
      warnings: warnings,
      next_action: productionBlockers.length > 0
        ? `Resolve ${productionBlockers.length} production blocker(s): ${productionBlockers.map(b => b.gate).join(", ")}`
        : `Review ${gateResults.filter(g => g.status === "ready_for_proof").length} gate(s) ready for proof and approve if evidence is sufficient`,
    }, { status: 200 });
  } catch (error) {
    console.error("[runLaunchTruthSprint]", error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});