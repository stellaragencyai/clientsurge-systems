import { secureJson } from "../_shared/response.ts";
/**
 * processCallRecording — Twilio recording webhook handler.
 *
 * Triggered by Twilio when a call recording is complete.
 * Twilio posts to this URL when you set the Recording Status Callback URL
 * in your Twilio number settings or twiML.
 *
 * Flow:
 *  1. Parse Twilio webhook params (RecordingUrl, CallSid, RecordingDuration, etc.)
 *  2. Match the call to a Lead by caller phone number
 *  3. Download recording transcript via Twilio Intelligence (if available),
 *     or fetch the MP3 URL and pass it to LLM for transcription via audio URL
 *  4. Call LLM (Claude Sonnet) to generate structured summary:
 *     - transcript excerpt
 *     - key pain points
 *     - overall sentiment
 *     - action items
 *     - recommended next step
 *  5. Save summary as a CommunicationEvent (shows in timeline)
 *  6. Save summary as an Events note (shows in Notes section)
 *  7. Update lead's last_contacted_at
 *
 * Webhook URL: set in Twilio Console → Phone Numbers → Voice → Recording Status Callback
 * Format: POST
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { twilioFetch } from "../_shared/providerFetch.js";
import {
  buildWebhookAuthErrorResponse,
  verifyTwilioWebhookRequest,
} from "../_shared/webhookSecurity.js";

function normalizePhone(phone) {
  if (!phone) return "";
  return phone.replace(/\D/g, "").replace(/^1/, "");
}

function twilioAuth(accountSid, authToken) {
  return `Basic ${btoa(`${accountSid}:${authToken}`)}`;
}

async function fetchTwilioTranscript(accountSid, authToken, recordingSid) {
  // Fetch recording transcription via Recordings API when available.
  const transcriptRes = await twilioFetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}/Transcriptions.json`,
    { headers: { Authorization: twilioAuth(accountSid, authToken) } }
  );
  if (!transcriptRes.ok) return null;
  const data = await transcriptRes.json();
  const completed = (data?.transcriptions || []).find(t => t.status === "completed");
  return completed?.transcription_text || null;
}

async function fetchRecordingMetadata(accountSid, authToken, recordingSid) {
  const res = await twilioFetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}.json`,
    { headers: { Authorization: twilioAuth(accountSid, authToken) } }
  );
  if (!res.ok) return null;
  return await res.json();
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}

    // Parse Twilio webhook form data (Twilio sends as application/x-www-form-urlencoded)
    const contentType = req.headers.get("content-type") || "";
    let params = {};
    let verifiedTwilioWebhook = false;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      const verification = await verifyTwilioWebhookRequest({ req, formData });
      if (!verification.ok) {
        console.warn("[processCallRecording] Rejected untrusted Twilio recording webhook", verification);
        return buildWebhookAuthErrorResponse({
          provider: "twilio",
          code: verification.code,
        });
      }
      verifiedTwilioWebhook = true;
      params = Object.fromEntries(formData.entries());
    } else {
      // Support direct admin test call
      if (!user || user.role !== "admin") {
        return secureJson({ error: "Forbidden: Admin only" }, { status: 403 });
      }
      params = await req.json().catch(() => ({}));
    }

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");

    if (!accountSid || !authToken) {
      return secureJson({ error: "Twilio credentials not configured" }, { status: 500 });
    }

    // Extract recording fields from Twilio webhook
    const recordingSid = params.RecordingSid || params.recording_sid;
    const recordingUrl = params.RecordingUrl || params.recording_url;
    const callSid = params.CallSid || params.call_sid;
    const callerRaw = params.Called || params.Caller || params.From || params.caller || params.from_number;
    const calledRaw = params.Called || params.To || params.called;
    const durationSecs = parseInt(params.RecordingDuration || params.duration || "0", 10);
    const callStatus = params.CallStatus || params.call_status || "completed";

    // For direct test calls, allow passing lead_id directly
    const directLeadId = params.lead_id || null;

    if (!recordingSid && !directLeadId) {
      return secureJson({ error: "RecordingSid required" }, { status: 400 });
    }

    console.log(`[processCallRecording] processCallRecording: duration=${durationSecs}s, verified=${verifiedTwilioWebhook}, directLead=${!!directLeadId}`);

    // Find matching lead by phone number
    let lead = null;
    let leadId = directLeadId;

    if (!leadId) {
      // Try to match by caller phone (normalize both sides)
      const callerNorm = normalizePhone(callerRaw);
      const calledNorm = normalizePhone(calledRaw);

      const allLeads = await base44.asServiceRole.entities.Leads.list("-created_date", 5000);
      for (const l of allLeads || []) {
        const leadPhoneNorm = normalizePhone(l.phone);
        if (leadPhoneNorm && (leadPhoneNorm === callerNorm || leadPhoneNorm === calledNorm)) {
          lead = l;
          leadId = l.id;
          break;
        }
      }
    } else {
      lead = await base44.asServiceRole.entities.Leads.get(leadId);
    }

    if (!leadId) {
      console.warn(`[processCallRecording] processCallRecording: No lead found for caller ${callerRaw}`);
      // Still log the recording so it's not lost
      return secureJson({
        success: true,
        warning: "No matching lead found for this caller",
        caller: callerRaw,
        recording_sid: recordingSid,
      });
    }

    if (!lead) {
      lead = await base44.asServiceRole.entities.Leads.get(leadId);
    }

    // Step 1: Try to get Twilio transcript, else use recording URL for LLM
    let transcript = null;
    if (recordingSid) {
      transcript = await fetchTwilioTranscript(accountSid, authToken, recordingSid);
    }

    // Step 2: Generate AI structured summary
    const durationLabel = durationSecs > 0
      ? `${Math.floor(durationSecs / 60)}m ${durationSecs % 60}s`
      : "unknown duration";

    const recordingMp3Url = recordingUrl ? `${recordingUrl}.mp3` : null;

    const promptContext = transcript
      ? `TRANSCRIPT:\n${transcript}`
      : `No transcript available. The recording URL is: ${recordingMp3Url || "not provided"}. Analyze based on context clues only.`;

    const prompt = `You are an expert sales call analyst for ClientSurge Systems, a lead automation agency. 
Analyze the following call recording information and generate a structured summary.

LEAD INFO:
- Name: ${lead?.full_name || "Unknown"}
- Business: ${lead?.business_name || "Unknown"}
- Business Type: ${lead?.business_type || "Unknown"}
- Current Status: ${lead?.status || "Unknown"}
- Problem Stated: ${lead?.problem || "Unknown"}

CALL DETAILS:
- Duration: ${durationLabel}
- Call Status: ${callStatus}
- Call SID: ${callSid || "N/A"}
- Recording SID: ${recordingSid || "N/A"}

${promptContext}

Generate a comprehensive call summary in the following JSON structure:

{
  "overall_sentiment": "Positive" | "Neutral" | "Negative",
  "sentiment_confidence": 0.0-1.0,
  "call_quality": "productive" | "brief" | "unproductive" | "no_answer",
  "summary": "2-3 sentence summary of what was discussed",
  "key_pain_points": ["pain point 1", "pain point 2"],
  "objections_raised": ["objection 1"] or [],
  "buying_signals": ["signal 1"] or [],
  "action_items": [
    { "owner": "team" | "lead", "task": "specific action to take", "priority": "high" | "medium" | "low" }
  ],
  "recommended_next_status": "Contacted" | "Replied" | "Qualified" | "Booking Prompt Sent" | "Booked" | null,
  "recommended_next_step": "Specific next step description",
  "follow_up_timing": "immediately" | "within 24h" | "within 48h" | "this week" | "not needed"
}

If no transcript is available, make reasonable inferences based on call duration and lead context.
Short calls (< 60s) likely indicate voicemail or no answer.`;

    const aiSummary = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: "claude_sonnet_4_6",
      response_json_schema: {
        type: "object",
        properties: {
          overall_sentiment: { type: "string" },
          sentiment_confidence: { type: "number" },
          call_quality: { type: "string" },
          summary: { type: "string" },
          key_pain_points: { type: "array", items: { type: "string" } },
          objections_raised: { type: "array", items: { type: "string" } },
          buying_signals: { type: "array", items: { type: "string" } },
          action_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                owner: { type: "string" },
                task: { type: "string" },
                priority: { type: "string" },
              }
            }
          },
          recommended_next_status: { type: "string" },
          recommended_next_step: { type: "string" },
          follow_up_timing: { type: "string" },
        }
      }
    });

    // Step 3: Build human-readable summary text for notes
    const noteText = [
      `📞 CALL SUMMARY (${durationLabel})`,
      `Sentiment: ${aiSummary.overall_sentiment} · Quality: ${aiSummary.call_quality}`,
      ``,
      `📝 Summary`,
      aiSummary.summary,
      ``,
      aiSummary.key_pain_points?.length
        ? `🎯 Key Pain Points\n${aiSummary.key_pain_points.map(p => `• ${p}`).join("\n")}`
        : null,
      aiSummary.buying_signals?.length
        ? `✅ Buying Signals\n${aiSummary.buying_signals.map(s => `• ${s}`).join("\n")}`
        : null,
      aiSummary.objections_raised?.length
        ? `⚠️ Objections\n${aiSummary.objections_raised.map(o => `• ${o}`).join("\n")}`
        : null,
      aiSummary.action_items?.length
        ? `🔧 Action Items\n${aiSummary.action_items.map(a => `• [${a.priority?.toUpperCase()}] ${a.task} (${a.owner})`).join("\n")}`
        : null,
      ``,
      `➡️ Next Step: ${aiSummary.recommended_next_step}`,
      `⏱ Follow-up: ${aiSummary.follow_up_timing}`,
      transcript ? `\n📄 Transcript\n${transcript.slice(0, 1000)}${transcript.length > 1000 ? "…" : ""}` : null,
    ].filter(Boolean).join("\n");

    const metadataJson = JSON.stringify({
      source: "processCallRecording",
      recording_sid: recordingSid,
      call_sid: callSid,
      duration_secs: durationSecs,
      has_transcript: !!transcript,
      recording_url_present: !!recordingMp3Url,
      ai_summary: aiSummary,
    });

    // Step 4: Save to CommunicationEvent (shows in Activity Timeline)
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: leadId,
      channel: "internal",
      direction: "inbound",
      event_type: "status_update",
      provider: "twilio",
      status: "processed",
      subject: `📞 Call Recording — AI Summary (${durationLabel}) · ${aiSummary.overall_sentiment}`,
      message_body: noteText,
      metadata_json: metadataJson,
    });

    // Step 5: Save as Events note (shows in Notes section)
    await base44.asServiceRole.entities.Events.create({
      lead_id: leadId,
      event_type: "note",
      data: {
        text: noteText,
        subject: `Call Recording AI Summary — ${new Date().toLocaleDateString()}`,
        source: "call_recording_ai",
        recording_sid: recordingSid,
        call_sid: callSid,
        duration_secs: durationSecs,
        ai_summary: aiSummary,
      },
    });

    // Step 6: Update lead last_contacted_at + sentiment
    const leadUpdate = {
      last_contacted_at: new Date().toISOString(),
    };
    if (aiSummary.overall_sentiment && ["Positive", "Neutral", "Negative"].includes(aiSummary.overall_sentiment)) {
      leadUpdate.reply_sentiment = aiSummary.overall_sentiment;
      leadUpdate.reply_sentiment_reason = `From call recording: ${aiSummary.summary?.slice(0, 200)}`;
      leadUpdate.reply_sentiment_analyzed_at = new Date().toISOString();
    }
    if (aiSummary.recommended_next_status && ["Contacted", "Replied", "Qualified", "Booking Prompt Sent", "Booked"].includes(aiSummary.recommended_next_status)) {
      leadUpdate.status = aiSummary.recommended_next_status;
    }
    await base44.asServiceRole.entities.Leads.update(leadId, leadUpdate);

    console.log(`[processCallRecording] processCallRecording: Successfully processed for lead ${leadId}, sentiment=${aiSummary.overall_sentiment}`);

    return secureJson({
      success: true,
      lead_id: leadId,
      recording_sid: recordingSid,
      duration_secs: durationSecs,
      sentiment: aiSummary.overall_sentiment,
      call_quality: aiSummary.call_quality,
      summary: aiSummary.summary,
      action_items_count: aiSummary.action_items?.length || 0,
      has_transcript: !!transcript,
    });

  } catch (error) {
    console.error("[processCallRecording] processCallRecording error:", error);
    return secureJson({ error: error.message || "Failed to process call recording" }, { status: 500 });
  }
});
