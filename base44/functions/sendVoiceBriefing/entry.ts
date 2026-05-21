/**
 * sendVoiceBriefing — USE CASE #7
 * Scheduled: Daily 7am MST (Phoenix)
 *
 * Calls Nolan's phone number via ElevenLabs TTS + Twilio outbound call.
 * Reads a 60-second AI-generated morning briefing:
 *   - New leads overnight
 *   - HOT leads needing immediate action
 *   - Overdue follow-ups
 *   - Any stalled clients
 *   - Payment failures
 *
 * Fallback: if call fails or voice_briefing_enabled=false, sends SMS summary instead.
 *
 * Required:
 *   - ADMIN_NOTIFICATION_PHONE secret (Nolan's phone)
 *   - ELEVENLABS_API_KEY secret
 *   - AdminSettings.voice_briefing_enabled = true
 *   - AdminSettings.elevenlabs_agent_ids.briefing = ElevenLabs agent ID for briefing
 *
 * The ElevenLabs "briefing" agent should be configured with:
 *   - System prompt: "You are Nolan's AI assistant. Read the following briefing clearly and concisely, then hang up."
 *   - Use a professional male voice
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { twilioFetch } from "../_shared/providerFetch.js";

const PHOENIX_OFFSET_HOURS = 7; // UTC-7, no DST

function isQuietHours() {
  const hour = (new Date().getUTCHours() - PHOENIX_OFFSET_HOURS + 24) % 24;
  return hour < 6 || hour >= 21; // Don't call before 6am or after 9pm
}

function hoursSince(isoDate) {
  if (!isoDate) return 999;
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [settings] = await base44.asServiceRole.entities.AdminSettings.list('-created_date', 1);

    // Check if voice briefing enabled
    if (!settings?.voice_briefing_enabled) {
      return Response.json({ skipped: true, reason: 'voice_briefing_disabled' });
    }

    if (isQuietHours()) {
      return Response.json({ skipped: true, reason: 'quiet_hours' });
    }

    const nolanPhone = settings?.voice_briefing_phone || Deno.env.get('ADMIN_NOTIFICATION_PHONE');
    if (!nolanPhone) {
      return Response.json({ error: 'No briefing phone number configured. Set AdminSettings.voice_briefing_phone or ADMIN_NOTIFICATION_PHONE.' }, { status: 400 });
    }

    const elevenLabsKey = Deno.env.get('ELEVENLABS_API_KEY');
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = settings?.twilio_from_number || Deno.env.get('TWILIO_PHONE_NUMBER');

    // ── Gather data for briefing ──────────────────────────────────────────
    const now = Date.now();
    const last24hAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    const [allLeads, allOrders] = await Promise.all([
      base44.asServiceRole.entities.Leads.list('-created_date', 1000),
      base44.asServiceRole.entities.Order.filter({ payment_status: 'paid' }, '-created_date', 100).catch(() => []),
    ]);

    const newLeads = (allLeads || []).filter(l => l.created_date >= last24hAgo);
    const hotLeads = (allLeads || []).filter(l =>
      l.activation_priority === 'Hot' &&
      !['Booked', 'Closed'].includes(l.status) &&
      !l.voice_call_attempted
    );
    const overdueFollowUps = (allLeads || []).filter(l => {
      if (['Booked', 'Closed'].includes(l.status)) return false;
      if (l.next_follow_up_at && new Date(l.next_follow_up_at).getTime() <= now) return true;
      return hoursSince(l.last_contacted_at) > 48;
    });
    const pastDueClients = (allOrders || []).filter(o => o.billing_status === 'past_due');
    const stalledInstalls = (allOrders || []).filter(o =>
      o.order_status === 'paid_setup_in_progress' &&
      hoursSince(o.install_initialized_at) > 48
    );

    // ── Generate AI briefing script ───────────────────────────────────────
    const briefingPrompt = `You are Nolan's AI morning briefing assistant for ClientSurge Systems.
Generate a crisp, professional 45-60 second spoken briefing script for Nolan to hear when called on his phone.
Speak directly to him. Be concise. Prioritize actionable information.

DATA:
- New leads in last 24 hours: ${newLeads.length}
- HOT leads needing immediate outreach (no call attempted): ${hotLeads.length}${hotLeads.length > 0 ? '\n  Top: ' + hotLeads.slice(0, 3).map(l => `${l.full_name || 'Unknown'} (${l.business_name || '?'}, score ${l.lead_score || 0})`).join(', ') : ''}
- Overdue follow-ups: ${overdueFollowUps.length}
- Past-due clients: ${pastDueClients.length}${pastDueClients.length > 0 ? '\n  Clients: ' + pastDueClients.slice(0, 2).map(o => o.business_name).join(', ') : ''}
- Stalled installations (48h+ no progress): ${stalledInstalls.length}${stalledInstalls.length > 0 ? '\n  Clients: ' + stalledInstalls.slice(0, 2).map(o => o.business_name).join(', ') : ''}
- Current date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/Phoenix' })}

Generate ONLY the spoken script. No formatting. Start with "Good morning Nolan".
End with the single most important action to take first thing today.`;

    const briefingScript = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: briefingPrompt,
      model: 'gpt_5_mini',
    });

    const scriptText = typeof briefingScript === 'string' ? briefingScript : JSON.stringify(briefingScript);
    console.log(`[sendVoiceBriefing] Generated script (${scriptText.length} chars): ${scriptText.slice(0, 150)}...`);

    // ── Option A: ElevenLabs TTS → Twilio outbound call via text-to-speech TwiML ──
    // We generate TwiML that uses Twilio's <Say> with the AI-generated script.
    // For ElevenLabs voice quality, the agent_id approach would require a Conversational agent.
    // The simplest reliable approach: use Twilio TwiML <Say> with Polly voice + the script.
    let callResult = null;
    let callMethod = 'none';

    if (elevenLabsKey && accountSid && authToken && fromNumber) {
      const agentId = settings?.elevenlabs_agent_ids?.briefing;

      if (agentId) {
        // ElevenLabs outbound call with first_message = briefing script
        try {
          const phoneNumberId = settings?.elevenlabs_phone_number_ids?.general
            || settings?.elevenlabs_phone_number_ids?.med_spa;

          if (phoneNumberId) {
            const elRes = await fetch('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'xi-api-key': elevenLabsKey,
              },
              body: JSON.stringify({
                agent_id: agentId,
                agent_phone_number_id: phoneNumberId,
                to_number: nolanPhone,
                conversation_initiation_client_data: {
                  conversation_config_override: {
                    agent: {
                      first_message: scriptText,
                    },
                  },
                },
              }),
            });

            if (elRes.ok) {
              callResult = await elRes.json();
              callMethod = 'elevenlabs';
              console.log('[sendVoiceBriefing] ElevenLabs call initiated:', callResult?.conversation_id);
            } else {
              const err = await elRes.json().catch(() => ({}));
              console.error('[sendVoiceBriefing] ElevenLabs call failed:', err);
            }
          }
        } catch (elErr) {
          console.error('[sendVoiceBriefing] ElevenLabs call error:', elErr.message);
        }
      }

      // Fallback: Twilio TwiML call with Polly voice
      if (!callResult && accountSid && authToken && fromNumber) {
        try {
          const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew" rate="95%">${scriptText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Say>
  <Pause length="1"/>
  <Hangup/>
</Response>`;

          // Twilio can't take inline TwiML for outbound calls — need a TwiML URL.
          // Best approach: store TwiML as a temporary public URL.
          // Since we can't create a public URL inline, we use Twilio TwiML Bins or
          // encode as base64 data URI. Instead, use the simpler approach:
          // Call with twiml parameter (Twilio supports this directly in the API)
          const callRes = await twilioFetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
            {
              method: 'POST',
              headers: {
                Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                To: nolanPhone,
                From: fromNumber,
                Twiml: twiml,
              }),
            }
          );

          if (callRes.ok) {
            callResult = await callRes.json();
            callMethod = 'twilio_tts';
            console.log('[sendVoiceBriefing] Twilio TTS call initiated:', callResult?.sid);
          } else {
            const err = await callRes.json().catch(() => ({}));
            console.error('[sendVoiceBriefing] Twilio call failed:', err);
          }
        } catch (twilioErr) {
          console.error('[sendVoiceBriefing] Twilio call error:', twilioErr.message);
        }
      }
    }

    // ── Fallback: SMS summary if call failed ──────────────────────────────
    if (!callResult) {
      console.log('[sendVoiceBriefing] Call failed — sending SMS fallback');
      const smsBody = `📊 Morning Briefing:\n• ${newLeads.length} new leads (24h)\n• ${hotLeads.length} HOT leads uncalled\n• ${overdueFollowUps.length} overdue follow-ups\n• ${pastDueClients.length} past-due clients\n• ${stalledInstalls.length} stalled installs\n\nReply STOP to unsubscribe.`;

      if (accountSid && authToken && fromNumber) {
        await twilioFetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ To: nolanPhone, From: fromNumber, Body: smsBody }),
        }).catch(e => console.error('[sendVoiceBriefing] SMS fallback failed:', e.message));
      }
      callMethod = 'sms_fallback';
    }

    // ── Log CommunicationEvent ───────────────────────────────────────────
    await base44.asServiceRole.entities.CommunicationEvent.create({
      channel: 'voice',
      direction: 'outbound',
      event_type: 'status_update',
      provider: callMethod === 'elevenlabs' ? 'elevenlabs' : callMethod === 'twilio_tts' ? 'twilio' : 'internal',
      status: callResult ? 'sent' : 'failed',
      subject: `Daily Voice Briefing — ${new Date().toLocaleDateString('en-US', { timeZone: 'America/Phoenix' })}`,
      message_body: scriptText,
      metadata_json: JSON.stringify({
        call_method: callMethod,
        stats: { newLeads: newLeads.length, hotLeads: hotLeads.length, overdueFollowUps: overdueFollowUps.length, pastDueClients: pastDueClients.length },
        call_sid: callResult?.sid || callResult?.conversation_id,
      }),
    });

    return Response.json({
      success: true,
      call_method: callMethod,
      stats: {
        new_leads: newLeads.length,
        hot_leads: hotLeads.length,
        overdue_follow_ups: overdueFollowUps.length,
        past_due_clients: pastDueClients.length,
        stalled_installs: stalledInstalls.length,
      },
    });

  } catch (error) {
    console.error('[sendVoiceBriefing] Fatal:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});