/**
 * AUTOMATION GUARDRAIL — Centralized edge case stability layer
 *
 * Provides:
 * - Duplicate trigger prevention (idempotency + dedup window check)
 * - Race condition guard per lead_id
 * - Retry safety verification
 * - AutomationJob duplicate check
 *
 * Usage:
 *   import { checkAutomationGuardrail, markGuardrailOutcome } from './_shared/automationGuardrail.js';
 *   const guard = await checkAutomationGuardrail(base44, { lead_id, job_type, trigger_event, idempotency_key });
 *   if (!guard.proceed) return Response.json({ skipped: true, reason: guard.reason });
 */

/**
 * Dedup window in milliseconds — events arriving within this window are considered duplicates
 */
const DEDUP_WINDOW_MS = 60 * 1000; // 60 seconds
const MAX_RETRIES = 5;

/**
 * Check all guardrails before executing an automation action
 * Returns { proceed: boolean, reason: string, existing_id?: string }
 */
export async function checkAutomationGuardrail(base44, { lead_id, job_type, trigger_event, idempotency_key, client_id }) {
  const checks = [];

  // 1. Idempotency key check
  if (idempotency_key) {
    try {
      const existing = await base44.entities.IdempotencyKey.filter({ key: idempotency_key }, '-created_date', 1);
      if (existing && existing.length > 0 && existing[0].status === 'processed') {
        return { proceed: false, reason: 'idempotency_key_already_processed', existing_id: existing[0].id };
      }
    } catch (_) {}
  }

  // 2. EventDedupLog — check for recent duplicate within dedup window
  if (lead_id && trigger_event) {
    try {
      const recentDedup = await base44.entities.EventDedupLog.filter(
        { lead_id, event_type: trigger_event },
        '-created_date',
        5
      );

      for (const dedupEntry of (recentDedup || [])) {
        const entryTime = new Date(dedupEntry.created_date).getTime();
        if (Date.now() - entryTime < DEDUP_WINDOW_MS) {
          return { proceed: false, reason: 'dedup_window_active', existing_id: dedupEntry.id };
        }
      }
    } catch (_) {}
  }

  // 3. AutomationJob — prevent duplicate active jobs for same lead + type + trigger
  if (lead_id && job_type) {
    try {
      const existingJobs = await base44.entities.AutomationJob.filter(
        { lead_id, automation_type: job_type },
        '-created_date',
        10
      );

      const conflicting = (existingJobs || []).find(j =>
        j.trigger_event === trigger_event &&
        ['pending', 'processing', 'queued'].includes(j.status)
      );

      if (conflicting) {
        return { proceed: false, reason: 'active_job_exists', existing_id: conflicting.id };
      }

      // Check if a completed job for same event already exists (within 24h)
      const recentCompleted = (existingJobs || []).find(j => {
        const jobTime = new Date(j.created_date).getTime();
        return j.trigger_event === trigger_event &&
          j.status === 'completed' &&
          Date.now() - jobTime < 24 * 60 * 60 * 1000;
      });

      if (recentCompleted) {
        return { proceed: false, reason: 'completed_job_exists_within_24h', existing_id: recentCompleted.id };
      }
    } catch (_) {}
  }

  return { proceed: true, reason: 'guardrail_passed' };
}

/**
 * Mark the outcome of a guardrail check in the EventDedupLog
 * Call this AFTER a successful execution to prevent future duplicates
 */
export async function markGuardrailOutcome(base44, { lead_id, event_type, idempotency_key, outcome, job_id }) {
  try {
    // Record in dedup log
    if (lead_id && event_type) {
      await base44.entities.EventDedupLog.create({
        lead_id,
        event_type,
        idempotency_key: idempotency_key || `${lead_id}_${event_type}_${Date.now()}`,
        outcome: outcome || 'processed',
        job_id,
        processed_at: new Date().toISOString(),
      }).catch(() => null);
    }

    // Mark idempotency key as processed
    if (idempotency_key) {
      const existing = await base44.entities.IdempotencyKey.filter({ key: idempotency_key }, '-created_date', 1);
      if (existing && existing.length > 0) {
        await base44.entities.IdempotencyKey.update(existing[0].id, {
          status: 'processed',
          processed_at: new Date().toISOString(),
        }).catch(() => null);
      }
    }
  } catch (_) {}
}

/**
 * Build an idempotency key from components
 */
export function buildIdempotencyKey(...parts) {
  return parts.filter(Boolean).join('_');
}

/**
 * Check retry safety — returns false if max retries exceeded or original already succeeded
 */
export function isRetrieSafe({ retry_count = 0, status, max_retries = MAX_RETRIES }) {
  if (retry_count >= max_retries) return false;
  if (status === 'completed' || status === 'success') return false;
  return true;
}

/**
 * Append safety flags to a CommunicationEvent update payload (non-destructive)
 */
export function buildSafetyFlags({ duplicate_detected = false, execution_skipped = false, retry_blocked = false, reason = '' }) {
  return {
    duplicate_detected,
    execution_skipped,
    retry_blocked,
    safety_flag_reason: reason,
    safety_flagged_at: new Date().toISOString(),
  };
}