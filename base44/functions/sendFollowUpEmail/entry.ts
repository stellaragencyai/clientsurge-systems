import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...(init.headers || {}),
    },
  });
}

const FALLBACK_SENDER = "noreply@clientsurgesystems.com";

function getApprovedEmailSender(settings = {}) {
  const configured = String(settings?.resend_from_email || "").trim();
  if (configured && configured.includes("@")) return configured;
  const envSender = String(Deno.env.get("RESEND_FROM_EMAIL") || "").trim();
  if (envSender && envSender.includes("@")) return envSender;
  return FALLBACK_SENDER;
}

function getEmailOutreachGate(context = "email outreach") {
  const proofStatus = String(Deno.env.get("EMAIL_DELIVERABILITY_PROOF_STATUS") || "").trim().toLowerCase();
  if (["verified", "passed", "production_verified"].includes(proofStatus)) {
    return { ok: true, reason: null, proof_status: proofStatus || "verified" };
  }
  return {
    ok: false,
    reason: `Email outreach blocked: deliverability proof not complete (context: ${context}).`,
    proof_status: proofStatus || "missing",
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { automation_job_id, follow_up_type } = await req.json();

    if (!automation_job_id || !follow_up_type) {
      return secureJson({ error: 'Missing required fields' }, { status: 400 });
    }

    const job = await base44.asServiceRole.entities.AutomationJob.get(automation_job_id);
    if (!job) {
      return secureJson({ error: 'Job not found' }, { status: 404 });
    }

    const lead = await base44.asServiceRole.entities.Leads.get(job.lead_id);
    if (!lead || !lead.email) {
      return secureJson({ error: 'Lead or email not found' }, { status: 404 });
    }

    const settings = await base44.asServiceRole.entities.AdminSettings.list();
    const adminSettings = settings?.[0] || {};

    let subject, body;
    if (follow_up_type === 'email_followup_24h') {
      subject = 'Just checking in — still interested?';
      body = 'Hi ' + (lead.full_name || 'there') + ', we wanted to follow up on your inquiry. Are you still interested in learning more? Let us know!';
    } else if (follow_up_type === 'email_followup_3d') {
      subject = 'Want help getting started?';
      body = 'Hi ' + (lead.full_name || 'there') + ', we haven\'t heard back from you. We\'d love to help you move forward. Reply to this email or book a time that works for you.';
    } else {
      subject = 'Following up';
      body = 'Hi ' + (lead.full_name || 'there') + ', just checking in!';
    }

    let emailResult = null;
    if (adminSettings.resend_enabled && Deno.env.get('RESEND_API_KEY')) {
      const sendGate = getEmailOutreachGate('direct follow-up email');
      if (!sendGate.ok) {
        await base44.asServiceRole.entities.CommunicationEvent.create({
          lead_id: job.lead_id,
          channel: 'email',
          direction: 'outbound',
          event_type: 'email_skipped',
          provider: 'resend',
          status: 'skipped',
          subject,
          message_body: body,
          error_message: sendGate.reason,
          metadata_json: JSON.stringify({
            automation_job_id,
            follow_up_type,
            proof_status: sendGate.proof_status,
            requires_owner_action: true,
          }),
        });

        return secureJson({
          success: false,
          email_sent: false,
          error: 'Follow-up email blocked until deliverability proof is complete.',
          reason: sendGate.reason,
          proof_status: sendGate.proof_status,
        }, { status: 403 });
      }

      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: getApprovedEmailSender(adminSettings),
          to: lead.email,
          subject,
          html: `<p>${body}</p>`,
        }),
      });

      const resendPayload = await resendResponse.text();
      try {
        emailResult = resendPayload ? JSON.parse(resendPayload) : {};
      } catch {
        emailResult = {};
      }
      if (!resendResponse.ok) {
        emailResult = {
          error: {
            message: emailResult?.message || `Resend error ${resendResponse.status}`,
          },
        };
      }
    }

    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: job.lead_id,
      channel: 'email',
      direction: 'outbound',
      event_type: 'email_sent',
      provider: 'resend',
      status: emailResult?.id ? 'sent' : 'failed',
      subject,
      message_body: body,
      provider_message_id: emailResult?.id || null,
      error_message: emailResult?.error?.message || null,
    });

    await base44.asServiceRole.entities.AutomationJob.update(automation_job_id, {
      status: 'completed',
      processed_at: new Date().toISOString(),
      result_metadata: JSON.stringify(emailResult),
    });

    return secureJson({
      success: true,
      email_sent: !!emailResult?.id,
      provider_id: emailResult?.id,
    });
  } catch (error) {
    return secureJson({ error: error.message }, { status: 500 });
  }
});