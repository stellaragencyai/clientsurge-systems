import { createClientFromRequest } from "npm:@base44/sdk@0.8.39";

const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

function count(value: unknown) {
  if (Array.isArray(value)) return value.length;
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function cappedPenalty(total: number, weight: number, cap: number) {
  return Math.min(total * weight, cap);
}

function computeScore(input: Record<string, unknown>) {
  const blockerCount = count(input.blockers ?? input.blocker_count);
  const warningCount = count(input.warnings ?? input.warning_count);
  const staleSourceCount = count(input.stale_sources ?? input.stale_source_count);
  const missingSourceCount = count(input.missing_sources ?? input.missing_source_count);
  const evidenceCount = count(input.evidence_records ?? input.evidence_count);
  const penalties = {
    blockers: cappedPenalty(blockerCount, 25, 75),
    warnings: cappedPenalty(warningCount, 8, 24),
    stale_sources: cappedPenalty(staleSourceCount, 12, 36),
    missing_sources: cappedPenalty(missingSourceCount, 15, 45),
  };
  const totalPenalty = Object.values(penalties).reduce((sum, value) => sum + value, 0);
  let score = Math.max(0, Math.min(100, 100 - totalPenalty));
  if (evidenceCount === 0 && blockerCount === 0 && warningCount === 0 && staleSourceCount === 0 && missingSourceCount === 0) score = 0;
  const band = score <= 0 ? "no_evidence" : blockerCount > 0 ? "blocked" : score >= 90 ? "trusted" : score >= 70 ? "warning" : "blocked";
  return { score, band, blockerCount, warningCount, staleSourceCount, missingSourceCount, evidenceCount, penalties, totalPenalty };
}

function deriveSources(row: any) {
  const sourceRecords = row?.source_records && typeof row.source_records === "object" ? row.source_records : {};
  const entries = Object.entries(sourceRecords).filter(([key]) => key !== "dashboard_trust_score");
  const missingSources = entries.filter(([, value]) => value == null || value === "" || (Array.isArray(value) && value.length === 0)).map(([key]) => key);
  const checkedAt = Date.parse(row?.last_checked_at || row?.updated_at || row?.created_at || "");
  const staleSources = Number.isFinite(checkedAt) && Date.now() - checkedAt > STALE_AFTER_MS ? entries.map(([key]) => key) : [];
  const evidenceCount = entries.filter(([, value]) => value != null && value !== "" && (!Array.isArray(value) || value.length > 0)).length;
  return { sourceRecords, missingSources, staleSources, evidenceCount };
}

Deno.serve(async (req) => {
  const requestId = `trust_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    if (req.method !== "POST") return Response.json({ error: "Method not allowed", request_id: requestId }, { status: 405, headers: { Allow: "POST", "X-Request-ID": requestId } });
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !["admin", "super_admin"].includes(String(user.role || "").toLowerCase())) return Response.json({ error: "Admin only", request_id: requestId }, { status: 403, headers: { "X-Request-ID": requestId } });

    const body = await req.json().catch(() => ({}));
    const dryRun = body?.dry_run !== false;
    const rows = await base44.asServiceRole.entities.DashboardTruthCheck.list("-last_checked_at", 500);
    const results = [];

    for (const row of rows || []) {
      const { sourceRecords, missingSources, staleSources, evidenceCount } = deriveSources(row);
      const scoring = computeScore({ blockers: row.blockers || [], warnings: row.warnings || [], stale_sources: staleSources, missing_sources: missingSources, evidence_count: evidenceCount });
      const scoreEvidence = {
        score: scoring.score,
        band: scoring.band,
        blocker_count: scoring.blockerCount,
        warning_count: scoring.warningCount,
        stale_source_count: scoring.staleSourceCount,
        missing_source_count: scoring.missingSourceCount,
        stale_sources: staleSources,
        missing_sources: missingSources,
        evidence_count: scoring.evidenceCount,
        penalties: scoring.penalties,
        total_penalty: scoring.totalPenalty,
        formula_version: "dashboard-trust-v1",
        scored_at: new Date().toISOString(),
        request_id: requestId,
      };
      const persistedUpdate = {
        blocker_count: scoring.blockerCount,
        warning_count: scoring.warningCount,
        truth_status: scoring.band === "no_evidence" ? "unknown" : scoring.band,
        safe_to_launch: scoring.band === "trusted" && scoring.blockerCount === 0,
        evidence_summary: `Trust ${scoring.score}/100 (${scoring.band}); blockers=${scoring.blockerCount}; warnings=${scoring.warningCount}; stale=${scoring.staleSourceCount}; missing=${scoring.missingSourceCount}; evidence=${scoring.evidenceCount}`,
        source_records: { ...sourceRecords, dashboard_trust_score: scoreEvidence },
        last_checked_at: new Date().toISOString(),
      };
      if (!dryRun) await base44.asServiceRole.entities.DashboardTruthCheck.update(row.id, persistedUpdate);
      results.push({ id: row.id, business_name: row.business_name || null, trust_score: scoring.score, trust_band: scoring.band, ...scoreEvidence });
    }

    const summary = {
      processed: results.length,
      trusted: results.filter((item) => item.trust_band === "trusted").length,
      warning: results.filter((item) => item.trust_band === "warning").length,
      blocked: results.filter((item) => item.trust_band === "blocked").length,
      no_evidence: results.filter((item) => item.trust_band === "no_evidence").length,
    };
    return Response.json({ success: true, request_id: requestId, dry_run: dryRun, summary, results }, { headers: { "X-Request-ID": requestId } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message, request_id: requestId }, { status: 500, headers: { "X-Request-ID": requestId } });
  }
});
