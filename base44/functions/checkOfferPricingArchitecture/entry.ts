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

const CANONICAL_PACKAGES = [
  { key: 'starter_system', label: 'Starter System', setupFee: 797, monthlyFee: 497 },
  { key: 'growth_system', label: 'Growth System', setupFee: 1297, monthlyFee: 997 },
  { key: 'pro_system', label: 'Pro System', setupFee: 2497, monthlyFee: 1997 },
];

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

    let allOrders = [];
    try {
      allOrders = await base44.asServiceRole.entities.Order.list('-created_date', 500);
    } catch { /* ignore */ }
    const ordersArray = Array.isArray(allOrders) ? allOrders : [];
    const totalOrders = ordersArray.length;

    const productionOrders = ordersArray.filter(o => !o.dashboard_excluded && o.environment !== 'smoke' && o.environment !== 'demo' && o.environment !== 'internal' && o.environment !== 'qa');
    const productionCount = productionOrders.length;

    let stripeMappings = [];
    try { stripeMappings = await base44.asServiceRole.entities.StripeMappingReference.list('-created_date', 100); } catch { /* ignore */ }
    const mappingsArray = Array.isArray(stripeMappings) ? stripeMappings : [];

    let planMappings = [];
    try { planMappings = await base44.asServiceRole.entities.PlanFeatureMapping.list('-created_date', 100); } catch { /* ignore */ }
    const planMappingsArray = Array.isArray(planMappings) ? planMappings : [];

    let saasMaps = [];
    try { saasMaps = await base44.asServiceRole.entities.SaaSProductizationControlMap.list('-created_date', 100); } catch { /* ignore */ }

    // Check 1: Orders exist
    checks.push({
      id: 'orders_exist',
      label: 'Order records exist for package validation',
      passed: totalOrders > 0,
      evidence: `${totalOrders} total orders, ${productionCount} production-trusted.`,
      status: totalOrders > 0 ? 'passed' : 'needs_proof',
    });

    // Check 2: pricing_summary present
    const ordersWithPricingSummary = productionOrders.filter(o => o.pricing_summary && typeof o.pricing_summary === 'object');
    const ordersMissingPricingSummary = productionOrders.filter(o => !o.pricing_summary || typeof o.pricing_summary !== 'object');
    checks.push({
      id: 'pricing_summary_present',
      label: 'Production orders have pricing_summary populated',
      passed: productionCount === 0 || ordersMissingPricingSummary.length === 0,
      evidence: `${ordersWithPricingSummary.length}/${productionCount} production orders have pricing_summary. ${ordersMissingPricingSummary.length} missing.`,
      status: ordersMissingPricingSummary.length === 0 ? 'passed' : 'needs_proof',
    });
    if (ordersMissingPricingSummary.length > 0) {
      warnings.push({
        code: 'ORDERS_MISSING_PRICING_SUMMARY',
        severity: 'advisory',
        message: `${ordersMissingPricingSummary.length} production orders missing pricing_summary.`,
        fix_action: 'Ensure checkout flow populates pricing_summary with package_key, package_name, fees, and service keys.',
      });
    }

    // Check 3: Package type mismatch
    const mismatchedOrders = productionOrders.filter(o => o.selected_package_type && o.package_type && o.selected_package_type !== o.package_type);
    checks.push({
      id: 'package_type_mismatch',
      label: 'No orders with selected_package_type / package_type mismatch',
      passed: mismatchedOrders.length === 0,
      evidence: mismatchedOrders.length === 0 ? 'No package type mismatches found.' : `${mismatchedOrders.length} orders have selected_package_type ≠ package_type.`,
      status: mismatchedOrders.length === 0 ? 'passed' : 'needs_proof',
    });
    if (mismatchedOrders.length > 0) {
      warnings.push({
        code: 'PACKAGE_TYPE_MISMATCH',
        severity: 'advisory',
        message: `${mismatchedOrders.length} orders have selected_package_type ≠ package_type.`,
        fix_action: 'Review mismatched orders — user intent may differ from detected package. Do not auto-change; review manually.',
      });
    }

    // Check 4: Negative discount totals or compare-at math issues
    const negativeDiscountOrders = productionOrders.filter(o => {
      const ps = o.pricing_summary || {};
      return (ps.setup_discount_total < 0) || (ps.monthly_discount_total < 0);
    });
    const badCompareAtOrders = productionOrders.filter(o => {
      const ps = o.pricing_summary || {};
      if (ps.compare_at_setup && ps.total_setup > ps.compare_at_setup) return true;
      if (ps.compare_at_monthly && ps.total_monthly > ps.compare_at_monthly) return true;
      return false;
    });
    const mathIssueOrders = [...new Set([...negativeDiscountOrders, ...badCompareAtOrders])];
    checks.push({
      id: 'discount_math_valid',
      label: 'No orders with negative discounts or impossible compare-at math',
      passed: mathIssueOrders.length === 0,
      evidence: mathIssueOrders.length === 0 ? 'All pricing math valid.' : `${mathIssueOrders.length} orders with discount/compare-at math issues.`,
      status: mathIssueOrders.length === 0 ? 'passed' : 'needs_proof',
    });
    if (mathIssueOrders.length > 0) {
      blockers.push({
        code: 'PRICING_MATH_ERROR',
        severity: 'launch_blocker',
        message: `${mathIssueOrders.length} orders have negative discounts or compare-at < actual price.`,
        fix_action: 'Review pricing_summary for these orders. Do not auto-fix — verify intended pricing and correct manually if needed.',
      });
    }

    // Check 5: Missing funnel_identity_id
    const missingFunnelId = productionOrders.filter(o => !(o.funnel_identity_id || '').trim());
    checks.push({
      id: 'funnel_identity_linked',
      label: 'Production orders have funnel_identity_id',
      passed: missingFunnelId.length === 0,
      evidence: missingFunnelId.length === 0 ? 'All production orders have funnel_identity_id.' : `${missingFunnelId.length} production orders missing funnel_identity_id.`,
      status: missingFunnelId.length === 0 ? 'passed' : 'needs_proof',
    });
    if (missingFunnelId.length > 0) {
      warnings.push({
        code: 'ORDERS_MISSING_FUNNEL_IDENTITY',
        severity: 'advisory',
        message: `${missingFunnelId.length} production orders missing funnel_identity_id.`,
        fix_action: 'Ensure checkout flow generates or inherits funnel_identity_id from the lead journey.',
      });
    }

    // Check 6: Packages traceable to plan map
    const packageKeysInOrders = [...new Set(productionOrders.map(o => o.pricing_summary?.package_key).filter(Boolean))];
    const planMapKeys = planMappingsArray.map(p => p.plan_key || p.package_key).filter(Boolean);
    const untraceablePackages = packageKeysInOrders.filter(k => !CANONICAL_PACKAGES.some(c => c.key === k) && !planMapKeys.includes(k));
    checks.push({
      id: 'packages_traceable_to_plan_map',
      label: 'All package keys in orders traceable to canonical packages or PlanFeatureMapping',
      passed: untraceablePackages.length === 0,
      evidence: untraceablePackages.length === 0 ? `All ${packageKeysInOrders.length} package keys traceable.` : `${untraceablePackages.length} untraceable package keys: ${untraceablePackages.join(', ')}.`,
      status: untraceablePackages.length === 0 ? 'passed' : 'needs_proof',
    });
    if (untraceablePackages.length > 0) {
      warnings.push({
        code: 'UNTRACEABLE_PACKAGE_KEYS',
        severity: 'advisory',
        message: `Package keys not found in canonical packages or PlanFeatureMapping: ${untraceablePackages.join(', ')}.`,
        fix_action: 'Add missing package keys to PlanFeatureMapping or correct the package_key in order pricing_summary.',
      });
    }

    // Check 7: Naming consistency
    const legacyNames = productionOrders.filter(o => {
      const name = (o.pricing_summary?.package_name || '').toLowerCase();
      return name.includes('elite') || name.includes('legacy') || name.includes('basic');
    });
    checks.push({
      id: 'naming_consistency',
      label: 'No legacy/inconsistent package names (Elite, Basic, legacy)',
      passed: legacyNames.length === 0,
      evidence: legacyNames.length === 0 ? 'No legacy package names found.' : `${legacyNames.length} orders with legacy/inconsistent names (Elite, Basic, legacy).`,
      status: legacyNames.length === 0 ? 'passed' : 'needs_proof',
    });
    if (legacyNames.length > 0) {
      warnings.push({
        code: 'LEGACY_PACKAGE_NAMES',
        severity: 'advisory',
        message: `${legacyNames.length} orders use legacy naming (Elite, Basic, legacy).`,
        fix_action: 'Standardize package names to Starter/Growth/Pro. Do not auto-rename — review and update manually.',
      });
    }

    // Check 8: Service keys match plan mapping
    let serviceKeyMismatches = 0;
    for (const order of productionOrders) {
      const ps = order.pricing_summary;
      if (!ps || !ps.package_key) continue;
      const planMap = planMappingsArray.find(p => (p.plan_key || p.package_key) === ps.package_key);
      if (planMap && Array.isArray(planMap.included_service_keys) && Array.isArray(ps.package_service_keys)) {
        const missing = planMap.included_service_keys.filter(k => !ps.package_service_keys.includes(k));
        if (missing.length > 0) serviceKeyMismatches++;
      }
    }
    checks.push({
      id: 'service_keys_match_plan',
      label: 'Order package_service_keys match PlanFeatureMapping',
      passed: serviceKeyMismatches === 0,
      evidence: serviceKeyMismatches === 0 ? 'All package service keys match plan mapping.' : `${serviceKeyMismatches} orders with service key mismatches vs PlanFeatureMapping.`,
      status: serviceKeyMismatches === 0 ? 'passed' : 'needs_proof',
    });
    if (serviceKeyMismatches > 0) {
      warnings.push({
        code: 'SERVICE_KEY_MISMATCH',
        severity: 'advisory',
        message: `${serviceKeyMismatches} orders have package_service_keys that do not match PlanFeatureMapping.`,
        fix_action: 'Review PlanFeatureMapping included_service_keys and update order pricing_summary or plan mapping to align.',
      });
    }

    // Build package summary
    const packageSummary = CANONICAL_PACKAGES.map(pkg => {
      const orderCount = productionOrders.filter(o => o.pricing_summary?.package_key === pkg.key).length;
      const stripeMapping = mappingsArray.find(m => m.package_key === pkg.key);
      const planMap = planMappingsArray.find(p => (p.plan_key || p.package_key) === pkg.key);
      return {
        key: pkg.key,
        label: pkg.label,
        setup_fee: pkg.setupFee,
        monthly_fee: pkg.monthlyFee,
        order_count: orderCount,
        stripe_mapping_exists: !!stripeMapping,
        plan_mapping_exists: !!planMap,
        included_service_keys: planMap?.included_service_keys || [],
        add_on_service_keys: planMap?.add_on_service_keys || [],
      };
    });

    const passedCount = checks.filter(c => c.status === 'passed').length;
    const totalChecks = checks.length;
    const checkRatio = passedCount / totalChecks;

    const ratios = {
      strategic_clarity: 0.85,
      user_journey: checkRatio,
      data_integrity: productionCount > 0 ? (ordersWithPricingSummary.length / productionCount) * 0.5 + (1 - mathIssueOrders.length / Math.max(productionCount, 1)) * 0.5 : 0.1,
      integration_reliability: (packageSummary.filter(p => p.stripe_mapping_exists).length / CANONICAL_PACKAGES.length) * 0.5 + (packageSummary.filter(p => p.plan_mapping_exists).length / CANONICAL_PACKAGES.length) * 0.5,
      proof_level: (productionCount > 0 ? 0.2 : 0) + (ordersMissingPricingSummary.length === 0 ? 0.2 : 0) + (mathIssueOrders.length === 0 ? 0.3 : 0) + (untraceablePackages.length === 0 ? 0.15 : 0) + (legacyNames.length === 0 ? 0.15 : 0),
      launch_readiness: checkRatio * 0.8,
    };

    const score = calculateSectionScore(ratios);

    return Response.json({
      section_key: 'offer_pricing_architecture',
      score,
      checks,
      blockers,
      warnings,
      evidence_summary: `${totalOrders} orders, ${productionCount} production. ${ordersMissingPricingSummary.length} missing pricing_summary. ${mismatchedOrders.length} package type mismatches. ${mathIssueOrders.length} math issues. ${untraceablePackages.length} untraceable packages. ${legacyNames.length} legacy names.`,
      package_summary: packageSummary,
      order_counts: { total: totalOrders, production: productionCount, missing_pricing_summary: ordersMissingPricingSummary.length, package_type_mismatch: mismatchedOrders.length, math_issues: mathIssueOrders.length, missing_funnel_identity: missingFunnelId.length },
    });
  } catch (error) {
    console.error('checkOfferPricingArchitecture error:', error);
    return Response.json({
      section_key: 'offer_pricing_architecture',
      score: { total: 0, grade: 'F', status: 'Blocked', components: [] },
      checks: [],
      blockers: [{ code: 'CHECK_ERROR', severity: 'critical_blocker', message: error.message, fix_action: 'Review backend function logs.' }],
      warnings: [],
      evidence_summary: `Error: ${error.message}`,
    }, { status: 200 });
  }
});