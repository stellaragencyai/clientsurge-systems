import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}
function clean(v: unknown) { return String(v ?? '').trim().toLowerCase(); }
function classifyEnvironment(lead: Record<string, unknown>) {
  const explicit = clean(lead.environment);
  if (['production','qa','smoke','demo','internal'].includes(explicit)) return explicit;
  const text = [lead.email, lead.full_name, lead.business_name, lead.source, lead.source_page, lead.message].map(clean).join(' ');
  if (text.includes('@clientsurgesystems.com') || text.includes('@base44.com')) return 'internal';
  if (/\b(smoke|test|testing|qa|debug|synthetic)\b/.test(text)) return 'smoke';
  if (/\bdemo\b/.test(text)) return 'demo';
  return 'production';
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  const now = new Date().toISOString();
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || !['admin','super_admin'].includes(user.role)) return json({ error: 'Admin only', request_id: requestId }, 403);
    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run !== false;
    const limit = Math.min(Math.max(Number(body.limit || 1000), 1), 5000);
    const leads = await base44.asServiceRole.entities.WebsiteLead.list('-created_date', limit).catch(() => []);
    const summary = { scanned: leads.length, updated: 0, production: 0, excluded: 0, manual_review: 0, errors: [] as string[] };

    for (const lead of leads) {
      try {
        const environment = classifyEnvironment(lead);
        const excluded = environment !== 'production';
        const submissionCount = Math.max(1, Number(lead.submission_count || 1));
        const firstSubmissionAt = lead.first_submission_at || lead.created_date || now;
        const lastSubmissionAt = lead.last_submission_at || lead.updated_date || lead.created_date || now;
        const leadQuality = ['unreviewed','valid','suspicious','internal_test','duplicate','disqualified'].includes(clean(lead.lead_quality))
          ? clean(lead.lead_quality)
          : excluded ? 'internal_test' : 'unreviewed';
        const priority = ['urgent','high','normal','low','none'].includes(clean(lead.follow_up_priority))
          ? clean(lead.follow_up_priority)
          : excluded ? 'none' : 'normal';
        const truthStatus = excluded ? 'excluded' : 'trusted';

        if (!dryRun) {
          await base44.asServiceRole.entities.WebsiteLead.update(lead.id, {
            environment,
            dashboard_excluded: excluded,
            dashboard_exclusion_reason: excluded ? `non_production_environment:${environment}` : '',
            dashboard_truth_status: truthStatus,
            lead_quality: leadQuality,
            follow_up_priority: priority,
            quality_reason_codes: Array.isArray(lead.quality_reason_codes) ? lead.quality_reason_codes : [],
            submission_count: submissionCount,
            first_submission_at: firstSubmissionAt,
            last_submission_at: lastSubmissionAt,
            capture_version: lead.capture_version || 'legacy_backfill_v1',
          });
        }
        summary.updated++;
        if (excluded) summary.excluded++; else summary.production++;
      } catch (error) {
        summary.errors.push(`${lead.id}:${error?.message || 'update_failed'}`);
      }
    }

    if (!dryRun) {
      await base44.asServiceRole.entities.AuditLog.create({
        action: 'website_lead_truth_backfill',
        actor_email: user.email || '',
        entity_type: 'WebsiteLead',
        details: JSON.stringify({ request_id: requestId, ...summary, errors: summary.errors.slice(0, 20) }),
        timestamp: now,
      }).catch(() => null);
    }

    return json({ success: true, dry_run: dryRun, request_id: requestId, summary });
  } catch (error) {
    return json({ error: error?.message || 'Backfill failed', request_id: requestId }, 500);
  }
});
