/**
 * Evidence Quality Levels — admin-only label system.
 * Classifies each evidence source string from the audit into one of four quality tiers.
 */

export const EVIDENCE_QUALITY = {
  strong: {
    key: "strong",
    label: "Strong Evidence",
    color: "#059669",
    description: "Final outcome confirmed by provider/status/proof record",
  },
  medium: {
    key: "medium",
    label: "Medium Evidence",
    color: "#D97706",
    description: "Valid attempt or configuration exists, but final outcome is not confirmed",
  },
  weak: {
    key: "weak",
    label: "Weak Evidence",
    color: "#DC2626",
    description: "Incomplete, internal-only, missing fields, or not tied to a real lead/client",
  },
  none: {
    key: "none",
    label: "No Evidence",
    color: "#6B7280",
    description: "Nothing usable found",
  },
};

/**
 * Classify a single evidence source string into a quality tier.
 */
export function classifyEvidence(sourceStr, cap) {
  if (!sourceStr || sourceStr === "No evidence checked") return "none";

  const lower = sourceStr.toLowerCase();

  // AutomationProofLog with passed > 0 = strong
  if (lower.includes("automationprooflog") && lower.includes("passed")) {
    const match = sourceStr.match(/\((\d+)\s*passed\)/i);
    if (match && parseInt(match[1], 10) > 0) return "strong";
    return "weak"; // proof log exists but 0 passed
  }

  // CommunicationLog with delivered > 0 = strong
  if (lower.includes("communicationlog") && lower.includes("delivered")) {
    const match = sourceStr.match(/\((\d+)\s*delivered\)/i);
    if (match && parseInt(match[1], 10) > 0) return "strong";
    // delivered count is 0
    if (lower.includes("attempts")) return "medium"; // attempts exist, 0 delivered
    return "weak";
  }

  // CommunicationLog with attempts but 0 delivered = medium
  if (lower.includes("communicationlog") && lower.includes("attempts")) {
    return "medium";
  }

  // Mentions "not set", "missing", "no " = weak
  if (lower.includes("not set") || lower.includes("missing") || lower.includes("no ")) {
    return "weak";
  }

  // Default: medium (configuration/attempt exists but unconfirmed)
  return "medium";
}

/**
 * Classify all evidence sources for a capability.
 * Returns array of { source, quality } objects.
 */
export function classifyCapabilityEvidence(cap) {
  const sources = cap?.evidence_sources || [];
  return sources.map((src) => ({
    source: src,
    quality: classifyEvidence(src, cap),
  }));
}

/**
 * Get the overall evidence quality for a capability.
 * Returns the highest quality tier found across all evidence sources.
 */
export function overallEvidenceQuality(cap) {
  const classified = classifyCapabilityEvidence(cap);
  if (classified.length === 0) return "none";

  const hasStrong = classified.some((e) => e.quality === "strong");
  const hasMedium = classified.some((e) => e.quality === "medium");
  const hasWeak = classified.some((e) => e.quality === "weak");

  if (hasStrong) return "strong";
  if (hasMedium) return "medium";
  if (hasWeak) return "weak";
  return "none";
}