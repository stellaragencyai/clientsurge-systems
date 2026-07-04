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

// ── HTML extraction helpers ──
function extractText(html, tag) {
  const regex = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, 'is');
  const match = html.match(regex);
  if (!match) return null;
  return match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractMetaDescription(html) {
  const match = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
  return match ? match[1].trim() : null;
}

function extractCTATexts(html) {
  const linkMatches = [...html.matchAll(/<a[^>]*>(.*?)<\/a>/gis)];
  const buttonMatches = [...html.matchAll(/<button[^>]*>(.*?)<\/button>/gis)];
  const texts = [...linkMatches, ...buttonMatches]
    .map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(t => t.length > 2 && t.length < 80);
  return [...new Set(texts)]; // dedupe
}

function extractAllHeadings(html, tag) {
  const regex = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, 'gis');
  const matches = [...html.matchAll(regex)];
  return matches.map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).filter(t => t.length > 0);
}

// ── Content analysis helpers ──
const GENERIC_AI_PHRASES = [
  'ai-powered', 'ai-driven', 'cutting-edge', 'revolutionary', 'next-generation',
  'game-changing', 'state-of-the-art', 'world-class', 'best-in-class',
  'transformative', 'disruptive', 'innovative solution',
];

const UNSUPPORTED_CLAIM_PHRASES = [
  'guaranteed results', '100% increase', 'risk-free', 'guaranteed roi',
  'guaranteed revenue', '100% guaranteed', 'money back guarantee',
  'double your', 'triple your', '10x', '10x roi',
];

const AUDIENCE_KEYWORDS = [
  'businesses with websites', 'service business', 'service businesses',
  'local business', 'local businesses', 'small business', 'smb',
  'med spa', 'dental', 'hvac', 'roofing', 'plumbing', 'chiropractic',
  'contractor', 'real estate', 'property service',
];

const OFFER_KEYWORDS = [
  'lead capture', 'instant response', 'instant lead', 'follow up', 'follow-up',
  'automated follow', 'appointment booking', 'booking automation',
  'missed call', 'text back', 'missed-call', 'reactivation',
  'ai automation', 'automation system',
];

const PROBLEM_KEYWORDS = [
  'missed lead', 'missed call', 'slow follow', 'slow response',
  'manual work', 'no follow-up', 'no follow up', 'losing lead',
  'missed opportunity', 'leak', 'revenue leak',
];

const OUTCOME_KEYWORDS = [
  'captured lead', 'more lead', 'faster response', 'booked appointment',
  'more booking', 'cleaner', 'streamlined', 'automated',
  'never miss', 'capture every',
];

const PREFERRED_HEADLINE_PATTERNS = [
  /turn.*website.*ai.*sales/i,
  /24\/7.*ai/i,
  /capture.*lead.*respond.*follow/i,
  /ai automation.*business/i,
  /cannot afford to miss/i,
];

const PREFERRED_CTA_PATTERNS = [
  /free.*audit/i,
  /see.*package/i,
  /browse.*system/i,
  /get.*audit/i,
  /view.*pricing/i,
  /start/i,
];

