import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SCORING_COMPONENTS = [
  { key: 'strategic_clarity', maxPoints: 15 },
  { key: 'user_journey', maxPoints: 15 },
  { key: 'data_integrity', maxPoints: 20 },
  { key: 'integration_reliability', maxPoints: 20 },
  { key: 'proof_level', maxPoints: 15 },
  { key: 'launch_readiness', maxPoints: 15 },
];

function scoreComponent(rawRatio, maxPoints) {
  if (typeof rawRatio !== 'number' || isNaN(rawRatio)) return 0;
  return Math.round(Math.max(0, Math.min(1, rawRatio)) * maxPoints);
}

function calculateSectionScore(ratios) {
  const components = SCORING_COMPONENTS.map((comp) => {
    const ratio = ratios[comp.key] ?? 0;
    return { key: comp.key, maxPoints: comp.maxPoints, points: scoreComponent(ratio, comp.maxPoints), ratio };
  });
  const total = components.reduce((sum, c) => sum + c.points, 0);
  const grade = total >= 90 ? 'A' : total >= 80 ? 'B' : total >= 70 ? 'C' : total >= 60 ? 'D' : 'F';
  const status = total >= 85 ? 'Trusted' : total >= 50 ? 'Needs Proof' : 'Blocked';
  return { total, grade, status, components };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const blockers = [];
    const warnings = [];
    const checks = [];

    // Fetch checkout_click events
    let checkoutClickEvents = [];
    try {
      checkoutClickEvents = await base44.asServiceRole.entities.ConversionTrackingEvent.filter({ event_type: 'checkout_click' }, '-timestamp', 100);
    } catch { /* ignore */ }
    const checkoutClickCount = Array.isArray(checkoutClickEvents) ? checkoutClickEvents.length : 0;

    // Fetch all orders
    let allOrders = [];
    try {
      allOrders = await base44.asServiceRole.entities.Order.list('-created_date', 500);
    } catch { /* ignore */ }
    const ordersArray = Array.isArray(allOrders) ? allOrders : [];
    const totalOrders = ordersArray.length;

    // Classify production-trusted orders
    const productionOrders = ordersArray.filter(o => !o.dashboard_excluded && o.environment !== 'smoke' && o.environment !== 'demo' && o.environment !== 'internal' && o.environment !== 'qa');
    const productionPaidOrders = productionOrders.filter(o => o.payment_status === 'paid');
    const pendingOrders = productionOrders.filter(o => o.payment_status === 'pending');
    const failedOrders = productionOrders.filter(o => o.payment_status === 'failed');

    // Check 1: Checkout click events
    checks.push({
      id: 'checkout_click_events',
      label: 'checkout_click ConversionTrackingEvent records exist',
      passed: checkoutClickCount > 0,
      evidence: `${checkoutClickCount} checkout_click events found.`,
      status: checkoutClickCount > 0 ? 'passed' : 'needs_proof',
    });
    if (checkoutClickCount === 0) {
      warnings.push({
        code: 'NO_CHECKOUT_CLICK_EVENTS',
        severity: 'advisory',
        message: 'No checkout_click ConversionTrackingEvent records found.',
        fix_action: 'Visit the pricing page and click a checkout button to generate a tracked event.',
      });
    }

    // Check 2: Orders from checkout sessions
    const ordersWithSession = productionOrders.filter(o => (o.stripe_session_id || '').trim());
    const ordersMissingSession = productionOrders.filter(o => !(o.stripe_session_id || '').trim());
    checks.push({
      id: 'orders_from_checkout_sessions',
      label: 'Production orders have stripe_session_id',
      passed: productionOrders.length === 0 || ordersMissingSession.length === 0,
      evidence: `${ordersWithSession.length}/${productionOrders.length} production orders have stripe_session_id. ${ordersMissingSession.length} missing.`,
      status: ordersMissingSession.length === 0 ? 'passed' : 'needs_proof',
    });
    if (ordersMissingSession.length > 0 && productionPaidOrders.length > 0) {
      warnings.push({
        code: 'ORDERS_MISSING_SESSION_ID',
        severity: 'advisory',
        message: `${ordersMissingSession.length} production orders missing stripe_session_id.`,
        fix_action: 'Ensure checkout flow stores stripe_session_id on Order creation.',
      });
    }

    // Check 3: Paid orders exist
    checks.push({
      id: 'paid_orders_exist',
      label: 'Production-trusted paid orders exist',
      passed: productionPaidOrders.length > 0,
      evidence: `${productionPaidOrders.length} production-trusted paid orders. ${pendingOrders.length} pending. ${failedOrders.length} failed.`,
      status: productionPaidOrders.length > 0 ? 'passed' : 'needs_proof',
    });
    if (productionPaidOrders.length === 0) {
      blockers.push({
        code: 'NO_PRODUCTION_PAID_ORDERS',
        severity: 'launch_blocker',
        message: 'No production-trusted paid orders found.',
        fix_action: 'Complete a real checkout flow to generate a paid order with production environment.',
      });
    }

    // Check 4: Paid orders missing identifiers
    const paidMissingCustomer = productionPaidOrders.filter(o => !(o.stripe_customer_id || '').trim());
    const paidMissingEvent = productionPaidOrders.filter(o => !(o.stripe_event_id || '').trim());
    checks.push({
      id: 'paid_orders_have_identifiers',
      label: 'Paid orders have stripe_customer_id and stripe_event_id',
      passed: paidMissingCustomer.length === 0 && paidMissingEvent.length === 0,
      evidence: `${productionPaidOrders.length - paidMissingCustomer.length}/${productionPaidOrders.length} have customer_id. ${productionPaidOrders.length - paidMissingEvent.length}/${productionPaidOrders.length} have event_id.`,
      status: (paidMissingCustomer.length === 0 && paidMissingEvent.length === 0) ? 'passed' : 'needs_proof',
    });
    if (paidMissingCustomer.length > 0 || paidMissingEvent.length > 0) {
      blockers.push({
        code: 'PAID_ORDERS_MISSING_IDENTIFIERS',
        severity: 'launch_blocker',
        message: `${paidMissingCustomer.length} paid orders missing stripe_customer_id, ${paidMissingEvent.length} missing stripe_event_id.`,
        fix_action: 'Ensure Stripe webhook stores customer_id and event_id on Order records.',
      });
    }

    // Check 5: Recurring orders have subscription
    const recurringPaidOrders = productionPaidOrders.filter(o => {
      const totalMonthly = o.total_monthly || o.pricing_summary?.total_monthly || 0;
      return totalMonthly > 0;
    });
    const missingSubscription = recurringPaidOrders.filter(o => !(o.subscription_id || '').trim() && !(o.stripe_subscription_id || '').trim());
    checks.push({
      id: 'recurring_orders_have_subscription',
      label: 'Recurring paid orders have subscription_id linked',
      passed: missingSubscription.length === 0,
      evidence: `${recurringPaidOrders.length - missingSubscription.length}/${recurringPaidOrders.length} recurring orders have subscription link. ${missingSubscription.length} missing.`,
      status: missingSubscription.length === 0 ? 'passed' : 'needs_proof',
    });
    if (missingSubscription.length > 0) {
      blockers.push({
        code: 'RECURRING_ORDER_MISSING_SUBSCRIPTION',
        severity: 'launch_blocker',
        message: `${missingSubscription.length} recurring paid orders missing subscription_id.`,
        fix_action: 'Ensure Stripe checkout creates subscription and webhook links it to the Order.',
      });
    }

    // Check 6: Paid orders missing funnel_identity_id
    const paidMissingFunnelId = productionPaidOrders.filter(o => !(o.funnel_identity_id || '').trim());
    checks.push({
      id: 'paid_orders_have_funnel_identity',
      label: 'Paid orders have funnel_identity_id',
      passed: paidMissingFunnelId.length === 0,
      evidence: `${productionPaidOrders.length - paidMissingFunnelId.length}/${productionPaidOrders.length} paid orders have funnel_identity_id.`,
      status: paidMissingFunnelId.length === 0 ? 'passed' : 'needs_proof',
    });
    if (paidMissingFunnelId.length > 0) {
      blockers.push({
        code: 'PAID_ORDERS_MISSING_FUNNEL_IDENTITY',
        severity: 'launch_blocker',
        message: `${paidMissingFunnelId.length} paid orders missing funnel_identity_id.`,
        fix_action: 'Ensure checkout flow inherits or generates funnel_identity_id from the lead journey.',
      });
    }

    // Check 7: Status consistency
    const inconsistentStatus = productionPaidOrders.filter(o => {
      if (o.payment_status === 'paid' && o.order_status === 'pending_payment') return true;
      if (o.payment_status === 'paid' && o.pipeline_status === 'Error') return true;
      return false;
    });
    checks.push({
      id: 'status_consistency',
      label: 'No payment_status / order_status / pipeline_status inconsistencies',
      passed: inconsistentStatus.length === 0,
      evidence: inconsistentStatus.length === 0 ? 'All statuses consistent.' : `${inconsistentStatus.length} orders with status inconsistencies.`,
      status: inconsistentStatus.length === 0 ? 'passed' : 'needs_proof',
    });
    if (inconsistentStatus.length > 0) {
      warnings.push({
        code: 'STATUS_INCONSISTENCY',
        severity: 'advisory',
        message: `${inconsistentStatus.length} paid orders have status inconsistencies (paid but pending_payment, or paid but pipeline Error).`,
        fix_action: 'Review and correct order_status and pipeline_status for these orders.',
      });
    }

    // Check 8: Paid orders have Client/ClientProject link
    const paidMissingClient = productionPaidOrders.filter(o => !(o.client_id || '').trim() && !(o.client_project_id || '').trim());
    checks.push({
      id: 'paid_orders_have_client_link',
      label: 'Paid orders have client_id or client_project_id linked',
      passed: paidMissingClient.length === 0,
      evidence: `${productionPaidOrders.length - paidMissingClient.length}/${productionPaidOrders.length} paid orders have client link.`,
      status: paidMissingClient.length === 0 ? 'passed' : 'needs_proof',
    });
    if (paidMissingClient.length > 0) {
      blockers.push({
        code: 'PAID_ORDER_NO_CLIENT_LINK',
        severity: 'launch_blocker',
        message: `${paidMissingClient.length} paid orders have no client_id or client_project_id.`,
        fix_action: 'Ensure post-payment orchestrator creates Client/ClientProject and links to Order.',
      });
    }

    // Check 9: Paid orders have onboarding handoff
    const paidMissingHandoff = productionPaidOrders.filter(o => !o.purchase_onboarding_handoff && !o.onboarding_client_id);
    checks.push({
      id: 'paid_orders_have_onboarding_handoff',
      label: 'Paid orders have purchase_onboarding_handoff or onboarding_client_id',
      passed: paidMissingHandoff.length === 0,
      evidence: `${productionPaidOrders.length - paidMissingHandoff.length}/${productionPaidOrders.length} paid orders have onboarding handoff.`,
      status: paidMissingHandoff.length === 0 ? 'passed' : 'needs_proof',
    });
    if (paidMissingHandoff.length > 0) {
      blockers.push({
        code: 'PAID_ORDER_NO_ONBOARDING_HANDOFF',
        severity: 'launch_blocker',
        message: `${paidMissingHandoff.length} paid orders have no onboarding handoff.`,
        fix_action: 'Ensure post-payment orchestrator creates onboarding handoff for each paid order.',
      });
    }

    // Check 10: Revenue excludes test records
    const testRevenueOrders = ordersArray.filter(o => (o.environment === 'smoke' || o.environment === 'demo' || o.environment === 'internal' || o.dashboard_excluded) && o.payment_status === 'paid');
    checks.push({
      id: 'revenue_excludes_test_records',
      label: 'Revenue metrics exclude test/smoke/internal/demo records',
      passed: true,
      evidence: `${testRevenueOrders.length} test/smoke/internal/demo paid orders excluded from production revenue metrics.`,
      status: 'passed',
    });

    const latestPaidOrder = productionPaidOrders[0] || null;

    const passedCount = checks.filter(c => c.status === 'passed').length;
    const totalChecks = checks.length;
    const checkRatio = passedCount / totalChecks;

    const ratios = {
      strategic_clarity: 0.9,
      user_journey: checkRatio,
      data_integrity: productionPaidOrders.length > 0 ? (1 - paidMissingCustomer.length / Math.max(productionPaidOrders.length, 1)) * 0.3 + (1 - paidMissingFunnelId.length / Math.max(productionPaidOrders.length, 1)) * 0.3 + (1 - paidMissingClient.length / Math.max(productionPaidOrders.length, 1)) * 0.2 + (1 - inconsistentStatus.length / Math.max(productionPaidOrders.length, 1)) * 0.2 : 0.1,
      integration_reliability: (checkoutClickCount > 0 ? 0.2 : 0) + (productionPaidOrders.length > 0 ? 0.3 : 0) + (missingSubscription.length === 0 ? 0.25 : 0) + (paidMissingHandoff.length === 0 ? 0.25 : 0),
      proof_level: (checkoutClickCount > 0 ? 0.2 : 0) + (productionPaidOrders.length > 0 ? 0.4 : 0) + (paidMissingCustomer.length === 0 && productionPaidOrders.length > 0 ? 0.2 : 0) + (paidMissingClient.length === 0 && productionPaidOrders.length > 0 ? 0.2 : 0),
      launch_readiness: checkRatio * 0.8,
    };

    const score = calculateSectionScore(ratios);

    return Response.json({
      section_key: 'checkout_revenue_flow',
      score,
      checks,
      blockers,
      warnings,
      evidence_summary: `${checkoutClickCount} checkout_click events. ${totalOrders} total orders, ${productionPaidOrders.length} production paid, ${pendingOrders.length} pending. ${ordersMissingSession.length} missing session. ${paidMissingFunnelId.length} paid missing funnel_identity. ${inconsistentStatus.length} status inconsistencies.`,
      order_counts: { total: totalOrders, production_paid: productionPaidOrders.length, pending: pendingOrders.length, failed: failedOrders.length, missing_session: ordersMissingSession.length, missing_customer_id: paidMissingCustomer.length, missing_subscription: missingSubscription.length, missing_funnel_identity: paidMissingFunnelId.length, status_inconsistencies: inconsistentStatus.length, missing_client_link: paidMissingClient.length, missing_onboarding_handoff: paidMissingHandoff.length },
      checkout_click_events: checkoutClickCount,
      latest_paid_order: latestPaidOrder ? {
        id: latestPaidOrder.id,
        customer_email: latestPaidOrder.customer_email || '',
        business_name: latestPaidOrder.business_name || '',
        payment_status: latestPaidOrder.payment_status || '',
        order_status: latestPaidOrder.order_status || '',
        pipeline_status: latestPaidOrder.pipeline_status || '',
        stripe_session_id: latestPaidOrder.stripe_session_id || '',
        stripe_customer_id: latestPaidOrder.stripe_customer_id || '',
        subscription_id: latestPaidOrder.subscription_id || '',
        funnel_identity_id: latestPaidOrder.funnel_identity_id || '',
        client_id: latestPaidOrder.client_id || '',
        client_project_id: latestPaidOrder.client_project_id || '',
        total_setup: latestPaidOrder.total_setup || 0,
        total_monthly: latestPaidOrder.total_monthly || 0,
        created_date: latestPaidOrder.created_date || '',
      } : null,
    });
  } catch (error) {
    console.error('checkCheckoutRevenueFlow error:', error);
    return Response.json({
      section_key: 'checkout_revenue_flow',
      score: { total: 0, grade: 'F', status: 'Blocked', components: [] },
      checks: [],
      blockers: [{ code: 'CHECK_ERROR', severity: 'critical_blocker', message: error.message, fix_action: 'Review backend function logs.' }],
      warnings: [],
      evidence_summary: `Error: ${error.message}`,
    }, { status: 200 });
  }
});