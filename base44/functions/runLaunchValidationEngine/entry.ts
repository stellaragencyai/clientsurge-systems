import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const REQUIRED_CONVERSION_EVENTS = [
  'page_view',
  'cta_click',
  'pricing_view',
  'checkout_click',
  'form_submit',
  'demo_booking_click',
];

const MANUAL_GOOGLE_CHECKS = [
  {
    check_key: 'tag_assistant_consent_mode_v2',
    check_name: 'Google Tag Assistant Consent Mode v2 proof',
    category: 'google',
    provider: 'google',
    critical: true,
    manual_steps_required: 'Open Tag Assistant for clientsurgesystems.com, accept/reject cookies, confirm analytics_storage/ad_storage/ad_user_data/ad_personalization update correctly, then attach proof screenshot or note.',
  },
  {
    check_key: 'ga4_internal_traffic_exclusion',
    check_name: 'GA4 internal traffic exclusion',
    category: 'google',
    provider: 'google',
    critical: true,
    manual_steps_required: 'In GA4 Admin, define internal traffic for Nolan home/office/devices and confirm the internal traffic filter is active or tested.',
  },
  {
    check_key: 'ga4_unwanted_referrals',
    check_name: 'GA4 unwanted referral exclusions',
    category: 'google',
    provider: 'google',
    critical: true,
    manual_steps_required: 'In GA4 web stream settings, add Stripe/customer portal domains as unwanted referrals so returning purchasers do not appear as stripe.com referrals.',
  },
  {
    check_key: 'ga4_cross_domain_measurement',
    check_name: 'GA4 cross-domain measurement',
    category: 'google',
    provider: 'google',
    critical: true,
    manual_steps_required: 'In GA4 web stream Configure your domains, include clientsurgesystems.com, www.clientsurgesystems.com, and verified checkout/custom domains. Confirm _gl linker continuity in a checkout-return test.',
  },
];

function status({ pass, configured, manualRequired, criticalFail }) {
  if (pass) return 'verified';
  if (criticalFail) return 'failed';
  if (manualRequired) return configured ? 'manual_required' : 'not_configured';
  return configured ? 'configured' : 'not_configured';
}

function makeCheck(input) {
  const now = new Date().toISOString();
  const checkStatus = input.status || status(input);
  return {
    check_key: input.check_key,
    check_name: input.check_name,
    category: input.category || 'system',
    provider: input.provider || 'base44',
    status: checkStatus,
    critical: input.critical !== false,
    safe_to_launch: checkStatus === 'verified' || input.critical === false,
    evidence_summary: input.evidence_summary || '',
    evidence_url: input.evidence_url || null,
    failure_reason: input.failure_reason || null,
    manual_steps_required: input.manual_steps_required || null,
    last_checked_at: now,
    last_passed_at: checkStatus === 'verified' ? now : null,
  };
}

function isLooksLikeUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

function isProductionTrusted(record) {
  if (!record || typeof record !== 'object') return false;
  if (record.dashboard_excluded === true || record.is_sample === true) return false;
  if (['qa', 'smoke', 'demo', 'internal', 'test'].includes(record.environment)) return false;
  const joined = [record.email, record.customer_email, record.client_email, record.business_name, record.customer_name, record.source]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return !/(test|smoke|demo|example|internal|sample|placeholder|backfill|qa)/.test(joined);
}

async function safeList(base44, entityName, sort = '-created_date', limit = 100) {
  try {
    return await base44.asServiceRole.entities[entityName].list(sort, limit) || [];
  } catch {
    return [];
  }
}

