import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { action, entity_id, metadata } = body;

    if (action === 'retry_job') {
      if (!entity_id) return Response.json({ error: 'entity_id required' }, { status: 400 });
      await base44.asServiceRole.entities.AutomationJob.update(entity_id, {
        status: 'queued',
        attempts: 0,
        last_error: null,
        scheduled_for: new Date().toISOString(),
      });
      return Response.json({ success: true, message: 'Job re-queued for processing' });
    }

    if (action === 'retry_all_failed') {
      const failedIds = metadata?.failed_ids || [];
      if (failedIds.length === 0) return Response.json({ error: 'No job IDs provided' }, { status: 400 });
      for (const id of failedIds) {
        await base44.asServiceRole.entities.AutomationJob.update(id, {
          status: 'queued',
          attempts: 0,
          last_error: null,
          scheduled_for: new Date().toISOString(),
        });
      }
      return Response.json({ success: true, message: `${failedIds.length} job${failedIds.length > 1 ? 's' : ''} re-queued` });
    }

    if (action === 'check_integration') {
      return Response.json({ success: true, message: 'Navigate to Integration Health tab to review and resolve' });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });

  } catch (error) {
    console.error('[fixAutomationAlert] fixAutomationAlert error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});