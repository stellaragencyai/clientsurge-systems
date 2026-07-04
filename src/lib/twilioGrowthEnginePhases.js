/**
 * Implementation Phase Labels for the Twilio Growth Engine.
 *
 * Phase 0 — Not started: nothing usable found
 * Phase 1 — Schema/config exists: configuration flags exist but no activity
 * Phase 2 — Logs/events exist: activity/logs exist but proof is incomplete
 * Phase 3 — Proof records exist: proof records exist but may still have blockers
 * Phase 4 — Trusted production-ready: proof records exist AND no active blockers
 *
 * Computed purely from audit data returned by getTwilioGrowthEngineAudit.
 */

export const PHASES = {
  0: { label: "Phase 0", short: "P0", name: "Not Started", color: "#6B7280", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.2)" },
  1: { label: "Phase 1", short: "P1", name: "Schema/Config", color: "#2563EB", bg: "rgba(37,99,235,0.08)", border: "rgba(37,99,235,0.2)" },
  2: { label: "Phase 2", short: "P2", name: "Logs/Events", color: "#D97706", bg: "rgba(217,119,6,0.08)", border: "rgba(217,119,6,0.2)" },
  3: { label: "Phase 3", short: "P3", name: "Proof Exists", color: "#7C3AED", bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.2)" },
  4: { label: "Phase 4", short: "P4", name: "Trusted", color: "#059669", bg: "rgba(5,150,105,0.08)", border: "rgba(5,150,105,0.2)" },
};

export const PHASE_LABELS = PHASES;

export const PHASE_ACTIONS = {
  0: "Nothing usable found — build schema/config first.",
  1: "Schema/config exists — generate activity logs next.",
  2: "Logs exist but proof incomplete — create AutomationProofLog records.",
  3: "Proof records exist but blockers remain — resolve blockers.",
  4: "Trusted production-ready — maintain monitoring.",
};

/**
 * Computes the implementation phase (0-4) for a capability given audit data.
 * Alias: computeCapabilityPhase (for backward compatibility)
 */
export function computeCapabilityPhase(capability, auditData) {
  return computePhase(capability, auditData);
}

/**
 * Core phase computation function.
 */
export function computePhase(cap, auditData) {
  if (!cap) return { phase: 0, ...PHASES[0], reason: "No capability data found." };

  const proof = cap.proof || { total: 0, passed: 0, failed: 0, pending: 0 };
  const hasPassedProof = proof.passed > 0;
  const hasAnyProof = proof.total > 0;
  const hasBlockers = (cap.blockers || []).length > 0;

  // Phase 4: proof records passed AND no active blockers
  if (hasPassedProof && !hasBlockers) {
    return { phase: 4, ...PHASES[4], reason: "Proof records passed with no active blockers." };
  }

  // Phase 3: proof records exist (passed or pending) but blockers remain
  if (hasPassedProof && hasBlockers) {
    return { phase: 3, ...PHASES[3], reason: "Proof records exist but blockers remain." };
  }
  if (hasAnyProof && !hasPassedProof) {
    return { phase: 3, ...PHASES[3], reason: "Proof records exist but none passed yet." };
  }

  // Phase 2: logs/events/activity exist but no proof
  const hasEvidenceSources = (cap.evidence_sources || []).some(
    src => src && !src.includes("0 passed") && !src.includes("No evidence")
  );
  if (hasEvidenceSources) {
    return { phase: 2, ...PHASES[2], reason: "Logs/events exist but proof is incomplete." };
  }

  // Check for any related activity in audit data for this service key
  const deliveryStats = auditData?.delivery_stats || {};
  const eventStats = auditData?.event_stats || {};
  const voiceReadiness = auditData?.voice_readiness || {};

  if (cap.service_key) {
    if (cap.key === "ai_voice_receptionist" || cap.key === "voice_broadcasts") {
      if (voiceReadiness.inbound_voice_enabled || voiceReadiness.voice_calls_enabled || voiceReadiness.has_elevenlabs_agent_ids) {
        return { phase: 1, ...PHASES[1], reason: "Voice configuration exists but no activity logs or proof." };
      }
    } else if (deliveryStats.total > 0 || eventStats.total > 0) {
      return { phase: 2, ...PHASES[2], reason: "SMS logs exist but no proof for this service." };
    }
  }

  // Phase 1: check for config/schema existence
  const hasConfig = (cap.evidence_sources || []).length > 0 || cap.service_key;
  if (hasConfig) {
    if (cap.key === "automation_proof_logs") {
      return { phase: 0, ...PHASES[0], reason: "AutomationProofLog entity exists but no records found." };
    }
    return { phase: 1, ...PHASES[1], reason: "Schema/configuration exists but no activity logs found." };
  }

  return { phase: 0, ...PHASES[0], reason: "Nothing usable found — no config, logs, or proof." };
}

/**
 * Computes phase for a repair queue item.
 * Repair items are inherently blocked, so max phase is 3.
 */
export function computeRepairItemPhase(repairItem) {
  if (!repairItem) return { phase: 0, ...PHASES[0], reason: "No repair item data." };

  if (repairItem.repair_type === "missing_proof_record") {
    if (repairItem.evidence_source && repairItem.evidence_source.includes("0 passed")) {
      return { phase: 3, ...PHASES[3], reason: "Proof records exist but none passed." };
    }
    return { phase: 2, ...PHASES[2], reason: "Logs may exist but no proof records passed." };
  }

  if (repairItem.repair_type === "incomplete_checklist") {
    return { phase: 1, ...PHASES[1], reason: "Checklist/schema exists but required fields incomplete." };
  }

  if (repairItem.repair_type === "provider_error_in_logs") {
    return { phase: 2, ...PHASES[2], reason: "Logs exist but contain provider errors." };
  }

  if (repairItem.repair_type === "weak_evidence_record") {
    return { phase: 2, ...PHASES[2], reason: "Logs exist but evidence is weak/incomplete." };
  }

  if (repairItem.repair_type === "missing_voice_prerequisite") {
    if (repairItem.evidence_source && repairItem.evidence_source.includes("AdminSettings")) {
      return { phase: 1, ...PHASES[1], reason: "Some config exists but voice prerequisites incomplete." };
    }
    return { phase: 0, ...PHASES[0], reason: "Voice prerequisites not configured." };
  }

  if (repairItem.repair_type === "test_data_in_production") {
    return { phase: 2, ...PHASES[2], reason: "Logs exist but test data is mixed in." };
  }

  if (repairItem.repair_type === "missing_client_facing_trust") {
    return { phase: 0, ...PHASES[0], reason: "No client-facing trust evidence found." };
  }

  return { phase: 0, ...PHASES[0], reason: "Unable to determine phase." };
}

/**
 * Computes phases for all capabilities in bulk.
 */
export function computeAllPhases(capabilities, auditData) {
  if (!capabilities) return [];
  return capabilities.map(cap => ({
    ...cap,
    phaseInfo: computePhase(cap, auditData),
  }));
}