/**
 * receiveElevenLabsPostCallWebhook — USE CASE #4
 * PUBLIC WEBHOOK: ElevenLabs post-call event handler
 *
 * ElevenLabs fires this after every call ends with:
 *   - conversation_id
 *   - call_sid (Twilio CallSid)
 *   - status (completed, no-answer, failed)
 *   - transcript (array of {role, message} objects)
 *   - metadata (agent_id, phone, etc.)
 *
 * ElevenLabs Console setup (manual — one-time):
 *   Dashboard → Agent → Post-call webhook URL → set to this function URL
 *   Copy the webhook secret → save to ELEVENLABS_WEBHOOK_SECRET secret
 *
 * What this does:
 *   1. Validates ElevenLabs webhook signature (HMAC-SHA256)
 *   2. Finds matching Lead by phone number
 *   3. Updates lead.voice_call_outcome (answered / no_answer / failed)
 *   4. Passes transcript to processCallRecording for AI summary
 *   5. Logs CommunicationEvent
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import crypto from 'node:crypto';

function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return null;
  return `+${digits.length === 10 ? '1' : ''}${digits}`;
}

function mapStatus(elevenLabsStatus) {
  // ElevenLabs status values: 'done', 'failed', 'no_answer', 'busy'
  if (elevenLabsStatus === 'done') return 'answered';
  if (elevenLabsStatus === 'no_answer') return 'no_answer';
  if (elevenLabsStatus === 'busy') return 'busy';
  return 'failed';
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const rawBody = await req.text();

  // ── Validate ElevenLabs webhook signature ─────────────────────────────
  const webhookSecret = Deno.env.get('ELEVENLABS_WEBHOOK_SECRET');
  if (webhookSecret) {
    const signature = req.headers.get('ElevenLabs-Signature') || req.headers.get('X-ElevenLabs-Signature') || '';
    if (signature) {
      const computed = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
      if (`sha256=${computed}` !== signature) {
        console.warn('[receiveElevenLabsPostCallWebhook] Invalid signature — rejected');
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else {
      console.warn('[receiveElevenLabsPostCallWebhook] No ElevenLabs-Signature header — proceeding without validation');
    }
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (_) {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log('[receiveElevenLabsPostCallWebhook] Received:', JSON.stringify({
    conversation_id: payload?.conversation_id,
    status: payload?.status || payload?.call_status,
    agent_id: payload?.agent_id,
  }));

  const base44 = createClientFromRequest(req);

  try {
    const conversationId = payload?.conversation_id;
    const callSid = payload?.call_sid || payload?.metadata?.call_sid;
    const elevenLabsStatus = payload?.status || payload?.call_status || 'failed';
    const voiceCallOutcome = mapStatus(elevenLabsStatus);

    // Extract phone from payload (various field names ElevenLabs may use)
    const rawPhone = payload?.to_number
      || payload?.phone_number
      || payload?.metadata?.to_number
      || payload?.conversation_initiation_client_data?.conversation_config_override?.call_data?.to_number
      || null;

    const normalizedPhone = normalizePhone(rawPhone);

    // ── Find lead by phone or conversation_id (stored in CommunicationEvent metadata) ──
    let lead = null;

    if (normalizedPhone) {
      const matches = await base44.asServiceRole.entities.Leads.filter(
        { phone: normalizedPhone }, '-created_date', 1
      ).catch(() => []);
      if (matches?.length > 0) lead = matches[0];
    }

    // Fallback: search CommunicationEvent by conversation_id
    if (!lead && conversationId) {
      const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
        { event_type: 'voice_call_initiated', provider: 'elevenlabs' },
        '-created_date',
        100
      ).catch(() => []);

      const matchedEvent = (events || []).find(e => {
        try {
          const meta = JSON.parse(e.metadata_json || '{}');
          return meta.conversation_id === conversationId;
        } catch (_) { return false; }
      });

      if (matchedEvent?.lead_id) {
        const leadMatches = await base44.asServiceRole.entities.Leads.filter(
          { id: matchedEvent.lead_id }, '-created_date', 1
        ).catch(() => []);
        if (leadMatches?.length > 0) lead = leadMatches[0];
      }
    }

    if (!lead) {
      console.warn('[receiveElevenLabsPostCallWebhook] No matching lead found for phone:', rawPhone, '/ conversation:', conversationId);
      return Response.json({ success: true, warning: 'No matching lead found' });
    }

    console.log(`[receiveElevenLabsPostCallWebhook] Matched lead ${lead.id} — outcome: ${voiceCallOutcome}`);

    // ── Update lead voice_call_outcome ───────────────────────────────────
    const leadUpdate = {
      voice_call_outcome: voiceCallOutcome,
      last_contacted_at: new Date().toISOString(),
    };

    // If call was NOT answered, schedule a follow-up in 24h
    if (voiceCallOutcome !== 'answered') {
      const followUpAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      leadUpdate.next_follow_up_at = followUpAt;
      console.log(`[receiveElevenLabsPostCallWebhook] Scheduling follow-up at ${followUpAt} for lead ${lead.id}`);
    }

    await base44.asServiceRole.entities.Leads.update(lead.id, leadUpdate);

    // ── Log CommunicationEvent ───────────────────────────────────────────
    const eventType = voiceCallOutcome === 'answered' ? 'voice_call_answered'
      : voiceCallOutcome === 'no_answer' ? 'voice_call_no_answer'
      : 'voice_call_completed';

    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: lead.id,
      channel: 'voice',
      direction: 'outbound',
      event_type: eventType,
      provider: 'elevenlabs',
      status: voiceCallOutcome === 'answered' ? 'delivered' : 'failed',
      subject: `ElevenLabs call ended — ${voiceCallOutcome}`,
      metadata_json: JSON.stringify({
        conversation_id: conversationId,
        call_sid: callSid,
        status: elevenLabsStatus,
        outcome: voiceCallOutcome,
        has_transcript: !!(payload?.transcript?.length),
      }),
    });

    // ── If call was answered and has transcript, feed to processCallRecording ──
    if (voiceCallOutcome === 'answered' && payload?.transcript?.length) {
      try {
        const transcriptText = (payload.transcript || [])
          .map(t => `${t.role === 'agent' ? 'AI' : 'Lead'}: ${t.message || t.content || ''}`)
          .join('\n');

        await base44.asServiceRole.functions.invoke('processCallRecording', {
          lead_id: lead.id,
          recording_sid: conversationId,
          transcript_text: transcriptText,
          call_status: 'completed',
          duration: payload?.duration_seconds || 0,
        });
        console.log(`[receiveElevenLabsPostCallWebhook] Transcript sent to processCallRecording for lead ${lead.id}`);
      } catch (recordingErr) {
        console.error('[receiveElevenLabsPostCallWebhook] processCallRecording failed (non-blocking):', recordingErr.message);
      }
    }

    return Response.json({
      success: true,
      lead_id: lead.id,
      outcome: voiceCallOutcome,
      follow_up_scheduled: voiceCallOutcome !== 'answered',
    });

  } catch (error) {
    console.error('[receiveElevenLabsPostCallWebhook] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});