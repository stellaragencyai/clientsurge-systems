/**
 * AUTOMATION JOB ROUTER
 * Priority queue management for segment-based lead execution
 * Ensures HOT > WARM > COLD processing order
 */

import { compareAutomationJobPriority, calculateRevenueExecutionPriorityScore } from './segmentExecutionEngine.js';

/**
 * Priority tier configurations for different job queues
 */
export const PRIORITY_TIERS = {
  HOT: {
    tier: 1,
    max_queue_size: 100, // Keep HOT queue small, process quickly
    processing_interval: 'real-time', // Process immediately
    timeout_minutes: 30,
  },
  WARM: {
    tier: 2,
    max_queue_size: 500,
    processing_interval: 'every_2_hours',
    timeout_minutes: 480, // 8 hours
  },
  COLD: {
    tier: 3,
    max_queue_size: 2000,
    processing_interval: 'daily_off_peak',
    timeout_minutes: 1440, // 24 hours
  },
};

/**
 * Sort automation jobs by priority
 * Returns jobs ordered: HOT → WARM → COLD
 */
export function sortJobsByPriority(jobs) {
  return [...jobs].sort(compareAutomationJobPriority);
}

/**
 * Filter jobs for processing in a given batch
 * Respects segment priority and frequency caps
 */
export function filterJobsForBatch(jobs, batchSize = 50) {
  // Sort all jobs by priority
  const sorted = sortJobsByPriority(jobs);

  // Take top jobs, respecting HOT queue limits
  const hotJobs = sorted.filter(j => j.segment_label === 'HOT').slice(0, batchSize);
  const warmJobs = sorted.filter(j => j.segment_label === 'WARM').slice(0, batchSize - hotJobs.length);
  const coldJobs = sorted.filter(j => j.segment_label === 'COLD').slice(0, batchSize - hotJobs.length - warmJobs.length);

  return [...hotJobs, ...warmJobs, ...coldJobs];
}

/**
 * Get next job to process from queue
 * Respects priority and availability
 */
export function getNextJobInQueue(jobs) {
  if (!jobs || jobs.length === 0) return null;

  // Find first HOT job not yet processed
  const hotJob = jobs.find(j => j.segment_label === 'HOT' && j.status === 'pending');
  if (hotJob) return hotJob;

  // Find first WARM job not yet processed
  const warmJob = jobs.find(j => j.segment_label === 'WARM' && j.status === 'pending');
  if (warmJob) return warmJob;

  // Find first COLD job not yet processed
  const coldJob = jobs.find(j => j.segment_label === 'COLD' && j.status === 'pending');
  if (coldJob) return coldJob;

  return null;
}

/**
 * Check if job meets processing criteria
 */
export function isJobReadyToProcess(job, now = new Date()) {
  if (job.status !== 'pending') return false;

  // Check scheduled time
  if (job.scheduled_for) {
    const scheduledTime = new Date(job.scheduled_for);
    if (scheduledTime > now) return false; // Not yet scheduled
  }

  // Check retry count
  if (job.retry_count && job.max_retries) {
    if (job.retry_count >= job.max_retries) return false;
  }

  return true;
}

/**
 * Calculate processing delay for a job
 * HOT = immediate, WARM = small delay, COLD = large delay
 */
export function getProcessingDelayMs(segment) {
  const delays = {
    HOT: 0, // Process immediately
    WARM: 1000 * 60 * 30, // 30-minute batching
    COLD: 1000 * 60 * 60 * 24, // Daily batching
  };

  return delays[segment] || delays.WARM;
}

/**
 * Estimate processing time for a batch
 */
export function estimateBatchProcessingTime(jobs, msPerJob = 1000) {
  const hotJobs = jobs.filter(j => j.segment_label === 'HOT').length;
  const warmJobs = jobs.filter(j => j.segment_label === 'WARM').length;
  const coldJobs = jobs.filter(j => j.segment_label === 'COLD').length;

  return {
    hot_count: hotJobs,
    warm_count: warmJobs,
    cold_count: coldJobs,
    total_count: jobs.length,
    estimated_minutes: Math.ceil((jobs.length * msPerJob) / (1000 * 60)),
  };
}

/**
 * Create AutomationJob from execution action
 */
export function createAutomationJob(lead, action, segmentLabel) {
  return {
    lead_id: lead.id,
    segment_label: segmentLabel,
    priority_score: calculateRevenueExecutionPriorityScore(lead),
    action_type: action.type,
    message_template: action.template,
    content_type: action.content_type,
    scheduled_for: action.scheduled_for || new Date().toISOString(),
    status: 'pending',
    retry_count: 0,
    max_retries: { HOT: 3, WARM: 2, COLD: 1 }[segmentLabel] || 2,
    created_at: new Date().toISOString(),
    metadata: {
      segment: segmentLabel,
      priority: PRIORITY_TIERS[segmentLabel]?.tier,
    },
  };
}

/**
 * Batch create jobs from sequence
 */
export function createAutomationJobsFromSequence(lead, executionSequence) {
  return executionSequence.actions_sequence.map((action, index) => {
    return {
      lead_id: lead.id,
      segment_label: executionSequence.segment_label,
      priority_score: executionSequence.priority_score,
      step: index + 1,
      action_type: action.type,
      message_template: action.template,
      scheduled_for: action.scheduled_for || new Date().toISOString(),
      status: 'pending',
      retry_count: 0,
      max_retries: { HOT: 3, WARM: 2, COLD: 1 }[executionSequence.segment_label] || 2,
      created_at: new Date().toISOString(),
      metadata: {
        segment: executionSequence.segment_label,
        priority: PRIORITY_TIERS[executionSequence.segment_label]?.tier,
        total_steps: executionSequence.actions_sequence.length,
      },
    };
  });
}

/**
 * Update job status after processing
 */
export function updateJobStatus(job, newStatus, result = null) {
  return {
    ...job,
    status: newStatus,
    last_processed_at: new Date().toISOString(),
    result: result,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Retry job with exponential backoff
 */
export function retryJob(job) {
  const backoffMs = Math.pow(2, job.retry_count || 0) * 60 * 1000; // 1min, 2min, 4min, etc.
  const nextRetryTime = new Date(Date.now() + backoffMs);

  return {
    ...job,
    status: 'pending',
    retry_count: (job.retry_count || 0) + 1,
    scheduled_for: nextRetryTime.toISOString(),
    last_error: null,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Get job queue stats
 */
export function getQueueStats(jobs) {
  return {
    total_jobs: jobs.length,
    pending_count: jobs.filter(j => j.status === 'pending').length,
    hot_count: jobs.filter(j => j.segment_label === 'HOT').length,
    warm_count: jobs.filter(j => j.segment_label === 'WARM').length,
    cold_count: jobs.filter(j => j.segment_label === 'COLD').length,
    oldest_pending_age_minutes: jobs.filter(j => j.status === 'pending').length > 0
      ? Math.floor((Date.now() - new Date(jobs.filter(j => j.status === 'pending')[0].created_at).getTime()) / (1000 * 60))
      : 0,
  };
}

export default {
  PRIORITY_TIERS,
  sortJobsByPriority,
  filterJobsForBatch,
  getNextJobInQueue,
  isJobReadyToProcess,
  getProcessingDelayMs,
  estimateBatchProcessingTime,
  createAutomationJob,
  createAutomationJobsFromSequence,
  updateJobStatus,
  retryJob,
  getQueueStats,
};