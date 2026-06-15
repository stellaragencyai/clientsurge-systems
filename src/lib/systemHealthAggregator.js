/**
 * Task 50 — System health aggregator
 * Computes a global Green/Yellow/Red status from aggregate metrics
 */

export const HEALTH_STATUS = {
  GREEN: 'green',
  YELLOW: 'yellow',
  RED: 'red',
};

/**
 * @param {object} metrics
 * @param {number} metrics.failedEventsCount
 * @param {number} metrics.deadLetterCount
 * @param {number} metrics.openAlertsCount
 * @param {number} metrics.circuitBreakerOpen
 * @returns {{ status: string, reasons: string[] }}
 */
export function computeSystemHealth(metrics = {}) {
  const reasons = [];

  if (metrics.circuitBreakerOpen) {
    reasons.push('Circuit breaker is OPEN — provider failures detected');
  }
  if (metrics.deadLetterCount > 0) {
    reasons.push(`${metrics.deadLetterCount} dead-letter events require attention`);
  }
  if (metrics.failedEventsCount > 10) {
    reasons.push(`High failed event count: ${metrics.failedEventsCount}`);
  }
  if (metrics.openAlertsCount > 5) {
    reasons.push(`${metrics.openAlertsCount} unresolved automation alerts`);
  }

  let status = HEALTH_STATUS.GREEN;
  if (metrics.circuitBreakerOpen || metrics.deadLetterCount > 0) {
    status = HEALTH_STATUS.RED;
  } else if (metrics.failedEventsCount > 10 || metrics.openAlertsCount > 5) {
    status = HEALTH_STATUS.YELLOW;
  }

  return { status, reasons };
}