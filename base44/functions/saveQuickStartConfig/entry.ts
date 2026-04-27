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

    // Also stamp the project
    await base44.asServiceRole.entities.ClientProject.update(project_id, {
      quick_start_completed: true,
    });

    console.log(`Quick start config saved for project ${project_id} by ${user.email}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('saveQuickStartConfig error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});