function containsAny(text, phrases) {
  const lower = text.toLowerCase();
  return phrases.filter(p => lower.includes(p));
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

    // ── Fetch homepage HTML ──
    let homepageHtml = '';
    let fetchOk = false;
    let fetchError = null;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(APP_URL, {
        signal: controller.signal,
        headers: { 'User-Agent': 'ClientSurge-Audit-Bot/1.0' },
      });
      clearTimeout(timeout);
      if (response.ok) {
        homepageHtml = await response.text();
        fetchOk = homepageHtml.length > 500;
      } else {
        fetchError = `HTTP ${response.status}`;
      }
    } catch (e) {
      fetchError = e.message;
    }

    // ── Extract content ──
    const pageTitle = extractText(homepageHtml, 'title') || '';
    const metaDescription = extractMetaDescription(homepageHtml) || '';
    const h1Text = extractText(homepageHtml, 'h1') || '';
    const h2Texts = extractAllHeadings(homepageHtml, 'h2');
    const ctaTexts = extractCTATexts(homepageHtml);

    // Combine all visible text for keyword analysis
    const allText = [pageTitle, metaDescription, h1Text, ...h2Texts, ...ctaTexts].join(' ').toLowerCase();

    // ── Check: Homepage fetchable ──
    checks.push({
      id: 'homepage_fetchable',
      label: 'Homepage HTML is fetchable and non-empty',
      passed: fetchOk,
      evidence: fetchOk ? `Fetched ${homepageHtml.length} chars from ${APP_URL}.` : `Failed to fetch homepage: ${fetchError}`,
      status: fetchOk ? 'passed' : 'needs_proof',
    });
    if (!fetchOk) {
      blockers.push({
        code: 'HOMEPAGE_NOT_FETCHABLE',
        severity: 'launch_blocker',
        message: `Cannot fetch homepage from ${APP_URL}: ${fetchError}`,
        fix_action: 'Verify the website is deployed and accessible. Check APP_URL environment variable.',
      });
    }

    // ── Check: Primary headline (h1) detected ──
    const hasH1 = h1Text.length > 5;
    const h1IsSpecific = hasH1 && PREFERRED_HEADLINE_PATTERNS.some(p => p.test(h1Text));
    const h1IsGeneric = hasH1 && !h1IsSpecific && containsAny(h1Text, GENERIC_AI_PHRASES).length > 0 && !containsAny(h1Text, OFFER_KEYWORDS).length;
    checks.push({
      id: 'primary_headline_detected',
      label: 'Primary homepage headline (h1) is detected and specific',
      passed: hasH1 && !h1IsGeneric,
      evidence: hasH1 ? `H1: "${h1Text.substring(0, 120)}"` : 'No h1 tag found in homepage HTML.',
      status: hasH1 && !h1IsGeneric ? 'passed' : hasH1 ? 'needs_proof' : 'needs_proof',
    });
    if (hasH1 && h1IsGeneric) {
      warnings.push({
        code: 'GENERIC_HEADLINE',
        severity: 'advisory',
        message: `Homepage headline is generic and does not clearly state what the system does: "${h1Text.substring(0, 80)}"`,
        fix_action: 'Use specific positioning like "Turn Your Website Into a 24/7 AI Sales System" or "AI automation systems for businesses that cannot afford to miss website leads, calls, or follow-ups."',
      });
    }

    // ── Check: Subheadline detected ──
    const subheadline = h2Texts.length > 0 ? h2Texts[0] : metaDescription;
    const hasSubheadline = subheadline && subheadline.length > 10;
    checks.push({
      id: 'subheadline_detected',
      label: 'Primary subheadline is detected',
      passed: !!hasSubheadline,
      evidence: hasSubheadline ? `Subheadline: "${subheadline.substring(0, 120)}"` : 'No subheadline (h2 or meta description) found.',
      status: hasSubheadline ? 'passed' : 'needs_proof',
    });

    // ── Check: Primary CTA detected ──
    const primaryCTAs = ctaTexts.filter(t => PREFERRED_CTA_PATTERNS.some(p => p.test(t)));
    const vagueCTAs = ctaTexts.filter(t => /learn more|click here|read more|submit|get started/i.test(t) && !PREFERRED_CTA_PATTERNS.some(p => p.test(t)));
    const hasSpecificCTA = primaryCTAs.length > 0;
    checks.push({
      id: 'primary_cta_detected',
      label: 'Primary CTA is specific and action-oriented',
      passed: hasSpecificCTA,
      evidence: hasSpecificCTA ? `Specific CTAs found: ${primaryCTAs.slice(0, 3).join(', ')}` : `No specific CTAs found. Detected: ${ctaTexts.slice(0, 5).join(', ') || 'none'}`,
      status: hasSpecificCTA ? 'passed' : 'needs_proof',
    });
    if (!hasSpecificCTA && vagueCTAs.length > 0) {
      warnings.push({
        code: 'VAGUE_CTA',
        severity: 'advisory',
        message: `CTAs are vague (e.g., "Learn More") without a stronger nearby action.`,
        fix_action: 'Use specific CTAs like "Get My Free AI Automation Audit" or "See Automation Packages".',
      });
    }

    // ── Check: Target audience clarity ──
    const audienceMatches = containsAny(allText, AUDIENCE_KEYWORDS);
    const audienceClear = audienceMatches.length > 0;
    checks.push({
      id: 'target_audience_clarity',
      label: 'Target audience is clear (businesses with websites, service businesses, or SMBs)',
      passed: audienceClear,
      evidence: audienceClear ? `Audience keywords found: ${audienceMatches.slice(0, 5).join(', ')}` : 'No target audience keywords found in homepage content.',
      status: audienceClear ? 'passed' : 'needs_proof',
    });
    if (!audienceClear) {
      warnings.push({
        code: 'AUDIENCE_UNCLEAR',
        severity: 'advisory',
        message: 'Homepage does not clearly identify the target audience.',
        fix_action: 'Add language specifying "businesses with websites" or "service businesses" in the hero section.',
      });
    }

    // ── Check: Offer clarity ──
    const offerMatches = containsAny(allText, OFFER_KEYWORDS);
    const offerClear = offerMatches.length >= 2;
    checks.push({
      id: 'offer_clarity',
      label: 'Offer clearly connects to lead capture, instant response, follow-up, booking, and automation',
      passed: offerClear,
      evidence: offerClear ? `Offer keywords found: ${offerMatches.slice(0, 6).join(', ')}` : `Only ${offerMatches.length} offer keyword(s) found: ${offerMatches.join(', ') || 'none'}`,
      status: offerClear ? 'passed' : 'needs_proof',
    });

    // ── Check: Problem clarity ──
    const problemMatches = containsAny(allText, PROBLEM_KEYWORDS);
    const problemClear = problemMatches.length > 0;
    checks.push({
      id: 'problem_clarity',
      label: 'Problem is clear (missed leads, slow follow-up, manual work, missed calls, no follow-up system)',
      passed: problemClear,
      evidence: problemClear ? `Problem keywords found: ${problemMatches.slice(0, 4).join(', ')}` : 'No problem-related keywords found.',
      status: problemClear ? 'passed' : 'needs_proof',
    });

    // ── Check: Outcome clarity ──
    const outcomeMatches = containsAny(allText, OUTCOME_KEYWORDS);
    const outcomeClear = outcomeMatches.length > 0;
    checks.push({
      id: 'outcome_clarity',
      label: 'Outcome is clear (captured leads, faster response, booked appointments, cleaner operations)',
      passed: outcomeClear,
      evidence: outcomeClear ? `Outcome keywords found: ${outcomeMatches.slice(0, 4).join(', ')}` : 'No outcome-related keywords found.',
      status: outcomeClear ? 'passed' : 'needs_proof',
    });

    // ── Check: Unsupported claims ──
    const unsupportedClaims = containsAny(allText, UNSUPPORTED_CLAIM_PHRASES);
    const noUnsupportedClaims = unsupportedClaims.length === 0;
    checks.push({
      id: 'no_unsupported_claims',
      label: 'No unsupported claims detected (guaranteed results, 100% increase, risk-free)',
      passed: noUnsupportedClaims,
      evidence: noUnsupportedClaims ? 'No unsupported claim phrases detected.' : `Unsupported claims found: ${unsupportedClaims.join(', ')}`,
      status: noUnsupportedClaims ? 'passed' : 'needs_proof',
    });
    if (!noUnsupportedClaims) {
      warnings.push({
        code: 'UNSUPPORTED_CLAIMS',
        severity: 'advisory',
        message: `Homepage contains unsupported claim language: ${unsupportedClaims.join(', ')}`,
        fix_action: 'Remove unsupported claims or add supporting proof (testimonials, case studies, data).',
      });
    }

    // ── Check: Generic AI wording ──
    const genericPhrases = containsAny(allText, GENERIC_AI_PHRASES);
    const noGenericAI = genericPhrases.length === 0 || offerMatches.length >= 2;
    checks.push({
      id: 'no_generic_ai_wording',
      label: 'No generic AI wording without specifics',
      passed: noGenericAI,
      evidence: noGenericAI ? 'No generic AI buzzwords detected, or they are accompanied by specific offer language.' : `Generic AI phrases found without specific offer language: ${genericPhrases.join(', ')}`,
      status: noGenericAI ? 'passed' : 'needs_proof',
    });
    if (!noGenericAI) {
      warnings.push({
        code: 'GENERIC_AI_WORDING',
        severity: 'advisory',
        message: `Homepage uses generic AI buzzwords without explaining what the system does: ${genericPhrases.join(', ')}`,
        fix_action: 'Replace generic AI wording with specific descriptions of what the system does (lead capture, instant response, automated follow-up, booking).',
      });
    }

    // ── Check: Proof/trust language ──
    let trustEvents = [];
    try {
      trustEvents = await base44.asServiceRole.entities.ConversionTrackingEvent.filter({
        page_key: 'homepage',
        event_type: 'cta_click',
      }, '-timestamp', 1);
    } catch { /* ignore */ }
    const hasTrustProof = Array.isArray(trustEvents) && trustEvents.length > 0;
    checks.push({
      id: 'proof_trust_language',
      label: 'Proof/trust language has supporting evidence (tracked engagement)',
      passed: hasTrustProof,
      evidence: hasTrustProof ? `${trustEvents.length} homepage CTA click events prove real engagement.` : 'No homepage engagement events found — cannot verify trust claims with data.',
      status: hasTrustProof ? 'passed' : 'needs_proof',
    });

    // ── Calculate ratios ──
    const passedCount = checks.filter(c => c.status === 'passed').length;
    const totalChecks = checks.length;
    const checkRatio = passedCount / totalChecks;

    const ratios = {
      strategic_clarity: (hasH1 && !h1IsGeneric ? 0.5 : 0.1) + (audienceClear ? 0.25 : 0) + (offerClear ? 0.25 : 0),
      user_journey: (hasSpecificCTA ? 0.4 : 0.1) + (problemClear ? 0.3 : 0.1) + (outcomeClear ? 0.3 : 0.1),
      data_integrity: fetchOk ? 0.6 + (hasH1 ? 0.2 : 0) + (hasSubheadline ? 0.2 : 0) : 0.1,
      integration_reliability: (offerClear ? 0.4 : 0.1) + (audienceClear ? 0.3 : 0.1) + (noGenericAI ? 0.3 : 0.1),
      proof_level: (hasTrustProof ? 0.4 : 0.05) + (noUnsupportedClaims ? 0.3 : 0) + (hasSpecificCTA ? 0.15 : 0) + (offerClear ? 0.15 : 0),
      launch_readiness: checkRatio * 0.85,
    };

    const score = calculateSectionScore(ratios);

    return Response.json({
      section_key: 'brand_positioning',
      score,
      checks,
      blockers,
      warnings,
      evidence_summary: `Homepage ${fetchOk ? 'fetched' : 'not fetchable'}. H1: ${hasH1 ? 'detected' : 'missing'}. CTA: ${hasSpecificCTA ? 'specific' : 'vague/missing'}. Audience: ${audienceClear ? 'clear' : 'unclear'}. Offer: ${offerClear ? 'clear' : 'unclear'}. ${warnings.length} warning(s), ${blockers.length} blocker(s).`,
      detected_content: {
        page_title: pageTitle.substring(0, 200),
        meta_description: metaDescription.substring(0, 300),
        h1: h1Text.substring(0, 300),
        h2s: h2Texts.slice(0, 5).map(t => t.substring(0, 150)),
        ctas: ctaTexts.slice(0, 10),
        primary_ctas: primaryCTAs.slice(0, 5),
        vague_ctas: vagueCTAs.slice(0, 5),
      },
      analysis: {
        target_audience_clarity: audienceClear,
        audience_keywords_found: audienceMatches,
        offer_clarity: offerClear,
        offer_keywords_found: offerMatches,
        problem_clarity: problemClear,
        problem_keywords_found: problemMatches,
        outcome_clarity: outcomeClear,
        outcome_keywords_found: outcomeMatches,
        unsupported_claims: unsupportedClaims,
        generic_ai_phrases: genericPhrases,
        trust_proof_exists: hasTrustProof,
      },
      preferred_positioning: {
        headlines: [
          'Turn Your Website Into a 24/7 AI Sales System',
          'AI automation systems for businesses that cannot afford to miss website leads, calls, or follow-ups.',
        ],
        subheadlines: [
          'Capture more leads, respond instantly, and follow up automatically.',
        ],
        ctas: [
          'Get My Free AI Automation Audit',
          'See Automation Packages',
        ],
      },
    });
  } catch (error) {
    console.error('checkBrandPositioning error:', error);
    return Response.json({
      section_key: 'brand_positioning',
      score: { total: 0, grade: 'F', status: 'Blocked', components: [] },
      checks: [],
      blockers: [{ code: 'CHECK_ERROR', severity: 'critical_blocker', message: error.message, fix_action: 'Review backend function logs.' }],
      warnings: [],
      evidence_summary: `Error: ${error.message}`,
    }, { status: 200 });
  }
});