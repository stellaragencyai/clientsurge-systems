import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { secureJson } from "../_shared/response.ts";
import { classifyLeadIntent as classifyLeadIntentShared } from "../_shared/leadIntentClassifier.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const {
      lead_id,
      lead,
      message_text,
      messageText,
      message_body,
      inbound_message,
    } = payload;

    const messageTextValue =
      message_text || messageText || message_body || inbound_message;

    if (!messageTextValue) {
      return secureJson(
        { error: "message_text or message_body required" },
        { status: 400 },
      );
    }

    let leadRecord = lead || null;

    if (!leadRecord && lead_id) {
      const leads = await base44.asServiceRole.entities.Leads.filter(
        { id: lead_id },
        "-created_date",
        1,
      );
      leadRecord = leads?.[0] || null;
    }

    const result = await classifyLeadIntentShared({
      base44,
      messageText: messageTextValue,
      lead: leadRecord,
    });

    if (lead_id && leadRecord) {
      await base44.asServiceRole.entities.Leads.update(lead_id, {
        ai_intent: result.canonical_intent,
        ai_last_classification: String(messageTextValue).slice(0, 200),
      }).catch(() => {});
    }

    return secureJson({
      success: true,
      lead_id: lead_id || leadRecord?.id || null,
      ...result,
    });
  } catch (error) {
    return secureJson(
      { error: error.message, success: false },
      { status: 500 },
    );
  }
});
