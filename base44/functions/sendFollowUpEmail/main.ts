import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { resendFetch } from "../_shared/resendFetch.js";
import { getApprovedEmailSender, getEmailOutreachGate } from "../_shared/emailDeliverabilityGate.js";
import { csEmailShell, csInfoCard, csPillButton, csEmailLogoUrl, CS_EMAIL_THEME, csEmailEscape } from "../_shared/clientSurgeEmailDesignSystem.ts";
import { getClientSurgeSignature, senderTags } from "../_shared/clientSurgeEmailSignatures.ts";

function followUpCopy(followUpType: string, leadName: string) {
  if (followUpType === 'email_followup_24h') {
    return {
      subject: 'Still interested in improving your lead response?',
      title: 'Quick follow-up on your ClientSurge inquiry.',
      subtitle: 'A faster response system can help stop good leads from slipping through the cracks.',
      intro: `Hi ${leadName || 'there'}, we wanted to follow up on your inquiry and see if you are still interested in learning more.`,
      cardLabel: 'Why this matters',
      cardBody: 'Most lost opportunities are not lost because the business is bad. They are lost because response time, follow-up, or booking handoff is too slow.',
      ctaLabel: 'View ClientSurge Systems →',
    };
  }
  return {
    subject: 'Want help getting your automation system started?',
    title: 'Want help moving this forward?',
    subtitle: 'ClientSurge can help turn missed calls, slow replies, and weak follow-up into a tighter lead-response system.',
    intro: `Hi ${leadName || 'there'}, we have not heard back yet. If improving lead capture and follow-up is still a priority, we can help you move forward.`,
    cardLabel: 'Next best step',
    cardBody: 'Reply to this email with your biggest bottleneck: missed calls, slow response, booking follow-up, or lead nurture. We will point you in the right direction.',
    ctaLabel: 'Review Your Options →',
  };
}

function buildFollowUpEmail(input: { followUpType: string; leadName: string; websiteUrl: string }) {
  const copy = followUpCopy(input.followUpType, input.leadName);
  const signature = getClientSurgeSignature("sales");
  const body = `<p style="margin:0 0 10px;color:${CS_EMAIL_THEME.muted};font-size:15px;line-height:22px;font-weight:650;">${csEmailEscape(copy.intro)}</p>${csInfoCard(copy.cardLabel, copy.cardBody, { accent: true })}${csInfoCard("No pressure", "If now is not the right time, no problem. If it is, reply here and we will help you identify the highest-leverage automation first.")}${csPillButton(copy.ctaLabel, input.websiteUrl)}`;
  return { subject: copy.subject, text: `${copy.intro}\n\n${copy.cardBody}\n\nReply to this email if you want help choosing the best next step.`, html: csEmailShell({ badge: "Follow Up", title: copy.title, subtitle: copy.subtitle, body, logoUrl: csEmailLogoUrl(), footerTitle: signature.footerTitle, footerText: signature.footerText }) };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { automation_job_id, follow_up_type } = await req.json();

    if (!automation_job_id || !follow_up_type) return secureJson({ error: 'Missing required fields' }, { status: 400 });

    const job = await base44.entities.AutomationJob.get(automation_job_id);
    if (!job) return secureJson({ error: 'Job not found' }, { status: 404 });

    const lead = await base44.entities.Lead.get(job.lead_id);
    if (!lead || !lead.email) return secureJson({ error: 'Lead or email not found' }, { status: 404 });

    const settings = await base44.entities.AdminSettings.list();
    const adminSettings = settings[0] || {};
    const websiteUrl = Deno.env.get("APP_URL") || "https://clientsurgesystems.com";
    const rendered = buildFollowUpEmail({ followUpType: follow_up_type, leadName: lead.name || lead.full_name || "there", websiteUrl });
    const bodyText = rendered.text;
    let emailResult = null;

    if (adminSettings.resend_enabled && Deno.env.get('RESEND_API_KEY')) {
      const sendGate = getEmailOutreachGate('direct follow-up email');
      if (!sendGate.ok) {
        await base44.entities.CommunicationEvent.create({ lead_id: job.lead_id, channel: 'email', direction: 'outbound', event_type: 'email_blocked', provider: 'resend', status: 'blocked', subject: rendered.subject, message_body: bodyText, error_message: sendGate.reason, metadata_json: JSON.stringify({ automation_job_id, follow_up_type, proof_status: sendGate.proof_status, requires_owner_action: true }) });
        return secureJson({ success: false, email_sent: false, error: 'Follow-up email blocked until deliverability proof is complete.', reason: sendGate.reason, proof_status: sendGate.proof_status }, { status: 403 });
      }

      const signature = getClientSurgeSignature("sales");
      const resendResponse = await resendFetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: getApprovedEmailSender(adminSettings, { preferLeads: true }) || `${signature.fromName} <${signature.fromEmail}>`, reply_to: signature.replyTo, to: lead.email, subject: rendered.subject, html: rendered.html, text: rendered.text, tags: senderTags("sales", "direct_follow_up") }),
      });

      const resendPayload = await resendResponse.text();
      try { emailResult = resendPayload ? JSON.parse(resendPayload) : {}; } catch { emailResult = {}; }
      if (!resendResponse.ok) emailResult = { error: { message: emailResult?.message || `Resend error ${resendResponse.status}` } };
    }

    await base44.entities.CommunicationEvent.create({ lead_id: job.lead_id, channel: 'email', direction: 'outbound', event_type: 'email_sent', provider: 'resend', status: emailResult?.id ? 'sent' : 'failed', subject: rendered.subject, message_body: bodyText, provider_message_id: emailResult?.id || null, error_message: emailResult?.error?.message || null });
    await base44.entities.AutomationJob.update(automation_job_id, { status: 'completed', processed_at: new Date().toISOString(), result_metadata: JSON.stringify(emailResult) });

    return secureJson({ success: true, email_sent: !!emailResult?.id, provider_id: emailResult?.id });
  } catch (error) {
    return secureJson({ error: error.message }, { status: 500 });
  }
});