async function safeFilter(base44, entityName, query, sort = '-created_date', limit = 100) {
  try {
    return await base44.asServiceRole.entities[entityName].filter(query, sort, limit) || [];
  } catch {
    return [];
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const now = new Date().toISOString();
    const [adminSettingsRows, ga4Rows, conversionEvents, websiteLeads, orders, commLogs, truthRows] = await Promise.all([
      safeList(base44, 'AdminSettings', '-updated_date', 5),
      safeList(base44, 'GA4Configuration', '-updated_date', 5),
      safeList(base44, 'ConversionTrackingEvent', '-timestamp', 100),
      safeList(base44, 'WebsiteLead', '-created_date', 50),
      safeList(base44, 'Order', '-created_date', 50),
      safeList(base44, 'CommunicationLog', '-created_date', 100),
      safeFilter(base44, 'DashboardTruthCheck', { scope: 'admin_dashboard' }, '-last_checked_at', 5),
    ]);

    const adminSettings = adminSettingsRows[0] || {};
    const ga4 = ga4Rows[0] || null;
    const eventTypes = new Set((conversionEvents || []).map((event) => event.event_type));
    const missingConversionEvents = REQUIRED_CONVERSION_EVENTS.filter((eventType) => !eventTypes.has(eventType));
    const productionLeads = (websiteLeads || []).filter(isProductionTrusted);
    const latestLead = productionLeads[0] || null;
    const productionOrders = (orders || []).filter(isProductionTrusted);
    const paidOrders = productionOrders.filter((order) => order.payment_status === 'paid');
    const latestPaidOrder = paidOrders[0] || null;
    const smsLogs = (commLogs || []).filter((log) => isProductionTrusted(log) && log.channel === 'sms');
    const emailLogs = (commLogs || []).filter((log) => isProductionTrusted(log) && log.channel === 'email');
    const latestSms = smsLogs[0] || null;
    const latestEmail = emailLogs[0] || null;
    const latestTruth = truthRows[0] || null;

    const checks = [];

    checks.push(makeCheck({
      check_key: 'ga4_active',
      check_name: 'GA4 active configuration',
      category: 'google',
      provider: 'google',
      pass: Boolean(ga4?.enabled && ga4?.setup_status === 'active' && /^G-[A-Z0-9]{6,}$/i.test(ga4?.measurement_id || '')),
      configured: Boolean(ga4),
      criticalFail: !ga4,
      evidence_summary: ga4 ? `Measurement ID ${ga4.measurement_id || 'missing'}, enabled=${Boolean(ga4.enabled)}, setup_status=${ga4.setup_status || 'unknown'}.` : 'No GA4Configuration record found.',
      failure_reason: ga4 ? null : 'Missing GA4Configuration record.',
    }));

    checks.push(makeCheck({
      check_key: 'conversion_event_matrix',
      check_name: 'Production conversion event matrix',
      category: 'analytics',
      provider: 'base44',
      pass: missingConversionEvents.length === 0,
      configured: conversionEvents.length > 0,
      criticalFail: conversionEvents.length === 0,
      evidence_summary: `Found ${conversionEvents.length} conversion event records. Present: ${Array.from(eventTypes).join(', ') || 'none'}. Missing: ${missingConversionEvents.join(', ') || 'none'}.`,
      failure_reason: missingConversionEvents.length ? `Missing: ${missingConversionEvents.join(', ')}` : null,
      manual_steps_required: missingConversionEvents.length ? 'Generate each missing event on the live website, then confirm it appears here and in GA4 Realtime/DebugView.' : null,
    }));

    checks.push(makeCheck({
      check_key: 'lead_form_consent_proof',
      check_name: 'Lead form consent proof',
      category: 'legal',
      provider: 'base44',
      pass: Boolean(latestLead?.consent_given === true && latestLead?.consent_given_at),
      configured: Boolean(latestLead),
      criticalFail: !latestLead,
      evidence_summary: latestLead ? `Latest production lead ${latestLead.id}. consent_given=${Boolean(latestLead.consent_given)}, consent_given_at=${latestLead.consent_given_at || 'missing'}, consent_source=${latestLead.consent_source || 'missing'}.` : 'No production-trusted WebsiteLead found.',
      failure_reason: latestLead ? 'Latest production lead lacks full consent proof.' : 'No production-trusted lead exists yet.',
      manual_steps_required: 'Submit a real production lead through the public form and verify consent_given, consent_given_at, consent_ip, consent_source, consent_text_version, and requested_channels are stored.',
    }));

    checks.push(makeCheck({
      check_key: 'stripe_live_payment_proof',
      check_name: 'Stripe live payment proof',
      category: 'stripe',
      provider: 'stripe',
      pass: Boolean(latestPaidOrder?.stripe_session_id && latestPaidOrder?.payment_status === 'paid'),
      configured: Boolean(latestPaidOrder),
      criticalFail: !latestPaidOrder,
      evidence_summary: latestPaidOrder ? `Latest paid production order ${latestPaidOrder.id}, stripe_session_id=${latestPaidOrder.stripe_session_id || 'missing'}, customer=${latestPaidOrder.customer_email || 'missing'}.` : 'No production-trusted paid Order found.',
      failure_reason: latestPaidOrder ? null : 'No live paid production order exists.',
      manual_steps_required: 'Complete a live Stripe checkout with a real customer/business and confirm webhook-created Order is paid with Stripe IDs stored.',
    }));

    checks.push(makeCheck({
      check_key: 'stripe_custom_checkout_domain',
      check_name: 'Stripe custom checkout domain verification',
      category: 'stripe',
      provider: 'stripe',
      status: 'manual_required',
      evidence_summary: 'Candidate domain: checkout.clientsurgesystems.com. Stripe dashboard/API proof required before this can be marked verified.',
      manual_steps_required: 'In Stripe Dashboard > Settings > Custom domains, confirm checkout.clientsurgesystems.com is ready/enabled. Attach screenshot or paste dashboard proof.',
    }));

    checks.push(makeCheck({
      check_key: 'resend_domain_authentication',
      check_name: 'Resend sender domain authentication',
      category: 'email',
      provider: 'resend',
      pass: Boolean(adminSettings?.resend_enabled && latestEmail?.provider_message_id && latestEmail?.delivery_status !== 'failed'),
      configured: Boolean(adminSettings?.resend_enabled),
      evidence_summary: `Resend enabled=${Boolean(adminSettings?.resend_enabled)}, from=${adminSettings?.resend_from_email || 'missing'}, latest provider_message_id=${latestEmail?.provider_message_id || 'missing'}, latest status=${latestEmail?.delivery_status || 'missing'}.`,
      failure_reason: adminSettings?.resend_enabled ? null : 'Resend is not enabled in AdminSettings.',
      manual_steps_required: 'In Resend dashboard, confirm SPF/DKIM/DMARC/domain status is verified for the sending domain. Attach screenshot/proof.',
    }));

    checks.push(makeCheck({
      check_key: 'twilio_delivery_proof',
      check_name: 'Twilio SMS delivery proof',
      category: 'twilio',
      provider: 'twilio',
      pass: Boolean(latestSms?.provider_message_id && latestSms?.delivery_status === 'delivered'),
      configured: Boolean(adminSettings?.twilio_enabled),
      evidence_summary: `Twilio enabled=${Boolean(adminSettings?.twilio_enabled)}, from=${adminSettings?.twilio_from_number || 'missing'}, latest SMS provider_message_id=${latestSms?.provider_message_id || 'missing'}, delivery_status=${latestSms?.delivery_status || 'missing'}.`,
      failure_reason: latestSms ? 'Latest SMS is not delivered yet.' : 'No production-trusted SMS log found.',
      manual_steps_required: 'Run a live inbound/form SMS test and confirm delivery_status=delivered with Twilio Message SID stored.',
    }));

    for (const manualCheck of MANUAL_GOOGLE_CHECKS) {
      checks.push(makeCheck({ ...manualCheck, status: 'manual_required', evidence_summary: 'Manual Google dashboard proof is required. This cannot be honestly auto-verified from Base44 records alone.' }));
    }

    checks.push(makeCheck({
      check_key: 'dashboard_truth_rollup',
      check_name: 'Dashboard truth rollup',
      category: 'base44',
      provider: 'base44',
      pass: Boolean(latestTruth?.safe_to_launch === true),
      configured: Boolean(latestTruth),
      evidence_summary: latestTruth ? `${latestTruth.truth_status || 'unknown'}: ${latestTruth.evidence_summary || 'No summary.'}` : 'No DashboardTruthCheck record found.',
      failure_reason: latestTruth?.safe_to_launch ? null : 'DashboardTruthCheck is not safe_to_launch.',
    }));

    const criticalChecks = checks.filter((check) => check.critical !== false);
    const blockers = criticalChecks.filter((check) => !check.safe_to_launch);
    const manualRequired = checks.filter((check) => check.status === 'manual_required');
    const failed = checks.filter((check) => check.status === 'failed');
    const verified = checks.filter((check) => check.status === 'verified');
    const safeToLaunch = blockers.length === 0;

    const dashboardPayload = {
      scope: 'admin_dashboard',
      environment: 'production',
      truth_status: safeToLaunch ? 'trusted' : failed.length ? 'blocked' : 'warning',
      safe_to_show_admin: true,
      safe_to_show_client: safeToLaunch,
      safe_to_launch: safeToLaunch,
      blocker_count: blockers.length,
      warning_count: manualRequired.length,
      blockers: blockers.map((check) => ({
        code: check.check_key,
        severity: check.status === 'failed' ? 'critical_blocker' : 'launch_blocker',
        message: `${check.check_name}: ${check.failure_reason || check.manual_steps_required || 'Proof not complete.'}`,
        entity_name: 'LaunchValidationEngine',
        fix_action: check.manual_steps_required || 'Resolve failed check and rerun validation.',
      })),
      warnings: manualRequired.map((check) => ({
        code: check.check_key,
        severity: 'advisory',
        message: check.manual_steps_required || `${check.check_name} requires manual proof.`,
        entity_name: 'LaunchValidationEngine',
        fix_action: check.manual_steps_required || 'Attach proof and rerun validation.',
      })),
      evidence_summary: `Launch Validation Engine (${now}): ${verified.length}/${checks.length} verified, ${manualRequired.length} manual-required, ${failed.length} failed, safe_to_launch=${safeToLaunch}.`,
      source_records: { checks, counts: { total: checks.length, verified: verified.length, manual_required: manualRequired.length, failed: failed.length, blockers: blockers.length } },
      last_checked_at: now,
      created_at: now,
      updated_at: now,
    };

    try {
      await base44.asServiceRole.entities.DashboardTruthCheck.create(dashboardPayload);
    } catch {
      // DashboardTruthCheck write should never prevent the admin UI from seeing validation results.
    }

    return Response.json({
      run_at: now,
      run_by: user.email,
      safe_to_launch: safeToLaunch,
      counts: dashboardPayload.source_records.counts,
      checks,
      blockers: dashboardPayload.blockers,
      warnings: dashboardPayload.warnings,
      next_action: blockers.length
        ? `Resolve or attach proof for ${blockers.length} launch blocker(s).`
        : 'All critical launch validation checks passed.',
    });
  } catch (error) {
    console.error('[runLaunchValidationEngine]', error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});
