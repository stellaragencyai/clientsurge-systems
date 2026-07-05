import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Admin-only: Returns counts of records missing tenant scope (client_id)
 * across communication, automation, and lead entities.
 * Used by the admin dashboard "Tenant Scope Missing" visibility card.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return json({ error: 'Admin access required' }, 403);
    }

    const sr = base44.asServiceRole;
    const entities = [
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

    const results = [];

    for (const entityName of entities) {
      try {
        const missing = await sr.entities[entityName].filter(
          { client_id: { $in: [null, ""] } },
          "-created_date",
          500
        );
        const total = await sr.entities[entityName].list("-created_date", 1);
        results.push({
          entity: entityName,
          missing_count: missing.length,
          total_count: total?.length || 0,
          sample_ids: missing.slice(0, 5).map(r => r.id),
        });
      } catch (e) {
        results.push({ entity: entityName, error: e.message });
      }
    }

    const totalMissing = results.reduce((sum, r) => sum + (r.missing_count || 0), 0);

    return json({
      success: true,
      total_missing: totalMissing,
      entities: results,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
});