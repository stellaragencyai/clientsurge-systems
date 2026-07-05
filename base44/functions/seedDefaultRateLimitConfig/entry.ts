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
    const CLIENT_ID = 'clientsurge_system';
    const PROJECT_ID = 'clientsurge_public_site';

    // Check if a default config already exists for this scope
    const existing = await svc.entities.RateLimitConfig.filter({
      client_id: CLIENT_ID,
      client_project_id: PROJECT_ID,
    });

    if (existing && existing.length > 0) {
      return Response.json({
        status: 'already_exists',
        count: existing.length,
        id: existing[0].id,
        message: 'Default RateLimitConfig already exists — no changes made.',
      });
    }

    const now = new Date().toISOString();

    const created = await svc.entities.RateLimitConfig.create({
      client_id: CLIENT_ID,
      client_project_id: PROJECT_ID,
      scope: 'client_project',
      max_events_per_minute: 100,
      max_messages_per_hour: 100,
      max_automation_triggers_per_minute: 60,
      max_api_calls_per_minute: 100,
      burst_multiplier: 1.5,
      burst_duration_seconds: 30,
      enabled: true,
      action_on_limit_exceeded: 'queue',
      updated_by: 'system_safe_patch',
      last_updated_at: now,
      description: 'Default safety rate-limit guardrails for ClientSurge public site inbound lead capture. Created by system_safe_patch.',
    });

    return Response.json({
      status: 'created',
      id: created.id,
      message: 'Default RateLimitConfig created successfully.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});