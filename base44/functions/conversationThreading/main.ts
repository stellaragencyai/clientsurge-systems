import { secureJson } from "../_shared/response.ts";
/**
 * Conversation Threading & Auto-Context
 * Stitches SMS + email + call logs into one thread
 * Provides full context for next touchpoint
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id } = await req.json();

    if (!lead_id) {
      return secureJson({ error: "lead_id required" }, { status: 400 });
    }

    console.log(`[Threading] Building conversation thread for ${lead_id}`);

    // 1. Get all communication events
    const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
      { lead_id },
      "created_date",
      100
    );

    if (!events || events.length === 0) {
      return secureJson({
        success: true,
        lead_id,
        thread: [],
        context_summary: "No prior communication",
      });
    }

    // 2. Build chronological thread
    const thread = events.map((event, idx) => ({
      sequence: idx + 1,
      timestamp: event.created_date,
      channel: event.channel,
      direction: event.direction,
      type: event.event_type,
      status: event.status,
      summary:
        event.direction === "outbound"
          ? `[${event.channel.toUpperCase()}] Sent: ${event.subject || event.message_body?.substring(0, 50)}`
          : `[${event.channel.toUpperCase()}] Received: ${event.message_body?.substring(0, 50)}`,
    }));

    // 3. Extract key context points
    const lastOutbound = events
      .filter((e) => e.direction === "outbound")
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

    const lastInbound = events
      .filter((e) => e.direction === "inbound")
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

    const openedEmails = events.filter((e) => e.status === "opened").length;
    const clickedLinks = events.filter((e) => e.status === "clicked").length;

    // 4. Build AI-friendly context summary
    const contextSummary = `
Last sent (${lastOutbound?.channel}): ${new Date(lastOutbound?.created_date).toLocaleDateString()}
Last reply (${lastInbound?.channel}): ${new Date(lastInbound?.created_date).toLocaleDateString()}
Total emails: ${events.filter((e) => e.channel === "email").length}
Total SMS: ${events.filter((e) => e.channel === "sms").length}
Engagement: ${openedEmails} opens, ${clickedLinks} clicks
Preferred channel: ${events.filter((e) => e.direction === "inbound").length > 0 ? lastInbound?.channel : "unknown"}
`;

    console.log(`[Threading] Built thread with ${thread.length} events`);

    return secureJson({
      success: true,
      lead_id,
      thread_length: thread.length,
      thread,
      context_summary: contextSummary.trim(),
      last_outbound_channel: lastOutbound?.channel,
      last_inbound_channel: lastInbound?.channel,
      preferred_channel:
        events.filter((e) => e.direction === "inbound" && e.channel === "sms")
          .length >
        events.filter((e) => e.direction === "inbound" && e.channel === "email")
          .length
          ? "sms"
          : "email",
    });
  } catch (error) {
    console.error("[Threading] Error:", error.message);
    return secureJson(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});