/**
 * simulateFailureRecoveryPlan — Non-sending, non-destructive simulation of
 * failed/stale AutomationJob, EventQueue, and DeadLetterLog records.
 *
 * Does NOT modify any records. Does NOT send messages. Does NOT call providers.
 * Classifies each failure into a root cause and recommends an action.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

// ── Internal/test classifiers ──
const INTERNAL_EMAIL_DOMAINS = /clientsurge-install\.internal|clientsurge\.test/i;
const INTERNAL_EMAIL_PREFIXES = /^(test\+|backfill-test\+|crm-smoke\+)/i;
const INTERNAL_SOURCE_PATTERNS = /install_test|ai_brain_backfill|verification=|smoke/i;
const INTERNAL_BUSINESS_NAMES = /Smoke QA|UI Function Smoke|Internal Test|Admin Test|ClientSurge Smoke/i;
const PHONE_555 = /555/;

function classifyInternalTest(record, ownerEmail) {
  const email = (record.email || record.lead_email || "").toLowerCase().trim();
  const source = (record.source || record.trigger_event || "").toLowerCase();
  const sourcePage = (record.source_page || record.metadata_json || "").toLowerCase();
  const businessName = record.business_name || "";
  const phone = record.phone_number || record.lead_phone || record.phone || "";

  if (INTERNAL_EMAIL_DOMAINS.test(email)) return true;
  if (INTERNAL_EMAIL_PREFIXES.test(email)) return true;
  if (INTERNAL_SOURCE_PATTERNS.test(source)) return true;
  if (INTERNAL_SOURCE_PATTERNS.test(sourcePage)) return true;
  if (INTERNAL_BUSINESS_NAMES.test(businessName)) return true;
  if (PHONE_555.test(phone)) return true;
  if (ownerEmail && email === ownerEmail.toLowerCase() && (source.includes("test") || source.includes("qa") || source.includes("smoke"))) return true;
  return false;
}

function isStaleProcessing(record) {
  if (record.status !== "processing") return false;
  const timestamp = record.processed_at || record.last_retry_at || record.created_date;
  if (!timestamp) return true; // processing with no timestamp = stale
  return new Date().getTime() - new Date(timestamp).getTime() > STALE_THRESHOLD_MS;
}

function isStaleQueued(record) {
  if (record.status !== "queued") return false;
  if (record.scheduled_for) {
    return new Date().getTime() - new Date(record.scheduled_for).getTime() > STALE_THRESHOLD_MS;
  }
  // queued with no scheduled_for and old created_date
  if (record.created_date) {
    return new Date().getTime() - new Date(record.created_date).getTime() > STALE_THRESHOLD_MS;
  }
  return false;
}

function isStuckProcessingEvent(record) {
  if (record.status !== "processing") return false;
  const timestamp = record.last_retry_at || record.created_date;
  if (!timestamp) return true;
  return new Date().getTime() - new Date(timestamp).getTime() > STALE_THRESHOLD_MS;
}

function classifyRootCause(record, type, leadExists, ownerEmail) {
  const errorMsg = (record.last_error || record.error_message || record.failure_reason || "").toLowerCase();
  const isInternal = classifyInternalTest(record, ownerEmail);

  // Check for internal/test first
  if (isInternal) return "internal_test_suppressed";

  // Check for duplicate
  if (errorMsg.includes("duplicate") || errorMsg.includes("already processed") || errorMsg.includes("idempotency")) {
    return "duplicate_suppressed";
  }

  // Check for missing consent
  if (errorMsg.includes("consent") || errorMsg.includes("opt-out") || errorMsg.includes("opted out") || errorMsg.includes("do not contact")) {
    return "missing_consent";
  }

  // Check for invalid phone/email
  if (errorMsg.includes("invalid phone") || errorMsg.includes("invalid email") || errorMsg.includes("malformed") || errorMsg.includes("e.164") || errorMsg.includes("unreachable")) {
    return "invalid_phone_or_email";
  }

  // Check for lead not found
  if (!leadExists || errorMsg.includes("lead not found") || errorMsg.includes("no lead") || errorMsg.includes("lead_id") || errorMsg.includes("missing lead")) {
    return "lead_not_found";
  }

  // Check for missing tenant scope
  if (!record.client_id || record.tenant_scope_status === "missing_client_id" || record.tenant_scope_status === "needs_backfill" || record.tenant_scope_error) {
    return "missing_tenant_scope";
  }

  // Check for stale processing
  if (type === "job" && isStaleProcessing(record)) return "stale_processing";
  if (type === "event" && isStuckProcessingEvent(record)) return "stale_processing";

  // Check for provider errors
  if (errorMsg.includes("twilio") || errorMsg.includes("resend") || errorMsg.includes("stripe") || errorMsg.includes("provider") || errorMsg.includes("api") || errorMsg.includes("timeout") || errorMsg.includes("500") || errorMsg.includes("503")) {
    return "provider_error";
  }

  return "unknown_error";
}

function recommendAction(rootCause) {
  switch (rootCause) {
    case "internal_test_suppressed": return "resolve_as_internal_test";
    case "duplicate_suppressed": return "safe_to_retry_later";
    case "missing_consent": return "mark_unrecoverable";
    case "invalid_phone_or_email": return "mark_unrecoverable";
    case "lead_not_found": return "needs_lead_id_repair";
    case "missing_tenant_scope": return "needs_tenant_scope_repair";
    case "stale_processing": return "safe_to_retry_later";
    case "provider_error": return "needs_provider_config_review";
    default: return "manual_review_required";
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return Response.json({ error: "Admin only" }, { status: 403 });
    }

    const svc = base44.asServiceRole;
    const ownerEmail = user.email || "";
    const now = new Date().toISOString();

    // ── Fetch all records (read-only, no provider calls) ──
    const [
      allJobs,
      failedJobs,
      processingJobs,
      queuedJobs,
      allEvents,
      failedEvents,
      deadLetterEvents,
      processingEvents,
      pendingDeadLetters,
      resolvedDeadLetters,
    ] = await Promise.all([
      svc.entities.AutomationJob.list("", 500).catch(() => []),
      svc.entities.AutomationJob.filter({ status: "failed" }, "-created_date", 500).catch(() => []),
      svc.entities.AutomationJob.filter({ status: "processing" }, "-created_date", 500).catch(() => []),
      svc.entities.AutomationJob.filter({ status: "queued" }, "-created_date", 500).catch(() => []),
      svc.entities.EventQueue.list("", 500).catch(() => []),
      svc.entities.EventQueue.filter({ status: "failed" }, "-created_date", 500).catch(() => []),
      svc.entities.EventQueue.filter({ status: "dead_letter" }, "-created_date", 500).catch(() => []),
      svc.entities.EventQueue.filter({ status: "processing" }, "-created_date", 500).catch(() => []),
      svc.entities.DeadLetterLog.filter({ status: "pending_review" }, "-created_date", 500).catch(() => []),
      svc.entities.DeadLetterLog.filter({ status: "resolved" }, "-created_date", 500).catch(() => []),
    ]);

    // Fetch leads for lead_not_found detection
    const leadIds = new Set();
    for (const job of (allJobs || [])) {
      if (job.lead_id) leadIds.add(job.lead_id);
    }
    for (const evt of (allEvents || [])) {
      // EventQueue doesn't have lead_id directly, check metadata_json
      try {
        const meta = evt.metadata_json ? JSON.parse(evt.metadata_json) : {};
        if (meta.lead_id) leadIds.add(meta.lead_id);
      } catch {}
    }

    const leads = leadIds.size > 0
      ? await svc.entities.Leads.filter({ _id: { $in: [...leadIds] } }, "", leadIds.size).catch(() => [])
      : [];
    const existingLeadIds = new Set((leads || []).map((l) => l.id));

    // ── Stale job detection ──
    const staleProcessingJobs = (processingJobs || []).filter((j) => isStaleProcessing(j));
    const staleQueuedJobs = (queuedJobs || []).filter((j) => isStaleQueued(j));
    const staleJobs = [...staleProcessingJobs, ...staleQueuedJobs];

    // ── Stuck event detection ──
    const stuckEvents = (processingEvents || []).filter((e) => isStuckProcessingEvent(e));

    // ── Classify failures ──
    const rootCauseCounts = {
      lead_not_found: 0,
      stale_processing: 0,
      provider_error: 0,
      missing_tenant_scope: 0,
      internal_test_suppressed: 0,
      duplicate_suppressed: 0,
      missing_consent: 0,
      invalid_phone_or_email: 0,
      unknown_error: 0,
    };

    const recommendedActionCounts = {
      safe_to_retry_later: 0,
      resolve_as_internal_test: 0,
      needs_lead_id_repair: 0,
      needs_tenant_scope_repair: 0,
      needs_provider_config_review: 0,
      mark_unrecoverable: 0,
      manual_review_required: 0,
    };

    const sampleJobIds = [];
    const sampleEventIds = [];
    const sampleDeadLetterIds = [];

    // Classify failed jobs
    for (const job of (failedJobs || [])) {
      const leadExists = job.lead_id ? existingLeadIds.has(job.lead_id) : false;
      const rootCause = classifyRootCause(job, "job", leadExists, ownerEmail);
      const action = recommendAction(rootCause);
      rootCauseCounts[rootCause]++;
      recommendedActionCounts[action]++;
      if (sampleJobIds.length < 10) sampleJobIds.push(job.id);
    }

    // Classify stale jobs
    for (const job of staleJobs) {
      const leadExists = job.lead_id ? existingLeadIds.has(job.lead_id) : false;
      const rootCause = classifyRootCause(job, "job", leadExists, ownerEmail);
      const action = recommendAction(rootCause);
      rootCauseCounts[rootCause]++;
      recommendedActionCounts[action]++;
      if (sampleJobIds.length < 10) sampleJobIds.push(job.id);
    }

    // Classify failed events
    for (const evt of (failedEvents || [])) {
      let leadId = null;
      try {
        const meta = evt.metadata_json ? JSON.parse(evt.metadata_json) : {};
        leadId = meta.lead_id;
      } catch {}
      const leadExists = leadId ? existingLeadIds.has(leadId) : false;
      const rootCause = classifyRootCause(evt, "event", leadExists, ownerEmail);
      const action = recommendAction(rootCause);
      rootCauseCounts[rootCause]++;
      recommendedActionCounts[action]++;
      if (sampleEventIds.length < 10) sampleEventIds.push(evt.id);
    }

    // Classify dead letter events
    for (const evt of (deadLetterEvents || [])) {
      let leadId = null;
      try {
        const meta = evt.metadata_json ? JSON.parse(evt.metadata_json) : {};
        leadId = meta.lead_id;
      } catch {}
      const leadExists = leadId ? existingLeadIds.has(leadId) : false;
      const rootCause = classifyRootCause(evt, "event", leadExists, ownerEmail);
      const action = recommendAction(rootCause);
      rootCauseCounts[rootCause]++;
      recommendedActionCounts[action]++;
      if (sampleEventIds.length < 10) sampleEventIds.push(evt.id);
    }

    // Classify stuck events
    for (const evt of stuckEvents) {
      const rootCause = classifyRootCause(evt, "event", true, ownerEmail);
      rootCauseCounts[rootCause]++;
      const action = recommendAction(rootCause);
      recommendedActionCounts[action]++;
      if (sampleEventIds.length < 10) sampleEventIds.push(evt.id);
    }

    // Classify pending dead letters
    for (const dl of (pendingDeadLetters || [])) {
      const rootCause = classifyRootCause(dl, "deadletter", true, ownerEmail);
      const action = recommendAction(rootCause);
      rootCauseCounts[rootCause]++;
      recommendedActionCounts[action]++;
      if (sampleDeadLetterIds.length < 10) sampleDeadLetterIds.push(dl.id);
    }

    // ── Unresolved client_id / lead_id counts ──
    const unresolvedClientId = [...(failedJobs || []), ...(staleJobs || []), ...(failedEvents || []), ...(deadLetterEvents || []), ...(pendingDeadLetters || [])]
      .filter((r) => !r.client_id).length;
    const unresolvedLeadId = [...(failedJobs || []), ...(staleJobs || []), ...(failedEvents || []), ...(deadLetterEvents || [])]
      .filter((r) => {
        if (r.lead_id) return !existingLeadIds.has(r.lead_id);
        try {
          const meta = r.metadata_json ? JSON.parse(r.metadata_json) : {};
          return meta.lead_id && !existingLeadIds.has(meta.lead_id);
        } catch {
          return false;
        }
      }).length;

    // ── Group failed jobs by root cause ──
    const failedJobsByRootCause = {};
    for (const job of (failedJobs || [])) {
      const leadExists = job.lead_id ? existingLeadIds.has(job.lead_id) : false;
      const rootCause = classifyRootCause(job, "job", leadExists, ownerEmail);
      if (!failedJobsByRootCause[rootCause]) failedJobsByRootCause[rootCause] = [];
      failedJobsByRootCause[rootCause].push(job.id);
    }

    const safeResolutionsAvailable =
      recommendedActionCounts.safe_to_retry_later +
      recommendedActionCounts.resolve_as_internal_test;

    const manualReviewRequired = recommendedActionCounts.manual_review_required +
      recommendedActionCounts.needs_lead_id_repair +
      recommendedActionCounts.needs_tenant_scope_repair +
      recommendedActionCounts.needs_provider_config_review;

    // ── Determine safe_to_continue ──
    const totalFailures = (failedJobs || []).length + staleJobs.length + (failedEvents || []).length + (deadLetterEvents || []).length + stuckEvents.length + (pendingDeadLetters || []).length;
    const safeToContinue = totalFailures === 0 ||
      (rootCauseCounts.internal_test_suppressed === totalFailures && manualReviewRequired === 0);

    const blockers = [];
    if ((failedJobs || []).length > 0) blockers.push(`${(failedJobs || []).length} failed AutomationJob(s)`);
    if (staleJobs.length > 0) blockers.push(`${staleJobs.length} stale AutomationJob(s)`);
    if ((failedEvents || []).length > 0) blockers.push(`${(failedEvents || []).length} failed EventQueue(s)`);
    if ((deadLetterEvents || []).length > 0) blockers.push(`${(deadLetterEvents || []).length} dead_letter EventQueue(s)`);
    if (stuckEvents.length > 0) blockers.push(`${stuckEvents.length} stuck processing EventQueue(s)`);
    if ((pendingDeadLetters || []).length > 0) blockers.push(`${(pendingDeadLetters || []).length} pending DeadLetterLog(s)`);
    if (unresolvedLeadId > 0) blockers.push(`${unresolvedLeadId} unresolved lead_id/lead_not_found`);

    const evidenceSummary = JSON.stringify({
      total_jobs: (allJobs || []).length,
      total_events: (allEvents || []).length,
      total_dead_letters: (pendingDeadLetters || []).length + (resolvedDeadLetters || []).length,
      failed_jobs: (failedJobs || []).length,
      stale_jobs: staleJobs.length,
      failed_events: (failedEvents || []).length,
      dead_letter_events: (deadLetterEvents || []).length,
      stuck_events: stuckEvents.length,
      root_causes: rootCauseCounts,
      no_provider_calls: true,
      no_records_modified: true,
      mode: "simulation",
    });

    // ── Write FailureRecoveryResult (simulation) ──
    let resultRecordId = null;
    try {
      const resultRecord = await svc.entities.FailureRecoveryResult.create({
        run_at: now,
        mode: "simulation",
        total_jobs_scanned: (allJobs || []).length,
        total_events_scanned: (allEvents || []).length,
        total_dead_letters_scanned: (pendingDeadLetters || []).length + (resolvedDeadLetters || []).length,
        root_cause_counts: rootCauseCounts,
        recommended_action_counts: recommendedActionCounts,
        safe_resolutions_available: safeResolutionsAvailable,
        manual_review_required: manualReviewRequired,
        records_annotated: 0,
        records_resolved: 0,
        records_left_blocked: totalFailures,
        blockers,
        warnings: [],
        evidence_summary: evidenceSummary,
        sample_job_ids: sampleJobIds,
        sample_event_ids: sampleEventIds,
        sample_dead_letter_ids: sampleDeadLetterIds,
        safe_to_continue_to_next_phase: safeToContinue,
        run_by: ownerEmail,
      });
      resultRecordId = resultRecord.id;
    } catch (err) {
      // Non-fatal — still return simulation results
    }

    return Response.json({
      success: true,
      mode: "simulation",
      run_at: now,
      no_provider_calls: true,
      no_records_modified: true,
      counts: {
        total_jobs: (allJobs || []).length,
        failed_jobs: (failedJobs || []).length,
        stale_jobs: staleJobs.length,
        stale_processing_jobs: staleProcessingJobs.length,
        stale_queued_jobs: staleQueuedJobs.length,
        processing_jobs: (processingJobs || []).length,
        queued_jobs: (queuedJobs || []).length,
        completed_jobs: (allJobs || []).filter((j) => j.status === "completed").length,
        total_events: (allEvents || []).length,
        failed_events: (failedEvents || []).length,
        dead_letter_events: (deadLetterEvents || []).length,
        stuck_processing_events: stuckEvents.length,
        pending_dead_letters: (pendingDeadLetters || []).length,
        resolved_dead_letters: (resolvedDeadLetters || []).length,
        unresolved_client_id: unresolvedClientId,
        unresolved_lead_id: unresolvedLeadId,
      },
      failed_jobs_by_root_cause: failedJobsByRootCause,
      root_cause_counts: rootCauseCounts,
      recommended_action_counts: recommendedActionCounts,
      safe_resolutions_available: safeResolutionsAvailable,
      manual_review_required: manualReviewRequired,
      records_left_blocked: totalFailures,
      blockers,
      warnings: [],
      sample_job_ids: sampleJobIds,
      sample_event_ids: sampleEventIds,
      sample_dead_letter_ids: sampleDeadLetterIds,
      safe_to_continue_to_next_phase: safeToContinue,
      result_record_id: resultRecordId,
      evidence_summary: evidenceSummary,
      next_step: totalFailures === 0
        ? "No failures detected — proceed to generate LeadNextBestAction records"
        : safeToContinue
          ? "All failures are internal/test — safe to apply resolution"
          : "Review root causes and apply safe annotation/resolution to clear blockers",
    });
  } catch (error) {
    console.error("[simulateFailureRecoveryPlan] error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});