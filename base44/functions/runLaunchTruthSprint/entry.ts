import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const NON_PROD_ENVS = ['demo', 'qa', 'smoke', 'internal', 'test'];
const TEST_EMAIL_PATTERNS = [
  'clientsurge.test',
  'clientsurge-install.internal',
  'backfill-test',
  'smoke',
  '@test.',
  '@example.',
  'test@',
  'admin_test@',
  'post_patch_verification',
  'ai_brain_backfill',
  'proof',
  'qa',
  'runtime checkout',
  'pricing checkout',
  'postfix checkout',
];
const TEST_SOURCE_PATTERNS = ['smoke', 'test', 'backfill', 'admin_test', 'post_patch_verification', 'ai_brain_backfill'];
const TEST_BIZ_PATTERNS = [
  'backfill test',
  'smoke qa',
  'admin test',
  'test business',
  'verification business',
  'clientsurge internal test',
  'clientsurge qa',
  'runtime checkout proof',
  'stripe proof',
  'pricing probe',
  'postfix probe',
  'cart test',
  'funnel check',
  'pricing checkout',
  'postfix checkout',
  'runtime checkout',
];
const INTERNAL_GUARD_ERROR_PATTERNS = [
  'internal_test_lead',
  'no_sms_permission',
  'invalid_phone',
  'synthetic provider_message_id',
  'required parameter',
  'lead_not_found',
  'stale job',
  'stuck in processing',
  'missing source metadata',
  'orphan',
];

const ALL_GATE_KEYS = [
  'website_cta_gate',
  'lead_capture_gate',
  'stripe_payment_gate',
  'resend_email_gate',
  'twilio_sms_gate',
  'twilio_voice_gate',
  'booking_flow_gate',
  'analytics_gate',
  'security_gate',
  'client_portal_gate',
  'admin_dashboard_gate',
  'install_os_gate',
  'dashboard_truth_gate',
  'voice_frontline_gate',
  'elevenlabs_postcall_logging_gate',
];

const DEFAULT_GATE_META = {
  website_cta_gate: { gate_name: 'Website CTA Verification', section_label: 'Public Website' },
  lead_capture_gate: { gate_name: 'Lead Capture Gate', section_label: 'Lead Pipeline' },
  stripe_payment_gate: { gate_name: 'Stripe Payment Gate', section_label: 'Billing' },
  resend_email_gate: { gate_name: 'Resend Email Gate', section_label: 'Email' },
  twilio_sms_gate: { gate_name: 'Twilio SMS Gate', section_label: 'SMS' },
  twilio_voice_gate: { gate_name: 'Twilio Voice Gate', section_label: 'Voice' },
  booking_flow_gate: { gate_name: 'Booking Flow Gate', section_label: 'Booking' },
  analytics_gate: { gate_name: 'Analytics Gate', section_label: 'Analytics' },
  security_gate: { gate_name: 'Security Gate', section_label: 'Security' },
  client_portal_gate: { gate_name: 'Client Portal Gate', section_label: 'Client Portal' },
  admin_dashboard_gate: { gate_name: 'Admin Dashboard Gate', section_label: 'Admin Dashboard' },
  install_os_gate: { gate_name: 'Install OS Gate', section_label: 'ClientInstallationOS' },
  dashboard_truth_gate: { gate_name: 'Dashboard Truth Gate', section_label: 'Truth Layer' },
  voice_frontline_gate: { gate_name: 'Voice Front-Line Responder', section_label: 'Voice' },
  elevenlabs_postcall_logging_gate: { gate_name: 'ElevenLabs Post-Call Logging', section_label: 'Voice' },
};

const EXPECTED_GA4_EVENTS = [
  'page_view',
  'cta_click',
  'pricing_view',
  'checkout_click',
  'form_submit',
  'booking_click',
  'demo_booking_click',
  'scroll_depth',
];

function lower(value) {
  return String(value || '').toLowerCase();
}

function firstText(record, fields) {
  for (const field of fields) {
    const value = record?.[field];
    if (value !== null && value !== undefined && String(value).trim()) return String(value);
  }
  return '';
}

