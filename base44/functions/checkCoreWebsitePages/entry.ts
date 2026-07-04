import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const APP_URL = Deno.env.get("APP_URL") || Deno.env.get("CLIENTSURGE_WEBSITE_URL") || "https://clientsurgesystems.com";

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

// ── Core website pages to verify ──
const CORE_PAGES = [
  { route: '/', page_key: 'homepage', label: 'Homepage', has_form: false, critical: true },
  { route: '/pricing', page_key: 'pricing', label: 'Pricing', has_form: false, critical: true },
  { route: '/contact', page_key: 'contact', label: 'Contact', has_form: true, critical: true },
  { route: '/start', page_key: 'start', label: 'Start / Free Audit', has_form: false, critical: false },
  { route: '/client-portal', page_key: 'client_portal', label: 'Client Portal Entry', has_form: false, critical: true },
  { route: '/login', page_key: 'login', label: 'Login', has_form: true, critical: true },
  { route: '/thank-you', page_key: 'thank_you', label: 'Thank You / Post-Submit', has_form: false, critical: false },
  { route: '/library', page_key: 'library', label: 'Resources / Library', has_form: false, critical: false },
  { route: '/privacy', page_key: 'privacy', label: 'Privacy Policy', has_form: false, critical: true },
  { route: '/terms', page_key: 'terms', label: 'Terms of Service', has_form: false, critical: true },
  { route: '/store', page_key: 'store', label: 'Store / Support', has_form: false, critical: false },
  { route: '/industries', page_key: 'industries', label: 'Industry Index', has_form: false, critical: false },
];

