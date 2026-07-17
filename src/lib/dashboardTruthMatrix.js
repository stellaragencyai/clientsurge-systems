export const DASHBOARD_TRUTH_CLASSIFICATIONS = Object.freeze({
  TRUSTED: 'Trusted',
  UNVERIFIED: 'Unverified',
  BROKEN: 'Broken',
  NEEDS_INSTRUMENTATION: 'Needs Instrumentation',
});

const LEGACY_ENTITY_PATTERNS = [
  /legacy/i,
  /deprecated/i,
  /old_/i,
  /v1_/i,
];

function asCount(value) {
  if (Array.isArray(value)) return value.length;
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

export function detectLegacyDependencies(sourceRecords = {}) {
  return Object.keys(sourceRecords || {}).filter((key) =>
    LEGACY_ENTITY_PATTERNS.some((pattern) => pattern.test(key))
  );
}

export function classifyDashboardTruth(input = {}) {
  const blockerCount = asCount(input.blockers ?? input.blocker_count);
  const warningCount = asCount(input.warnings ?? input.warning_count);
  const missingSourceCount = asCount(input.missing_sources ?? input.missing_source_count);
  const staleSourceCount = asCount(input.stale_sources ?? input.stale_source_count);
  const evidenceCount = asCount(input.evidence_records ?? input.evidence_count);
  const sourceRecords = input.source_records || {};
  const legacyDependencies = detectLegacyDependencies(sourceRecords);
  const explicitBand = String(input.trust_band || input.truth_status || '').toLowerCase();

  if (blockerCount > 0 || explicitBand === 'blocked' || explicitBand === 'broken') {
    return {
      classification: DASHBOARD_TRUTH_CLASSIFICATIONS.BROKEN,
      reason: blockerCount > 0
        ? `${blockerCount} blocking condition${blockerCount === 1 ? '' : 's'} recorded.`
        : 'The canonical truth state is blocked.',
      blocker_count: blockerCount,
      warning_count: warningCount,
      missing_source_count: missingSourceCount,
      stale_source_count: staleSourceCount,
      evidence_count: evidenceCount,
      legacy_dependencies: legacyDependencies,
      safe_to_trust: false,
    };
  }

  if (missingSourceCount > 0 || evidenceCount === 0 || explicitBand === 'no_evidence') {
    return {
      classification: DASHBOARD_TRUTH_CLASSIFICATIONS.NEEDS_INSTRUMENTATION,
      reason: evidenceCount === 0
        ? 'No persisted evidence records support this status.'
        : `${missingSourceCount} required proof source${missingSourceCount === 1 ? ' is' : 's are'} missing.`,
      blocker_count: blockerCount,
      warning_count: warningCount,
      missing_source_count: missingSourceCount,
      stale_source_count: staleSourceCount,
      evidence_count: evidenceCount,
      legacy_dependencies: legacyDependencies,
      safe_to_trust: false,
    };
  }

  if (warningCount > 0 || staleSourceCount > 0 || legacyDependencies.length > 0 || explicitBand === 'warning' || explicitBand === 'unknown') {
    const reason = legacyDependencies.length > 0
      ? `Legacy dependencies detected: ${legacyDependencies.join(', ')}.`
      : staleSourceCount > 0
        ? `${staleSourceCount} evidence source${staleSourceCount === 1 ? ' is' : 's are'} stale.`
        : `${warningCount} warning${warningCount === 1 ? '' : 's'} recorded.`;
    return {
      classification: DASHBOARD_TRUTH_CLASSIFICATIONS.UNVERIFIED,
      reason,
      blocker_count: blockerCount,
      warning_count: warningCount,
      missing_source_count: missingSourceCount,
      stale_source_count: staleSourceCount,
      evidence_count: evidenceCount,
      legacy_dependencies: legacyDependencies,
      safe_to_trust: false,
    };
  }

  if (explicitBand === 'trusted' && evidenceCount > 0) {
    return {
      classification: DASHBOARD_TRUTH_CLASSIFICATIONS.TRUSTED,
      reason: `${evidenceCount} persisted evidence source${evidenceCount === 1 ? '' : 's'} support this status with no blockers, warnings, stale sources, or missing instrumentation.`,
      blocker_count: blockerCount,
      warning_count: warningCount,
      missing_source_count: missingSourceCount,
      stale_source_count: staleSourceCount,
      evidence_count: evidenceCount,
      legacy_dependencies: legacyDependencies,
      safe_to_trust: true,
    };
  }

  return {
    classification: DASHBOARD_TRUTH_CLASSIFICATIONS.UNVERIFIED,
    reason: 'The status is not backed by an explicit trusted truth band.',
    blocker_count: blockerCount,
    warning_count: warningCount,
    missing_source_count: missingSourceCount,
    stale_source_count: staleSourceCount,
    evidence_count: evidenceCount,
    legacy_dependencies: legacyDependencies,
    safe_to_trust: false,
  };
}
