import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Admin-only: Audit and backfill tenant scope (client_id/client_project_id)
 * on existing communication, automation, lead, and campaign records.
 *
 * Non-destructive: only adds fields, never deletes or overwrites existing client_id.
 * Records that can't be confidently mapped → tenant_scope_status=manual_review.
 *
 * POST body:
 *   { "action": "audit" | "backfill", "entity": "CommunicationLog" | ... , "limit": 100 }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return json({ error: 'Admin access required' }, 403);
    }

    const { action = 'audit', entity = 'CommunicationLog', limit = 100 } = await req.json().catch(() => ({}));
    const sr = base44.asServiceRole;

    // Entities to scan and their lead_id field
    const ENTITY_CONFIG = {
      CommunicationLog: { leadField: 'lead_id', hasClient: true },
      CommunicationEvent: { leadField: 'lead_id', hasClient: true },
      Messages: { leadField: 'lead_id', hasClient: true },
      Emails: { leadField: 'lead_id', hasClient: true },
      AutomationJob: { leadField: 'lead_id', hasClient: true },
      DripCampaign: { leadField: 'lead_id', hasClient: true },
      NurtureCampaign: { leadField: 'lead_id', hasClient: true },
      EmailDripCampaign: { leadField: 'lead_id', hasClient: true },
      Alert: { leadField: 'lead_id', hasClient: true },
      DemoRequest: { leadField: 'lead_id', hasClient: true },
      LeadRevenue: { leadField: 'lead_id', hasClient: true },
      LeadReactivation: { leadField: 'lead_id', hasClient: true },
      ConversationThread: { leadField: 'lead_id', hasClient: true },
    };

    const config = ENTITY_CONFIG[entity];
    if (!config) {
      return json({ error: `Entity ${entity} not supported for tenant scope backfill` }, 400);
    }

    // Fetch records missing client_id
    const records = await sr.entities[entity].filter(
      { client_id: { $in: [null, ""] } },
      "-created_date",
      Math.min(limit, 500)
    );

    const results = { entity, action, scanned: records.length, updated: 0, manual_review: 0, already_scoped: 0, errors: 0, details: [] };

    for (const rec of records) {
      const leadId = rec[config.leadField];
      let resolvedClientId = null;
      let resolvedClientProjectId = null;
      let resolutionSource = null;

      // Try Leads lookup
      if (leadId) {
        try {
          const lead = await sr.entities.Leads.get(leadId);
          if (lead?.client_id) {
            resolvedClientId = lead.client_id;
            resolvedClientProjectId = lead.client_project_id || null;
            resolutionSource = `lead:${leadId}`;
          }
        } catch (_) {}
      }

      // Try order_id → ClientProject
      if (!resolvedClientId && rec.order_id) {
        try {
          const projects = await sr.entities.ClientProject.filter({ order_id: rec.order_id }, "-created_date", 1);
          if (projects?.length === 1 && projects[0].client_id) {
            resolvedClientId = projects[0].client_id;
            resolvedClientProjectId = projects[0].id;
            resolutionSource = `order_project:${rec.order_id}`;
          }
        } catch (_) {}
      }

      // Try client_email → ClientAccountConfig
      if (!resolvedClientId && rec.client_email) {
        try {
          const configs = await sr.entities.ClientAccountConfig.filter({ client_email: rec.client_email }, "-created_date", 1);
          if (configs?.length === 1 && configs[0].client_id) {
            resolvedClientId = configs[0].client_id;
            resolvedClientProjectId = configs[0].client_project_id || null;
            resolutionSource = `client_config:${rec.client_email}`;
          }
        } catch (_) {}
      }

      if (resolvedClientId) {
        if (action === 'backfill') {
          try {
            await sr.entities[entity].update(rec.id, {
              client_id: resolvedClientId,
              client_project_id: resolvedClientProjectId,
              tenant_scope_status: 'scoped',
            });
            results.updated++;
            results.details.push({ id: rec.id, status: 'scoped', source: resolutionSource });
          } catch (e) {
            results.errors++;
            results.details.push({ id: rec.id, status: 'error', error: e.message });
          }
        } else {
          results.updated++; // would update
          results.details.push({ id: rec.id, status: 'would_scope', source: resolutionSource });
        }
      } else {
        // Mark for manual review
        if (action === 'backfill') {
          try {
            await sr.entities[entity].update(rec.id, { tenant_scope_status: 'manual_review' });
          } catch (_) {}
        }
        results.manual_review++;
        results.details.push({ id: rec.id, status: 'manual_review', lead_id: leadId, order_id: rec.order_id, client_email: rec.client_email });
      }
    }

    return json({ success: true, ...results });
  } catch (error) {
    console.error('[backfillTenantScope] Error:', error.message);
    return json({ error: error.message }, 500);
  }
});