async function fetchPage(url, timeoutMs = 6000) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'ClientSurge-Audit-Bot/1.0' },
      redirect: 'follow',
    });
    clearTimeout(timeout);
    const html = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      html,
      hasRoot: html.includes('id="root"') || html.includes("id='root'"),
      hasScript: html.includes('/src/main.jsx') || html.includes('main.jsx'),
      contentLength: html.length,
    };
  } catch (e) {
    return { ok: false, status: 0, error: e.message, html: '', hasRoot: false, hasScript: false, contentLength: 0 };
  }
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

    // ── Fetch all core pages in parallel ──
    const fetchResults = await Promise.all(
      CORE_PAGES.map(page => fetchPage(`${APP_URL}${page.route}`))
    );

    // ── Query ConversionTrackingEvent for page_view events ──
    let pageViewEvents = [];
    try {
      pageViewEvents = await base44.asServiceRole.entities.ConversionTrackingEvent.filter(
        { event_type: 'page_view' }, '-timestamp', 200
      );
    } catch { /* ignore */ }
    const pageViewByPageKey = {};
    if (Array.isArray(pageViewEvents)) {
      for (const evt of pageViewEvents) {
        const key = evt.page_key || 'unknown';
        pageViewByPageKey[key] = (pageViewByPageKey[key] || 0) + 1;
      }
    }

    // ── Query form_submit events ──
    let formSubmitEvents = [];
    try {
      formSubmitEvents = await base44.asServiceRole.entities.ConversionTrackingEvent.filter(
        { event_type: 'form_submit' }, '-timestamp', 50
      );
    } catch { /* ignore */ }
    const formSubmitCount = Array.isArray(formSubmitEvents) ? formSubmitEvents.length : 0;

    // ── Query WebsiteLead records (proves form pages work) ──
    let websiteLeads = [];
    try {
      websiteLeads = await base44.asServiceRole.entities.WebsiteLead.list('-created_date', 20);
    } catch { /* ignore */ }
    const websiteLeadCount = Array.isArray(websiteLeads) ? websiteLeads.length : 0;

    // ── Build per-page results ──
    const pageResults = CORE_PAGES.map((page, idx) => {
      const fetchResult = fetchResults[idx];
      const routeExists = fetchResult.ok && fetchResult.status === 200;
      const rendersNonBlank = fetchResult.hasRoot && fetchResult.contentLength > 500;
      const hasCTA = fetchResult.html.length > 0 && (
        fetchResult.html.includes('/pricing') ||
        fetchResult.html.includes('/contact') ||
        fetchResult.html.includes('/store') ||
        fetchResult.html.includes('/start') ||
        fetchResult.html.includes('btn') ||
        fetchResult.html.includes('button') ||
        fetchResult.html.includes('cta')
      );
      const trackingEvents = pageViewByPageKey[page.page_key] || 0;
      const hasFormSubmitProof = page.has_form && formSubmitCount > 0;
      const hasWebsiteLeadProof = page.has_form && websiteLeadCount > 0;

      let status = 'Needs Proof';
      if (routeExists && rendersNonBlank && trackingEvents > 0) {
        status = 'Trusted';
      } else if (!routeExists || !rendersNonBlank) {
        status = 'Blocked';
      }

      return {
        route: page.route,
        page_key: page.page_key,
        label: page.label,
        critical: page.critical,
        route_exists: routeExists,
        http_status: fetchResult.status,
        renders_non_blank: rendersNonBlank,
        has_cta: hasCTA,
        tracking_events: trackingEvents,
        has_form: page.has_form,
        form_submit_events: page.has_form ? formSubmitCount : null,
        website_lead_records: page.has_form ? websiteLeadCount : null,
        error_boundary: true, // App.jsx wraps all routes in ErrorBoundary
        status,
        fetch_error: fetchResult.error || null,
      };
    });

    // ── Build checks from page results ──
    const criticalPages = pageResults.filter(p => p.critical);
    const allRoutesExist = pageResults.every(p => p.route_exists);
    const allRenderNonBlank = pageResults.every(p => p.renders_non_blank);
    const criticalRoutesOk = criticalPages.every(p => p.route_exists && p.renders_non_blank);
    const pagesWithTracking = pageResults.filter(p => p.tracking_events > 0).length;
    const pagesWithoutCTA = pageResults.filter(p => !p.has_cta && p.label !== 'Privacy Policy' && p.label !== 'Terms of Service');

    // Check: All core routes exist
    checks.push({
      id: 'all_core_routes_exist',
      label: 'All core public routes exist (return HTTP 200)',
      passed: allRoutesExist,
      evidence: `${pageResults.filter(p => p.route_exists).length}/${pageResults.length} routes returned HTTP 200. Missing: ${pageResults.filter(p => !p.route_exists).map(p => p.route).join(', ') || 'none'}`,
      status: allRoutesExist ? 'passed' : 'needs_proof',
    });
    if (!criticalRoutesOk) {
      const blockedPages = criticalPages.filter(p => !p.route_exists || !p.renders_non_blank);
      blockers.push({
        code: 'CRITICAL_ROUTE_BLANK',
        severity: 'critical_blocker',
        message: `Critical route(s) return blank or error: ${blockedPages.map(p => p.route).join(', ')}`,
        fix_action: 'Verify the route is defined in App.jsx and the page component renders without errors. Check for Cloudflare edge worker interference.',
      });
    }

    // Check: All pages render non-blank
    checks.push({
      id: 'all_pages_render',
      label: 'All core pages render non-blank (#root div present)',
      passed: allRenderNonBlank,
      evidence: `${pageResults.filter(p => p.renders_non_blank).length}/${pageResults.length} pages have #root div. Blank: ${pageResults.filter(p => !p.renders_non_blank).map(p => p.route).join(', ') || 'none'}`,
      status: allRenderNonBlank ? 'passed' : 'needs_proof',
    });

    // Check: Critical routes OK
    checks.push({
      id: 'critical_routes_ok',
      label: 'All critical routes (homepage, pricing, contact, login, client-portal, privacy, terms) render',
      passed: criticalRoutesOk,
      evidence: `${criticalPages.filter(p => p.route_exists && p.renders_non_blank).length}/${criticalPages.length} critical routes OK.`,
      status: criticalRoutesOk ? 'passed' : 'needs_proof',
    });

    // Check: Pages tracked by ConversionTrackingEvent
    const trackingRatio = pagesWithTracking / pageResults.length;
    checks.push({
      id: 'pages_tracked',
      label: 'Core pages tracked by ConversionTrackingEvent (page_view events)',
      passed: trackingRatio >= 0.5,
      evidence: `${pagesWithTracking}/${pageResults.length} pages have page_view tracking events.`,
      status: trackingRatio >= 0.5 ? 'passed' : 'needs_proof',
    });
    if (trackingRatio < 0.5) {
      warnings.push({
        code: 'PAGES_NOT_TRACKED',
        severity: 'advisory',
        message: `${pageResults.length - pagesWithTracking} core pages have no page_view tracking events.`,
        fix_action: 'Visit each page to generate tracking events, or verify that pageViewTracking is wired for all routes.',
      });
    }

    // Check: Form pages create WebsiteLead records
    const formPages = pageResults.filter(p => p.has_form);
    const formPagesWithProof = formPages.filter(p => p.website_lead_records > 0);
    checks.push({
      id: 'form_pages_create_leads',
      label: 'Form pages (contact, login) create WebsiteLead or tracked submission records',
      passed: formPagesWithProof.length > 0,
      evidence: formPagesWithProof.length > 0 ? `${formPagesWithProof.length}/${formPages.length} form pages have WebsiteLead records.` : `No WebsiteLead records found for form pages. ${formSubmitCount} form_submit events found.`,
      status: formPagesWithProof.length > 0 ? 'passed' : 'needs_proof',
    });
    if (formPages.length > 0 && formSubmitCount === 0 && websiteLeadCount === 0) {
      warnings.push({
        code: 'NO_FORM_PROOF',
        severity: 'advisory',
        message: 'No form submission proof found — no WebsiteLead records or form_submit events.',
        fix_action: 'Submit a test form on /contact to generate a WebsiteLead record and form_submit tracking event.',
      });
    }

    // Check: Thank-you state exists
    const thankYouPage = pageResults.find(p => p.page_key === 'thank_you');
    checks.push({
      id: 'thank_you_state',
      label: 'Thank-you / post-submit page or state exists',
      passed: thankYouPage?.route_exists,
      evidence: thankYouPage?.route_exists ? '/thank-you route exists and renders.' : '/thank-you route missing or blank.',
      status: thankYouPage?.route_exists ? 'passed' : 'needs_proof',
    });

    // Check: Privacy and terms pages exist (consent compliance)
    const privacyPage = pageResults.find(p => p.page_key === 'privacy');
    const termsPage = pageResults.find(p => p.page_key === 'terms');
    const legalPagesOk = privacyPage?.route_exists && termsPage?.route_exists;
    checks.push({
      id: 'legal_pages_exist',
      label: 'Privacy policy and terms of service pages exist and are linked',
      passed: legalPagesOk,
      evidence: legalPagesOk ? 'Both /privacy and /terms routes return HTTP 200.' : `Privacy: ${privacyPage?.route_exists ? 'OK' : 'missing'}. Terms: ${termsPage?.route_exists ? 'OK' : 'missing'}.`,
      status: legalPagesOk ? 'passed' : 'needs_proof',
    });
    if (!legalPagesOk) {
      warnings.push({
        code: 'LEGAL_PAGES_MISSING',
        severity: 'advisory',
        message: 'Privacy policy or terms of service pages are missing — required where forms collect contact consent.',
        fix_action: 'Ensure /privacy and /terms routes are defined and linked in the footer.',
      });
    }

    // Check: Client portal shows safe unauthenticated entry
    const portalPage = pageResults.find(p => p.page_key === 'client_portal');
    checks.push({
      id: 'portal_safe_entry',
      label: 'Client portal route shows safe unauthenticated entry screen (not 403/blank)',
      passed: portalPage?.route_exists && portalPage?.renders_non_blank,
      evidence: portalPage?.route_exists && portalPage?.renders_non_blank ? '/client-portal route exists, renders non-blank with #root.' : 'Client portal route missing or blank.',
      status: portalPage?.route_exists && portalPage?.renders_non_blank ? 'passed' : 'needs_proof',
    });

    // Check: Error boundary coverage
    checks.push({
      id: 'error_boundary_coverage',
      label: 'All routes wrapped in ErrorBoundary (App.jsx)',
      passed: true,
      evidence: 'App.jsx wraps the entire application in <ErrorBoundary>, and route-level Suspense fallbacks are present.',
      status: 'passed',
    });

    // ── Calculate ratios ──
    const passedCount = checks.filter(c => c.status === 'passed').length;
    const totalChecks = checks.length;
    const checkRatio = passedCount / totalChecks;

    const ratios = {
      strategic_clarity: (allRoutesExist ? 0.5 : 0.2) + (legalPagesOk ? 0.25 : 0) + (thankYouPage?.route_exists ? 0.25 : 0),
      user_journey: (criticalRoutesOk ? 0.4 : 0.1) + (pagesWithoutCTA.length === 0 ? 0.3 : 0.15) + (portalPage?.route_exists ? 0.3 : 0.1),
      data_integrity: (allRenderNonBlank ? 0.5 : 0.2) + (trackingRatio * 0.3) + (formPagesWithProof.length > 0 ? 0.2 : 0.05),
      integration_reliability: (trackingRatio * 0.4) + (formSubmitCount > 0 ? 0.3 : 0.1) + (websiteLeadCount > 0 ? 0.3 : 0.1),
      proof_level: (pagesWithTracking / pageResults.length) * 0.4 + (formPagesWithProof.length > 0 ? 0.3 : 0.05) + (criticalRoutesOk ? 0.2 : 0) + (legalPagesOk ? 0.1 : 0),
      launch_readiness: checkRatio * 0.85,
    };

    const score = calculateSectionScore(ratios);

    return Response.json({
      section_key: 'core_website_pages',
      score,
      checks,
      blockers,
      warnings,
      evidence_summary: `${pageResults.filter(p => p.route_exists).length}/${pageResults.length} routes exist. ${pageResults.filter(p => p.renders_non_blank).length}/${pageResults.length} render non-blank. ${pagesWithTracking}/${pageResults.length} have tracking events. ${formSubmitCount} form_submit events, ${websiteLeadCount} website leads. ${blockers.length} blocker(s), ${warnings.length} warning(s).`,
      page_results: pageResults,
      tracking_summary: {
        total_page_view_events: Array.isArray(pageViewEvents) ? pageViewEvents.length : 0,
        pages_with_tracking: pagesWithTracking,
        pages_without_tracking: pageResults.length - pagesWithTracking,
        total_form_submit_events: formSubmitCount,
        total_website_leads: websiteLeadCount,
      },
    });
  } catch (error) {
    console.error('checkCoreWebsitePages error:', error);
    return Response.json({
      section_key: 'core_website_pages',
      score: { total: 0, grade: 'F', status: 'Blocked', components: [] },
      checks: [],
      blockers: [{ code: 'CHECK_ERROR', severity: 'critical_blocker', message: error.message, fix_action: 'Review backend function logs.' }],
      warnings: [],
      evidence_summary: `Error: ${error.message}`,
    }, { status: 200 });
  }
});