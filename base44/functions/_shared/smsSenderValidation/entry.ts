import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";
import {
  normalizePhoneE164,
  resolveTwilioSender,
  classifyInboundNumber,
} from "../twilioSenderConfig/entry.ts";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const purpose = payload?.purpose || "customer_service";
    const sender = await resolveTwilioSender(base44, {
      purpose,
      conversationFromNumber: payload?.conversationFromNumber,
      clientAssignedNumber: payload?.clientAssignedNumber,
    });
    const recipient = normalizePhoneE164(payload?.phone);

    if (!recipient) {
      return Response.json({ error: "Invalid recipient phone" }, { status: 400 });
    }

    return Response.json({
      sender_from: sender,
      sender_role: classifyInboundNumber(sender),
      sender_purpose: purpose,
      recipient_to: recipient,
      status_callback_url: Deno.env.get("TWILIO_SMS_STATUS_CALLBACK_URL") ? "configured" : "missing",
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
});
