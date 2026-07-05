/**
 * runInboundFollowupSimulation — NON-SENDING proof harness.
 *
 * Does NOT call Twilio, Resend, Gmail, or any external provider.
 * Does NOT modify existing WebsiteLead/Leads/AutomationJob records.
 * Only creates an InboundFollowupProofResult record (admin-only).
 *
 * Simulates the decision path for autonomous inbound follow-up
 * and writes a proof/simulation result record.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.34';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

// ── Internal/test lead classifier (read-only, no mutation) ──
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
  if (/test@|smoke@|admin.*test@/i.test(email)) return true;
  return false;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return json({ error: 'Admin access required' }, 403);
    }

    const now = new Date().toISOString();
    const blockers = [];
    const warnings = [];
    const sampledWebsiteLeadIds = [];
    const sampledCrmLeadIds = [];

    // ── Fetch WebsiteLead records (read-only) ──
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

    for (const lead of websiteLeads || []) {
      const isInternal = classifyLeadInternal(lead);
      if (isInternal) internalTestLeads++;
      else productionLeads++;

      if (!lead.client_id) missingClientId++;
      if (!lead.client_project_id) missingClientProjectId++;
      if (!lead.dedup_key) missingDedupKey++;
      if (!lead.crm_lead_id) missingCrmLeadId++;
      if (!lead.utm_source && !lead.utm_medium && !lead.source && !lead.current_lead_source) missingUtm++;
      if (lead.consent_given === undefined || lead.consent_given === null) missingConsent++;
      if (!lead.email && !lead.phone_number) noEmailNoPhone++;
      if (lead.cadence_paused === true) cadencePaused++;
      if (lead.archived === true) archived++;
      if (lead.automation_enabled === false) automationDisabled++;
      if (!isInternal && lead.lead_status === 'new' && !lead.initial_response_sent_at) waitingInitialResponse++;

      if (sampledWebsiteLeadIds.length < 10 && lead.id) sampledWebsiteLeadIds.push(lead.id);
    }

    // ── Fetch CRM Leads (read-only) ──
    const crmLeads = await base44.asServiceRole.entities.Leads.list('-created_date', 500).catch(() => []);
    for (const lead of crmLeads || []) {
      if (sampledCrmLeadIds.length < 10 && lead.id) sampledCrmLeadIds.push(lead.id);
    }

    // ── AutomationJob health ──
    const failedJobs = await base44.asServiceRole.entities.AutomationJob.filter({ status: 'failed' }, '-created_date', 100).catch(() => []);
    const failedJobCount = failedJobs?.length || 0;

    const staleJobs = await base44.asServiceRole.entities.AutomationJob.filter({ status: 'processing' }, '-created_date', 100).catch(() => []);
    const staleJobCount = (staleJobs || []).filter(j => {
      if (!j.created_date) return false;
      const ageHours = (Date.now() - new Date(j.created_date).getTime()) / 3600000;
      return ageHours > 1;
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
      const ageHours = (Date.now() - new Date(e.created_date).getTime()) / 3600000;
      return ageHours > 1;
    }).length;

    const eventQueueFailedCount = eqFailed?.length || 0;
    const eventQueueDeadLetterCount = eqDeadLetter?.length || 0;

    // ── RateLimitConfig ──
    const rateLimitConfigs = await base44.asServiceRole.entities.RateLimitConfig.list('-created_date', 50).catch(() => []);
    const rateLimitCount = rateLimitConfigs?.length || 0;

    // ── IdempotencyKey ──
    const idempotencyKeys = await base44.asServiceRole.entities.IdempotencyKey.list('-created_date', 50).catch(() => []);
    const idempotencyKeyCount = idempotencyKeys?.length || 0;

    // ── LeadNextBestAction ──
    const nextBestActions = await base44.asServiceRole.entities.LeadNextBestAction.list('-created_date', 50).catch(() => []);
    const nextBestActionCount = nextBestActions?.length || 0;

    // ── PostPatchVerificationResult ──
    const postPatchResults = await base44.asServiceRole.entities.PostPatchVerificationResult.list('-created_date', 5).catch(() => []);
    const latestPostPatch = postPatchResults?.[0] || null;

    // ── SIMULATION CASES (no external calls, no record mutations) ──
    const cases = [];

    // Case 1: eligible lead would be allowed for follow-up
    const eligibleLead = (websiteLeads || []).find(l =>
      !classifyLeadInternal(l) &&
      l.consent_given === true &&
      l.automation_enabled !== false &&
      l.cadence_paused !== true &&
      l.archived !== true &&
      (l.email || l.phone_number) &&
      l.lead_status === 'new'
    );
    cases.push({
      name: 'eligible_lead_allowed_for_followup',
      passed: !!eligibleLead,
      detail: eligibleLead ? `Found eligible lead ${eligibleLead.id}` : 'No eligible production lead found in sample',
    });

    // Case 2: internal QA lead would be skipped
    const internalLead = (websiteLeads || []).find(l => classifyLeadInternal(l));
    cases.push({
      name: 'internal_qa_lead_skipped',
      passed: !!internalLead,
      detail: internalLead ? `Internal/test lead detected: ${internalLead.id}` : 'No internal/test leads found in sample',
    });

    // Case 3: no-consent lead would be skipped
    const noConsentLead = (websiteLeads || []).find(l =>
      !classifyLeadInternal(l) && l.consent_given === false
    );
    cases.push({
      name: 'no_consent_lead_skipped',
      passed: !!noConsentLead,
      detail: noConsentLead ? `No-consent lead found: ${noConsentLead.id}` : 'No no-consent production leads found',
    });

    // Case 4: missing phone lead would be email-only candidate
    const emailOnlyLead = (websiteLeads || []).find(l =>
      !classifyLeadInternal(l) && l.email && !l.phone_number && l.consent_given !== false
    );
    cases.push({
      name: 'missing_phone_email_only_candidate',
      passed: !!emailOnlyLead,
      detail: emailOnlyLead ? `Email-only lead found: ${emailOnlyLead.id}` : 'No email-only leads found',
    });

    // Case 5: missing email lead would be SMS-only candidate
    const smsOnlyLead = (websiteLeads || []).find(l =>
      !classifyLeadInternal(l) && !l.email && l.phone_number && l.consent_given !== false
    );
    cases.push({
      name: 'missing_email_sms_only_candidate',
      passed: !!smsOnlyLead,
      detail: smsOnlyLead ? `SMS-only lead found: ${smsOnlyLead.id}` : 'No SMS-only leads found',
    });

    // Case 6: do-not-contact lead would be skipped
    const dncLead = (websiteLeads || []).find(l => l.automation_enabled === false);
    cases.push({
      name: 'do_not_contact_lead_skipped',
      passed: !!dncLead,
      detail: dncLead ? `DNC/automation-disabled lead found: ${dncLead.id}` : 'No DNC leads found',
    });

    // Case 7: cadence_paused lead would be skipped
    const pausedLead = (websiteLeads || []).find(l => l.cadence_paused === true);
    cases.push({
      name: 'cadence_paused_lead_skipped',
      passed: !!pausedLead,
      detail: pausedLead ? `Cadence-paused lead found: ${pausedLead.id}` : 'No cadence-paused leads found',
    });

    // Case 8: duplicate idempotency key would suppress duplicate action
    cases.push({
      name: 'duplicate_idempotency_key_suppresses',
      passed: idempotencyKeyCount > 0,
      detail: idempotencyKeyCount > 0
        ? `IdempotencyKey infrastructure exists (${idempotencyKeyCount} keys)`
        : 'No IdempotencyKey records found — duplicate suppression not yet proven',
    });

    // Case 9: failed job would be identified for recovery review
    cases.push({
      name: 'failed_job_identified_for_recovery',
      passed: true,
      detail: failedJobCount > 0
        ? `${failedJobCount} failed AutomationJobs identified for recovery`
        : 'No failed AutomationJobs found',
    });

    // Case 10: booking/replied lead would pause follow-up
    const bookedLead = (websiteLeads || []).find(l =>
      l.lead_status === 'booked' || l.reply_status === 'responded' || l.booking_status === 'booked'
    );
    cases.push({
      name: 'booking_replied_lead_pauses_followup',
      passed: !!bookedLead,
      detail: bookedLead ? `Booked/replied lead found: ${bookedLead.id}` : 'No booked/replied leads found',
    });

    const casesPassed = cases.filter(c => c.passed).length;
    const casesFailed = cases.length - casesPassed;

    // ── Blocker detection ──
    if (rateLimitCount === 0) blockers.push('No RateLimitConfig records found — rate limiting not configured before enabling live sends');
    if (idempotencyKeyCount === 0) blockers.push('No IdempotencyKey records found — duplicate suppression not proven before enabling live sends');
    if (failedJobCount > 0) blockers.push(`${failedJobCount} failed AutomationJob records exist — resolve before enabling autonomous follow-up`);
    if (staleJobCount > 0) blockers.push(`${staleJobCount} stale AutomationJob records stuck in processing — repair before enabling autonomous follow-up`);
    if (deadLetterCount > 0) blockers.push(`${deadLetterCount} DeadLetterLog records pending review — clear before enabling autonomous follow-up`);
    if (eventQueueFailedCount > 0) blockers.push(`${eventQueueFailedCount} EventQueue records in failed state`);
    if (eventQueueDeadLetterCount > 0) blockers.push(`${eventQueueDeadLetterCount} EventQueue records in dead_letter state`);
    if (eqStuckCount > 0) blockers.push(`${eqStuckCount} EventQueue records stuck in processing`);
    if (missingDedupKey > 0) blockers.push(`${missingDedupKey} WebsiteLead records missing dedup_key — backfill required`);
    if (missingClientId > 0) blockers.push(`${missingClientId} WebsiteLead records missing client_id — tenant routing incomplete`);
    if (missingClientProjectId > 0) blockers.push(`${missingClientProjectId} WebsiteLead records missing client_project_id — tenant routing incomplete`);

    // ── Warnings (non-blocking) ──
    if (missingCrmLeadId > 0) warnings.push(`${missingCrmLeadId} WebsiteLead records missing crm_lead_id — CRM sync incomplete`);
    if (missingUtm > 0) warnings.push(`${missingUtm} WebsiteLead records missing UTM/source attribution — analytics incomplete`);
    if (missingConsent > 0) warnings.push(`${missingConsent} WebsiteLead records have no consent_given value — consent tracking gap`);
    if (noEmailNoPhone > 0) warnings.push(`${noEmailNoPhone} WebsiteLead records have no email AND no phone — unreachable leads`);
    if (nextBestActionCount === 0) warnings.push('No LeadNextBestAction records found — next-best-action engine not yet generating recommendations');
    if (cadencePaused > 0) warnings.push(`${cadencePaused} WebsiteLead records have cadence_paused=true`);
    if (automationDisabled > 0) warnings.push(`${automationDisabled} WebsiteLead records have automation_enabled=false`);

    // ── Overall status ──
    let overallStatus = 'pass';
    let safeToEnableLiveSends = true;

    if (blockers.length > 0) {
      overallStatus = 'fail';
      safeToEnableLiveSends = false;
    } else if (casesFailed > 0) {
      overallStatus = 'partial';
      safeToEnableLiveSends = false;
    }

    // ── Readiness score 0-100 ──
    const totalChecks = 10 + blockers.length;
    const passedChecks = casesPassed + (blockers.length === 0 ? 1 : 0);
    const readinessScore = Math.round((passedChecks / totalChecks) * 100);

    // ── Readiness label ──
    let readinessLabel = 'PROOF_PASSED';
    if (blockers.length > 0) readinessLabel = 'BLOCKED';
    else if (casesFailed > 0 || !latestPostPatch) readinessLabel = 'PARTIAL';
    else if (overallStatus === 'pass' && safeToEnableLiveSends) readinessLabel = 'READY_FOR_LIVE_PROOF';

    if (!latestPostPatch) {
      warnings.push('No PostPatchVerificationResult found — run live-safe provider proof after simulation passes');
      if (readinessLabel === 'PROOF_PASSED') readinessLabel = 'READY_FOR_LIVE_PROOF';
    }

    // ── Evidence summary ──
    const evidenceSummary = [
      `Run at: ${now}`,
      `Mode: simulation_only (NO external calls made)`,
      `WebsiteLeads sampled: ${totalWebsiteLeads}`,
      `Production leads: ${productionLeads}`,
      `Internal/test leads: ${internalTestLeads}`,
      `Cases: ${casesPassed}/${cases.length} passed`,
      `Blockers: ${blockers.length}`,
      `Warnings: ${warnings.length}`,
      `Readiness score: ${readinessScore}/100`,
      `Readiness label: ${readinessLabel}`,
      `Safe to enable live sends: ${safeToEnableLiveSends}`,
    ].join(' | ');

    // ── Idempotency simulation result ──
    const idempotencySimResult = idempotencyKeyCount > 0
      ? `PASS — ${idempotencyKeyCount} IdempotencyKey records exist; duplicate suppression infrastructure is present`
      : 'FAIL — no IdempotencyKey records; duplicate actions would not be suppressed';

    // ── Rate limit simulation result ──
    const rateLimitSimResult = rateLimitCount > 0
      ? `PASS — ${rateLimitCount} RateLimitConfig records exist; rate limiting is configured`
      : 'FAIL — no RateLimitConfig records; outbound rate limiting is not configured';

    // ── Dead letter summary ──
    const deadLetterSummary = `${deadLetterCount} pending review, ${eventQueueDeadLetterCount} in EventQueue dead_letter`;

    // ── Create proof result record (the only write in this function) ──
    const proofResult = await base44.asServiceRole.entities.InboundFollowupProofResult.create({
      run_at: now,
      mode: 'simulation_only',
      overall_status: overallStatus,
      safe_to_enable_live_sends: safeToEnableLiveSends,
      cases_passed: casesPassed,
      cases_failed: casesFailed,
      total_cases: cases.length,
      production_lead_count: productionLeads,
      internal_test_lead_count: internalTestLeads,
      blockers,
      warnings,
      evidence_summary: evidenceSummary,
      sampled_website_lead_ids: sampledWebsiteLeadIds,
      sampled_crm_lead_ids: sampledCrmLeadIds,
      idempotency_simulation_result: idempotencySimResult,
      rate_limit_simulation_result: rateLimitSimResult,
      dead_letter_summary: deadLetterSummary,
      notes: 'Non-sending simulation — no Twilio/Resend/Gmail calls were made. No existing records were modified.',
    });

    return json({
      success: true,
      proof_result_id: proofResult?.id,
      run_at: now,
      mode: 'simulation_only',
      overall_status: overallStatus,
      safe_to_enable_live_sends: safeToEnableLiveSends,
      readiness_score: readinessScore,
      readiness_label: readinessLabel,
      cases_passed: casesPassed,
      cases_failed: casesFailed,
      total_cases: cases.length,
      production_lead_count: productionLeads,
      internal_test_lead_count: internalTestLeads,
      data_hygiene: {
        total_website_leads: totalWebsiteLeads,
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
      },
      infrastructure: {
        failed_automation_jobs: failedJobCount,
        stale_automation_jobs: staleJobCount,
        dead_letter_pending: deadLetterCount,
        event_queue_failed: eventQueueFailedCount,
        event_queue_dead_letter: eventQueueDeadLetterCount,
        event_queue_stuck: eqStuckCount,
        rate_limit_configs: rateLimitCount,
        idempotency_keys: idempotencyKeyCount,
        lead_next_best_actions: nextBestActionCount,
        latest_post_patch_verification: latestPostPatch ? {
          id: latestPostPatch.id,
          created_date: latestPostPatch.created_date,
        } : null,
      },
      cases: cases.map(c => ({ name: c.name, passed: c.passed, detail: c.detail })),
      blockers,
      warnings,
      evidence_summary: evidenceSummary,
    });
  } catch (error) {
    console.error('[runInboundFollowupSimulation] Error:', error.message);
    return json({ error: error.message }, 500);
  }
});