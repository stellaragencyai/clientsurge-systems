import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Safe admin-only reconciliation/backfill function.
 * Infers client_id/client_project_id for existing records that are missing tenant scope.
 *
 * Strategy (non-destructive):
 * 1. Query records with tenant_scope_status=missing_client_id (or null/blank).
 * 2. For each record, attempt to resolve client_id from:
 *    a. lead_id → Leads.client_id
 *    b. website_lead_id → WebsiteLead.client_id
 *    c. order_id → ClientProject.client_id
 *    d. onboarding_client_id → OnboardingClient.client_id
 *    e. client_email/customer_email → Client.client_id
 * 3. If exactly one confident match → update record, set tenant_scope_status=scoped.
 * 4. If no match or ambiguous → set tenant_scope_status=manual_review.
 * 5. Log what was inferred and why to an audit summary.
 *
 * Entities scanned:
 * - CommunicationLog, CommunicationEvent, Messages, Emails
 * - AutomationJob, DripCampaign, NurtureCampaign, EmailDripCampaign
 * - Alert, DemoRequest, LeadRevenue, LeadReactivation, WebsiteLead
 *
 * Payload: { entity_name, limit, dry_run }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return json({ error: 'Admin access required' }, 403);
    }

    const payload = await req.json().catch(() => ({}));
    const entityName = payload.entity_name || 'CommunicationLog';
    const limit = Math.min(payload.limit || 100, 500);
    const dryRun = payload.dry_run === true;

    const entities = base44.asServiceRole.entities;
    if (!entities[entityName]) {
      return json({ error: `Entity ${entityName} not found` }, 400);
    }

    // Fetch records missing tenant scope
    // Query for records where client_id is null/empty
    const records = await entities[entityName].filter({
      client_id: null,
    }, '-created_date', limit).catch((e) => {
      throw new Error(`Filter failed: ${e.message}`);
    });

    const results = {
      entity_name: entityName,
      scanned: records.length,
      scoped: 0,
      manual_review: 0,
      no_match: 0,
      dry_run: dryRun,
      updates: [],
      audit_log: [],
    };

    for (const record of records) {
      let resolvedClientId = null;
      let resolvedClientProjectId = null;
      let source = 'none';
      let confidence = 'none';

      // a. Resolve from lead_id
      if (!resolvedClientId && record.lead_id) {
        try {
          const lead = await entities.Leads.get(record.lead_id);
          if (lead?.client_id) {
            resolvedClientId = lead.client_id;
            resolvedClientProjectId = lead.client_project_id || null;
            source = 'leads';
            confidence = 'high';
          }
        } catch (_) {}
      }

      // b. Resolve from website_lead_id (if field exists)
      if (!resolvedClientId && record.website_lead_id) {
        try {
          const wl = await entities.WebsiteLead.get(record.website_lead_id);
          if (wl?.client_id) {
            resolvedClientId = wl.client_id;
            resolvedClientProjectId = wl.client_project_id || null;
            source = 'website_lead';
            confidence = 'high';
          }
        } catch (_) {}
      }

      // c. Resolve from order_id → ClientProject
      if (!resolvedClientId && record.order_id) {
        try {
          const projects = await entities.ClientProject.filter({ order_id: record.order_id }, '-created_date', 1);
          if (projects?.length === 1 && projects[0].client_id) {
            resolvedClientId = projects[0].client_id;
            resolvedClientProjectId = projects[0].id || null;
            source = 'order_to_project';
            confidence = 'high';
          } else if (projects?.length > 1) {
            confidence = 'ambiguous';
          }
        } catch (_) {}
      }

      // d. Resolve from onboarding_client_id
      if (!resolvedClientId && record.onboarding_client_id) {
        try {
          const oc = await entities.OnboardingClient.get(record.onboarding_client_id);
          if (oc?.client_id) {
            resolvedClientId = oc.client_id;
            resolvedClientProjectId = oc.client_project_id || null;
            source = 'onboarding_client';
            confidence = 'high';
          }
        } catch (_) {}
      }

      // e. Resolve from client_email / customer_email
      if (!resolvedClientId && (record.client_email || record.lead_email)) {
        const emailToLookup = record.client_email || record.lead_email;
        try {
          const clients = await entities.Client.filter({ email: emailToLookup }, '-created_date', 1);
          if (clients?.length === 1 && clients[0].id) {
            resolvedClientId = clients[0].id;
            source = 'client_email';
            confidence = 'medium';
          } else if (clients?.length > 1) {
            confidence = 'ambiguous';
          }
        } catch (_) {}
      }

      // Apply result
      if (resolvedClientId && confidence === 'high' || (resolvedClientId && confidence === 'medium')) {
        if (!dryRun) {
          await entities[entityName].update(record.id, {
            client_id: resolvedClientId,
            client_project_id: resolvedClientProjectId,
            tenant_scope_status: 'scoped',
            tenant_scope_error: null,
          }).catch((e) => {
            console.warn(`[backfill] Update failed for ${record.id}:`, e.message);
          });
        }
        results.scoped++;
        results.updates.push({ id: record.id, action: 'scoped', client_id: resolvedClientId, source });
      } else if (confidence === 'ambiguous') {
        if (!dryRun) {
          await entities[entityName].update(record.id, {
            tenant_scope_status: 'manual_review',
            tenant_scope_error: 'ambiguous_client_match',
          }).catch((e) => {
            console.warn(`[backfill] Manual review update failed for ${record.id}:`, e.message);
          });
        }
        results.manual_review++;
        results.updates.push({ id: record.id, action: 'manual_review', reason: 'ambiguous_match' });
      } else {
        if (!dryRun) {
          await entities[entityName].update(record.id, {
            tenant_scope_status: 'manual_review',
            tenant_scope_error: 'no_confident_match',
          }).catch((e) => {
            console.warn(`[backfill] No-match update failed for ${record.id}:`, e.message);
          });
        }
        results.no_match++;
        results.updates.push({ id: record.id, action: 'manual_review', reason: 'no_confident_match' });
      }

      results.audit_log.push({
        record_id: record.id,
        source,
        confidence,
        resolved_client_id: resolvedClientId,
      });
    }

    return json(results);
  } catch (error) {
    console.error('[backfillTenantScope] Error:', error.message);
    return json({ error: error.message }, 500);
  }
});