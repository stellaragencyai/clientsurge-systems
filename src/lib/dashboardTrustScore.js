const DEFAULT_WEIGHTS = Object.freeze({
  blocker: 25,
  warning: 8,
  staleSource: 12,
  missingSource: 15,
});

const DEFAULT_CAPS = Object.freeze({
  blocker: 75,
  warning: 24,
  staleSource: 36,
  missingSource: 45,
});

function count(value) {
  if (Array.isArray(value)) return value.length;
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function cappedPenalty(total, weight, cap) {
  return Math.min(total * weight, cap);
}

export function dashboardTrustBand(score, blockerCount = 0) {
  if (score <= 0) return "no_evidence";
  if (blockerCount > 0) return "blocked";
  if (score >= 90) return "trusted";
  if (score >= 70) return "warning";
  return "blocked";
}

export function computeDashboardTrustScore(input = {}, options = {}) {
  const weights = { ...DEFAULT_WEIGHTS, ...(options.weights || {}) };
  const caps = { ...DEFAULT_CAPS, ...(options.caps || {}) };

  const blockerCount = count(input.blockers ?? input.blocker_count);
  const warningCount = count(input.warnings ?? input.warning_count);
  const staleSourceCount = count(input.stale_sources ?? input.stale_source_count);
  const missingSourceCount = count(input.missing_sources ?? input.missing_source_count);
  const evidenceCount = count(input.evidence_records ?? input.evidence_count);

  const penalties = {
    blockers: cappedPenalty(blockerCount, weights.blocker, caps.blocker),
    warnings: cappedPenalty(warningCount, weights.warning, caps.warning),
    stale_sources: cappedPenalty(staleSourceCount, weights.staleSource, caps.staleSource),
    missing_sources: cappedPenalty(missingSourceCount, weights.missingSource, caps.missingSource),
  };

  const totalPenalty = Object.values(penalties).reduce((sum, value) => sum + value, 0);
  let score = Math.max(0, Math.min(100, 100 - totalPenalty));

  if (evidenceCount === 0 && blockerCount === 0 && warningCount === 0 && staleSourceCount === 0 && missingSourceCount === 0) {
    score = 0;
  }

  const band = dashboardTrustBand(score, blockerCount);

  return {
    score,
    band,
    blocker_count: blockerCount,
    warning_count: warningCount,
    stale_source_count: staleSourceCount,
    missing_source_count: missingSourceCount,
    evidence_count: evidenceCount,
    penalties,
    total_penalty: totalPenalty,
    safe_to_launch: band === "trusted" && blockerCount === 0,
    formula_version: "dashboard-trust-v1",
  };
}
