import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const NON_PROD = new Set(['qa', 'smoke', 'demo', 'internal']);
const TEST_TEXT = /\b(test|testing|smoke|demo|fake|dummy|sample|placeholder|qa|debug|synthetic|fabricated|simulated)\b/i;
const INTERNAL_EMAIL = /@clientsurgesystems\.com$/i;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
function isAdmin(user: any) {
  return user?.role === 'admin' || user?.role === 'super_admin';
}
function clean(value: unknown) {
  return String(value ?? '').trim();
}
function classify(record: any) {
  const explicit = clean(record.environment).toLowerCase();
  if (explicit && explicit !== 'unknown') return { environment: explicit, reason: 'explicit_environment' };

  const text = [
    record.description,
    record.error_message,
    record.subject,
    record.message_body,
    record.dashboard_exclusion_reason,
    record.dashboard_truth_notes,
    record.business_name,
    record.client_email,
    record.customer_email,
    record.provider_message_id,
    record.context_type,
    record.service_key,
  ].map(clean).join(' ');

  if (record.dashboard_excluded === true) return { environment: 'internal', reason: 'dashboard_excluded' };
  if (INTERNAL_EMAIL.test(clean(record.client_email || record.customer_email || record.provider_from_email))) {
    return { environment: 'internal', reason: 'internal_clientsurge_email' };
  }
  if (TEST_TEXT.test(text)) {
    if (/\bsmoke\b/i.test(text)) return { environment: 'smoke', reason: 'smoke_marker' };
    if (/\bdemo\b/i.test(text)) return { environment: 'demo', reason: 'demo_marker' };
    if (/\bqa\b/i.test(text)) return { environment: 'qa', reason: 'qa_marker' };
    return { environment: 'internal', reason: 'test_marker' };
  }
  if (record.provider === 'internal' || record.provider === 'internal_guardrail' || record.provider === 'internal_compliance_guard') {
    return { environment: 'internal', reason: 'internal_provider' };
  }
  if (record.order_id || record.client_id || record.client_project_id || record.provider_message_id) {
    return { environment: 'production', reason: 'production_linkage' };
  }
  return { environment: 'unknown', reason: 'insufficient_evidence' };
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!isAdmin(user)) return json({ error: 'Admin only', request_id: requestId }, 403);

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run === true;
    const limit = Math.min(Math.max(Number(body.limit || 1000), 1), 5000);
    const entityNames = ['CommunicationEvent', 'ClientInstallationOS', 'DashboardTruthCheck'];
    const summary: any = { scanned: 0, updated: 0, unresolved: 0, by_environment: {}, by_entity: {}, errors: [] };

    for (const entityName of entityNames) {
      const entity = base44.asServiceRole.entities[entityName];
      const rows = await entity.list('-created_date', limit).catch((error: Error) => {
        summary.errors.push(`${entityName}: ${error.message}`);
        return [];
      });
      const entitySummary = { scanned: 0, updated: 0, unresolved: 0 };

      for (const row of rows || []) {
        if (clean(row.environment).toLowerCase() !== 'unknown' && clean(row.environment)) continue;
        summary.scanned++;
        entitySummary.scanned++;
        const result = classify(row);
        summary.by_environment[result.environment] = (summary.by_environment[result.environment] || 0) + 1;

        if (result.environment === 'unknown') {
          summary.unresolved++;
          entitySummary.unresolved++;
          if (!dryRun && row.dashboard_truth_status !== 'warning') {
            await entity.update(row.id, {
              dashboard_truth_status: 'warning',
              dashboard_truth_notes: `Environment requires manual review: ${result.reason}`,
            }).catch((error: Error) => summary.errors.push(`${entityName}/${row.id}: ${error.message}`));
          }
          continue;
        }

        if (!dryRun) {
          const excluded = NON_PROD.has(result.environment);
          await entity.update(row.id, {
            environment: result.environment,
            dashboard_excluded: excluded,
            dashboard_exclusion_reason: excluded ? `Environment backfill: ${result.reason}` : '',
            dashboard_truth_status: excluded ? 'warning' : 'trusted',
            dashboard_truth_notes: `Environment assigned by deterministic backfill: ${result.reason}`,
          });
        }
        summary.updated++;
        entitySummary.updated++;
      }
      summary.by_entity[entityName] = entitySummary;
    }

    if (!dryRun) {
      await base44.asServiceRole.entities.AuditLog.create({
        admin_email: user.email || 'admin',
        action: 'unknown_environment_backfill',
        entity_name: 'OperationalEntities',
        record_id: requestId,
        before: '{}',
        after: JSON.stringify(summary),
        timestamp: new Date().toISOString(),
        notes: 'Deterministic environment backfill. No PII stored in audit payload.',
      }).catch(() => null);
    }

    return json({ success: summary.errors.length === 0, dry_run: dryRun, request_id: requestId, summary });
  } catch (error) {
    console.error(`[backfillUnknownEnvironments] ${error.message}; request_id=${requestId}`);
    return json({ error: error.message, request_id: requestId }, 500);
  }
});
