import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Nightly audit: checks for records missing tenant scope (client_id)
 * across all communication and automation entities.
 * If new unscoped records are found, creates an Alert for admin visibility.
 * Designed to run as a scheduled automation.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    const entities = [
      'CommunicationLog', 'CommunicationEvent', 'Messages', 'Emails',
      'AutomationJob', 'EmailCampaignRecipient', 'DripCampaign', 'NurtureCampaign',
      'EmailDripCampaign', 'WebsiteLead', 'Alert', 'DemoRequest',
      'LeadRevenue', 'LeadReactivation',
    ];

    const results = [];
    let totalMissing = 0;

    for (const entityName of entities) {
      try {
        const missing = await sr.entities[entityName].filter(
          { client_id: { $in: [null, ""] } },
          "-created_date",
          500
        );
        if (missing.length > 0) {
          results.push({ entity: entityName, missing_count: missing.length });
          totalMissing += missing.length;
        }
      } catch (_) {}
    }

    // Create admin alert if unscoped records found
    if (totalMissing > 0) {
      try {
        await sr.entities.Alert.create({
          type: 'engagement_trigger',
          severity: totalMissing > 100 ? 'critical' : 'high',
          phone_number: 'system',
          lead_name: 'Tenant Scope Audit',
          message: `Nightly audit found ${totalMissing} records missing client_id across ${results.length} entities. Run backfill from admin dashboard → Tenant Scope Audit panel.`,
          source: 'cloudflare_worker',
          tags: ['tenant_scope', 'nightly_audit', 'missing_client_id'],
          conversion_status: 'new',
          client_id: null,
          tenant_scope_status: 'system_internal',
        });
      } catch (_) {}

      // Also send admin email
      try {
        const adminEmail = Deno.env.get('ADMIN_NOTIFICATION_EMAIL') || Deno.env.get('ADMIN_EMAIL');
        if (adminEmail) {
          await sr.integrations.Core.SendEmail({
            to: adminEmail,
            subject: `[ClientSurge] ${totalMissing} records missing tenant scope`,
            body: `<p>Nightly tenant scope audit found <strong>${totalMissing} records</strong> missing client_id.</p><p>Entities affected:</p><ul>${results.map(r => `<li>${r.entity}: ${r.missing_count}</li>`).join('')}</ul><p>Run backfill from the admin dashboard → Tenant Scope Audit panel.</p>`,
          });
        }
      } catch (_) {}
    }

    return json({
      success: true,
      total_missing: totalMissing,
      entities_with_gaps: results,
      alert_created: totalMissing > 0,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[nightlyTenantScopeAudit] Error:', error.message);
    return json({ error: error.message }, 500);
  }
});