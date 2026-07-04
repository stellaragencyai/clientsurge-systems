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

    let allOrders = [];
    try {
      allOrders = await base44.asServiceRole.entities.Order.list('-created_date', 500);
    } catch { /* ignore */ }
    const ordersArray = Array.isArray(allOrders) ? allOrders : [];
    const productionPaidOrders = ordersArray.filter(o => o.payment_status === 'paid' && !o.dashboard_excluded && o.environment !== 'smoke' && o.environment !== 'demo' && o.environment !== 'internal' && o.environment !== 'qa');

    const fetchEntity = async (name, sortField = '-created_date', limit = 200) => {
      try {
        const result = await base44.asServiceRole.entities[name].list(sortField, limit);
        return Array.isArray(result) ? result : [];
      } catch { return []; }
    };

    const setupAuths = await fetchEntity('SetupAuthorization');
    const activationSessions = await fetchEntity('ActivationWizardSession');
    const websiteScans = await fetchEntity('WebsiteIntelligenceScan');
    const aiBlueprints = await fetchEntity('AIInstallBlueprint');
    const aiProfiles = await fetchEntity('AIBusinessProfile');
    const smartAccessRequests = await fetchEntity('SmartAccessRequest');
    const simulationRuns = await fetchEntity('SimulationRun');
    const onboardingOrchestrations = await fetchEntity('OnboardingOrchestration');
    const installOSRecords = await fetchEntity('ClientInstallationOS');

    // Checks 1-9: Entity existence
    const entityChecks = [
      { id: 'paid_orders_exist', label: 'Production-trusted paid orders exist as onboarding starting point', count: productionPaidOrders.length },
      { id: 'onboarding_orchestration_exists', label: 'OnboardingOrchestration records exist', count: onboardingOrchestrations.length },
      { id: 'install_os_exists', label: 'ClientInstallationOS records exist', count: installOSRecords.length },
      { id: 'setup_authorization_exists', label: 'SetupAuthorization records exist', count: setupAuths.length },
      { id: 'website_scan_exists', label: 'WebsiteIntelligenceScan records exist', count: websiteScans.length },
      { id: 'ai_blueprint_exists', label: 'AIInstallBlueprint records exist', count: aiBlueprints.length },
      { id: 'ai_business_profile_exists', label: 'AIBusinessProfile records exist', count: aiProfiles.length },
      { id: 'smart_access_request_exists', label: 'SmartAccessRequest records exist', count: smartAccessRequests.length },
      { id: 'simulation_run_exists', label: 'SimulationRun records exist', count: simulationRuns.length },
    ];

    for (const ec of entityChecks) {
      checks.push({
        id: ec.id,
        label: ec.label,
        passed: ec.count > 0,
        evidence: `${ec.count} records found.`,
        status: ec.count > 0 ? 'passed' : 'needs_proof',
      });
    }

    // Chain validation for latest paid order
    const latestPaidOrder = productionPaidOrders[0] || null;
    let chainValidation = null;

    if (latestPaidOrder) {
      const orderId = latestPaidOrder.id;
      const clientId = latestPaidOrder.client_id || '';
      const clientProjectId = latestPaidOrder.client_project_id || '';

      const linkedOrchestration = onboardingOrchestrations.find(o => o.order_id === orderId || o.client_id === clientId || o.client_project_id === clientProjectId);
      const linkedInstallOS = installOSRecords.find(o => o.order_id === orderId || o.client_id === clientId || o.client_project_id === clientProjectId);
      const linkedSetupAuth = setupAuths.find(s => s.order_id === orderId || s.client_id === clientId || s.client_project_id === clientProjectId);
      const linkedWebsiteScan = websiteScans.find(s => s.order_id === orderId || s.client_id === clientId || s.client_project_id === clientProjectId);
      const linkedBlueprint = aiBlueprints.find(b => b.order_id === orderId || b.client_id === clientId || b.client_project_id === clientProjectId);
      const linkedProfile = aiProfiles.find(p => p.order_id === orderId || p.client_id === clientId || p.client_project_id === clientProjectId);
      const linkedAccess = smartAccessRequests.find(a => a.order_id === orderId || a.client_id === clientId || a.client_project_id === clientProjectId);
      const linkedSimulation = simulationRuns.find(s => s.order_id === orderId || s.client_id === clientId || s.client_project_id === clientProjectId);

      chainValidation = {
        order_id: orderId,
        client_id: clientId,
        client_project_id: clientProjectId,
        has_orchestration: !!linkedOrchestration,
        has_install_os: !!linkedInstallOS,
        has_setup_authorization: !!linkedSetupAuth,
        has_website_scan: !!linkedWebsiteScan,
        has_ai_blueprint: !!linkedBlueprint,
        has_ai_business_profile: !!linkedProfile,
        has_smart_access_request: !!linkedAccess,
        has_simulation_run: !!linkedSimulation,
        install_os_stage: linkedInstallOS?.workflow_stage || '',
        install_os_activation_status: linkedInstallOS?.activation_status || '',
        install_os_live: linkedInstallOS?.activation_status === 'live' || linkedInstallOS?.workflow_stage === 'activated',
      };

      const hasChain = linkedOrchestration || linkedInstallOS;
      checks.push({
        id: 'paid_order_has_onboarding_chain',
        label: 'Latest paid order has onboarding chain (OnboardingOrchestration or ClientInstallationOS)',
        passed: !!hasChain,
        evidence: hasChain ? `Chain found: orchestration=${!!linkedOrchestration}, install_os=${!!linkedInstallOS}.` : 'No onboarding chain linked to latest paid order.',
        status: hasChain ? 'passed' : 'needs_proof',
      });
      if (!hasChain) {
        blockers.push({
          code: 'NO_ONBOARDING_CHAIN',
          severity: 'launch_blocker',
          message: 'Latest production-trusted paid order has no onboarding chain.',
          fix_action: 'Ensure post-payment orchestrator creates OnboardingOrchestration and ClientInstallationOS for each paid order.',
        });
      }

      checks.push({
        id: 'chain_has_setup_authorization',
        label: 'Onboarding chain has SetupAuthorization',
        passed: !!linkedSetupAuth,
        evidence: linkedSetupAuth ? 'SetupAuthorization found.' : 'No SetupAuthorization linked.',
        status: linkedSetupAuth ? 'passed' : 'needs_proof',
      });
      if (!linkedSetupAuth) {
        blockers.push({
          code: 'MISSING_SETUP_AUTHORIZATION',
          severity: 'launch_blocker',
          message: 'Paid order onboarding chain missing SetupAuthorization.',
          fix_action: 'Create SetupAuthorization for this client to capture their approval for setup.',
        });
      }

      checks.push({
        id: 'chain_has_access_request',
        label: 'Onboarding chain has SmartAccessRequest',
        passed: !!linkedAccess,
        evidence: linkedAccess ? 'SmartAccessRequest found.' : 'No SmartAccessRequest linked.',
        status: linkedAccess ? 'passed' : 'needs_proof',
      });
      if (!linkedAccess) {
        warnings.push({
          code: 'MISSING_ACCESS_REQUEST',
          severity: 'advisory',
          message: 'Paid order onboarding chain missing SmartAccessRequest.',
          fix_action: 'Create SmartAccessRequest to capture client credentials/access for setup.',
        });
      }

      if (chainValidation.install_os_live) {
        const simPassed = linkedSimulation && (linkedSimulation.status === 'passed' || linkedSimulation.result === 'passed' || linkedSimulation.outcome === 'passed');
        checks.push({
          id: 'simulation_passed_before_golive',
          label: 'SimulationRun passed before Install OS marked live',
          passed: !!simPassed,
          evidence: simPassed ? 'Simulation passed before go-live.' : 'Install OS is live but no passing SimulationRun found.',
          status: simPassed ? 'passed' : 'needs_proof',
        });
        if (!simPassed) {
          blockers.push({
            code: 'GO_LIVE_WITHOUT_SIMULATION',
            severity: 'launch_blocker',
            message: 'ClientInstallationOS is live but no passing SimulationRun found.',
            fix_action: 'Run and pass a simulation before marking Install OS as live.',
          });
        }

        checks.push({
          id: 'install_os_live_has_proof',
          label: 'ClientInstallationOS live status backed by automation proof',
          passed: false,
          evidence: 'Install OS is marked live — cross-check with Automation Delivery Proof section for actual automation evidence.',
          status: 'needs_proof',
        });
        warnings.push({
          code: 'INSTALL_OS_LIVE_UNVERIFIED',
          severity: 'advisory',
          message: 'ClientInstallationOS is live — verify automation proof exists in Automation Delivery section.',
          fix_action: 'Cross-check Automation Delivery Proof section for this client project.',
        });
      }
    }

    const entityCounts = {
      setup_authorization: setupAuths.length,
      activation_wizard_session: activationSessions.length,
      website_intelligence_scan: websiteScans.length,
      ai_install_blueprint: aiBlueprints.length,
      ai_business_profile: aiProfiles.length,
      smart_access_request: smartAccessRequests.length,
      simulation_run: simulationRuns.length,
      onboarding_orchestration: onboardingOrchestrations.length,
      client_installation_os: installOSRecords.length,
    };

    let onboardingState = 'Intake received';
    if (chainValidation) {
      if (chainValidation.install_os_live) onboardingState = 'Live';
      else if (chainValidation.has_simulation_run) onboardingState = 'Ready for activation';
      else if (chainValidation.has_smart_access_request) onboardingState = 'Simulation needed';
      else if (chainValidation.has_ai_blueprint && chainValidation.has_ai_business_profile) onboardingState = 'Access needed';
      else if (chainValidation.has_website_scan) onboardingState = 'Blueprint needed';
      else if (chainValidation.has_setup_authorization) onboardingState = 'Website scan needed';
      else if (chainValidation.has_orchestration || chainValidation.has_install_os) onboardingState = 'Setup authorization needed';
    }
    if (blockers.length > 0 && onboardingState !== 'Live') onboardingState = 'Blocked';

    const passedCount = checks.filter(c => c.status === 'passed').length;
    const totalChecks = checks.length;
    const checkRatio = totalChecks > 0 ? passedCount / totalChecks : 0;

    const ratios = {
      strategic_clarity: 0.85,
      user_journey: checkRatio,
      data_integrity: Object.values(entityCounts).filter(c => c > 0).length / 9,
      integration_reliability: (chainValidation?.has_orchestration ? 0.2 : 0) + (chainValidation?.has_install_os ? 0.2 : 0) + (chainValidation?.has_setup_authorization ? 0.2 : 0) + (chainValidation?.has_smart_access_request ? 0.2 : 0) + (chainValidation?.has_simulation_run ? 0.2 : 0),
      proof_level: (productionPaidOrders.length > 0 ? 0.2 : 0) + (chainValidation?.has_orchestration ? 0.2 : 0) + (chainValidation?.has_install_os ? 0.2 : 0) + (chainValidation?.has_setup_authorization ? 0.2 : 0) + (chainValidation?.has_simulation_run ? 0.2 : 0),
      launch_readiness: checkRatio * 0.8,
    };

    const score = calculateSectionScore(ratios);

    return Response.json({
      section_key: 'client_onboarding_flow',
      score,
      checks,
      blockers,
      warnings,
      evidence_summary: `${productionPaidOrders.length} production paid orders. Entity counts: SetupAuth=${setupAuths.length}, WebsiteScan=${websiteScans.length}, Blueprint=${aiBlueprints.length}, Profile=${aiProfiles.length}, Access=${smartAccessRequests.length}, Simulation=${simulationRuns.length}, Orchestration=${onboardingOrchestrations.length}, InstallOS=${installOSRecords.length}. Latest chain state: ${onboardingState}.`,
      entity_counts: entityCounts,
      onboarding_state: onboardingState,
      chain_validation: chainValidation,
    });
  } catch (error) {
    console.error('checkClientOnboardingFlow error:', error);
    return Response.json({
      section_key: 'client_onboarding_flow',
      score: { total: 0, grade: 'F', status: 'Blocked', components: [] },
      checks: [],
      blockers: [{ code: 'CHECK_ERROR', severity: 'critical_blocker', message: error.message, fix_action: 'Review backend function logs.' }],
      warnings: [],
      evidence_summary: `Error: ${error.message}`,
    }, { status: 200 });
  }
});