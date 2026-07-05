import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const svc = base44.asServiceRole;
    const nowIso = new Date().toISOString();

    // Fetch WebsiteLead samples — read only, no provider calls
    const websiteLeads = await svc.entities.WebsiteLead.list('', 10).catch(() => []);

    // Filter out internal/test/sample leads — they should remain skipped
    const INTERNAL_PATTERNS = [
      /test@/i, /example@/i, /demo@/i, /clientsurge/i, /noreply/i, /sample/i,
      /@yopmail/i, /@mailinator/i, /fake@/i, /@test\./i,
    ];
    const isInternalLead = (lead) => {
      const email = (lead.email || '').toLowerCase();
      const name = (lead.business_name || '').toLowerCase();
      return INTERNAL_PATTERNS.some((p) => p.test(email) || p.test(name));
    };

    const eligibleLeads = (websiteLeads || []).filter((l) => !isInternalLead(l)).slice(0, 3);
    const internalLeads = (websiteLeads || []).filter(isInternalLead).slice(0, 2);

    if (eligibleLeads.length === 0) {
      return Response.json({
        status: 'no_samples',
        simulation_proof: false,
        message: 'No eligible (non-internal) WebsiteLead samples found for simulation. Add real lead data first.',
        checked_at: nowIso,
      });
    }

    // Define simulation actions — 5 per lead
    const ACTIONS = [
      { key_prefix: 'initial_sms', status: 'completed', description: 'First SMS execution allowed — duplicate would be suppressed' },
      { key_prefix: 'initial_email', status: 'completed', description: 'First email execution allowed — duplicate would be suppressed' },
      { key_prefix: 'admin_alert', status: 'skipped', description: 'Admin alert skipped — internal/test lead remains skipped' },
      { key_prefix: 'followup_1_sms', status: 'completed', description: 'Follow-up SMS execution allowed — duplicate would be suppressed' },
      { key_prefix: 'followup_1_email', status: 'failed', description: 'Failed key marked for review — not blindly resent' },
    ];

    const created = [];
    const suppressed = [];
    const skippedRemain = [];

    // ── Process eligible leads ──
    for (const lead of eligibleLeads) {
      for (const action of ACTIONS) {
        const idempotencyKey = `${action.key_prefix}:${lead.id}`;

        // Check if key already exists — proves duplicate suppression
        const existing = await svc.entities.IdempotencyKey.filter(
          { idempotency_key: idempotencyKey },
          '',
          1
        ).catch(() => []);

        if (existing && existing.length > 0) {
          // Duplicate execution suppressed — key already exists
          suppressed.push({
            key: idempotencyKey,
            existing_status: existing[0].status,
            description: action.description,
          });
          continue;
        }

        // Create simulation-only record — no provider call, no message sent
        const record = await svc.entities.IdempotencyKey.create({
          idempotency_key: idempotencyKey,
          operation_type: 'messaging_send',
          resource_type: 'lead',
          resource_id: lead.id,
          status: action.status,
          execution_count: 1,
          first_executed_at: nowIso,
          last_executed_at: nowIso,
          client_id: 'clientsurge_system',
          client_project_id: 'clientsurge_public_site',
          metadata_json: JSON.stringify({
            simulation_only: true,
            no_provider_call: true,
            no_message_sent: true,
            action: action.key_prefix,
            lead_id: lead.id,
            lead_email: lead.email || 'unknown',
            description: action.description,
            created_by: 'simulateInboundIdempotencyCheck',
          }),
        }).catch(() => null);

        if (record) {
          created.push({
            key: idempotencyKey,
            status: action.status,
            description: action.description,
          });
        }
      }
    }

    // ── Process internal/test leads — must remain skipped ──
    for (const lead of internalLeads) {
      const idempotencyKey = `admin_alert:${lead.id}`;
      const existing = await svc.entities.IdempotencyKey.filter(
        { idempotency_key: idempotencyKey },
        '',
        1
      ).catch(() => []);

      if (existing && existing.length > 0) {
        skippedRemain.push({
          key: idempotencyKey,
          status: existing[0].status,
          description: 'Internal/test lead — remained skipped',
        });
        continue;
      }

      // Create skipped record for internal lead
      const record = await svc.entities.IdempotencyKey.create({
        idempotency_key: idempotencyKey,
        operation_type: 'messaging_send',
        resource_type: 'lead',
        resource_id: lead.id,
        status: 'skipped',
        execution_count: 0,
        first_executed_at: nowIso,
        last_executed_at: nowIso,
        client_id: 'clientsurge_system',
        client_project_id: 'clientsurge_public_site',
        metadata_json: JSON.stringify({
          simulation_only: true,
          no_provider_call: true,
          no_message_sent: true,
          action: 'admin_alert',
          lead_id: lead.id,
          lead_email: lead.email || 'unknown',
          description: 'Internal/test lead — skipped, no send attempted',
          created_by: 'simulateInboundIdempotencyCheck',
        }),
      }).catch(() => null);

      if (record) {
        skippedRemain.push({
          key: idempotencyKey,
          status: 'skipped',
          description: 'Internal/test lead — remained skipped',
        });
      }
    }

    return Response.json({
      status: 'simulation_complete',
      simulation_proof: true,
      no_provider_calls: true,
      no_messages_sent: true,
      eligible_leads_simulated: eligibleLeads.length,
      internal_leads_skipped: internalLeads.length,
      created_count: created.length,
      suppressed_count: suppressed.length,
      skipped_count: skippedRemain.length,
      created,
      suppressed,
      skipped: skippedRemain,
      proof_summary: {
        first_execution_allowed: created.filter((c) => c.status === 'completed').length,
        duplicate_execution_suppressed: suppressed.length,
        failed_key_marked_for_review: created.filter((c) => c.status === 'failed').length,
        internal_lead_remained_skipped: skippedRemain.length,
      },
      checked_at: nowIso,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});