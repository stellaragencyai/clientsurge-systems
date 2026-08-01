const RETRY_DELAYS_MINUTES = [1, 5, 30];
const MAX_RETRY_ATTEMPTS = RETRY_DELAYS_MINUTES.length;

export function getRetryDelayMinutes(attempts = 0) {
  return RETRY_DELAYS_MINUTES[Math.min(Math.max(Number(attempts) || 0, 0), RETRY_DELAYS_MINUTES.length - 1)];
}

export function shouldRetryAutomationJob(attempts = 0) {
  return (Number(attempts) || 0) < MAX_RETRY_ATTEMPTS;
}

export function buildRetrySchedulePatch({ attempts = 0, error = "", now = new Date() } = {}) {
  const nextAttempts = (Number(attempts) || 0) + 1;
  const retryable = shouldRetryAutomationJob(attempts);

  if (!retryable) {
    return {
      status: "terminal",
      attempts: Number(attempts) || 0,
      last_error: error || null,
      terminal_reason: "max_retry_attempts_exceeded",
      processed_at: now.toISOString(),
    };
  }

  const scheduledFor = new Date(now.getTime() + getRetryDelayMinutes(attempts) * 60 * 1000);
  return {
    status: "retryable",
    attempts: nextAttempts,
    last_error: error || null,
    scheduled_for: scheduledFor.toISOString(),
  };
}

export function isAutomationJobDue(job = {}, now = new Date()) {
  if (!["queued", "retryable"].includes(job.status)) {
    return false;
  }

  if (!job.scheduled_for) {
    return true;
  }

  return new Date(job.scheduled_for).getTime() <= now.getTime();
}

export function buildFailedSendRetryJob({
  lead,
  channel,
  message,
  subject = "",
  source = "website_lead_response",
  step = 0,
  stepKey = "",
  now = new Date(),
} = {}) {
  const isSms = channel === "sms";
  return {
    lead_id: lead?.id,
    job_type: isSms ? "instant_sms" : "confirmation_email",
    trigger_event: source,
    status: "queued",
    attempts: 0,
    scheduled_for: new Date(now.getTime() + RETRY_DELAYS_MINUTES[0] * 60 * 1000).toISOString(),
    result_metadata: JSON.stringify({
      source,
      channel,
      message,
      subject,
      step,
      step_key: stepKey,
      context_id: lead?.id,
      context_type: "website_lead",
      queued_at: now.toISOString(),
    }),
  };
}
