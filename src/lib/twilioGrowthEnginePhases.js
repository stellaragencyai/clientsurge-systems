/**
 * Shared Implementation Phase computation for Twilio Growth Engine capabilities.
 *
 * Phase 0: Not started — nothing usable found
 * Phase 1: Schema/config exists — configuration or schema present, no activity
 * Phase 2: Logs/events exist — activity records exist, proof incomplete
 * Phase 3: Proof records exist — AutomationProofLog passed, may still have blockers
 * Phase 4: Trusted production-ready — proof passed AND no active blockers
 */

export const PHASE_LABELS = {
  0: { label: "Phase 0 — Not Started", short: "P0", color: "#6B7280", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.2)" },
  1: { label: "Phase 1 — Schema/Config Exists", short: "P1", color: "#9333EA", bg: "rgba(147,51,234,0.06)", border: "rgba(147,51,234,0.2)" },
  2: { label: "Phase 2 — Logs/Events Exist", short: "P2", color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)" },
  3: { label: "Phase 3 — Proof Records Exist", short: "P3", color: "#2563EB", bg: "rgba(37,99,235,0.06)", border: "rgba(37,99,235,0.2)" },
  4: { label: "Phase 4 — Trusted Production-Ready", short: "P4", color: "#059669", bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.2)" },
};

export const PHASE_ACTIONS = {
  0: "Configure schema and integration settings to move to Phase 1.",
  1: "Generate real activity logs or events to move to Phase 2.",
  2: "Create and pass AutomationProofLog records to move to Phase 3.",
  3: "Resolve all active blockers to reach Phase 4 (trusted production-ready).",
  4: "Maintain proof records and monitor for regressions.",
};

/**
 * Computes the implementation phase (0-4) for a single capability.
 * @param {object} cap - capability object from audit data
 * @returns {object} { phase, phase_label, has_config, has_logs, has_proof, has_blockers }
 */
export function computePhase(cap) {
  if (!cap) return { phase: 0, has_config: false, has_logs: false, has_proof: false, has_blockers: false };

  const hasProof = cap.proof?.passed > 0;
  const hasProofRecords = cap.proof?.total > 0;
  const hasBlockers = (cap.blockers || []).length > 0;
  const hasEvidence = (cap.evidence_sources || []).some(s => !s.includes("0 passed") && !s.includes("No evidence"));
  const hasLogs = hasEvidence || cap.proof?.total > 0;

  // Phase 4: proof passed AND no blockers
  if (hasProof && !hasBlockers) {
    return { phase: 4, has_config: true, has_logs: true, has_proof: true, has_blockers: false };
  }
  // Phase 3: proof records exist (passed or not), may have blockers
  if (hasProofRecords || hasProof) {
    return { phase: 3, has_config: true, has_logs: true, has_proof: true, has_blockers: hasBlockers };
  }
  // Phase 2: logs/events exist but no proof
  if (hasLogs) {
    return { phase: 2, has_config: true, has_logs: true, has_proof: false, has_blockers: hasBlockers };
  }
  // Phase 1: status is yellow (partial = config exists) or has evidence sources mentioning config
  if (cap.status === "yellow" || hasEvidence) {
    return { phase: 1, has_config: true, has_logs: false, has_proof: false, has_blockers: hasBlockers };
  }
  // Phase 0: nothing usable
  return { phase: 0, has_config: false, has_logs: false, has_proof: false, has_blockers: hasBlockers };
}

/**
 * Computes phases for all capabilities and returns them grouped by phase.
 * @param {array} capabilities - from audit data
 * @returns {object} { byPhase: { 0: [...], 1: [...], ... }, all: [{cap, phase, ...}], summary: {0: n, 1: n, ...} }
 */
export function computeAllPhases(capabilities) {
  const all = (capabilities || []).map(cap => {
    const phaseInfo = computePhase(cap);
    return { ...cap, ...phaseInfo };
  });

  const byPhase = { 0: [], 1: [], 2: [], 3: [], 4: [] };
  for (const item of all) {
    byPhase[item.phase]?.push(item);
  }

  const summary = { 0: byPhase[0].length, 1: byPhase[1].length, 2: byPhase[2].length, 3: byPhase[3].length, 4: byPhase[4].length };

  return { byPhase, all, summary };
}