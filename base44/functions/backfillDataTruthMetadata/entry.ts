import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ENTITY_NAMES = [
  'WebsiteLead',
  'ConversionTrackingEvent',
  'LandingPageAnalytics',
  'OnboardingOrchestration',
] as const;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function normalizeText(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function inferEnvironment(record: Record<string, any>) {
  const existing = normalizeText(record.environment);
  if (['production', 'qa', 'smoke', 'demo', 'internal'].includes(existing)) return existing;

  const evidence = [
    record.email,
    record.client_email,
    record.source,
    record.source_page,
    record.page_url,
    record.route,
    record.business_name,
    record.notes,
    record.admin_notes,
  ].map(normalizeText).join(' ');

  if (/(@clientsurgesystems\.com|internal|staff|admin test)/i.test(evidence)) return 'internal';
  if (/\b(smoke|synthetic|healthcheck)\b/i.test(evidence)) return 'smoke';
  if (/\b(qa|staging|quality assurance)\b/i.test(evidence)) return 'qa';
  if (/\b(demo|sample|example)\b/i.test(evidence)) return 'demo';
  if (record.order_id || record.client_id || record.client_project_id || record.event_id) return 'production';
  return 'unknown';
}

function buildPatch(entityName: string, record: Record<string, any>, now: string) {
  const environment = inferEnvironment(record);
  const excluded = environment !== 'production';
  const truthStatus = environment === 'production'
    ? 'trusted'
    : environment === 'unknown'
      ? 'manual_review'
      : 'blocked';

  const patch: Record<string, any> = {
    environment,
    dashboard_excluded: excluded,
    dashboard_exclusion_reason: excluded ? `environment:${environment}` : '',
    dashboard_truth_status: truthStatus,
  };

  if (entityName === 'WebsiteLead') {
    patch.lead_quality = record.lead_quality || 'unreviewed';
    patch.follow_up_priority = record.follow_up_priority || 'normal';
    patch.submission_count = Math.max(Number(record.submission_count || 1), 1);
    patch.first_submission_at = record.first_submission_at || record.created_date || now;
    patch.last_submission_at = record.last_submission_at || record.updated_date || record.created_date || now;
  }

  if (entityName === 'ConversionTrackingEvent') {
    patch.consent_state = record.consent_state || 'unknown';
    patch.tracking_version = record.tracking_version || 'v1';
    patch.release_version = record.release_version || 'legacy-unattributed';
  }

  if (entityName === 'LandingPageAnalytics') {
    patch.source_event_count = Number(record.source_event_count || 0);
    patch.calculation_version = record.calculation_version || 'legacy-v1';
    patch.calculated_at = record.calculated_at || record.updated_date || record.created_date || now;
    patch.calculated_by = record.calculated_by || 'backfillDataTruthMetadata';
    patch.proof_status = record.proof_status || (patch.source_event_count > 0 ? 'manual_review' : 'unverified');
  }

  if (entityName === 'OnboardingOrchestration') {
    patch.override_status = record.override_status || 'none';
    patch.go_live_requirements_version = record.go_live_requirements_version || 'v1';
  }

  return patch;
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return json({ error: 'Admin only', request_id: requestId }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run !== false;
    const limit = Math.min(Math.max(Number(body.limit || 1000), 1), 5000);
    const requested = Array.isArray(body.entities) ? body.entities : ENTITY_NAMES;
    const entities = requested.filter((name: string) => ENTITY_NAMES.includes(name as any));

    const summary: Record<string, any> = {
      request_id: requestId,
      dry_run: dryRun,
      started_at: now,
      entities: {},
      totals: { scanned: 0, updated: 0, production: 0, excluded: 0, manual_review: 0, errors: 0 },
    };

    for (const entityName of entities) {
      const api = (base44.asServiceRole.entities as any)[entityName];
      const rows = await api.list('-created_date', limit).catch(() => []);
      const entitySummary = { scanned: rows.length, updated: 0, production: 0, excluded: 0, manual_review: 0, errors: [] as string[] };

      for (const record of rows) {
        try {
          const patch = buildPatch(entityName, record, now);
          if (patch.environment === 'production') entitySummary.production++;
          if (patch.dashboard_excluded) entitySummary.excluded++;
          if (patch.dashboard_truth_status === 'manual_review') entitySummary.manual_review++;
          if (!dryRun) {
            await api.update(record.id, patch);
            entitySummary.updated++;
          }
        } catch (error) {
          entitySummary.errors.push(`${record.id}:${String(error?.message || error).slice(0, 180)}`);
        }
      }

      summary.entities[entityName] = entitySummary;
      summary.totals.scanned += entitySummary.scanned;
      summary.totals.updated += entitySummary.updated;
      summary.totals.production += entitySummary.production;
      summary.totals.excluded += entitySummary.excluded;
      summary.totals.manual_review += entitySummary.manual_review;
      summary.totals.errors += entitySummary.errors.length;
    }

    if (!dryRun) {
      await base44.asServiceRole.entities.AuditLog.create({
        action: 'data_truth_metadata_backfill',
        actor_email: user.email || '',
        entity_type: 'multi_entity',
        details: JSON.stringify({ request_id: requestId, totals: summary.totals, entities }),
        timestamp: new Date().toISOString(),
      }).catch(() => null);
    }

    summary.completed_at = new Date().toISOString();
    return json(summary);
  } catch (error) {
    return json({ error: String(error?.message || error), request_id: requestId }, 500);
  }
});
