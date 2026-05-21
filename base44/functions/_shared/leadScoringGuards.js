export const MIN_LEAD_SCORE_CONFIDENCE = 0.6;

export function normalizeLeadScoreConfidence(value, fallback = 1) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(1, numeric));
}

export function shouldApplyLeadScoreResult(result, minConfidence = MIN_LEAD_SCORE_CONFIDENCE) {
  const confidence = normalizeLeadScoreConfidence(result?.confidence, 1);
  return {
    confidence,
    shouldApply: confidence >= minConfidence,
  };
}
