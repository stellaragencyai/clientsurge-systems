import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Resolves tenant scope (client_id + client_project_id) for an outbound send.
 * Returns { allowed, client_id, client_project_id, tenant_scope_status, reason }.
 *
 * Resolution chain:
 *   1. If client_id already provided → use it
 *   2. If lead_id provided → look up lead.client_id
 *   3. If order_id provided → look up ClientProject by order_id
 *   4. If client_email provided → look up ClientAccountConfig
 *   5. If is_internal=true → allow as system_internal
 *   6. Otherwise → blocked (missing_client_id_tenant_scope)
 *
 * Invoke via: base44.functions.invoke('resolveTenantScope', { lead_id, client_id, ... })
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;
    const {
      lead_id,
      client_id,
      client_project_id,
      order_id,
      client_email,
      is_internal = false,
      lead_entity = 'Leads',
    } = await req.json().catch(() => ({}));

    // System internal sends (admin notifications, test sends) are always allowed
    if (is_internal) {
      return json({
        allowed: true,
        client_id: null,
        client_project_id: null,
        tenant_scope_status: 'system_internal',
        reason: 'system_internal',
      });
    }

    // 1. Already have client_id
    if (client_id) {
      return json({
        allowed: true,
        client_id,
        client_project_id: client_project_id || null,
        tenant_scope_status: 'scoped',
        reason: 'provided',
      });
    }

    // 2. Resolve from lead
    if (lead_id) {
      try {
        const lead = await sr.entities[lead_entity].get(lead_id);
        if (lead?.client_id) {
          return json({
            allowed: true,
            client_id: lead.client_id,
            client_project_id: lead.client_project_id || null,
            tenant_scope_status: 'scoped',
            reason: `lead:${lead_id}`,
          });
        }
      } catch (_) {
        // Lead not found in primary entity — try WebsiteLead
        if (lead_entity === 'Leads') {
          try {
            const wl = await sr.entities.WebsiteLead.get(lead_id);
            if (wl?.client_id) {
              return json({
                allowed: true,
                client_id: wl.client_id,
                client_project_id: wl.client_project_id || null,
                tenant_scope_status: 'scoped',
                reason: `website_lead:${lead_id}`,
              });
            }
          } catch (_) {}
        }
      }
    }

    // 3. Resolve from order_id → ClientProject
    if (order_id) {
      try {
        const projects = await sr.entities.ClientProject.filter({ order_id }, "-created_date", 1);
        if (projects?.length === 1 && projects[0].client_id) {
          return json({
            allowed: true,
            client_id: projects[0].client_id,
            client_project_id: projects[0].id,
            tenant_scope_status: 'scoped',
            reason: `order_project:${order_id}`,
          });
        }
      } catch (_) {}
    }

    // 4. Resolve from client_email → ClientAccountConfig
    if (client_email) {
      try {
        const configs = await sr.entities.ClientAccountConfig.filter({ client_email }, "-created_date", 1);
        if (configs?.length === 1 && configs[0].client_id) {
          return json({
            allowed: true,
            client_id: configs[0].client_id,
            client_project_id: configs[0].client_project_id || null,
            tenant_scope_status: 'scoped',
            reason: `client_config:${client_email}`,
          });
        }
      } catch (_) {}
    }

    // 5. Blocked — cannot resolve tenant scope
    return json({
      allowed: false,
      client_id: null,
      client_project_id: null,
      tenant_scope_status: 'missing_client_id',
      reason: 'missing_client_id_tenant_scope',
    });
  } catch (error) {
    return json({
      allowed: false,
      client_id: null,
      client_project_id: null,
      tenant_scope_status: 'manual_review',
      reason: `resolver_error: ${error.message}`,
    }, 500);
  }
});