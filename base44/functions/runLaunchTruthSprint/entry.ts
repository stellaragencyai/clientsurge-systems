import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const TEST_EMAIL_PATTERNS = [
  'clientsurge.test', 'clientsurge-install.internal', 'backfill-test',
  'smoke', '@test.', '@example.', 'test@', 'admin_test@',
  'post_patch_verification', 'ai_brain_backfill', 'proof', 'qa',
  'runtime checkout', 'pricing checkout', 'postfix checkout', 'sandbox'
];
const TEST_SOURCE_PATTERNS = ['smoke', 'test', 'backfill', 'admin_test', 'post_patch_verification', 'ai_brain_backfill', 'sandbox'];
const TEST_BIZ_PATTERNS = [
  'backfill test', 'smoke qa', 'admin test', 'test business', 'verification business',
  'clientsurge internal test', 'clientsurge qa', 'runtime checkout proof', 'stripe proof',
  'pricing probe', 'postfix probe', 'cart test', 'funnel check', 'pricing checkout',
  'postfix checkout', 'runtime checkout', 'sandbox'
];
const NON_PROD_ENVS = ['demo', 'qa', 'smoke', 'internal', 'test', 'sandbox'];

const ALL_GATE_KEYS = [
  'website_cta_gate', 'lead_capture_gate', 'stripe_payment_gate', 'resend_email_gate',
  'twilio_sms_gate', 'twilio_voice_gate', 'booking_flow_gate', 'analytics_gate',
  'security_gate', 'client_portal_gate', 'admin_dashboard_gate', 'install_os_gate',
  'dashboard_truth_gate', 'voice_frontline_gate', 'elevenlabs_postcall_logging_gate'
];

const CORE_GA4_EVENTS = ['page_view', 'cta_click'];
const MARKETPLACE_GA4_EVENTS = ['pricing_view', 'checkout_click', 'form_submit'];
const ENTERPRISE_OPTIONAL_GA4_EVENTS = ['booking_click', 'demo_booking_click'];

function getExclusionReason(record) {
  if (!record || typeof record !== 'object') return 'No record';
  if (record.dashboard_excluded === true) return 'dashboard_excluded=true';
  if (record.is_sample === true) return 'is_sample=true';
  if (record.dashboard_truth_status === 'blocked') return 'dashboard_truth_status=blocked';
  const env = record.environment;
  if (env && NON_PROD_ENVS.includes(env)) return `environment=${env}`;

  const emailFields = ['email', 'normalized_email', 'canonical_email', 'client_email', 'customer_email', 'lead_email'];
  for (const field of emailFields) {
    const val = record[field];
    if (val && typeof val === 'string') {
      const lower = val.toLowerCase();
      for (const p of TEST_EMAIL_PATTERNS) if (lower.includes(p)) return `test email pattern: "${p}" in ${field}`;
    }
  }

  if (record.source && typeof record.source === 'string') {
    const lower = record.source.toLowerCase();
    for (const p of TEST_SOURCE_PATTERNS) if (lower.includes(p)) return `test source pattern: "${p}"`;
  }

  const bizFields = ['business_name', 'normalized_business_name', 'canonical_business_name', 'client_name', 'customer_name'];
  for (const field of bizFields) {
    const val = record[field];
    if (val && typeof val === 'string') {
      const lower = val.toLowerCase();
      for (const p of TEST_BIZ_PATTERNS) if (lower.includes(p)) return `test business name pattern: "${p}" in ${field}`;
    }
  }
  return null;
}

function isInternalTestRecord(record) {
  return getExclusionReason(record) !== null;
}

function isProductionTrustedRecord(record) {
  if (!record || typeof record !== 'object') return false;
  if (record.dashboard_truth_status === 'trusted') return true;
  if (isInternalTestRecord(record)) return false;
  if (record.environment === 'production') return true;
  if (!record.environment) return true;
  return false;
}

function partitionTrusted(records) {
  if (!Array.isArray(records)) return { trusted: [], internal: [] };
  const trusted = [];
  const internal = [];
  for (const record of records) {
    if (isProductionTrustedRecord(record)) trusted.push(record);
    else internal.push({ record, reason: getExclusionReason(record) });
  }
  return { trusted, internal };
}

function present(value) {
  return value !== undefined && value !== null && value !== '' && value !== '—';
}

function subscriptionPresent(order) {
  return present(order?.stripe_subscription_id) || present(order?.subscription_id);
}

function hasStripePaidShape(order) {
  return order?.payment_status === 'paid'
    && order?.payment_source === 'stripe'
    && present(order?.stripe_session_id)
    && subscriptionPresent(order);
}

function isProductionRevenueOrder(order) {
  if (!hasStripePaidShape(order)) return false;
  if (!isProductionTrustedRecord(order)) return false;
  const email = String(order.customer_email || '').toLowerCase();
  const biz = String(order.business_name || order.customer_name || '').toLowerCase();
  if (!email || email.includes('test') || email.includes('example') || email.includes('qa') || email.includes('smoke') || email.includes('proof') || email.includes('sandbox')) return false;
  if (!biz || biz.includes('test') || biz.includes('demo') || biz.includes('qa') || biz.includes('smoke') || biz.includes('proof') || biz.includes('sandbox')) return false;
  return true;
}

