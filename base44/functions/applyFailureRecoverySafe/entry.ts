/**
 * applyFailureRecoverySafe — Admin-controlled safe annotation and resolution of
 * failed/stale AutomationJob, EventQueue, and DeadLetterLog records.
 *
 * SAFETY RULES (enforced):
 *   - No SMS, email, Twilio, Resend, Gmail, Stripe, or external provider calls
 *   - No outbound CommunicationLog entries created
 *   - No lead status changed to contacted/booked/closed
 *   - No records deleted
 *   - No provider sends retried
 *
 * ALLOWED CHANGES ONLY:
 *   - Mark clearly internal/test failures as resolved or archived with admin notes
 *   - Mark unrecoverable lead_not_found jobs as failed/manual_review
 *   - Annotate DeadLetterLog.admin_notes with root cause and recommendation
 *   - Update EventQueue status only when safe and no provider call is needed
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

const STALE_THRESHOLD_MS = 10 * 60 * 1000;

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
  if (!timestamp) return true;
  return new Date().getTime() - new Date(timestamp).getTime() > STALE_THRESHOLD_MS;
}

function isStaleQueued(record) {
  if (record.status !== "queued") return false;
  if (record.scheduled_for) {
    return new Date().getTime() - new Date(record.scheduled_for).getTime() > STALE_THRESHOLD_MS;
  }
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

  if (isInternal) return "internal_test_suppressed";
  if (errorMsg.includes("duplicate") || errorMsg.includes("already processed") || errorMsg.includes("idempotency")) return "duplicate_suppressed";
  if (errorMsg.includes("consent") || errorMsg.includes("opt-out") || errorMsg.includes("opted out") || errorMsg.includes("do not contact")) return "missing_consent";
  if (errorMsg.includes("invalid phone") || errorMsg.includes("invalid email") || errorMsg.includes("malformed") || errorMsg.includes("e.164") || errorMsg.includes("unreachable")) return "invalid_phone_or_email";
  if (!leadExists || errorMsg.includes("lead not found") || errorMsg.includes("no lead") || errorMsg.includes("lead_id") || errorMsg.includes("missing lead")) return "lead_not_found";
  if (!record.client_id || record.tenant_scope_status === "missing_client_id" || record.tenant_scope_status === "needs_backfill" || record.tenant_scope_error) return "missing_tenant_scope";
  if (type === "job" && isStaleProcessing(record)) return "stale_processing";
  if (type === "event" && isStuckProcessingEvent(record)) return "stale_processing";
  if (errorMsg.includes("twilio") || errorMsg.includes("resend") || errorMsg.includes("stripe") || errorMsg.includes("provider") || errorMsg.includes("api") || errorMsg.includes("timeout") || errorMsg.includes("500") || errorMsg.includes("503")) return "provider_error";
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

const ANNOTATION_PREFIX = "[FailureRecovery]";

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

    const [
      failedJobs,
      processingJobs,
      queuedJobs,
      failedEvents,
      deadLetterEvents,
      processingEvents,
      pendingDeadLetters,
    ] = await Promise.all([
      svc.entities.AutomationJob.filter({ status: "failed" }, "-created_date", 500).catch(() => []),
      svc.entities.AutomationJob.filter({ status: "processing" }, "-created_date", 500).catch(() => []),
      svc.entities.AutomationJob.filter({ status: "queued" }, "-created_date", 500).catch(() => []),
      svc.entities.EventQueue.filter({ status: "failed" }, "-created_date", 500).catch(() => []),
      svc.entities.EventQueue.filter({ status: "dead_letter" }, "-created_date", 500).catch(() => []),
      svc.entities.EventQueue.filter({ status: "processing" }, "-created_date", 500).catch(() => []),
      svc.entities.DeadLetterLog.filter({ status: "pending_review" }, "-created_date", 500).catch(() => []),
    ]);

    // Fetch leads for lead_not_found detection
    const leadIds = new Set();
    for (const job of (failedJobs || [])) {
      if (job.lead_id) leadIds.add(job.lead_id);
    }
    const leads = leadIds.size > 0
      ? await svc.entities.Leads.filter({ _id: { $in: [...leadIds] } }, "", leadIds.size).catch(() => [])
      : [];
    const existingLeadIds = new Set((leads || []).map((l) => l.id));

    const counts = {
      records_annotated: 0,
      records_resolved: 0,
      records_left_blocked: 0,
    };

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

    const actionCounts = {
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
    const blockers = [];
    const warnings = [];

    // ── Process failed AutomationJobs ──
    for (const job of (failedJobs || [])) {
      const leadExists = job.lead_id ? existingLeadIds.has(job.lead_id) : false;
      const rootCause = classifyRootCause(job, "job", leadExists, ownerEmail);
      const action = recommendAction(rootCause);
      rootCauseCounts[rootCause]++;
      actionCounts[action]++;

      const update = {};
      const noteText = `${ANNOTATION_PREFIX} root_cause=${rootCause} recommended_action=${action} annotated_by=${ownerEmail} at=${now}`;

      if (action === "resolve_as_internal_test") {
        // Safe to resolve as internal test — mark failed but annotated
        update.last_error = (job.last_error || "") + ` | ${noteText}`;
        update.result_metadata = noteText;
        counts.records_resolved++;
      } else if (action === "mark_unrecoverable") {
        // Mark as unrecoverable — no retry
        update.last_error = (job.last_error || "") + ` | ${ANNOTATION_PREFIX} UNRECOVERABLE: ${rootCause} — do not retry`;
        update.result_metadata = `${ANNOTATION_PREFIX} unrecoverable=true root_cause=${rootCause} annotated_by=${ownerEmail}`;
        counts.records_annotated++;
      } else if (action === "safe_to_retry_later") {
        // Annotate for retry — do NOT retry (no provider call)
        update.last_error = (job.last_error || "") + ` | ${ANNOTATION_PREFIX} safe_to_retry_later root_cause=${rootCause}`;
        update.result_metadata = noteText;
        counts.records_annotated++;
      } else {
        // needs_lead_id_repair, needs_tenant_scope_repair, needs_provider_config_review, manual_review_required
        update.last_error = (job.last_error || "") + ` | ${ANNOTATION_PREFIX} manual_review_required root_cause=${rootCause} action=${action}`;
        update.result_metadata = noteText;
        counts.records_left_blocked++;
      }

      if (sampleJobIds.length < 10) sampleJobIds.push(job.id);

      try {
        if (Object.keys(update).length > 0) {
          await svc.entities.AutomationJob.update(job.id, update);
        }
      } catch (err) {
        warnings.push(`Failed to annotate AutomationJob ${job.id}: ${err.message}`);
      }
    }

    // ── Process stale AutomationJobs (processing too long or queued past schedule) ──
    const staleProcessingJobs = (processingJobs || []).filter((j) => isStaleProcessing(j));
    const staleQueuedJobs = (queuedJobs || []).filter((j) => isStaleQueued(j));
    for (const job of [...staleProcessingJobs, ...staleQueuedJobs]) {
      const leadExists = job.lead_id ? existingLeadIds.has(job.lead_id) : false;
      const rootCause = classifyRootCause(job, "job", leadExists, ownerEmail);
      const action = recommendAction(rootCause);
      rootCauseCounts[rootCause]++;
      actionCounts[action]++;

      const noteText = `${ANNOTATION_PREFIX} stale_job root_cause=${rootCause} recommended_action=${action} annotated_by=${ownerEmail} at=${now}`;

      if (action === "resolve_as_internal_test") {
        // Mark as completed (internal test — no provider retry)
        try {
          await svc.entities.AutomationJob.update(job.id, {
            status: "completed",
            last_error: (job.last_error || "") + ` | ${ANNOTATION_PREFIX} resolved_as_internal_test`,
            result_metadata: noteText,
            processed_at: now,
          });
          counts.records_resolved++;
        } catch (err) {
          warnings.push(`Failed to resolve stale internal job ${job.id}: ${err.message}`);
        }
      } else if (action === "safe_to_retry_later") {
        // Annotate stale job — do NOT retry
        try {
          await svc.entities.AutomationJob.update(job.id, {
            last_error: (job.last_error || "") + ` | ${noteText}`,
            result_metadata: noteText,
          });
          counts.records_annotated++;
        } catch (err) {
          warnings.push(`Failed to annotate stale job ${job.id}: ${err.message}`);
        }
      } else {
        // Blocked — needs manual review
        try {
          await svc.entities.AutomationJob.update(job.id, {
            last_error: (job.last_error || "") + ` | ${ANNOTATION_PREFIX} manual_review_required root_cause=${rootCause} action=${action}`,
            result_metadata: noteText,
          });
          counts.records_left_blocked++;
        } catch (err) {
          warnings.push(`Failed to annotate stale job ${job.id}: ${err.message}`);
        }
      }

      if (sampleJobIds.length < 10) sampleJobIds.push(job.id);
    }

    // ── Process failed/dead_letter EventQueue records ──
    for (const evt of [...(failedEvents || []), ...(deadLetterEvents || [])]) {
      let leadId = null;
      try {
        const meta = evt.metadata_json ? JSON.parse(evt.metadata_json) : {};
        leadId = meta.lead_id;
      } catch {}
      const leadExists = leadId ? existingLeadIds.has(leadId) : false;
      const rootCause = classifyRootCause(evt, "event", leadExists, ownerEmail);
      const action = recommendAction(rootCause);
      rootCauseCounts[rootCause]++;
      actionCounts[action]++;

      const noteText = `${ANNOTATION_PREFIX} root_cause=${rootCause} recommended_action=${action} annotated_by=${ownerEmail} at=${now}`;

      // Only update EventQueue status when safe and no provider call needed
      if (action === "resolve_as_internal_test") {
        try {
          await svc.entities.EventQueue.update(evt.id, {
            status: "completed",
            error_message: (evt.error_message || "") + ` | ${ANNOTATION_PREFIX} resolved_as_internal_test`,
            metadata_json: noteText,
            completed_at: now,
          });
          counts.records_resolved++;
        } catch (err) {
          warnings.push(`Failed to resolve internal event ${evt.id}: ${err.message}`);
        }
      } else if (action === "mark_unrecoverable") {
        // Keep as dead_letter but annotate — no retry
        try {
          await svc.entities.EventQueue.update(evt.id, {
            error_message: (evt.error_message || "") + ` | ${ANNOTATION_PREFIX} UNRECOVERABLE: ${rootCause}`,
            metadata_json: noteText,
          });
          counts.records_annotated++;
        } catch (err) {
          warnings.push(`Failed to annotate event ${evt.id}: ${err.message}`);
        }
      } else {
        // Annotate — leave status unchanged
        try {
          await svc.entities.EventQueue.update(evt.id, {
            error_message: (evt.error_message || "") + ` | ${noteText}`,
            metadata_json: noteText,
          });
          counts.records_annotated++;
        } catch (err) {
          warnings.push(`Failed to annotate event ${evt.id}: ${err.message}`);
        }
      }

      if (sampleEventIds.length < 10) sampleEventIds.push(evt.id);
    }

    // ── Process stuck processing EventQueue records ──
    const stuckEvents = (processingEvents || []).filter((e) => isStuckProcessingEvent(e));
    for (const evt of stuckEvents) {
      const rootCause = classifyRootCause(evt, "event", true, ownerEmail);
      const action = recommendAction(rootCause);
      rootCauseCounts[rootCause]++;
      actionCounts[action]++;

      // Only reset to queued if safe_to_retry_later — no provider call
      if (action === "safe_to_retry_later" || action === "resolve_as_internal_test") {
        try {
          await svc.entities.EventQueue.update(evt.id, {
            status: action === "resolve_as_internal_test" ? "completed" : "queued",
            error_message: (evt.error_message || "") + ` | ${ANNOTATION_PREFIX} stale_processing_reset annotated_by=${ownerEmail}`,
            completed_at: action === "resolve_as_internal_test" ? now : undefined,
          });
          counts.records_annotated++;
        } catch (err) {
          warnings.push(`Failed to reset stuck event ${evt.id}: ${err.message}`);
        }
      } else {
        try {
          await svc.entities.EventQueue.update(evt.id, {
            error_message: (evt.error_message || "") + ` | ${ANNOTATION_PREFIX} manual_review_required root_cause=${rootCause}`,
          });
          counts.records_left_blocked++;
        } catch (err) {
          warnings.push(`Failed to annotate stuck event ${evt.id}: ${err.message}`);
        }
      }

      if (sampleEventIds.length < 10) sampleEventIds.push(evt.id);
    }

    // ── Annotate pending DeadLetterLog records ──
    for (const dl of (pendingDeadLetters || [])) {
      const rootCause = classifyRootCause(dl, "deadletter", true, ownerEmail);
      const action = recommendAction(rootCause);
      rootCauseCounts[rootCause]++;
      actionCounts[action]++;

      const noteText = `${ANNOTATION_PREFIX} root_cause=${rootCause} recommended_action=${action} annotated_by=${ownerEmail} at=${now}`;

      if (action === "resolve_as_internal_test") {
        try {
          await svc.entities.DeadLetterLog.update(dl.id, {
            status: "resolved",
            admin_notes: (dl.admin_notes || "") + ` | ${noteText} — resolved as internal test`,
          });
          counts.records_resolved++;
        } catch (err) {
          warnings.push(`Failed to resolve dead letter ${dl.id}: ${err.message}`);
        }
      } else {
        try {
          await svc.entities.DeadLetterLog.update(dl.id, {
            status: action === "mark_unrecoverable" ? "archived" : "under_investigation",
            admin_notes: (dl.admin_notes || "") + ` | ${noteText}`,
          });
          counts.records_annotated++;
        } catch (err) {
          warnings.push(`Failed to annotate dead letter ${dl.id}: ${err.message}`);
        }
      }

      if (sampleDeadLetterIds.length < 10) sampleDeadLetterIds.push(dl.id);
    }

    // ── Blockers still remaining? ──
    const remainingFailures = counts.records_left_blocked;
    if (remainingFailures > 0) {
      blockers.push(`${remainingFailures} record(s) still blocked — require manual review or data repair`);
    }

    const safeToContinue = remainingFailures === 0;
    const totalScannedJobs = (failedJobs || []).length + staleProcessingJobs.length + staleQueuedJobs.length;
    const totalScannedEvents = (failedEvents || []).length + (deadLetterEvents || []).length + stuckEvents.length;
    const totalScannedDeadLetters = (pendingDeadLetters || []).length;

    const evidenceSummary = JSON.stringify({
      jobs_scanned: totalScannedJobs,
      events_scanned: totalScannedEvents,
      dead_letters_scanned: totalScannedDeadLetters,
      annotated: counts.records_annotated,
      resolved: counts.records_resolved,
      left_blocked: counts.records_left_blocked,
      no_provider_calls: true,
      no_records_deleted: true,
      no_lead_status_changed: true,
      no_outbound_communication_log: true,
      mode: "applied",
    });

    // ── Write FailureRecoveryResult (applied) ──
    let resultRecordId = null;
    try {
      const resultRecord = await svc.entities.FailureRecoveryResult.create({
        run_at: now,
        mode: "applied",
        total_jobs_scanned: totalScannedJobs,
        total_events_scanned: totalScannedEvents,
        total_dead_letters_scanned: totalScannedDeadLetters,
        root_cause_counts: rootCauseCounts,
        recommended_action_counts: actionCounts,
        safe_resolutions_available: actionCounts.safe_to_retry_later + actionCounts.resolve_as_internal_test,
        manual_review_required: actionCounts.manual_review_required + actionCounts.needs_lead_id_repair + actionCounts.needs_tenant_scope_repair + actionCounts.needs_provider_config_review,
        records_annotated: counts.records_annotated,
        records_resolved: counts.records_resolved,
        records_left_blocked: counts.records_left_blocked,
        blockers,
        warnings,
        evidence_summary: evidenceSummary,
        sample_job_ids: sampleJobIds,
        sample_event_ids: sampleEventIds,
        sample_dead_letter_ids: sampleDeadLetterIds,
        safe_to_continue_to_next_phase: safeToContinue,
        run_by: ownerEmail,
      });
      resultRecordId = resultRecord.id;
    } catch (err) {
      warnings.push(`Failed to write FailureRecoveryResult: ${err.message}`);
    }

    return Response.json({
      success: true,
      mode: "applied",
      run_at: now,
      no_provider_calls: true,
      no_records_deleted: true,
      no_lead_status_changed: true,
      no_outbound_communication_log: true,
      counts: {
        records_annotated: counts.records_annotated,
        records_resolved: counts.records_resolved,
        records_left_blocked: counts.records_left_blocked,
        ...rootCauseCounts,
      },
      root_cause_counts: rootCauseCounts,
      recommended_action_counts: actionCounts,
      blockers,
      warnings,
      sample_job_ids: sampleJobIds,
      sample_event_ids: sampleEventIds,
      sample_dead_letter_ids: sampleDeadLetterIds,
      safe_to_continue_to_next_phase: safeToContinue,
      result_record_id: resultRecordId,
      evidence_summary: evidenceSummary,
      next_step: blockers.length > 0
        ? "Review blocked records — repair lead_id/tenant_scope/provider config, then re-run"
        : "All failures annotated/resolved — next: generate LeadNextBestAction records, then run full non-sending inbound simulation",
    });
  } catch (error) {
    console.error("[applyFailureRecoverySafe] error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});