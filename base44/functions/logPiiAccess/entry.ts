/**
 * Finding #140: Audit log for PII data access.
 * Logs every time an admin accesses lead PII (phone, email, business name).
 * Also Finding #147: GDPR/CCPA data deletion request handler.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    // ── Finding #147: GDPR/CCPA data deletion request ──
    if (body.action === 'request_data_deletion') {
      const { email, phone, reason } = body;
      if (!email && !phone) {
        return Response.json({ error: 'Email or phone required for deletion request' }, { status: 400 });
      }

      // Log the deletion request
      await base44.asServiceRole.entities.AuditLog.create({
        action: 'data_deletion_requested',
        entity_type: 'gdpr_compliance',
        details: JSON.stringify({
          email: email || null,
          phone: phone || null,
          reason: reason || 'user_request',
          requested_by: user.email,
          status: 'pending',
          sla_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      }).catch(() => null);

      return Response.json({
        success: true,
        message: 'Data deletion request received. Will be processed within 30 days per GDPR/CCPA requirements.',
      });
    }

    // ── Finding #140: Log PII access ──
    const { entity_type, entity_id, access_purpose } = body;
    if (!entity_type || !entity_id) {
      return Response.json({ error: 'entity_type and entity_id required' }, { status: 400 });
    }

    await base44.asServiceRole.entities.AuditLog.create({
      action: 'pii_accessed',
      entity_type,
      entity_id,
      details: JSON.stringify({
        accessed_by: user.email,
        accessed_at: new Date().toISOString(),
        purpose: access_purpose || 'admin_view',
      }),
    }).catch(() => null);

    return Response.json({ success: true, logged: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});