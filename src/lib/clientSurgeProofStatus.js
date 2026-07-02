export const CLIENTSURGE_PROOF_STATUSES = [
  "trusted",
  "warning",
  "blocked",
  "unknown",
  "stale",
  "pending",
];

export const CLIENTSURGE_PROOF_STATUS_LABELS = {
  trusted: "Trusted",
  warning: "Warning",
  blocked: "Blocked",
  unknown: "Unknown",
  stale: "Stale",
  pending: "Pending",
};

export const CLIENTSURGE_PROOF_STATUS_DESCRIPTIONS = {
  trusted: "Verified recently with direct evidence.",
  warning: "Working or partially working, but attention is needed.",
  blocked: "Cannot proceed safely until this is resolved.",
  unknown: "No current evidence is available.",
  stale: "Evidence exists, but it is outside the freshness window.",
  pending: "A check or deployment is still in progress.",
};

export function normalizeClientSurgeProofStatus(status) {
  const normalized = String(status || "unknown").trim().toLowerCase();
  return CLIENTSURGE_PROOF_STATUSES.includes(normalized) ? normalized : "unknown";
}

export function getClientSurgeProofStatusLabel(status) {
  return CLIENTSURGE_PROOF_STATUS_LABELS[normalizeClientSurgeProofStatus(status)];
}

export function getClientSurgeProofStatusDescription(status) {
  return CLIENTSURGE_PROOF_STATUS_DESCRIPTIONS[normalizeClientSurgeProofStatus(status)];
}

export function isClientSurgeProofFresh(checkedAt, freshnessWindowMs) {
  if (!checkedAt || !freshnessWindowMs) return false;
  const checkedTime = new Date(checkedAt).getTime();
  if (Number.isNaN(checkedTime)) return false;
  return Date.now() - checkedTime <= freshnessWindowMs;
}

export function resolveClientSurgeProofStatus({ status, checkedAt, freshnessWindowMs }) {
  const normalized = normalizeClientSurgeProofStatus(status);
  if (normalized === "trusted" && freshnessWindowMs && !isClientSurgeProofFresh(checkedAt, freshnessWindowMs)) {
    return "stale";
  }
  return normalized;
}
