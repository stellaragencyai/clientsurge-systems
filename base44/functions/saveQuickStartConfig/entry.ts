import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { resolveClientPortalAccess } from "../_shared/portalOwnership.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return secureJson({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const {
      project_id,
      business_name,
      industry,
      phone,
      website,
      brand_voice,
      business_hours,
      booking_link,
      calendar_system,
      requires_consultation,
      response_speed,
      customer_questions,
      twilio_number,
      sms_template,
      missed_call_sms_template,
      resend_from_email,
      lead_notification_email,
      email_confirmation_template,
    } = body;

    const access = await resolveClientPortalAccess({
      base44,
      userEmail: user.email,
    });

    if (access.status !== "resolved" || !access.project?.id) {
      return secureJson({ error: 'Forbidden' }, { status: 403 });
    }

    if (project_id && project_id !== access.project.id) {
      return secureJson({ error: 'Forbidden' }, { status: 403 });
    }

    const updates = {
      quick_start_completed: true,
    };

    if (business_name !== undefined) updates.business_name = business_name || "";
    if (industry !== undefined) updates.industry = industry || "";
    if (phone !== undefined) updates.phone = phone || "";
    if (website !== undefined) updates.website = website || "";
    if (brand_voice !== undefined) updates.brand_voice = brand_voice || "";
    if (business_hours !== undefined) updates.business_hours = business_hours || "";
    if (booking_link !== undefined) updates.booking_link = booking_link || "";
    if (calendar_system !== undefined) updates.calendar_system = calendar_system || "";
    if (requires_consultation !== undefined) updates.requires_consultation = requires_consultation || "";
    if (response_speed !== undefined) updates.response_speed = response_speed || "";
    if (customer_questions !== undefined) updates.customer_questions = customer_questions || "";
    if (twilio_number !== undefined) updates.twilio_number = twilio_number || "";
    if (sms_template !== undefined) updates.sms_template = sms_template || "";
    if (missed_call_sms_template !== undefined) updates.missed_call_sms_template = missed_call_sms_template || "";
    if (resend_from_email !== undefined) updates.resend_from_email = resend_from_email || "";
    if (lead_notification_email !== undefined) updates.lead_notification_email = lead_notification_email || "";
    if (email_confirmation_template !== undefined) updates.email_confirmation_template = email_confirmation_template || "";

    const updatedProject = await base44.asServiceRole.entities.ClientProject.update(access.project.id, updates);

    console.log(`[saveQuickStartConfig] Quick start config saved for project ${access.project.id} by ${user.email}`);
    return secureJson({ success: true, project: updatedProject });
  } catch (error) {
    console.error('[saveQuickStartConfig] saveQuickStartConfig error:', error);
    return secureJson({ error: error.message }, { status: 500 });
  }
});
