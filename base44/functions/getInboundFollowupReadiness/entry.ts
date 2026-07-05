/**
 * getInboundFollowupReadiness — admin-only read-only readiness dashboard data.
 *
 * Returns:
 * - WebsiteLead counts (total, production vs internal/test, missing fields)
 * - AutomationJob failed/stale counts
 * - DeadLetterLog pending count
 * - EventQueue failed/dead_letter/stuck counts
 * - RateLimitConfig count
 * - IdempotencyKey count
 * - LeadNextBestAction count
 * - Latest PostPatchVerificationResult
 * - Latest InboundFollowupProofResult (simulation)
 * - Overall readiness score (0-100) and label
 * - Remediation recommendations list
 *
 * Does NOT send messages. Does NOT modify records.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.34';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

const INTERNAL_EMAIL_PATTERNS = /clientsurge-install\.internal|clientsurge\.test|test\+|test-|^test\b|smoke|\bqa\b|example\.com|internal/i;
const OWNER_PATTERNS = /nolanf|nolan\./i;
const INTERNAL_SOURCE_VALUES = new Set([
  'install_test', 'admin_test_lead', 'crm_live_smoke_test',
  'post_patch_verification_internal_test', 'internal', 'qa', 'smoke',
]);
const INTERNAL_BUSINESS_PATTERNS = /smoke\s*qa|ui\s*function\s*smoke|internal\s*test|admin\s*test/i;
const TEST_PHONE_PATTERNS = /555/;

function classifyLeadInternal(lead) {
  if (!lead) return false;
  const email = String(lead.email || '').toLowerCase();
  const source = String(lead.source || lead.current_lead_source || '').toLowerCase();
  const businessName = String(lead.business_name || '').toLowerCase();
  const fullName = String(lead.full_name || '').toLowerCase();
  const phone = String(lead.phone_number || '');

  if (INTERNAL_EMAIL_PATTERNS.test(email)) return true;
  if (OWNER_PATTERNS.test(email) || OWNER_PATTERNS.test(businessName)) return true;
  if (INTERNAL_SOURCE_VALUES.has(source)) return true;
  if (INTERNAL_BUSINESS_PATTERNS.test(businessName)) return true;
  if (TEST_PHONE_PATTERNS.test(phone)) return true;
  if (/^test\b|^smoke\b|^qa\b|^admin\s*test/i.test(fullName)) return true;
  return false;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return json({ error: 'Admin access required' }, 403);
    }

    // ── WebsiteLead audit ──
    const websiteLeads = await base44.asServiceRole.entities.WebsiteLead.list('-created_date', 500).catch(() => []);
    const totalWebsiteLeads = websiteLeads?.length || 0;

    let productionLeads = 0;
    let internalTestLeads = 0;
    let missingClientId = 0;
    let missingClientProjectId = 0;
    let missingDedupKey = 0;
    let missingCrmLeadId = 0;
    let missingUtm = 0;
    let missingConsent = 0;
    let noEmailNoPhone = 0;
    let cadencePaused = 0;
    let archived = 0;
    let automationDisabled = 0;
    let waitingInitialResponse = 0;

    const examples = {
      missing_client_id: [],
      missing_dedup_key: [],
      missing_crm_lead_id: [],
      missing_consent: [],
      missing_utm: [],
      no_email_no_phone: [],
      cadence_paused: [],
      automation_disabled: [],
      waiting_initial_response: [],
    };

    for (const lead of websiteLeads || []) {
      const isInternal = classifyLeadInternal(lead);
      if (isInternal) internalTestLeads++;
      else productionLeads++;

      if (!lead.client_id) { missingClientId++; if (examples.missing_client_id.length < 3) examples.missing_client_id.push({ id: lead.id, email: lead.email, business_name: lead.business_name }); }
      if (!lead.client_project_id) missingClientProjectId++;
      if (!lead.dedup_key) { missingDedupKey++; if (examples.missing_dedup_key.length < 3) examples.missing_dedup_key.push({ id: lead.id, email: lead.email }); }
      if (!lead.crm_lead_id) { missingCrmLeadId++; if (examples.missing_crm_lead_id.length < 3) examples.missing_crm_lead_id.push({ id: lead.id, email: lead.email }); }
      if (!lead.utm_source && !lead.utm_medium && !lead.source && !lead.current_lead_source) { missingUtm++; if (examples.missing_utm.length < 3) examples.missing_utm.push({ id: lead.id }); }
      if (lead.consent_given === undefined || lead.consent_given === null) { missingConsent++; if (examples.missing_consent.length < 3) examples.missing_consent.push({ id: lead.id, email: lead.email }); }
      if (!lead.email && !lead.phone_number) { noEmailNoPhone++; if (examples.no_email_no_phone.length < 3) examples.no_email_no_phone.push({ id: lead.id }); }
      if (lead.cadence_paused === true) { cadencePaused++; if (examples.cadence_paused.length < 3) examples.cadence_paused.push({ id: lead.id }); }
      if (lead.archived === true) archived++;
      if (lead.automation_enabled === false) { automationDisabled++; if (examples.automation_disabled.length < 3) examples.automation_disabled.push({ id: lead.id }); }
      if (!isInternal && lead.lead_status === 'new' && !lead.initial_response_sent_at) { waitingInitialResponse++; if (examples.waiting_initial_response.length < 3) examples.waiting_initial_response.push({ id: lead.id, email: lead.email, phone: lead.phone_number }); }
    }

    // ── AutomationJob health ──
    const failedJobs = await base44.asServiceRole.entities.AutomationJob.filter({ status: 'failed' }, '-created_date', 100).catch(() => []);
    const failedJobCount = failedJobs?.length || 0;

    const processingJobs = await base44.asServiceRole.entities.AutomationJob.filter({ status: 'processing' }, '-created_date', 100).catch(() => []);
    const staleJobCount = (processingJobs || []).filter(j => {
      if (!j.created_date) return false;
      return (Date.now() - new Date(j.created_date).getTime()) / 3600000 > 1;
    }).length;

    // ── DeadLetterLog ──
    const deadLetters = await base44.asServiceRole.entities.DeadLetterLog.filter({ status: 'pending_review' }, '-created_date', 100).catch(() => []);
    const deadLetterCount = deadLetters?.length || 0;

    // ── EventQueue ──
    const eqFailed = await base44.asServiceRole.entities.EventQueue.filter({ status: 'failed' }, '-created_date', 100).catch(() => []);
    const eqDeadLetter = await base44.asServiceRole.entities.EventQueue.filter({ status: 'dead_letter' }, '-created_date', 100).catch(() => []);
    const eqProcessing = await base44.asServiceRole.entities.EventQueue.filter({ status: 'processing' }, '-created_date', 100).catch(() => []);
    const eqStuckCount = (eqProcessing || []).filter(e => {
      if (!e.created_date) return false;
      return (Date.now() - new Date(e.created_date).getTime()) / 3600000 > 1;
    }).length;

    // ── Infrastructure counts ──
    const rateLimitConfigs = await base44.asServiceRole.entities.RateLimitConfig.list('-created_date', 50).catch(() => []);
    const rateLimitCount = rateLimitConfigs?.length || 0;

    const idempotencyKeys = await base44.asServiceRole.entities.IdempotencyKey.list('-created_date', 50).catch(() => []);
    const idempotencyKeyCount = idempotencyKeys?.length || 0;

    const nextBestActions = await base44.asServiceRole.entities.LeadNextBestAction.list('-created_date', 50).catch(() => []);
    const nextBestActionCount = nextBestActions?.length || 0;

    // ── Latest proof results ──
    const postPatchResults = await base44.asServiceRole.entities.PostPatchVerificationResult.list('-created_date', 5).catch(() => []);
    const latestPostPatch = postPatchResults?.[0] || null;

    const proofResults = await base44.asServiceRole.entities.InboundFollowupProofResult.list('-created_date', 5).catch(() => []);
    const latestProofResult = proofResults?.[0] || null;

    // ── Blockers & readiness ──
    const blockers = [];
    const remediation = [];

    if (rateLimitCount === 0) { blockers.push('No RateLimitConfig records'); remediation.push('Create default RateLimitConfig records before enabling outbound communication'); }
    if (idempotencyKeyCount === 0) { blockers.push('No IdempotencyKey records'); remediation.push('Enable IdempotencyKey usage before outbound communication'); }
    if (failedJobCount > 0) { blockers.push(`${failedJobCount} failed AutomationJobs`); remediation.push('Repair failed AutomationJob records'); }
    if (staleJobCount > 0) { blockers.push(`${staleJobCount} stale AutomationJobs`); remediation.push('Repair stale AutomationJob records stuck in processing'); }
    if (deadLetterCount > 0) { blockers.push(`${deadLetterCount} DeadLetterLog pending review`); remediation.push('Review pending DeadLetterLog records'); }
    if ((eqFailed?.length || 0) > 0) { blockers.push(`${eqFailed.length} EventQueue failed`); remediation.push('Resolve failed EventQueue records'); }
    if ((eqDeadLetter?.length || 0) > 0) { blockers.push(`${eqDeadLetter.length} EventQueue dead_letter`); remediation.push('Resolve dead-letter EventQueue records'); }
    if (eqStuckCount > 0) { blockers.push(`${eqStuckCount} EventQueue stuck`); remediation.push('Unstick processing EventQueue records'); }
    if (missingDedupKey > 0) { blockers.push(`${missingDedupKey} leads missing dedup_key`); remediation.push('Backfill WebsiteLead.dedup_key'); }
    if (missingClientId > 0) { blockers.push(`${missingClientId} leads missing client_id`); remediation.push('Resolve client_id/client_project_id routing'); }
    if (missingClientProjectId > 0) { blockers.push(`${missingClientProjectId} leads missing client_project_id`); remediation.push('Resolve client_id/client_project_id routing'); }

    if (missingCrmLeadId > 0) remediation.push('Backfill WebsiteLead.crm_lead_id');
    if (nextBestActionCount === 0) remediation.push('Generate LeadNextBestAction records');
    remediation.push('Run live-safe provider proof after simulation passes');

    // ── Readiness score ──
    const checks = [
      { passed: rateLimitCount > 0 },
      { passed: idempotencyKeyCount > 0 },
      { passed: failedJobCount === 0 },
      { passed: staleJobCount === 0 },
      { passed: deadLetterCount === 0 },
      { passed: (eqFailed?.length || 0) === 0 },
      { passed: (eqDeadLetter?.length || 0) === 0 },
      { passed: eqStuckCount === 0 },
      { passed: missingDedupKey === 0 },
      { passed: missingClientId === 0 },
      { passed: !!latestProofResult && latestProofResult.overall_status === 'pass' },
      { passed: !!latestPostPatch },
    ];
    const passedCount = checks.filter(c => c.passed).length;
    const readinessScore = Math.round((passedCount / checks.length) * 100);

    let readinessLabel = 'BLOCKED';
    if (blockers.length === 0 && latestProofResult?.overall_status === 'pass' && latestPostPatch) {
      readinessLabel = 'PROOF_PASSED';
    } else if (blockers.length === 0 && latestProofResult?.overall_status === 'pass') {
      readinessLabel = 'READY_FOR_LIVE_PROOF';
    } else if (blockers.length === 0 || (latestProofResult && latestProofResult.overall_status !== 'fail')) {
      readinessLabel = 'PARTIAL';
    }

    return json({
      success: true,
      fetched_at: new Date().toISOString(),
      website_leads: {
        total: totalWebsiteLeads,
        production: productionLeads,
        internal_test: internalTestLeads,
        missing_client_id: missingClientId,
        missing_client_project_id: missingClientProjectId,
        missing_dedup_key: missingDedupKey,
        missing_crm_lead_id: missingCrmLeadId,
        missing_utm: missingUtm,
        missing_consent: missingConsent,
        no_email_no_phone: noEmailNoPhone,
        cadence_paused: cadencePaused,
        archived,
        automation_disabled: automationDisabled,
        waiting_initial_response: waitingInitialResponse,
        examples,
      },
      automation_jobs: {
        failed: failedJobCount,
        stale: staleJobCount,
      },
      dead_letters: {
        pending_review: deadLetterCount,
      },
      event_queue: {
        failed: eqFailed?.length || 0,
        dead_letter: eqDeadLetter?.length || 0,
        stuck: eqStuckCount,
      },
      infrastructure: {
        rate_limit_configs: rateLimitCount,
        idempotency_keys: idempotencyKeyCount,
        lead_next_best_actions: nextBestActionCount,
        latest_post_patch_verification: latestPostPatch ? {
          id: latestPostPatch.id,
          created_date: latestPostPatch.created_date,
        } : null,
      },
      latest_proof_result: latestProofResult ? {
        id: latestProofResult.id,
        run_at: latestProofResult.run_at,
        overall_status: latestProofResult.overall_status,
        safe_to_enable_live_sends: latestProofResult.safe_to_enable_live_sends,
        cases_passed: latestProofResult.cases_passed,
        cases_failed: latestProofResult.cases_failed,
        total_cases: latestProofResult.total_cases,
        blockers: latestProofResult.blockers,
        warnings: latestProofResult.warnings,
      } : null,
      readiness_score: readinessScore,
      readiness_label: readinessLabel,
      blockers,
      remediation,
    });
  } catch (error) {
    console.error('[getInboundFollowupReadiness] Error:', error.message);
    return json({ error: error.message }, 500);
  }
});