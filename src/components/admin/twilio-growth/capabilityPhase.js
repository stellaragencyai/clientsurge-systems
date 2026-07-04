/**
 * Shared Implementation Phase logic for the Twilio Growth Engine.
 *
 * Phase 0: Not started — nothing usable found
 * Phase 1: Schema/config exists — configuration is set but no activity
 * Phase 2: Logs/events exist — activity recorded but proof incomplete
 * Phase 3: Proof records exist — AutomationProofLog pass exists, may have blockers
 * Phase 4: Trusted production-ready — proof + no blockers
 */

export const PHASE_CONFIG = {
  0: { label: "Phase 0 — Not Started", color: "#DC2626", bg: "rgba(220,38,38,0.05)", border: "rgba(220,38,38,0.18)", shortLabel: "P0" },
  1: { label: "Phase 1 — Schema/Config", color: "#EA580C", bg: "rgba(234,88,12,0.05)", border: "rgba(234,88,12,0.18)", shortLabel: "P1" },
  2: { label: "Phase 2 — Logs/Events", color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)", shortLabel: "P2" },
  3: { label: "Phase 3 — Proof Records", color: "#2563EB", bg: "rgba(37,99,235,0.06)", border: "rgba(37,99,235,0.2)", shortLabel: "P3" },
  4: { label: "Phase 4 — Trusted / Production-Ready", color: "#059669", bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.2)", shortLabel: "P4" },
};

export const PHASE_ADVANCE_ACTIONS = {
  0: "Create schema/config and set up provider credentials.",
  1: "Trigger real activity — send a test lead or inbound call to generate logs/events.",
  2: "Create and pass an AutomationProofLog record for this capability.",
  3: "Resolve all blockers and confirm no active issues remain.",
  4: "Maintain proof records and monitor for regressions.",
};

/**
 * Computes the implementation phase (0-4) for a capability from audit data.
 *
 * Rules:
 * - Phase 4 requires proof records AND no active blockers.
 * - Phase 3 requires proof records but may still have blockers.
 * - Phase 2 means activity/logs exist but proof is incomplete.
 * - Phase 1 means only configuration/schema exists.
 * - Phase 0 means nothing usable found.
 */
export function computePhase(capability, data) {
  if (!capability) return 0;

  const hasProof = capability.proof?.passed > 0;
  const hasProofTotal = capability.proof?.total > 0;
  const hasBlockers = (capability.blockers?.length || 0) > 0;
  const hasEvidenceSources = (capability.evidence_sources?.length || 0) > 0;
  const evidenceMentionsZero = (capability.evidence_sources || []).some(s =>
    /0 passed|0 delivered|0 attempts|No evidence/i.test(s)
  );

  // Phase 4: proof + no blockers
  if (hasProof && !hasBlockers) return 4;
  // Phase 3: proof records exist but blockers remain
  if (hasProof && hasBlockers) return 3;
  // Phase 3 also if proof total exists (pending/failed) but no passes yet
  if (hasProofTotal) return 3;
  // Phase 2: activity/logs exist but no proof
  if (hasEvidenceSources && !evidenceMentionsZero) return 2;
  // Phase 1: check for config existence via evidence sources that mention config
  if (hasEvidenceSources) return 1;
  // Phase 0: nothing usable
  return 0;
}

export function getPhaseLabel(phase) {
  return PHASE_CONFIG[phase]?.label || PHASE_CONFIG[0].label;
}

export function getPhaseConfig(phase) {
  return PHASE_CONFIG[phase] || PHASE_CONFIG[0];
}