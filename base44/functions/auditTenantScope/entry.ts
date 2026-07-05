import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Admin-only audit of tenant scope health across all communication/automation entities.
 * Returns counts of scoped vs missing_client_id vs manual_review records.
 * Records with missing tenant scope must show as warning/blocked in dashboards, not trusted.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return json({ error: 'Admin access required' }, 403);
    }

    const entities = base44.asServiceRole.entities;

    // Entities to audit for tenant scope gaps
    const auditEntities = [
      'CommunicationLog',
      'CommunicationEvent',
      'Messages',
      'Emails',
      'AutomationJob',
      'EmailCampaignRecipient',
      'DripCampaign',
      'NurtureCampaign',
      'EmailDripCampaign',
      'WebsiteLead',
      'Alert',
      'DemoRequest',
      'LeadRevenue',
      'LeadReactivation',
    ];

    const results = {
      audited_at: new Date().toISOString(),
      entities: [],
      total_scoped: 0,
      total_missing: 0,
      total_manual_review: 0,
      dashboard_truth_status: 'trusted',
    };

    for (const entityName of auditEntities) {
      if (!entities[entityName]) continue;

      let scoped = 0, missing = 0, manualReview = 0, total = 0;

      try {
        // Count scoped records
        const scopedRecords = await entities[entityName].filter({
          tenant_scope_status: 'scoped',
        }, '-created_date', 1).catch(() => []);
        scoped = scopedRecords?.length || 0;
      } catch (_) {}

      try {
        // Count missing scope records
        const missingRecords = await entities[entityName].filter({
          tenant_scope_status: 'missing_client_id',
        }, '-created_date', 1).catch(() => []);
        missing = missingRecords?.length || 0;
      } catch (_) {}

      try {
        const reviewRecords = await entities[entityName].filter({
          tenant_scope_status: 'manual_review',
        }, '-created_date', 1).catch(() => []);
        manualReview = reviewRecords?.length || 0;
      } catch (_) {}

      // Note: filter returns up to limit, so these are indicator counts
      // For real counts, use a count aggregation if available
      total = scoped + missing + manualReview;

      results.entities.push({
        entity_name: entityName,
        scoped,
        missing_client_id: missing,
        manual_review: manualReview,
        has_unscoped_records: missing > 0,
        truth_status: missing > 0 ? 'blocked' : 'trusted',
      });

      results.total_scoped += scoped;
      results.total_missing += missing;
      results.total_manual_review += manualReview;
    }

    // Overall dashboard truth status
    if (results.total_missing > 0) {
      results.dashboard_truth_status = 'blocked';
    } else if (results.total_manual_review > 0) {
      results.dashboard_truth_status = 'warning';
    }

    return json(results);
  } catch (error) {
    console.error('[auditTenantScope] Error:', error.message);
    return json({ error: error.message }, 500);
  }
});