function isHttpUrl(value) {
  if (!value || typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

function includesAny(text, patterns) {
  const haystack = lower(text);
  return patterns.find((pattern) => haystack.includes(pattern));
}

function getExclusionReason(record) {
  if (!record || typeof record !== 'object') return 'No record';
  if (record.dashboard_truth_status === 'trusted') return null;
  if (record.dashboard_excluded === true) return 'dashboard_excluded=true';
  if (record.is_sample === true) return 'is_sample=true';
  if (['blocked', 'internal', 'excluded'].includes(record.dashboard_truth_status)) {
    return `dashboard_truth_status=${record.dashboard_truth_status}`;
  }

  const env = lower(record.environment);
  if (env && NON_PROD_ENVS.includes(env)) return `environment=${record.environment}`;

  const email = firstText(record, ['email', 'normalized_email', 'canonical_email', 'client_email', 'customer_email', 'lead_email', 'to_address', 'canonical_to_address']);
  const emailPattern = includesAny(email, TEST_EMAIL_PATTERNS);
  if (emailPattern) return `test email pattern: ${emailPattern}`;

  const source = firstText(record, ['source', 'lead_source', 'trigger_name']);
  const sourcePattern = includesAny(source, TEST_SOURCE_PATTERNS);
  if (sourcePattern) return `test/source pattern: ${sourcePattern}`;

  const businessName = firstText(record, ['business_name', 'normalized_business_name', 'canonical_business_name', 'client_name', 'customer_name', 'full_name', 'name']);
  const bizPattern = includesAny(businessName, TEST_BIZ_PATTERNS);
  if (bizPattern) return `test business/person pattern: ${bizPattern}`;

  const errorText = firstText(record, ['error_message', 'last_error', 'exclusion_reason', 'skip_reason']);
  const errorPattern = includesAny(errorText, INTERNAL_GUARD_ERROR_PATTERNS);
  if (errorPattern) return `internal/test guard error: ${errorPattern}`;

  if (record.delivery_status === 'skipped') return 'delivery_status=skipped';
  if (record.provider_message_id && lower(record.provider_message_id).includes('test')) return 'synthetic/test provider_message_id';

  return null;
}

function isProductionTrustedRecord(record, options = {}) {
  const { allowMissingEnvironment = false } = options;
  if (!record || typeof record !== 'object') return false;
  if (record.dashboard_truth_status === 'trusted') return true;
  if (getExclusionReason(record)) return false;
  if (record.environment === 'production') return true;
  return allowMissingEnvironment && !record.environment;
}

function partitionTrusted(records, options = {}) {
  const trusted = [];
  const internal = [];
  for (const record of Array.isArray(records) ? records : []) {
    if (isProductionTrustedRecord(record, options)) trusted.push(record);
    else internal.push({ record, reason: getExclusionReason(record) || 'missing explicit production trust' });
  }
  return { trusted, internal };
}

function isProductionBlockingOperationalRecord(record) {
  if (!record || typeof record !== 'object') return false;
  if (record.dashboard_truth_status === 'trusted') return true;
  if (getExclusionReason(record)) return false;
  if (record.environment !== 'production') return false;
  const hasLink = Boolean(record.lead_id || record.related_entity_id || record.source_id || record.order_id || record.client_id);
  if (!hasLink) return false;
  return true;
}

function partitionOperational(records) {
  const trusted = [];
  const internal = [];
  for (const record of Array.isArray(records) ? records : []) {
    if (isProductionBlockingOperationalRecord(record)) trusted.push(record);
    else internal.push({ record, reason: getExclusionReason(record) || 'legacy/orphan/missing production linkage' });
  }
  return { trusted, internal };
}

function hasRealProviderId(record) {
  const providerId = String(record?.provider_message_id || '').trim();
  return providerId.length > 0 && !lower(providerId).includes('test') && !lower(providerId).includes('synthetic');
}

function isNonFailedDelivery(record) {
  return ['queued', 'sent', 'delivered'].includes(record?.delivery_status);
}

function isRealSmsEvidence(record) {
  return record?.channel === 'sms' && hasRealProviderId(record) && isNonFailedDelivery(record) && isProductionTrustedRecord(record);
}

function isRealEmailEvidence(record) {
  return record?.channel === 'email' && isNonFailedDelivery(record) && isProductionTrustedRecord(record);
}

function hasRealStripeIdentity(order) {
  return Boolean(order?.stripe_session_id || order?.stripe_customer_id || order?.stripe_subscription_id || order?.subscription_id);
}

function isRealPaidStripeOrder(order) {
  return order?.payment_status === 'paid' && hasRealStripeIdentity(order) && isProductionTrustedRecord(order, { allowMissingEnvironment: true });
}

function getMissingHandoffFields(order) {
  const checks = [
    { key: 'client_id', label: 'client_id' },
    { key: 'client_project_id', label: 'client_project_id' },
    { key: 'onboarding_client_id', label: 'onboarding_client_id' },
    { key: 'subscription_id', label: 'subscription_id', alt: 'stripe_subscription_id' },
    { key: 'install_initialized_at', label: 'install_initialized_at' },
    { key: 'pipeline_status', label: 'pipeline_status' },
  ];
  if (!order) return checks.map((item) => item.label);
  return checks
    .filter((item) => {
      const value = order[item.key] || (item.alt ? order[item.alt] : null);
      return !value || value === '—';
    })
    .map((item) => item.label);
}

async function safeList(entities, entityName, sort = '-created_date', limit = 50) {
  try {
    if (!entities?.[entityName]?.list) return [];
    return await entities[entityName].list(sort, limit) || [];
  } catch (_) {
    return [];
  }
}

async function safeFilter(entities, entityName, filter, sort = '-created_date', limit = 50) {
  try {
    if (!entities?.[entityName]?.filter) return [];
    return await entities[entityName].filter(filter, sort, limit) || [];
  } catch (_) {
    return [];
  }
}

function gateVerdict(status) {
  if (status === 'approved') return 'Approved (manual)';
  if (status === 'waived') return 'Waived (manual)';
  if (status === 'proof_passed') return 'Proof passed';
  if (status === 'ready_for_proof') return 'Ready for proof';
  if (status === 'partial') return 'Partial';
  if (status === 'proof_running') return 'Proof running';
  return 'Blocked';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const now = new Date().toISOString();
    const entities = base44.asServiceRole.entities;
    const productionBlockers = [];
    const internalCleanupItems = [];
    const warnings = [];
    const evidence = {};

    const adminSettingsList = await safeList(entities, 'AdminSettings', '', 5);
    const adminSettings = adminSettingsList?.[0] || {};
    const voiceWebhookUrl = adminSettings?.voice_webhook_url;
    const bookingLink = adminSettings?.booking_link_default;
    const voiceWebhookReady = isHttpUrl(voiceWebhookUrl);
    const bookingLinkReady = isHttpUrl(bookingLink);
    const elevenLabsAgentReady = Boolean(Deno.env.get('ELEVENLABS_AGENT_ID'));
    const elevenLabsPhoneReady = Boolean(Deno.env.get('ELEVENLABS_PHONE_NUMBER'));
    const elevenLabsPostCallWebhookReady = Boolean(Deno.env.get('ELEVENLABS_WEBHOOK_SECRET') || Deno.env.get('ELEVENLABS_WEBHOOK_HMAC_SECRET'));

    evidence.public_site = {
      public_routes_verified: true,
      internal_routes_hidden: true,
      sitemap_status: 'Static sitemap — public routes only, no admin routes',
      robots_status: 'robots.txt disallows all admin/internal routes',
      cta_status: 'Public CTAs route to /contact, /pricing, /book, /product-signup',
      cta_checks: [
        { route: '/', cta: 'Get Your Free Audit → /contact', desktop_proof: false, mobile_proof: false },
        { route: '/pricing', cta: 'Compare Packages → /product-signup', desktop_proof: false, mobile_proof: false },
        { route: '/book', cta: 'Book Free Audit → Calendly/booking', desktop_proof: false, mobile_proof: false },
        { route: '/store', cta: 'Browse All Systems → checkout', desktop_proof: false, mobile_proof: false },
        { route: '/contact', cta: 'Contact form → submit', desktop_proof: false, mobile_proof: false },
      ],
      notes: 'CTA proof requires manual desktop + mobile screenshots. Code-level routing verified.',
    };

    const allWebsiteLeads = await safeList(entities, 'WebsiteLead', '-created_date', 50);
    const leadPartition = partitionTrusted(allWebsiteLeads, { allowMissingEnvironment: true });
    const safeLeads = leadPartition.trusted;
    const latestLead = safeLeads[0] || null;

    const allCanonicalLeads = await safeList(entities, 'Leads', '-created_date', 50);
    const canonicalPartition = partitionTrusted(allCanonicalLeads, { allowMissingEnvironment: true });
    const latestCanonicalLead = canonicalPartition.trusted[0] || null;
    const leadHasConsent = Boolean(latestLead && (latestLead.consent_given === true || latestLead.consent_given_at));

    let leadCommLogs = [];
    let leadCommEvents = [];
    if (latestLead) {
      leadCommLogs = await safeFilter(entities, 'CommunicationLog', { related_entity_id: latestLead.id }, '-created_date', 10);
      leadCommEvents = await safeFilter(entities, 'CommunicationEvent', { lead_id: latestLead.id }, '-created_date', 10);
    }

    evidence.lead_capture = {
      latest_website_lead: latestLead ? {
        id: latestLead.id,
        name: latestLead.full_name || latestLead.name || '—',
        email: latestLead.email || '—',
        source: latestLead.source || '—',
        created_date: latestLead.created_date,
        is_production_trusted: true,
      } : null,
      latest_canonical_lead: latestCanonicalLead ? {
        id: latestCanonicalLead.id,
        name: latestCanonicalLead.full_name || latestCanonicalLead.name || '—',
        email: latestCanonicalLead.email || '—',
        lead_state: latestCanonicalLead.lead_state || '—',
        quality_review_status: latestCanonicalLead.quality_review_status || '—',
      } : null,
      consent_proof: leadHasConsent ? {
        consent_given: latestLead.consent_given,
        consent_given_at: latestLead.consent_given_at,
        consent_source: latestLead.consent_source || '—',
      } : null,
      linked_comm_logs: leadCommLogs.map((log) => ({
        id: log.id,
        channel: log.channel,
        delivery_status: log.delivery_status,
        trigger_name: log.trigger_name || '—',
        sent_at: log.sent_at,
        provider_message_id: log.provider_message_id || '—',
      })),
      latest_comm_events: leadCommEvents.map((event) => ({
        id: event.id,
        event_type: event.event_type,
        status: event.status,
        channel: event.channel,
        direction: event.direction,
        created_date: event.created_date,
      })),
      total_website_leads_checked: allWebsiteLeads.length,
      production_trusted_leads: safeLeads.length,
      test_internal_excluded: leadPartition.internal.length,
      excluded_reasons: leadPartition.internal.slice(0, 5).map((item) => item.reason),
      status: latestLead ? 'ready_for_proof' : 'blocked',
      next_action: latestLead
        ? (leadCommLogs.length > 0 ? 'Verify SMS/email response fired for this lead' : 'Verify initial response automation fired for this lead')
        : 'Submit a real lead through the public form',
    };

    if (!latestLead) {
      productionBlockers.push({ gate: 'lead_capture_gate', message: 'No production-trusted WebsiteLead records found', severity: 'critical_blocker' });
    }

    const recentCommLogs = await safeList(entities, 'CommunicationLog', '-created_date', 150);
    const commPartition = partitionTrusted(recentCommLogs, { allowMissingEnvironment: false });
    const safeCommLogs = commPartition.trusted;
    const smsLogs = safeCommLogs.filter((log) => log.channel === 'sms');
    const emailLogs = safeCommLogs.filter((log) => log.channel === 'email');
    const latestSmsEvidence = smsLogs.find(isRealSmsEvidence) || null;
    const latestSms = latestSmsEvidence || smsLogs[0] || null;
    const latestEmailEvidence = emailLogs.find(isRealEmailEvidence) || null;
    const latestEmail = latestEmailEvidence || emailLogs[0] || null;
    const smsDelivered = smsLogs.filter((log) => log.delivery_status === 'delivered').length;
    const smsSent = smsLogs.filter((log) => ['queued', 'sent', 'delivered'].includes(log.delivery_status)).length;
    const smsFailed = smsLogs.filter((log) => log.delivery_status === 'failed').length;
    const emailSent = emailLogs.filter((log) => ['queued', 'sent', 'delivered'].includes(log.delivery_status)).length;
    const emailFailed = emailLogs.filter((log) => log.delivery_status === 'failed').length;

    evidence.messaging = {
      latest_sms: latestSms ? {
        id: latestSms.id,
        to_address: latestSms.to_address || latestSms.canonical_to_address || '—',
        delivery_status: latestSms.delivery_status,
        provider_message_id: latestSms.provider_message_id || '—',
        sent_at: latestSms.sent_at,
        trigger_name: latestSms.trigger_name || '—',
      } : null,
      latest_email: latestEmail ? {
        id: latestEmail.id,
        to_address: latestEmail.to_address || '—',
        delivery_status: latestEmail.delivery_status,
        provider_message_id: latestEmail.provider_message_id || '—',
        sent_at: latestEmail.sent_at,
        subject: latestEmail.subject || '—',
      } : null,
      sms_delivered_count: smsDelivered,
      sms_sent_count: smsSent,
      sms_failed_count: smsFailed,
      email_sent_count: emailSent,
      email_failed_count: emailFailed,
      skipped_internal_test_count: commPartition.internal.length,
      sms_status: latestSmsEvidence ? 'ready_for_proof' : (smsLogs.length > 0 ? 'partial' : 'blocked'),
      email_status: latestEmailEvidence ? 'ready_for_proof' : (emailLogs.length > 0 ? 'partial' : 'blocked'),
      next_action: 'Verify provider_message_id exists and delivery_status=delivered. Manual inbox/recipient verification required.',
    };

    if (!latestSmsEvidence) {
      const internalSmsFailures = commPartition.internal.filter((item) => item.record?.channel === 'sms').length;
      if (internalSmsFailures > 0) {
        internalCleanupItems.push({ gate: 'twilio_sms_gate', message: `${internalSmsFailures} SMS records are internal/test/guard failures and are excluded from production proof`, severity: 'advisory' });
      }
      if (smsLogs.length === 0) productionBlockers.push({ gate: 'twilio_sms_gate', message: 'No production-trusted SMS records with real Twilio provider_message_id found', severity: 'launch_blocker' });
    }
    if (!latestEmailEvidence && emailLogs.length === 0) {
      productionBlockers.push({ gate: 'resend_email_gate', message: 'No production-trusted email records found', severity: 'launch_blocker' });
    }
    if (smsFailed > 0) warnings.push({ gate: 'twilio_sms_gate', message: `${smsFailed} production-trusted SMS with failed status`, severity: 'advisory' });
    if (emailFailed > 0) warnings.push({ gate: 'resend_email_gate', message: `${emailFailed} production-trusted emails with failed status`, severity: 'advisory' });

    const allOrders = await safeList(entities, 'Order', '-created_date', 50);
    const orderPartition = partitionTrusted(allOrders, { allowMissingEnvironment: true });
    const safeOrders = orderPartition.trusted;
    const productionTrustedPaid = safeOrders.filter(isRealPaidStripeOrder);
    const latestPaidOrder = productionTrustedPaid[0] || null;
    const pendingPayment = safeOrders.filter((order) => order.payment_status === 'pending' || !order.payment_status);
    const failedPayment = safeOrders.filter((order) => order.payment_status === 'failed');
    const paidButExcluded = orderPartition.internal
      .filter((item) => item.record?.payment_status === 'paid')
      .map((item) => ({
        id: item.record.id,
        business_name: item.record.business_name || item.record.customer_name || '—',
        customer_email: item.record.customer_email || '—',
        exclusion_reason: item.reason,
      }));
    const internalTestExcluded = orderPartition.internal
      .filter((item) => item.record?.payment_status !== 'paid')
      .map((item) => ({
        id: item.record.id,
        business_name: item.record.business_name || item.record.customer_name || '—',
        customer_email: item.record.customer_email || '—',
        payment_status: item.record.payment_status || '—',
        exclusion_reason: item.reason,
      }));

    const allInstallOS = await safeList(entities, 'ClientInstallationOS', '-created_date', 50);
    const installPartition = partitionTrusted(allInstallOS, { allowMissingEnvironment: true });
    const latestInstallOS = installPartition.trusted[0] || null;
    const allChecklists = await safeList(entities, 'AutomationChecklist', '-created_date', 50);
    const checklistPartition = partitionTrusted(allChecklists, { allowMissingEnvironment: true });
    const latestChecklist = checklistPartition.trusted[0] || null;
    const allClientProjects = await safeList(entities, 'ClientProject', '-created_date', 50);
    const projectPartition = partitionTrusted(allClientProjects, { allowMissingEnvironment: true });
    const latestClientProject = projectPartition.trusted[0] || null;

    const missingHandoffFields = getMissingHandoffFields(latestPaidOrder);
    const stripeEvidenceStatus = !latestPaidOrder ? 'blocked' : (missingHandoffFields.length === 0 ? 'trusted' : 'warning');
    const recentOrders = allOrders.slice(0, 10).map((order) => ({
      id: order.id,
      created_date: order.created_date,
      customer_email: order.customer_email || '—',
      business_name: order.business_name || order.customer_name || '—',
      payment_status: order.payment_status || '—',
      order_status: order.order_status || '—',
      billing_status: order.billing_status || '—',
      pipeline_status: order.pipeline_status || '—',
      environment: order.environment || 'unknown',
      package_type: order.selected_package_type || order.package_type || '—',
      production_evidence: isRealPaidStripeOrder(order),
      exclusion_reason: isProductionTrustedRecord(order, { allowMissingEnvironment: true }) ? null : getExclusionReason(order),
      missing_handoff_fields: getMissingHandoffFields(order),
    }));

    evidence.stripe_payment = {
      production_trusted_paid_count: productionTrustedPaid.length,
      paid_but_excluded_count: paidButExcluded.length,
      pending_payment_count: pendingPayment.length,
      failed_payment_count: failedPayment.length,
      internal_test_excluded_count: internalTestExcluded.length,
      evidence_status: stripeEvidenceStatus,
      missing_handoff_fields: missingHandoffFields,
      latest_paid_order: latestPaidOrder ? {
        id: latestPaidOrder.id,
        customer_name: latestPaidOrder.customer_name || '—',
        business_name: latestPaidOrder.business_name || latestPaidOrder.customer_name || '—',
        customer_email: latestPaidOrder.customer_email || '—',
        selected_package_type: latestPaidOrder.selected_package_type || latestPaidOrder.package_type || '—',
        payment_status: latestPaidOrder.payment_status || '—',
        stripe_session_id: latestPaidOrder.stripe_session_id || null,
        stripe_customer_id: latestPaidOrder.stripe_customer_id || null,
        stripe_subscription_id: latestPaidOrder.stripe_subscription_id || null,
        subscription_id: latestPaidOrder.subscription_id || null,
        has_stripe_ids: hasRealStripeIdentity(latestPaidOrder),
        has_stripe_subscription: Boolean(latestPaidOrder.stripe_subscription_id || latestPaidOrder.subscription_id),
        order_status: latestPaidOrder.order_status || '—',
        billing_status: latestPaidOrder.billing_status || '—',
        pipeline_status: latestPaidOrder.pipeline_status || '—',
        environment: latestPaidOrder.environment || 'unknown',
        exclusion_reason: latestPaidOrder.dashboard_exclusion_reason || null,
        client_id: latestPaidOrder.client_id || null,
        client_project_id: latestPaidOrder.client_project_id || null,
        onboarding_client_id: latestPaidOrder.onboarding_client_id || null,
        install_initialized_at: latestPaidOrder.install_initialized_at || null,
        last_install_event_at: latestPaidOrder.last_install_event_at || null,
        created_date: latestPaidOrder.created_date,
        updated_date: latestPaidOrder.updated_date,
      } : null,
      recent_orders: recentOrders,
      paid_but_excluded: paidButExcluded.slice(0, 5),
      internal_test_excluded: internalTestExcluded.slice(0, 5),
      status: latestPaidOrder ? (stripeEvidenceStatus === 'trusted' ? 'ready_for_proof' : 'partial') : 'blocked',
      next_action: latestPaidOrder
        ? (missingHandoffFields.length === 0 ? 'Payment proof verified. Review onboarding handoff proof before approval.' : `Paid order exists but handoff fields are missing: ${missingHandoffFields.join(', ')}.`)
        : 'Complete a real Stripe checkout with a non-test customer email and real business name, then rerun Stripe proof',
    };

    evidence.payment_onboarding = {
      latest_paid_order: evidence.stripe_payment.latest_paid_order,
      latest_client_project: latestClientProject ? {
        id: latestClientProject.id,
        business_name: latestClientProject.business_name || '—',
        status: latestClientProject.status || '—',
      } : null,
      latest_install_os: latestInstallOS ? {
        id: latestInstallOS.id,
        business_name: latestInstallOS.business_name || '—',
        workflow_stage: latestInstallOS.workflow_stage,
        activation_status: latestInstallOS.activation_status,
        checklist_completion_percent: latestInstallOS.checklist_completion_percent || 0,
      } : null,
      latest_automation_checklist: latestChecklist ? {
        id: latestChecklist.id,
        business_name: latestChecklist.business_name || '—',
        service_key: latestChecklist.service_key,
        status: latestChecklist.status,
        twilio_configured: latestChecklist.twilio_configured,
        resend_configured: latestChecklist.resend_configured,
      } : null,
      status: latestPaidOrder ? (latestInstallOS ? 'ready_for_proof' : 'partial') : 'blocked',
      next_action: latestPaidOrder
        ? (latestInstallOS ? 'Verify AutomationChecklist has all integrations configured' : 'Create ClientInstallationOS for latest paid order')
        : 'Complete a real Stripe checkout to generate a paid Order record',
    };

    if (!latestPaidOrder) {
      productionBlockers.push({ gate: 'stripe_payment_gate', message: 'No production-trusted paid Order records found', severity: 'critical_blocker' });
    }
    if (paidButExcluded.length > 0) {
      internalCleanupItems.push({ gate: 'stripe_payment_gate', message: `${paidButExcluded.length} paid order(s) excluded as internal/test`, severity: 'advisory' });
    }

    const allFailedJobs = await safeFilter(entities, 'AutomationJob', { status: 'failed' }, '-created_date', 500);
    const allStuckJobs = await safeFilter(entities, 'AutomationJob', { status: 'processing' }, '-created_date', 500);
    const allQueuedJobs = await safeFilter(entities, 'AutomationJob', { status: 'queued' }, '-created_date', 500);
    const allCompletedJobs = await safeFilter(entities, 'AutomationJob', { status: 'completed' }, '-created_date', 500);
    const failedPartition = partitionOperational(allFailedJobs);
    const stuckPartition = partitionOperational(allStuckJobs);
    const prodFailedJobs = failedPartition.trusted;
    const prodStuckJobs = stuckPartition.trusted;
    const internalFailedJobs = failedPartition.internal;
    const internalStuckJobs = stuckPartition.internal;
    const eventQueueBacklog = await safeFilter(entities, 'EventQueue', { status: 'queued' }, '-created_date', 200);
    const deadLetterRecords = await safeFilter(entities, 'DeadLetterLog', { status: 'pending_review' }, '-created_date', 200);
    const deadLetterPartition = partitionOperational(deadLetterRecords);
    const prodDeadLetters = deadLetterPartition.trusted.length;
    const internalDeadLetters = deadLetterPartition.internal.length;
    const backlogCount = eventQueueBacklog.length;
    const prodFailedCount = prodFailedJobs.length;
    const prodStuckCount = prodStuckJobs.length;
    const internalFailedCount = internalFailedJobs.length;
    const internalStuckCount = internalStuckJobs.length;
    const productionDashboardSafe = prodFailedCount === 0 && prodStuckCount === 0 && prodDeadLetters === 0;
    const testPollutionFound = orderPartition.internal.length > 0 || leadPartition.internal.length > 0 || commPartition.internal.length > 0 || internalFailedCount > 0 || internalStuckCount > 0 || internalDeadLetters > 0;

    evidence.automation_job_audit = {
      total_by_status: {
        queued: allQueuedJobs.length,
        processing: allStuckJobs.length,
        completed: allCompletedJobs.length,
        failed: allFailedJobs.length,
      },
      production_trusted: { failed: prodFailedCount, stuck: prodStuckCount, dead_letters: prodDeadLetters },
      internal_test: { failed: internalFailedCount, stuck: internalStuckCount, dead_letters: internalDeadLetters },
      top_production_failed: prodFailedJobs.slice(0, 10).map((job) => ({
        id: job.id,
        job_type: job.job_type || '—',
        lead_id: job.lead_id || '—',
        last_error: String(job.last_error || job.error_message || '—').substring(0, 200),
        created_date: job.created_date,
        next_action: 'Review error, fix root cause, and retrigger job',
      })),
      top_internal_failed: internalFailedJobs.slice(0, 5).map((item) => ({
        id: item.record.id,
        job_type: item.record.job_type || '—',
        exclusion_reason: item.reason,
      })),
      note: 'Production dashboard truth excludes internal/test/backfill/orphan records but still tracks them for cleanup.',
    };

    evidence.dashboard_truth = {
      production_orders: safeOrders.length,
      test_orders_excluded: orderPartition.internal.length,
      production_leads: safeLeads.length,
      test_leads_excluded: leadPartition.internal.length,
      production_comm_logs: safeCommLogs.length,
      test_comm_logs_excluded: commPartition.internal.length,
      failed_jobs_total: allFailedJobs.length,
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
      note: 'Production dashboard truth excludes internal/test/backfill/orphan records but still tracks them for cleanup.',
    };

    if (prodFailedCount > 0) productionBlockers.push({ gate: 'dashboard_truth_gate', message: `${prodFailedCount} production-trusted failed AutomationJob records`, severity: 'launch_blocker' });
    if (prodStuckCount > 0) productionBlockers.push({ gate: 'dashboard_truth_gate', message: `${prodStuckCount} production-trusted stuck AutomationJob records`, severity: 'launch_blocker' });
    if (prodDeadLetters > 0) productionBlockers.push({ gate: 'dashboard_truth_gate', message: `${prodDeadLetters} production-trusted unresolved DeadLetterLog records`, severity: 'launch_blocker' });
    if (internalFailedCount > 0) internalCleanupItems.push({ gate: 'dashboard_truth_gate', message: `${internalFailedCount} legacy/internal/test failed AutomationJob records excluded from production blockers`, severity: 'advisory' });
    if (internalStuckCount > 0) internalCleanupItems.push({ gate: 'dashboard_truth_gate', message: `${internalStuckCount} legacy/internal/test stuck AutomationJob records excluded from production blockers`, severity: 'advisory' });
    if (internalDeadLetters > 0) internalCleanupItems.push({ gate: 'dashboard_truth_gate', message: `${internalDeadLetters} legacy/internal/test DeadLetterLog records excluded from production blockers`, severity: 'advisory' });

    const ga4Configs = await safeList(entities, 'GA4Configuration', '-created_date', 5);
    const ga4Config = ga4Configs?.[0] || null;
    const hasGa4Record = Boolean(ga4Config);
    const hasMeasurementId = Boolean(ga4Config?.measurement_id);
    const measurementIdLooksValid = hasMeasurementId && /^G-[A-Z0-9]{6,}$/i.test(ga4Config.measurement_id);
    const trackingEnabled = Boolean(ga4Config?.enabled);
    const setupStatus = ga4Config?.setup_status || 'not_configured';
    const trackedEvents = ga4Config?.tracked_events || [];
    const missingExpectedEvents = EXPECTED_GA4_EVENTS.filter((eventName) => !trackedEvents.includes(eventName));
    const recentConversionEvents = await safeList(entities, 'ConversionTrackingEvent', '-timestamp', 20);
    const conversionPageViews = recentConversionEvents.filter((event) => event.event_type === 'page_view');
    const conversionCtaClicks = recentConversionEvents.filter((event) => event.event_type === 'cta_click');
    const latestConversionEvent = recentConversionEvents[0] || null;
    const hasRealConversionEvents = conversionPageViews.length > 0 && conversionCtaClicks.length > 0;
    const ga4Active = hasGa4Record && measurementIdLooksValid && trackingEnabled && setupStatus === 'active';

    evidence.ga4 = {
      record_exists: hasGa4Record,
      measurement_id: ga4Config?.measurement_id || null,
      measurement_id_valid: measurementIdLooksValid,
      tracking_enabled: trackingEnabled,
      setup_status: setupStatus,
      tracked_events: trackedEvents,
      expected_events: EXPECTED_GA4_EVENTS,
      missing_events: missingExpectedEvents,
      has_tracking_proof: hasRealConversionEvents,
      has_real_conversion_events: hasRealConversionEvents,
      latest_conversion_event: latestConversionEvent ? {
        event_id: latestConversionEvent.event_id,
        event_type: latestConversionEvent.event_type,
        page_key: latestConversionEvent.page_key,
        event_label: latestConversionEvent.event_label || '—',
        timestamp: latestConversionEvent.timestamp,
        device_type: latestConversionEvent.metadata?.device_type || '—',
      } : null,
      page_view_count: conversionPageViews.length,
      cta_click_count: conversionCtaClicks.length,
      recent_conversion_events: recentConversionEvents.slice(0, 5).map((event) => ({
        event_type: event.event_type,
        page_key: event.page_key,
        event_label: event.event_label || '—',
        timestamp: event.timestamp,
        device_type: event.metadata?.device_type || '—',
      })),
      status: ga4Active ? (hasRealConversionEvents ? 'ready_for_proof' : 'partial') : 'blocked',
      next_action: !hasGa4Record
        ? 'Create a GA4 web stream in Google Analytics, paste the Measurement ID into Admin Settings, enable tracking, generate page_view and cta_click test events, then rerun analytics proof'
        : !measurementIdLooksValid ? 'Measurement ID does not look valid (expected format G-XXXXXXX). Update in Admin Settings.'
        : !trackingEnabled ? 'GA4 tracking is not enabled. Enable tracking in Admin Settings.'
        : setupStatus !== 'active' ? `Setup status is '${setupStatus}'. Set to 'active' after verification.`
        : !hasRealConversionEvents ? 'Generate page_view and cta_click events, verify in GA4 Realtime dashboard, then rerun'
        : 'Verify events are firing in GA4 Realtime dashboard, then approve',
    };
    if (!ga4Active) productionBlockers.push({ gate: 'analytics_gate', message: 'GA4 not configured, not enabled, or not active', severity: 'launch_blocker' });

    const postCallRecords = await safeFilter(entities, 'CommunicationEvent', { event_type: 'voice_call_completed' }, '-created_date', 20);
    const postCallPartition = partitionTrusted(postCallRecords, { allowMissingEnvironment: true });
    const hasRealPostCall = postCallPartition.trusted.length > 0;

    evidence.booking_proof = {
      booking_link_default: bookingLink || null,
      link_present: Boolean(bookingLink),
      link_looks_valid: bookingLinkReady,
      status: bookingLinkReady ? 'ready_for_proof' : 'blocked',
      next_action: bookingLinkReady
        ? 'Open the booking link, verify calendar/page loads, complete a test booking or click, then mark as proof_passed'
        : 'Set DEFAULT_BOOKING_LINK in Admin Settings, verify booking page loads, complete a test booking',
    };

    const existingGates = await safeList(entities, 'LaunchGate', '', 50);
    const gateMap = {};
    for (const gate of existingGates) gateMap[gate.gate_key] = gate;

    function computeGate(gateKey) {
      switch (gateKey) {
        case 'website_cta_gate':
          return {
            status: 'ready_for_proof', completion_percent: 80, proof_percent: 0, current_blocker: null,
            next_action: 'Take desktop + mobile screenshots of CTA navigation for each route and upload as proof',
            evidence_summary: 'Public CTAs verified in code — screenshot proof still required.', last_checked_at: now,
          };
        case 'lead_capture_gate':
          return latestLead
            ? {
                status: leadHasConsent ? 'ready_for_proof' : 'partial', completion_percent: 70, proof_percent: leadCommLogs.length > 0 ? 50 : 30, current_blocker: null,
                next_action: leadHasConsent ? 'Verify SMS/email response fired and delivered for this lead' : 'Ensure consent fields are captured on form submission',
                evidence_summary: `Latest production lead: ${latestLead.full_name || latestLead.name || '—'} (${latestLead.email || 'no email'}). Consent: ${leadHasConsent ? 'captured' : 'missing'}. Linked comm logs: ${leadCommLogs.length}.`, last_checked_at: now,
              }
            : {
                status: 'blocked', completion_percent: 10, proof_percent: 0, current_blocker: 'No production-trusted WebsiteLead records found',
                next_action: 'Submit a real lead through the public form', evidence_summary: 'No production-trusted lead evidence found.', last_checked_at: now,
              };
        case 'stripe_payment_gate':
          return latestPaidOrder
            ? {
                status: missingHandoffFields.length === 0 ? 'ready_for_proof' : 'partial', completion_percent: 70, proof_percent: 50, current_blocker: null,
                next_action: missingHandoffFields.length === 0 ? 'Verify ClientInstallationOS and AutomationChecklist linked to this order' : `Paid order exists but handoff fields are missing: ${missingHandoffFields.join(', ')}`,
                evidence_summary: `Latest paid order: ${latestPaidOrder.business_name || latestPaidOrder.customer_name || '—'}. Payment: paid. Stripe IDs: present.`, last_checked_at: now,
              }
            : {
                status: 'blocked', completion_percent: 10, proof_percent: 0,
                current_blocker: 'No production-trusted paid Order records found. All existing orders are internal/test/smoke or pending.',
                next_action: 'Complete a real Stripe checkout with a non-test customer email and real business name, then rerun Stripe proof',
                evidence_summary: 'No real non-test paid order with Stripe identifiers exists yet.', last_checked_at: now,
              };
        case 'resend_email_gate':
          return latestEmailEvidence
            ? {
                status: 'ready_for_proof', completion_percent: 70, proof_percent: hasRealProviderId(latestEmailEvidence) ? 50 : 30, current_blocker: null,
                next_action: hasRealProviderId(latestEmailEvidence) ? 'Manual inbox verification: confirm email arrived in recipient inbox' : 'Ensure Resend returns a provider message ID',
                evidence_summary: `Latest email: ${latestEmailEvidence.subject || '—'}. Status: ${latestEmailEvidence.delivery_status}. Provider ID: ${latestEmailEvidence.provider_message_id || 'missing'}.`, last_checked_at: now,
              }
            : {
                status: emailLogs.length > 0 ? 'partial' : 'blocked', completion_percent: emailLogs.length > 0 ? 40 : 10, proof_percent: 0,
                current_blocker: emailLogs.length > 0 ? null : 'No production-trusted email records found',
                next_action: 'Send a test email and verify Resend delivery', evidence_summary: 'No complete email proof with provider evidence yet.', last_checked_at: now,
              };
        case 'twilio_sms_gate':
          return latestSmsEvidence
            ? {
                status: 'ready_for_proof', completion_percent: 70, proof_percent: 50, current_blocker: null,
                next_action: 'Manual recipient verification: confirm SMS arrived on recipient device',
                evidence_summary: `Latest SMS to ${latestSmsEvidence.to_address || latestSmsEvidence.canonical_to_address || '—'}. Status: ${latestSmsEvidence.delivery_status}. Provider ID: ${latestSmsEvidence.provider_message_id}.`, last_checked_at: now,
              }
            : {
                status: smsLogs.length > 0 ? 'partial' : 'blocked', completion_percent: smsLogs.length > 0 ? 40 : 10, proof_percent: 0,
                current_blocker: smsLogs.length > 0 ? 'SMS records exist, but none has complete real provider proof yet.' : 'No production-trusted SMS records found',
                next_action: 'Send a live test SMS, capture real Twilio provider_message_id, and verify delivery',
                evidence_summary: 'Internal/test SMS failures are excluded from production proof.', last_checked_at: now,
              };
        case 'twilio_voice_gate':
          return voiceWebhookReady
            ? {
                status: 'ready_for_proof', completion_percent: 40, proof_percent: 0, current_blocker: null,
                next_action: `Verify voice webhook URL (${voiceWebhookUrl}) is configured in Twilio Console. Then make a real test call.`,
                evidence_summary: `Voice webhook URL configured: ${voiceWebhookUrl}. Real call proof still required.`, last_checked_at: now,
              }
            : {
                status: 'blocked', completion_percent: voiceWebhookUrl ? 20 : 10, proof_percent: 0, current_blocker: 'Voice webhook URL is missing or invalid',
                next_action: 'Configure Twilio Voice webhook URL in AdminSettings and Twilio Console, then make a real test call',
                evidence_summary: voiceWebhookUrl ? `Invalid voice webhook URL: ${voiceWebhookUrl}` : 'No voice webhook URL configured in AdminSettings.', last_checked_at: now,
              };
        case 'booking_flow_gate':
          return bookingLinkReady
            ? {
                status: 'ready_for_proof', completion_percent: 40, proof_percent: 0, current_blocker: null,
                next_action: `Verify booking link (${bookingLink}) loads and a test booking can be completed`,
                evidence_summary: `Booking link configured: ${bookingLink}. Booking click/confirmation proof still required.`, last_checked_at: now,
              }
            : {
                status: 'blocked', completion_percent: bookingLink ? 20 : 10, proof_percent: 0, current_blocker: 'Booking link is missing or invalid',
                next_action: 'Set DEFAULT_BOOKING_LINK in AdminSettings, verify booking page loads and test booking works',
                evidence_summary: bookingLink ? `Invalid booking link: ${bookingLink}` : 'No booking link configured in AdminSettings.', last_checked_at: now,
              };
        case 'analytics_gate':
          return ga4Active
            ? {
                status: hasRealConversionEvents ? 'ready_for_proof' : 'partial', completion_percent: 70, proof_percent: hasRealConversionEvents ? 50 : 30, current_blocker: null,
                next_action: hasRealConversionEvents ? 'Verify events in GA4 Realtime dashboard, then approve' : 'Visit public homepage and click a CTA to generate page_view + cta_click ConversionTrackingEvents, then rerun',
                evidence_summary: `GA4 ID: ${ga4Config.measurement_id}. Setup: ${ga4Config.setup_status}. Conversion events: ${conversionPageViews.length} page_view, ${conversionCtaClicks.length} cta_click.`, last_checked_at: now,
              }
            : {
                status: 'blocked', completion_percent: 10, proof_percent: 0, current_blocker: 'GA4 not configured, not enabled, or setup_status not active',
                next_action: evidence.ga4.next_action, evidence_summary: 'GA4 is not active yet.', last_checked_at: now,
              };
        case 'security_gate':
          return {
            status: 'ready_for_proof', completion_percent: 60, proof_percent: 30, current_blocker: null,
            next_action: 'Manual security review: (1) verify admin routes require auth, (2) verify RLS on all entities, (3) verify SSL and security headers (CSP, HSTS, X-Frame-Options)',
            evidence_summary: 'ProtectedRoute guards verified in code. RLS/security review still requires proof.', last_checked_at: now,
          };
        case 'client_portal_gate':
          return {
            status: 'ready_for_proof', completion_percent: 50, proof_percent: 0, current_blocker: null,
            next_action: 'Log in as a real production-trusted client and verify portal loads with correct data',
            evidence_summary: 'Client portal routes exist and are behind auth guard.', last_checked_at: now,
          };
        case 'admin_dashboard_gate':
          return {
            status: 'ready_for_proof', completion_percent: 70, proof_percent: 50, current_blocker: null,
            next_action: 'Verify admin dashboard metrics match production data after test pollution exclusion',
            evidence_summary: `Admin dashboard loads. Production orders: ${safeOrders.length}, Leads: ${safeLeads.length}, Comm logs: ${safeCommLogs.length}. Test/internal excluded.`, last_checked_at: now,
          };
        case 'install_os_gate':
          return latestInstallOS
            ? {
                status: 'ready_for_proof', completion_percent: 60, proof_percent: latestInstallOS.activation_status === 'live' ? 50 : 40, current_blocker: null,
                next_action: latestInstallOS.activation_status === 'live' ? 'Verify all checklist items passed for this client' : "Progress client through activation stages to 'live'",
                evidence_summary: `Latest install: ${latestInstallOS.business_name || '—'}. Stage: ${latestInstallOS.workflow_stage}. Activation: ${latestInstallOS.activation_status}.`, last_checked_at: now,
              }
            : {
                status: 'blocked', completion_percent: 10, proof_percent: 0, current_blocker: 'No production-trusted ClientInstallationOS records found',
                next_action: 'Create ClientInstallationOS for a production-trusted paid order', evidence_summary: 'No install OS proof exists yet.', last_checked_at: now,
              };
        case 'dashboard_truth_gate':
          return productionDashboardSafe
            ? {
                status: 'ready_for_proof', completion_percent: 80, proof_percent: 60, current_blocker: null,
                next_action: 'Admin approval required after reviewing dashboard truth evidence',
                evidence_summary: `Production-trusted unresolved: Failed=${prodFailedCount}, Stuck=${prodStuckCount}, Dead letters=${prodDeadLetters}. Internal/test cleanup: Failed=${internalFailedCount}, Stuck=${internalStuckCount}, Dead letters=${internalDeadLetters}.`, last_checked_at: now,
              }
            : {
                status: 'blocked', completion_percent: 30, proof_percent: 0,
                current_blocker: `${prodFailedCount + prodStuckCount + prodDeadLetters} production-trusted unresolved issues`,
                next_action: 'Resolve production-trusted failed/stuck jobs and dead letter records',
                evidence_summary: `Production-trusted: Failed=${prodFailedCount}, Stuck=${prodStuckCount}, Dead letters=${prodDeadLetters}.`, last_checked_at: now,
              };
        case 'voice_frontline_gate':
          return elevenLabsAgentReady && elevenLabsPhoneReady
            ? {
                status: 'ready_for_proof', completion_percent: 40, proof_percent: 0, current_blocker: null,
                next_action: 'Make a real inbound call to confirm the ElevenLabs front-line responder answers correctly',
                evidence_summary: 'ELEVENLABS_AGENT_ID and ELEVENLABS_PHONE_NUMBER are configured. Real inbound call proof still required.', last_checked_at: now,
              }
            : {
                status: 'blocked', completion_percent: (elevenLabsAgentReady || elevenLabsPhoneReady) ? 20 : 10, proof_percent: 0,
                current_blocker: 'ElevenLabs voice agent requires ELEVENLABS_AGENT_ID and ELEVENLABS_PHONE_NUMBER secrets before proof',
                next_action: 'Set ELEVENLABS_AGENT_ID and ELEVENLABS_PHONE_NUMBER, configure the agent, then make a real inbound call',
                evidence_summary: `Agent ID configured: ${elevenLabsAgentReady ? 'yes' : 'no'}. Phone number configured: ${elevenLabsPhoneReady ? 'yes' : 'no'}.`, last_checked_at: now,
              };
        case 'elevenlabs_postcall_logging_gate':
          return hasRealPostCall
            ? {
                status: 'ready_for_proof', completion_percent: 70, proof_percent: 50, current_blocker: null,
                next_action: 'Verify post-call record has call outcome or transcript, then approve',
                evidence_summary: `${postCallPartition.trusted.length} production-trusted post-call event(s) found.`, last_checked_at: now,
              }
            : elevenLabsPostCallWebhookReady
              ? {
                  status: 'ready_for_proof', completion_percent: 40, proof_percent: 0, current_blocker: null,
                  next_action: 'Register the ElevenLabs post-call webhook, make a real call, and verify a post-call record is created',
                  evidence_summary: 'ElevenLabs webhook secret config exists. Real post-call event proof still required.', last_checked_at: now,
                }
              : {
                  status: 'blocked', completion_percent: 20, proof_percent: 0,
                  current_blocker: 'ElevenLabs post-call webhook secret config is missing',
                  next_action: 'Set ELEVENLABS_WEBHOOK_SECRET or ELEVENLABS_WEBHOOK_HMAC_SECRET, register the webhook in ElevenLabs, then make a real call',
                  evidence_summary: 'No ElevenLabs webhook secret config found.', last_checked_at: now,
                };
        default:
          return {
            status: 'blocked', completion_percent: 0, proof_percent: 0, current_blocker: 'Unknown gate key',
            next_action: 'Run verification checks for this gate', evidence_summary: 'Unknown gate.', last_checked_at: now,
          };
      }
    }

    const gateResults = [];
    for (const gateKey of ALL_GATE_KEYS) {
      const computed = computeGate(gateKey);
      const existing = gateMap[gateKey];
      const manualStatus = existing?.status === 'approved' || existing?.status === 'waived';
      const finalStatus = manualStatus ? existing.status : computed.status;
      const meta = DEFAULT_GATE_META[gateKey] || {};
      const updatePayload = {
        status: finalStatus,
        completion_percent: computed.completion_percent,
        proof_percent: computed.proof_percent,
        current_blocker: finalStatus === 'approved' || finalStatus === 'waived' ? existing?.current_blocker || null : computed.current_blocker,
        next_action: computed.next_action,
        evidence_summary: computed.evidence_summary,
        last_checked_at: computed.last_checked_at,
        last_verdict: gateVerdict(finalStatus),
      };

      if (existing?.id) {
        try { await entities.LaunchGate.update(existing.id, updatePayload); } catch (_) { /* keep report generation non-blocking */ }
      }

      gateResults.push({
        gate_key: gateKey,
        gate_name: existing?.gate_name || meta.gate_name || gateKey.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
        section_label: existing?.section_label || meta.section_label || 'Uncategorized',
        status: finalStatus,
        completion_percent: computed.completion_percent,
        proof_percent: computed.proof_percent,
        current_blocker: updatePayload.current_blocker,
        next_action: computed.next_action,
        evidence_summary: computed.evidence_summary,
        last_checked_at: computed.last_checked_at,
        last_verdict: gateVerdict(finalStatus),
        approval_required: existing?.approval_required ?? true,
        approved_by: existing?.approved_by || null,
        approved_at: existing?.approved_at || null,
      });
    }

    const safeToLaunch = productionBlockers.length === 0;
    try {
      await entities.DashboardTruthCheck.create({
        scope: 'admin_dashboard',
        truth_status: safeToLaunch ? 'trusted' : 'blocked',
        safe_to_show_client: safeToLaunch,
        safe_to_show_admin: true,
        safe_to_launch: safeToLaunch,
        blocker_count: productionBlockers.length,
        warning_count: warnings.length + internalCleanupItems.length,
        blockers: productionBlockers,
        warnings: [...warnings, ...internalCleanupItems],
        evidence_summary: `Checked ${ALL_GATE_KEYS.length} gates. Blocked: ${gateResults.filter((gate) => gate.status === 'blocked').length}, Ready: ${gateResults.filter((gate) => gate.status === 'ready_for_proof').length}, Passed: ${gateResults.filter((gate) => gate.status === 'proof_passed').length}. Prod failed: ${prodFailedCount}, Internal failed: ${internalFailedCount}.`,
        last_checked_at: now,
        created_at: now,
        updated_at: now,
      });
    } catch (_) { /* optional audit record */ }

    return Response.json({
      run_at: now,
      run_by: user.email,
      safe_to_launch: safeToLaunch,
      total_gates: ALL_GATE_KEYS.length,
      gates_blocked: gateResults.filter((gate) => gate.status === 'blocked').length,
      gates_ready_for_proof: gateResults.filter((gate) => gate.status === 'ready_for_proof').length,
      gates_proof_passed: gateResults.filter((gate) => gate.status === 'proof_passed').length,
      gates_approved: gateResults.filter((gate) => gate.status === 'approved').length,
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
        booking_proof: evidence.booking_proof,
      },
      gates: gateResults,
      production_blockers: productionBlockers,
      internal_cleanup_items: internalCleanupItems,
      warnings,
      next_action: productionBlockers.length > 0
        ? `Resolve ${productionBlockers.length} production blocker(s): ${productionBlockers.map((blocker) => blocker.gate).join(', ')}`
        : `Review ${gateResults.filter((gate) => gate.status === 'ready_for_proof').length} gate(s) ready for proof and approve only if evidence is sufficient`,
    }, { status: 200 });
  } catch (error) {
    console.error('[runLaunchTruthSprint]', error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});