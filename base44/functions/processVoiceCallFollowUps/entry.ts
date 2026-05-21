/**
 * processVoiceCallFollowUps — USE CASE #2
 * Scheduled: Hourly
 *
 * Finds leads where:
 *   - voice_call_attempted = true
 *   - voice_call_outcome IN [no_answer, busy, failed]
 *   - next_follow_up_at <= now (set by entity automation when outcome written)
 *   - voice_call_followup_sent != true (idempotency)
 *   - status NOT IN [Booked, Closed]
 *
 * Sends:
 *   1. Personalized SMS (AI-generated via generateIndustryFirstSMS or template fallback)
 *   2. Email if lead.email is present
 *   3. Logs CommunicationEvent for both
 *   4. Marks lead.voice_call_followup_sent = true
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { resendFetch } from "../_shared/resendFetch.js";
import { twilioFetch } from "../_shared/providerFetch.js";

const QUIET_START = 20; // 8pm Phoenix
const QUIET_END = 8;   // 8am Phoenix

function isQuietHours() {
  const hour = (new Date().getUTCHours() - 7 + 24) % 24;
  return hour >= QUIET_START || hour < QUIET_END;
}

function hoursSince(isoDate) {
  if (!isoDate) return 999;
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60);
}

const OUTCOME_LABELS = {
  no_answer: 'no answer',
  busy: 'busy signal',
  failed: 'failed to connect',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled (no user) or admin
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (isQuietHours()) {
      return Response.json({ skipped: true, reason: 'quiet_hours' });
    }

    // Load settings
    const [settings] = await base44.asServiceRole.entities.AdminSettings.list('-created_date', 1);
    const fromNumber = settings?.twilio_from_number || Deno.env.get('TWILIO_PHONE_NUMBER');
    const fromEmail = settings?.resend_from_email || Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@clientsurgesystems.com';
    const bookingLink = settings?.booking_link_default || Deno.env.get('DEFAULT_BOOKING_LINK') || '';
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const resendKey = Deno.env.get('RESEND_API_KEY');

    if (!accountSid || !authToken || !fromNumber) {
      return Response.json({ error: 'Twilio credentials not configured' }, { status: 500 });
    }

    // Find leads needing voice follow-up
    // voice_call_attempted=true, bad outcome, next_follow_up_at in the past, not already followed up
    const candidates = await base44.asServiceRole.entities.Leads.filter(
      {
        voice_call_attempted: true,
        voice_call_outcome: { $in: ['no_answer', 'busy', 'failed'] },
        status: { $nin: ['Booked', 'Closed'] },
      },
      '-updated_date',
      200
    );

    const now = Date.now();
    const results = { processed: 0, sms_sent: 0, email_sent: 0, skipped: 0, failed: 0 };

    for (const lead of (candidates || [])) {
      try {
        // Skip if follow-up already sent (idempotency)
        if (lead.voice_call_followup_sent) {
          results.skipped++;
          continue;
        }

        // Skip if next_follow_up_at not yet reached (24h gate)
        if (lead.next_follow_up_at && new Date(lead.next_follow_up_at).getTime() > now) {
          results.skipped++;
          continue;
        }

        // If no next_follow_up_at set, require at least 24h since last_contacted_at
        if (!lead.next_follow_up_at && hoursSince(lead.last_contacted_at) < 24) {
          results.skipped++;
          continue;
        }

        const firstName = (lead.full_name || '').split(' ')[0] || 'there';
        const industryKey = (lead.assigned_agent_name || 'general').replace('sales_rep_', '');
        const outcomeLabel = OUTCOME_LABELS[lead.voice_call_outcome] || 'an issue reaching you';

        results.processed++;

        // ── SMS ───────────────────────────────────────────────────────
        if (lead.phone) {
          let smsBody;
          try {
            // Try AI-generated personalized SMS first
            const aiResult = await base44.asServiceRole.functions.invoke('generateIndustryFirstSMS', {
              lead_id: lead.id,
              industry_key: industryKey,
            });
            smsBody = aiResult?.sms || null;
          } catch (_) {
            smsBody = null;
          }

          // Fallback template
          if (!smsBody) {
            smsBody = `Hi ${firstName}, we tried calling earlier but had ${outcomeLabel}. We'd still love to connect about automating your lead follow-up — when works for you? ${bookingLink}`.trim();
          }

          // TCPA
          if (!smsBody.includes('STOP')) {
            smsBody += '\n\nReply STOP to unsubscribe.';
          }

          try {
            const twilioRes = await twilioFetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({ To: lead.phone, From: fromNumber, Body: smsBody }),
              }
            );

            if (twilioRes.ok) {
              const twilioData = await twilioRes.json();
              await base44.asServiceRole.entities.CommunicationEvent.create({
                lead_id: lead.id,
                channel: 'sms',
                direction: 'outbound',
                event_type: 'sms_sent',
                provider: 'twilio',
                status: 'sent',
                subject: 'Voice Call Follow-Up SMS',
                message_body: smsBody,
                provider_message_id: twilioData.sid,
                metadata_json: JSON.stringify({ trigger: 'voice_call_followup', outcome: lead.voice_call_outcome }),
              });
              results.sms_sent++;
              console.log(`[processVoiceCallFollowUps] SMS sent to lead ${lead.id}`);
            } else {
              const err = await twilioRes.json().catch(() => ({}));
              console.error(`[processVoiceCallFollowUps] SMS failed for ${lead.id}: ${err?.message}`);
              results.failed++;
            }
          } catch (smsErr) {
            console.error(`[processVoiceCallFollowUps] SMS error for ${lead.id}:`, smsErr.message);
            results.failed++;
          }
        }

        // ── Email ──────────────────────────────────────────────────────
        if (lead.email && resendKey) {
          const emailSubject = `Hey ${firstName} — we tried to reach you`;
          const emailHtml = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;">
  <p style="font-size:16px;line-height:1.7;">Hi ${firstName},</p>
  <p style="font-size:15px;line-height:1.7;color:#444;">
    We attempted to call you earlier today but experienced ${outcomeLabel}. 
    We didn't want you to miss out on learning how ClientSurge can automate your lead follow-up and help you book more ${industryKey !== 'general' ? industryKey.replace('_', ' ') : 'service'} appointments.
  </p>
  <p style="font-size:15px;line-height:1.7;color:#444;">
    Would you be open to a quick 15-minute call this week? I can walk you through exactly what we'd build for ${lead.business_name || 'your business'}.
  </p>
  ${bookingLink ? `
  <div style="text-align:center;margin:32px 0;">
    <a href="${bookingLink}" style="display:inline-block;background:linear-gradient(135deg,#0A1628,#003B8F);color:#fff;padding:14px 32px;border-radius:9999px;text-decoration:none;font-weight:700;font-size:15px;">
      📅 Book a 15-Minute Call
    </a>
  </div>` : ''}
  <p style="font-size:14px;color:#666;">Or just reply to this email — I'm watching.</p>
  <p style="font-size:14px;color:#888;margin-top:32px;">— Nolan<br><span style="color:#0077CC;">ClientSurge Systems</span></p>
  <p style="font-size:11px;color:#bbb;margin-top:24px;">You're receiving this because you expressed interest in ClientSurge automation systems.</p>
</div>`;

          try {
            const emailRes = await resendFetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${resendKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: fromEmail,
                to: lead.email,
                subject: emailSubject,
                html: emailHtml,
              }),
            });

            if (emailRes.ok) {
              const emailData = await emailRes.json();
              await base44.asServiceRole.entities.CommunicationEvent.create({
                lead_id: lead.id,
                channel: 'email',
                direction: 'outbound',
                event_type: 'email_sent',
                provider: 'resend',
                status: 'sent',
                subject: emailSubject,
                message_body: emailHtml,
                provider_message_id: emailData.id,
                metadata_json: JSON.stringify({ trigger: 'voice_call_followup', outcome: lead.voice_call_outcome }),
              });
              results.email_sent++;
              console.log(`[processVoiceCallFollowUps] Email sent to lead ${lead.id}`);
            }
          } catch (emailErr) {
            console.error(`[processVoiceCallFollowUps] Email error for ${lead.id}:`, emailErr.message);
          }
        }

        // ── Mark as followed up + update status ───────────────────────
        await base44.asServiceRole.entities.Leads.update(lead.id, {
          voice_call_followup_sent: true,
          last_contacted_at: new Date().toISOString(),
          status: lead.status === 'New' ? 'Contacted' : lead.status,
        });

      } catch (leadErr) {
        console.error(`[processVoiceCallFollowUps] Error for lead ${lead.id}:`, leadErr.message);
        results.failed++;
      }
    }

    console.log(`[processVoiceCallFollowUps] Done:`, results);
    return Response.json({ success: true, ...results });

  } catch (error) {
    console.error('[processVoiceCallFollowUps] Fatal:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});