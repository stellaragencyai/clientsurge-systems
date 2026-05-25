import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const {
      project_id,
      twilio_number,
      sms_template,
      missed_call_sms_template,
      resend_from_email,
      lead_notification_email,
      email_confirmation_template,
    } = body;

    if (!project_id) return Response.json({ error: 'project_id required' }, { status: 400 });

    // Verify user owns this project
    const projects = await base44.asServiceRole.entities.ClientProject.filter({ id: project_id });
    const project = projects?.[0];
    if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });
    if (project.client_email !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get or create AdminSettings record
    const settings = await base44.asServiceRole.entities.AdminSettings.list('-created_date', 1);
    const existing = settings?.[0];

    const updates = {};
    if (twilio_number)              updates.twilio_from_number = twilio_number;
    if (sms_template)               updates.sms_template = sms_template;
    if (missed_call_sms_template)   updates.missed_call_sms_template = missed_call_sms_template;
    if (resend_from_email)          updates.resend_from_email = resend_from_email;
    if (lead_notification_email)    updates.lead_notification_email = lead_notification_email;
    if (email_confirmation_template) updates.email_confirmation_template = email_confirmation_template;

    if (existing) {
      await base44.asServiceRole.entities.AdminSettings.update(existing.id, updates);
    } else {
      await base44.asServiceRole.entities.AdminSettings.create(updates);
    }

    const completionTimestamp = new Date().toISOString();

    // Also stamp the project
    await base44.asServiceRole.entities.ClientProject.update(project_id, {
      quick_start_completed: true,
      quick_start_completed_at: completionTimestamp,
    });

    try {
      const adminSettings = await base44.asServiceRole.entities.AdminSettings.list('-created_date', 1);
      const settingsRecord = adminSettings?.[0] || null;
      const adminEmail =
        settingsRecord?.lead_notification_email ||
        Deno.env.get('ADMIN_NOTIFICATION_EMAIL') ||
        Deno.env.get('ADMIN_EMAIL');

      if (adminEmail) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: adminEmail,
          from_name: 'ClientSurge Systems',
          subject: `Quick Start Complete — ${project.business_name || project.client_email || project.id}`,
          body: `
<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:600px;margin:0 auto;padding:32px 20px;">
  <h2 style="color:#0A1628;margin:0 0 16px;">Client Quick Start Complete</h2>
  <p style="color:#555;margin:0 0 20px;">
    <strong>${project.business_name || 'A client'}</strong> finished the portal quick-start checklist.
  </p>
  <div style="background:#f8fafc;border:1px solid #dbeafe;border-radius:12px;padding:16px;margin-bottom:20px;">
    <p style="margin:0 0 8px;color:#0A1628;"><strong>Project ID:</strong> ${project.id}</p>
    <p style="margin:0 0 8px;color:#0A1628;"><strong>Client Email:</strong> ${project.client_email || user.email}</p>
    <p style="margin:0;color:#0A1628;"><strong>Completed At:</strong> ${completionTimestamp}</p>
  </div>
  <p style="color:#555;margin:0;">Review the client portal and install queue to confirm the next setup steps are in motion.</p>
</div>`,
        });
      }

      await base44.asServiceRole.entities.CommunicationEvent.create({
        client_project_id: project_id,
        channel: 'internal',
        direction: 'system',
        event_type: 'quick_start_completed',
        provider: 'internal',
        status: 'processed',
        subject: 'Client quick start completed',
        message_body: `${project.business_name || project.client_email || project.id} completed quick start.`,
        context_type: 'client_quick_start',
        context_id: `quick_start_completed:${project_id}`,
        metadata_json: JSON.stringify({
          project_id,
          completed_at: completionTimestamp,
          completed_by: user.email,
        }),
      }).catch(() => null);
    } catch (error) {
      console.warn(`[saveQuickStartConfig] admin notification failed: ${error.message}`);
    }

    console.log(`Quick start config saved for project ${project_id} by ${user.email}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('saveQuickStartConfig error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
