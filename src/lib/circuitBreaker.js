/**
 * Task 12 — Webhook circuit breaker
 * Suspends processing after 3+ consecutive provider failures
 */

const state = {
  failures: 0,
  lastFailureAt: null,
  open: false,
  openedAt: null,
};

const FAILURE_THRESHOLD = 3;
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

export function recordSuccess() {
  state.failures = 0;
  state.open = false;
  state.openedAt = null;
}

export function recordFailure() {
  state.failures += 1;
  state.lastFailureAt = Date.now();
  if (state.failures >= FAILURE_THRESHOLD) {
    state.open = true;
    state.openedAt = Date.now();
  }
}

export function isCircuitOpen() {
  if (!state.open) return false;
  // Auto-reset after cooldown
  if (state.openedAt && Date.now() - state.openedAt > COOLDOWN_MS) {
    state.open = false;
    state.failures = 0;
    return false;
  }
  return true;
}

export function getCircuitStatus() {
  return {
    open: state.open,
    failures: state.failures,
    lastFailureAt: state.lastFailureAt,
    openedAt: state.openedAt,
  };
}