/**
 * PRODUCTION SAFETY UTILITIES
 * Frontend helpers for environment-aware behavior, rate limit display, and health status.
 */

export const HEALTH_STATUS = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  CRITICAL: 'critical',
};

// Safe throughput thresholds (advisory — not enforced in UI)
export const RATE_LIMITS = {
  SMS_PER_HOUR: 60,
  SMS_PER_DAY: 800,
  EMAIL_PER_DAY: 500,
  QUEUE_SAFE_BACKLOG: 20,
  QUEUE_WARN_BACKLOG: 100,
  AUTOMATION_MIN_SUCCESS_RATE: 80,
  AUTOMATION_CRITICAL_RATE: 60,
};

/**
 * Returns a color class and label based on health status string.
 */
export function getHealthStyle(status) {
  switch (status) {
    case 'healthy':
      return { badge: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500', label: 'Healthy' };
    case 'degraded':
      return { badge: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500', label: 'Degraded' };
    case 'critical':
      return { badge: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', label: 'Critical' };
    default:
      return { badge: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400', label: 'Unknown' };
  }
}

/**
 * Returns overall production readiness from a metrics object.
 */
export function computeProductionReadiness(metrics) {
  if (!metrics) return { ready: false, score: 0, issues: [] };
  const issues = [];
  let score = 100;

  if (metrics.queue_health?.status === 'critical') { score -= 30; issues.push('Queue backlog critical'); }
  else if (metrics.queue_health?.status === 'degraded') { score -= 10; issues.push('Queue backlog elevated'); }

  if (metrics.automation_health?.status === 'critical') { score -= 30; issues.push('Automation success rate critical'); }
  else if (metrics.automation_health?.status === 'degraded') { score -= 15; issues.push('Automation success rate degraded'); }

  if (metrics.messaging_health?.status === 'critical') { score -= 25; issues.push('Messaging delivery failures high'); }
  else if (metrics.messaging_health?.status === 'degraded') { score -= 10; issues.push('Messaging delivery degraded'); }

  if (metrics.automation_health?.cascade_risk) { score -= 15; issues.push('Cascade failure risk detected'); }
  if (metrics.messaging_health?.sms_rate_limit_warning) { score -= 5; issues.push('SMS rate near limit'); }
  if (metrics.messaging_health?.email_rate_limit_warning) { score -= 5; issues.push('Email rate near limit'); }

  return {
    ready: score >= 70,
    score: Math.max(0, score),
    issues,
  };
}