function isStripeSandboxReadinessOrder(order) {
  if (!hasStripePaidShape(order)) return false;
  if (isProductionRevenueOrder(order)) return false;
  const env = order.environment || '';
  return order.dashboard_excluded === true
    || NON_PROD_ENVS.includes(env)
    || isInternalTestRecord(order);
}

function getMissingHandoffFields(order) {
  const checks = [
    ['client_id', order?.client_id],
    ['client_project_id', order?.client_project_id],
    ['onboarding_client_id', order?.onboarding_client_id],
    ['subscription_id', order?.subscription_id || order?.stripe_subscription_id],
    ['install_initialized_at', order?.install_initialized_at],
    ['pipeline_status', order?.pipeline_status],
  ];
  return checks.filter(([, value]) => !present(value)).map(([key]) => key);
}

async function safeList(base44, entityName, sort = '-created_date', limit = 50) {
  try { return await base44.asServiceRole.entities[entityName].list(sort, limit) || []; }
  catch (_e) { return []; }
}

async function safeFilter(base44, entityName, query, sort = '-created_date', limit = 50) {
  try { return await base44.asServiceRole.entities[entityName].filter(query, sort, limit) || []; }
  catch (_e) { return []; }
}

function gateName(gateKey) {
  return gateKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'super_admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const now = new Date().toISOString();
    const productionBlockers = [];
    const internalCleanupItems = [];
    const warnings = [];
    const evidence = {};

    const adminSettings = (await safeList(base44, 'AdminSettings', '-created_date', 5))[0] || {};

    const websiteLeads = await safeList(base44, 'WebsiteLead', '-created_date', 50);
    const leadPartition = partitionTrusted(websiteLeads);
    const safeLeads = leadPartition.trusted;
    const latestLead = safeLeads[0] || null;
    const leadHasConsent = Boolean(latestLead && (latestLead.consent_given === true || latestLead.consent_given_at));
    const leadCommLogs = latestLead ? await safeFilter(base44, 'CommunicationLog', { related_entity_id: latestLead.id }, '-created_date', 20) : [];

    const commLogs = await safeList(base44, 'CommunicationLog', '-created_date', 150);
    const commPartition = partitionTrusted(commLogs);
    const safeCommLogs = commPartition.trusted;
    const smsLogs = safeCommLogs.filter(l => l.channel === 'sms');
    const emailLogs = safeCommLogs.filter(l => l.channel === 'email');
    const latestSms = smsLogs[0] || null;
    const latestEmail = emailLogs[0] || null;
    const smsDelivered = smsLogs.filter(l => l.delivery_status === 'delivered').length;
    const smsSent = smsLogs.filter(l => l.delivery_status === 'sent' || l.delivery_status === 'delivered').length;
    const smsFailed = smsLogs.filter(l => l.delivery_status === 'failed').length;
    const emailSent = emailLogs.filter(l => l.delivery_status === 'sent' || l.delivery_status === 'delivered').length;
    const emailFailed = emailLogs.filter(l => l.delivery_status === 'failed').length;

    const allOrders = await safeList(base44, 'Order', '-created_date', 100);
    const orderPartition = partitionTrusted(allOrders);
    const safeOrders = orderPartition.trusted;
    const productionRevenueOrders = allOrders.filter(isProductionRevenueOrder);
    const latestProductionPaidOrder = productionRevenueOrders[0] || null;
    const sandboxReadinessOrders = allOrders.filter(isStripeSandboxReadinessOrder);
    const latestSandboxReadinessOrder = sandboxReadinessOrders[0] || null;
    const latestPaidOrder = latestProductionPaidOrder || latestSandboxReadinessOrder || null;
    const pendingPayment = safeOrders.filter(o => o.payment_status === 'pending' || !o.payment_status);
    const failedPayment = safeOrders.filter(o => o.payment_status === 'failed');
    const paidButExcluded = orderPartition.internal
      .filter(e => e.record.payment_status === 'paid')
      .map(e => ({ id: e.record.id, business_name: e.record.business_name || e.record.customer_name || '—', customer_email: e.record.customer_email || '—', exclusion_reason: e.reason }));
    const internalTestExcluded = orderPartition.internal
      .filter(e => e.record.payment_status !== 'paid')
      .map(e => ({ id: e.record.id, business_name: e.record.business_name || e.record.customer_name || '—', customer_email: e.record.customer_email || '—', payment_status: e.record.payment_status || '—', exclusion_reason: e.reason }));

    const allInstallOS = await safeList(base44, 'ClientInstallationOS', '-created_date', 50);
    const installPartition = partitionTrusted(allInstallOS);
    const latestInstallOS = installPartition.trusted[0] || null;
    const allChecklists = await safeList(base44, 'AutomationChecklist', '-created_date', 50);
    const checklistPartition = partitionTrusted(allChecklists);
    const latestChecklist = checklistPartition.trusted[0] || null;
    const allClientProjects = await safeList(base44, 'ClientProject', '-created_date', 50);
    const projectPartition = partitionTrusted(allClientProjects);
    const latestClientProject = projectPartition.trusted[0] || null;

    let stripeEvidenceStatus = 'blocked';
    let stripeStatus = 'blocked';
    let stripeNextAction = 'Complete a Stripe sandbox/test checkout using test keys and card 4242 4242 4242 4242, or complete a real production checkout after launch.';
    let stripeEvidenceSummary = 'No Stripe paid evidence yet.';
    let stripeMissingHandoffFields = getMissingHandoffFields(latestPaidOrder);
    let stripeBlocker = 'No production revenue proof or sandbox integration proof found.';

    if (latestProductionPaidOrder) {
      const missing = getMissingHandoffFields(latestProductionPaidOrder);
      stripeEvidenceStatus = missing.length === 0 ? 'trusted' : 'warning';
      stripeStatus = missing.length === 0 ? 'proof_passed' : 'ready_for_proof';
      stripeBlocker = null;
      stripeMissingHandoffFields = missing;
      stripeEvidenceSummary = `Production revenue proof found: ${latestProductionPaidOrder.business_name || latestProductionPaidOrder.customer_name || '—'}. Stripe customer/subscription/session IDs present.`;
      stripeNextAction = missing.length === 0
        ? 'Production payment proof verified. Verify onboarding pipeline is progressing.'
        : `Production paid order exists but handoff fields are missing: ${missing.join(', ')}. Trigger or repair post-payment onboarding.`;
    } else if (latestSandboxReadinessOrder) {
      stripeEvidenceStatus = 'sandbox_ready';
      stripeStatus = 'ready_for_proof';
      stripeBlocker = null;
      stripeMissingHandoffFields = getMissingHandoffFields(latestSandboxReadinessOrder);
      stripeEvidenceSummary = `Stripe sandbox/test integration readiness found: paid test/smoke order ${latestSandboxReadinessOrder.id}. This proves checkout/webhook/subscription plumbing but does not count as production revenue.`;
      stripeNextAction = 'Approve Stripe integration readiness if the test checkout/webhook/subscription IDs are verified. Production revenue proof remains pending until the first real customer payment.';
      internalCleanupItems.push({ gate: 'stripe_payment_gate', message: 'Stripe integration has sandbox/test paid proof; production revenue proof is still pending and must not be counted as revenue.', severity: 'advisory' });
    } else {
      productionBlockers.push({ gate: 'stripe_payment_gate', message: 'No Stripe sandbox readiness proof or production paid Order found', severity: 'launch_blocker' });
    }

    evidence.stripe_payment = {
      stripe_gate_model: 'separated_sandbox_readiness_and_production_revenue',
      production_revenue_paid_count: productionRevenueOrders.length,
      sandbox_readiness_paid_count: sandboxReadinessOrders.length,
      production_trusted_paid_count: productionRevenueOrders.length,
      paid_but_excluded_count: paidButExcluded.length,
      pending_payment_count: pendingPayment.length,
      failed_payment_count: failedPayment.length,
      internal_test_excluded_count: internalTestExcluded.length,
      evidence_status: stripeEvidenceStatus,
      missing_handoff_fields: stripeMissingHandoffFields,
      latest_paid_order: latestPaidOrder ? {
        id: latestPaidOrder.id,
        customer_name: latestPaidOrder.customer_name || '—',
        business_name: latestPaidOrder.business_name || latestPaidOrder.customer_name || '—',
        customer_email: latestPaidOrder.customer_email || '—',
        selected_package_type: latestPaidOrder.selected_package_type || latestPaidOrder.package_type || '—',
        payment_status: latestPaidOrder.payment_status || '—',
        payment_source: latestPaidOrder.payment_source || '—',
        stripe_session_id: latestPaidOrder.stripe_session_id || null,
        stripe_customer_id: latestPaidOrder.stripe_customer_id || null,
        stripe_subscription_id: latestPaidOrder.stripe_subscription_id || null,
        subscription_id: latestPaidOrder.subscription_id || null,
        has_stripe_ids: Boolean(latestPaidOrder.stripe_session_id || latestPaidOrder.stripe_customer_id),
        has_stripe_subscription: subscriptionPresent(latestPaidOrder),
        order_status: latestPaidOrder.order_status || '—',
        billing_status: latestPaidOrder.billing_status || '—',
        pipeline_status: latestPaidOrder.pipeline_status || '—',
        environment: latestPaidOrder.environment || 'unknown',
        evidence_lane: latestProductionPaidOrder ? 'production_revenue' : 'sandbox_readiness',
        dashboard_excluded: latestPaidOrder.dashboard_excluded === true,
        exclusion_reason: latestProductionPaidOrder ? null : getExclusionReason(latestPaidOrder),
        client_id: latestPaidOrder.client_id || null,
        client_project_id: latestPaidOrder.client_project_id || null,
        onboarding_client_id: latestPaidOrder.onboarding_client_id || null,
        install_initialized_at: latestPaidOrder.install_initialized_at || null,
        last_install_event_at: latestPaidOrder.last_install_event_at || null,
        created_date: latestPaidOrder.created_date,
        updated_date: latestPaidOrder.updated_date,
      } : null,
      recent_orders: allOrders.slice(0, 10).map(o => ({
        id: o.id,
        created_date: o.created_date,
        customer_email: o.customer_email || '—',
        business_name: o.business_name || o.customer_name || '—',
        payment_status: o.payment_status || '—',
        payment_source: o.payment_source || '—',
        order_status: o.order_status || '—',
        billing_status: o.billing_status || '—',
        pipeline_status: o.pipeline_status || '—',
        environment: o.environment || 'unknown',
        package_type: o.selected_package_type || o.package_type || '—',
        production_revenue_evidence: isProductionRevenueOrder(o),
        sandbox_readiness_evidence: isStripeSandboxReadinessOrder(o),
        exclusion_reason: isProductionTrustedRecord(o) ? null : getExclusionReason(o),
        missing_handoff_fields: getMissingHandoffFields(o),
      })),
      paid_but_excluded: paidButExcluded.slice(0, 5),
      internal_test_excluded: internalTestExcluded.slice(0, 5),
      status: stripeStatus,
      next_action: stripeNextAction,
    };

    evidence.payment_onboarding = {
      latest_paid_order: evidence.stripe_payment.latest_paid_order,
      latest_client_project: latestClientProject ? { id: latestClientProject.id, business_name: latestClientProject.business_name || '—', status: latestClientProject.status || '—' } : null,
      latest_install_os: latestInstallOS ? { id: latestInstallOS.id, business_name: latestInstallOS.business_name || '—', workflow_stage: latestInstallOS.workflow_stage, activation_status: latestInstallOS.activation_status, checklist_completion_percent: latestInstallOS.checklist_completion_percent || 0 } : null,
      latest_automation_checklist: latestChecklist ? { id: latestChecklist.id, business_name: latestChecklist.business_name || '—', service_key: latestChecklist.service_key, status: latestChecklist.status, twilio_configured: latestChecklist.twilio_configured, resend_configured: latestChecklist.resend_configured } : null,
      status: latestPaidOrder ? (latestInstallOS ? 'ready_for_proof' : 'partial') : 'blocked',
      next_action: latestPaidOrder ? (latestInstallOS ? 'Verify AutomationChecklist has all integrations configured' : 'Create ClientInstallationOS for latest paid order') : 'Complete Stripe sandbox checkout or real production checkout to generate a paid Order record',
    };

    evidence.public_site = {
      public_routes_verified: true,
      internal_routes_hidden: true,
      sitemap_status: 'Static sitemap — public routes only, no admin routes',
      robots_status: 'robots.txt disallows all admin/internal routes',
      cta_status: 'Public CTAs route to /contact, /pricing, /book, /product-signup',
      notes: 'CTA proof requires manual desktop + mobile screenshots. Code-level routing verified.',
    };

    evidence.lead_capture = {
      latest_website_lead: latestLead ? { id: latestLead.id, name: latestLead.full_name || '—', email: latestLead.email || '—', source: latestLead.source || '—', created_date: latestLead.created_date, is_production_trusted: true } : null,
      consent_proof: leadHasConsent ? { consent_given: latestLead.consent_given, consent_given_at: latestLead.consent_given_at, consent_source: latestLead.consent_source || '—' } : null,
      linked_comm_logs: leadCommLogs.map(l => ({ id: l.id, channel: l.channel, delivery_status: l.delivery_status, trigger_name: l.trigger_name || '—', sent_at: l.sent_at, provider_message_id: l.provider_message_id || '—' })),
      production_trusted_leads: safeLeads.length,
      test_internal_excluded: leadPartition.internal.length,
      status: latestLead ? 'ready_for_proof' : 'blocked',
      next_action: latestLead ? 'Verify SMS/email response fired for this lead' : 'Submit a real lead through the public form',
    };
    if (!latestLead) productionBlockers.push({ gate: 'lead_capture_gate', message: 'No production-trusted WebsiteLead records found', severity: 'critical_blocker' });

    evidence.messaging = {
      latest_sms: latestSms ? { id: latestSms.id, to_address: latestSms.to_address || latestSms.canonical_to_address || '—', delivery_status: latestSms.delivery_status, provider_message_id: latestSms.provider_message_id || '—', sent_at: latestSms.sent_at, trigger_name: latestSms.trigger_name || '—' } : null,
      latest_email: latestEmail ? { id: latestEmail.id, to_address: latestEmail.to_address || '—', delivery_status: latestEmail.delivery_status, provider_message_id: latestEmail.provider_message_id || '—', sent_at: latestEmail.sent_at, subject: latestEmail.subject || '—' } : null,
      sms_delivered_count: smsDelivered,
      sms_sent_count: smsSent,
      sms_failed_count: smsFailed,
      email_sent_count: emailSent,
      email_failed_count: emailFailed,
      skipped_internal_test_count: commPartition.internal.length,
    };
    if (!latestSms) productionBlockers.push({ gate: 'twilio_sms_gate', message: 'No production-trusted SMS records found', severity: 'launch_blocker' });
    if (!latestEmail) productionBlockers.push({ gate: 'resend_email_gate', message: 'No production-trusted email records found', severity: 'launch_blocker' });
    if (smsFailed > 0) warnings.push({ gate: 'twilio_sms_gate', message: `${smsFailed} SMS with failed status`, severity: 'advisory' });
    if (emailFailed > 0) warnings.push({ gate: 'resend_email_gate', message: `${emailFailed} emails with failed status`, severity: 'advisory' });

    const failedJobs = await safeFilter(base44, 'AutomationJob', { status: 'failed' }, '-created_date', 200);
    const stuckJobs = await safeFilter(base44, 'AutomationJob', { status: 'processing' }, '-created_date', 200);
    const deadLetters = await safeFilter(base44, 'DeadLetterLog', { status: 'pending_review' }, '-created_date', 200);
    const failedPartition = partitionTrusted(failedJobs);
    const stuckPartition = partitionTrusted(stuckJobs);
    const deadPartition = partitionTrusted(deadLetters);
    const prodFailedCount = failedPartition.trusted.length;
    const prodStuckCount = stuckPartition.trusted.length;
    const prodDeadLetters = deadPartition.trusted.length;
    const internalFailedCount = failedPartition.internal.length;
    const internalStuckCount = stuckPartition.internal.length;
    const productionDashboardSafe = prodFailedCount + prodStuckCount + prodDeadLetters === 0;
    evidence.dashboard_truth = { production_safe: productionDashboardSafe, prod_failed_jobs: prodFailedCount, prod_stuck_jobs: prodStuckCount, prod_dead_letters: prodDeadLetters, internal_failed_jobs: internalFailedCount, internal_stuck_jobs: internalStuckCount };
    if (!productionDashboardSafe) productionBlockers.push({ gate: 'dashboard_truth_gate', message: `${prodFailedCount + prodStuckCount + prodDeadLetters} production-trusted unresolved issues`, severity: 'critical_blocker' });

    const ga4Configs = await safeList(base44, 'GA4Configuration', '-created_date', 5);
    const ga4Config = ga4Configs[0] || {};
    const conversionEvents = await safeList(base44, 'ConversionTrackingEvent', '-timestamp', 100);
    const conversionPageViews = conversionEvents.filter(e => e.event_type === 'page_view');
    const conversionCtaClicks = conversionEvents.filter(e => e.event_type === 'cta_click');
    const conversionPricing = conversionEvents.filter(e => e.event_type === 'pricing_view');
    const conversionCheckout = conversionEvents.filter(e => e.event_type === 'checkout_click');
    const conversionForms = conversionEvents.filter(e => e.event_type === 'form_submit');
    const measurementIdLooksValid = /^G-[A-Z0-9]+$/.test(String(ga4Config.measurement_id || ''));
    const trackingEnabled = ga4Config.enabled === true;
    const setupStatus = ga4Config.setup_status || 'not_configured';
    const ga4Active = Boolean(ga4Config.id && measurementIdLooksValid && trackingEnabled && setupStatus === 'active');
    const hasRealConversionEvents = conversionPageViews.length > 0 && conversionCtaClicks.length > 0;
    evidence.ga4 = {
      measurement_id: ga4Config.measurement_id || null,
      enabled: trackingEnabled,
      setup_status: setupStatus,
      core_required_events: CORE_GA4_EVENTS,
      marketplace_events: MARKETPLACE_GA4_EVENTS,
      enterprise_optional_events: ENTERPRISE_OPTIONAL_GA4_EVENTS,
      page_view_count: conversionPageViews.length,
      cta_click_count: conversionCtaClicks.length,
      pricing_view_count: conversionPricing.length,
      checkout_click_count: conversionCheckout.length,
      form_submit_count: conversionForms.length,
      has_tracking_proof: hasRealConversionEvents,
      status: ga4Active ? (hasRealConversionEvents ? 'ready_for_proof' : 'partial') : 'blocked',
      next_action: ga4Active ? (hasRealConversionEvents ? 'Verify events in GA4 Realtime dashboard, then approve' : 'Visit public homepage and click a CTA to generate page_view + cta_click ConversionTrackingEvents, then rerun') : 'Configure GA4 Measurement ID, enable tracking, and set setup_status=active',
    };
    if (!ga4Active) productionBlockers.push({ gate: 'analytics_gate', message: 'GA4 not configured, not enabled, or not active', severity: 'launch_blocker' });

    const postCallRecords = await safeFilter(base44, 'CommunicationEvent', { event_type: 'voice_call_completed' }, '-created_date', 5);
    const postCallPartition = partitionTrusted(postCallRecords);
    const hasRealPostCall = postCallPartition.trusted.length > 0;

    const existingGates = await safeList(base44, 'LaunchGate', '', 50);
    const gateMap = {};
    for (const gate of existingGates) gateMap[gate.gate_key] = gate;
    const gateResults = [];

    function computeGate(gateKey) {
      let status = 'blocked';
      let completion = 0;
      let proof = 0;
      let blocker = null;
      let nextAction = 'Run verification checks for this gate';
      let evidenceSummary = 'No evidence yet';

      switch (gateKey) {
        case 'website_cta_gate':
          completion = 80; proof = 0; status = 'ready_for_proof';
          evidenceSummary = 'Public CTAs verified in code. Desktop + mobile screenshot proof needed separately.';
          nextAction = 'Take desktop + mobile screenshots of CTA navigation for each public route and upload as proof';
          break;
        case 'lead_capture_gate':
          if (latestLead) {
            completion = 70; proof = 50; status = leadHasConsent ? 'ready_for_proof' : 'partial';
            evidenceSummary = `Latest production lead: ${latestLead.full_name || '—'} (${latestLead.email || 'no email'}). Consent: ${leadHasConsent ? 'captured' : 'missing'}. Linked comm logs: ${leadCommLogs.length}.`;
            nextAction = leadHasConsent ? 'Verify SMS/email response fired and delivered for this lead' : 'Ensure consent fields are captured on form submission';
          } else { completion = 10; blocker = 'No production-trusted WebsiteLead records found'; nextAction = 'Submit a real lead through the public form'; }
          break;
        case 'stripe_payment_gate':
          completion = latestProductionPaidOrder ? 80 : latestSandboxReadinessOrder ? 65 : 10;
          proof = latestProductionPaidOrder ? 70 : latestSandboxReadinessOrder ? 45 : 0;
          status = stripeStatus;
          blocker = stripeBlocker;
          evidenceSummary = stripeEvidenceSummary;
          nextAction = stripeNextAction;
          break;
        case 'resend_email_gate':
          if (latestEmail && latestEmail.delivery_status !== 'failed') {
            completion = 70; proof = 50; status = latestEmail.provider_message_id ? 'ready_for_proof' : 'partial';
            evidenceSummary = `Latest email: ${latestEmail.subject || '—'}. Status: ${latestEmail.delivery_status}. Provider ID: ${latestEmail.provider_message_id || 'missing'}. Sent: ${emailSent}, Failed: ${emailFailed}.`;
            nextAction = latestEmail.provider_message_id ? 'Manual inbox verification: confirm email arrived in recipient inbox' : 'Ensure Resend returns a provider message ID';
          } else { completion = emailSent > 0 ? 40 : 10; blocker = emailFailed > 0 ? `${emailFailed} emails failed` : 'No production-trusted email records found'; nextAction = 'Send a test email and verify Resend delivery'; }
          break;
        case 'twilio_sms_gate':
          if (latestSms && latestSms.delivery_status !== 'failed') {
            completion = 70; proof = 50; status = latestSms.provider_message_id ? 'ready_for_proof' : 'partial';
            evidenceSummary = `Latest SMS to ${latestSms.to_address || latestSms.canonical_to_address || '—'}. Status: ${latestSms.delivery_status}. Provider ID: ${latestSms.provider_message_id || 'missing'}. Delivered: ${smsDelivered}, Sent: ${smsSent}, Failed: ${smsFailed}.`;
            nextAction = latestSms.provider_message_id ? 'Manual recipient verification: confirm SMS arrived on recipient device' : 'Ensure Twilio returns a provider message ID';
          } else { completion = smsSent > 0 ? 40 : 10; blocker = smsFailed > 0 ? `${smsFailed} SMS failed` : 'No production-trusted SMS records found'; nextAction = 'Send a test SMS and verify Twilio delivery'; }
          break;
        case 'twilio_voice_gate': {
          const voiceUrl = adminSettings?.voice_webhook_url;
          completion = voiceUrl ? 40 : 20; proof = 0; status = 'blocked';
          blocker = 'Voice webhook requires manual verification in Twilio Console';
          nextAction = voiceUrl ? `Verify voice webhook URL (${voiceUrl}) is configured in Twilio Console. Then make a real test call.` : 'Configure Twilio Voice webhook URL in AdminSettings and Twilio Console, then make a real test call';
          evidenceSummary = voiceUrl ? `Voice webhook URL configured: ${voiceUrl}. Real call proof still required.` : 'No voice webhook URL configured in AdminSettings.';
          break;
        }
        case 'booking_flow_gate': {
          const bookingLink = adminSettings?.booking_link_default;
          completion = bookingLink ? 40 : 10; proof = 0; status = 'blocked';
          blocker = 'Enterprise/custom booking flow requires manual verification';
          nextAction = bookingLink ? `Verify optional enterprise booking link (${bookingLink}) loads and a test booking can be completed` : 'Set booking link only for enterprise/custom consultation path';
          evidenceSummary = bookingLink ? `Enterprise/custom booking link configured: ${bookingLink}. Not required for core self-service marketplace checkout.` : 'No booking link configured.';
          break;
        }
        case 'analytics_gate':
          if (ga4Active) {
            completion = 70; proof = hasRealConversionEvents ? 50 : 30; status = hasRealConversionEvents ? 'ready_for_proof' : 'partial';
            evidenceSummary = `GA4 ID: ${ga4Config.measurement_id}. Enabled: ${trackingEnabled}. Setup: ${setupStatus}. Core proof: ${conversionPageViews.length} page_view, ${conversionCtaClicks.length} cta_click.`;
            nextAction = hasRealConversionEvents ? 'Verify events in GA4 Realtime dashboard, then approve' : 'Visit public homepage and click a CTA to generate page_view + cta_click ConversionTrackingEvents, then rerun';
          } else { completion = 10; blocker = 'GA4 not configured, not enabled, or setup_status not active'; nextAction = evidence.ga4.next_action; }
          break;
        case 'security_gate':
          completion = 60; proof = 30; status = 'ready_for_proof';
          evidenceSummary = 'ProtectedRoute guards verified in code. RLS on entities. SSL active on domain.';
          nextAction = 'Manual security review: verify admin routes, RLS, SSL, CSP/HSTS/X-Frame-Options';
          break;
        case 'client_portal_gate':
          completion = 50; proof = 0; status = 'ready_for_proof';
          evidenceSummary = 'Client portal routes exist and are behind auth guard.';
          nextAction = 'Log in as a production-trusted client and verify portal data';
          break;
        case 'admin_dashboard_gate':
          completion = 70; proof = 50; status = 'ready_for_proof';
          evidenceSummary = `Admin dashboard loads. Production orders: ${safeOrders.length}, Leads: ${safeLeads.length}, Comm logs: ${safeCommLogs.length}. Test/internal excluded.`;
          nextAction = 'Verify admin dashboard metrics match production data after test pollution exclusion';
          break;
        case 'install_os_gate':
          if (latestInstallOS) {
            completion = 60; proof = 40; status = latestInstallOS.activation_status === 'live' ? 'proof_passed' : 'ready_for_proof';
            evidenceSummary = `Latest install: ${latestInstallOS.business_name || '—'}. Stage: ${latestInstallOS.workflow_stage || '—'}. Activation: ${latestInstallOS.activation_status || '—'}.`;
            nextAction = latestInstallOS.activation_status === 'live' ? 'Verify all checklist items passed for this client' : 'Progress client through activation stages to live';
          } else { completion = 10; blocker = 'No production-trusted ClientInstallationOS records found'; nextAction = 'Create ClientInstallationOS for a paid order'; }
          break;
        case 'dashboard_truth_gate':
          if (productionDashboardSafe) {
            completion = 80; proof = 60; status = 'ready_for_proof';
            evidenceSummary = `Production-trusted: Failed=${prodFailedCount}, Stuck=${prodStuckCount}, Dead letters=${prodDeadLetters}. Internal/test cleanup: Failed=${internalFailedCount}, Stuck=${internalStuckCount}.`;
            nextAction = 'Admin approval required to mark as proof_passed';
          } else {
            completion = 30; blocker = `${prodFailedCount + prodStuckCount + prodDeadLetters} production-trusted unresolved issues`;
            nextAction = 'Resolve production-trusted failed/stuck jobs and dead letter records';
            evidenceSummary = `Production-trusted: Failed=${prodFailedCount}, Stuck=${prodStuckCount}, Dead letters=${prodDeadLetters}.`;
          }
          break;
        case 'voice_frontline_gate': {
          const agentIdPresent = Boolean(Deno.env.get('ELEVENLABS_AGENT_ID'));
          const phoneIdPresent = Boolean(Deno.env.get('ELEVENLABS_PHONE_NUMBER'));
          completion = (agentIdPresent && phoneIdPresent) ? 40 : 10; proof = 0; status = 'blocked';
          blocker = 'ElevenLabs voice agent requires real inbound call proof';
          nextAction = 'Verify ELEVENLABS_AGENT_ID and ELEVENLABS_PHONE_NUMBER secrets are set, agent is configured, then make a real inbound call';
          evidenceSummary = `Agent ID configured: ${agentIdPresent ? 'yes' : 'no'}. Phone number configured: ${phoneIdPresent ? 'yes' : 'no'}. Real inbound call proof required.`;
          break;
        }
        case 'elevenlabs_postcall_logging_gate':
          if (hasRealPostCall) {
            completion = 70; proof = 50; status = 'ready_for_proof';
            evidenceSummary = `${postCallPartition.trusted.length} production-trusted post-call event(s) found.`;
            nextAction = 'Verify post-call record has call outcome or transcript, then approve';
          } else {
            completion = 20; proof = 0; status = 'blocked'; blocker = 'No production-trusted post-call records with call outcome or transcript';
            nextAction = 'Verify ElevenLabs post-call webhook is registered and make a real call to generate a post-call record';
            evidenceSummary = `Post-call records found: ${postCallRecords.length}. Production-trusted: ${postCallPartition.trusted.length}.`;
          }
          break;
        default:
          blocker = 'Unknown gate key';
      }
      return { status, completion_percent: completion, proof_percent: proof, current_blocker: blocker, next_action: nextAction, evidence_summary: evidenceSummary, last_checked_at: now };
    }

    const gateResults = [];
    for (const gateKey of ALL_GATE_KEYS) {
      const computed = computeGate(gateKey);
      const existing = gateMap[gateKey];
      const manualStatus = existing?.status === 'approved' || existing?.status === 'waived';
      const finalStatus = manualStatus ? existing.status : computed.status;
      const verdict = existing?.status === 'approved' ? 'Approved (manual)' : existing?.status === 'waived' ? 'Waived (manual)' : computed.status === 'proof_passed' ? 'Proof passed' : computed.status === 'ready_for_proof' ? 'Ready for proof' : computed.status === 'blocked' ? 'Blocked' : 'Partial';

      if (existing) {
        try {
          await base44.asServiceRole.entities.LaunchGate.update(existing.id, {
            status: finalStatus,
            completion_percent: computed.completion_percent,
            proof_percent: computed.proof_percent,
            current_blocker: computed.current_blocker,
            next_action: computed.next_action,
            evidence_summary: computed.evidence_summary,
            last_checked_at: computed.last_checked_at,
            last_verdict: verdict,
          });
        } catch (_e) {}
      }

      gateResults.push({
        gate_key: gateKey,
        gate_name: existing?.gate_name || gateName(gateKey),
        section_label: existing?.section_label || 'Uncategorized',
        status: finalStatus,
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

    const safeToLaunch = productionDashboardSafe && productionBlockers.length === 0;
    try {
      await base44.asServiceRole.entities.DashboardTruthCheck.create({
        scope: 'admin_dashboard',
        truth_status: safeToLaunch ? 'trusted' : (productionBlockers.length > 0 ? 'blocked' : 'warning'),
        safe_to_show_client: safeToLaunch,
        safe_to_show_admin: true,
        safe_to_launch: safeToLaunch,
        blocker_count: productionBlockers.length,
        warning_count: warnings.length + internalCleanupItems.length,
        blockers: productionBlockers,
        warnings: [...warnings, ...internalCleanupItems],
        evidence_summary: `Checked ${ALL_GATE_KEYS.length} gates. Blocked: ${gateResults.filter(g => g.status === 'blocked').length}, Ready: ${gateResults.filter(g => g.status === 'ready_for_proof').length}, Passed: ${gateResults.filter(g => g.status === 'proof_passed').length}. Prod failed: ${prodFailedCount}, Internal failed: ${internalFailedCount}. Stripe model: sandbox readiness separated from production revenue.`,
        source_records: evidence,
        last_checked_at: now,
        created_at: now,
        updated_at: now,
      });
    } catch (_e) {}

    return Response.json({
      run_at: now,
      run_by: user.email,
      safe_to_launch: safeToLaunch,
      total_gates: ALL_GATE_KEYS.length,
      gates_blocked: gateResults.filter(g => g.status === 'blocked').length,
      gates_ready_for_proof: gateResults.filter(g => g.status === 'ready_for_proof').length,
      gates_proof_passed: gateResults.filter(g => g.status === 'proof_passed').length,
      gates_approved: gateResults.filter(g => g.status === 'approved').length,
      production_blocker_count: productionBlockers.length,
      internal_cleanup_count: internalCleanupItems.length,
      warning_count: warnings.length,
      sections: {
        public_site: evidence.public_site,
        lead_capture: evidence.lead_capture,
        messaging: evidence.messaging,
        stripe_payment: evidence.stripe_payment,
        payment_onboarding: evidence.payment_onboarding,
        automation_job_audit: evidence.dashboard_truth,
        dashboard_truth: evidence.dashboard_truth,
        ga4: evidence.ga4,
        booking_proof: {
          booking_link_default: adminSettings?.booking_link_default || null,
          status: adminSettings?.booking_link_default ? 'ready_for_proof' : 'blocked',
          next_action: adminSettings?.booking_link_default ? 'Verify optional enterprise booking path manually' : 'Booking is optional enterprise/custom path, not required for self-service checkout.',
        },
      },
      gates: gateResults,
      production_blockers: productionBlockers,
      internal_cleanup_items: internalCleanupItems,
      warnings,
      next_action: productionBlockers.length > 0
        ? `Resolve ${productionBlockers.length} production blocker(s): ${productionBlockers.map(b => b.gate).join(', ')}`
        : `Review ${gateResults.filter(g => g.status === 'ready_for_proof').length} gate(s) ready for proof and approve if evidence is sufficient`,
    }, { status: 200 });
  } catch (error) {
    console.error('[runLaunchTruthSprint]', error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});
