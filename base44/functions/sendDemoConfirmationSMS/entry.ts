import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import {
  sendCommunicationViaOutbox,
  sendTwilioSmsProvider,
} from "../_shared/communicationOutbox.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { phone, full_name, scheduled_date, scheduled_time } = await req.json();

    if (!phone || !scheduled_date || !scheduled_time) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Format date nicely e.g. "Monday, May 5"
    let friendlyDate = scheduled_date;
    try {
      const d = new Date(`${scheduled_date}T${scheduled_time}:00`);
      friendlyDate = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    } catch (_) {}

    const firstName = (full_name || 'there').split(' ')[0];
    const message = `Hi ${firstName}! ✅ Your ClientSurge demo is confirmed for ${friendlyDate} at ${scheduled_time} (AZ time). Nolan will call you directly at this number — keep it handy! Questions before then? Just reply here. Reply STOP to opt out.`;

    const result = await sendCommunicationViaOutbox({
      base44,
      channel: "sms",
      provider: "twilio",
      recipient: phone,
      body: message,
      source: "sendDemoConfirmationSMS",
      sourceRecordId: `${phone}:${scheduled_date}:${scheduled_time}`,
      templateKey: "demo_confirmation_sms",
      messageType: "transactional",
      consentBasis: "transactional_relationship",
      metadata: { scheduled_date, scheduled_time, full_name },
      providerSend: (providerPayload) => sendTwilioSmsProvider({
        ...providerPayload,
        env: (name) => Deno.env.get(name),
        fetchImpl: fetch,
      }),
    });

    if (!result.success && !result.suppressed) {
      throw new Error(result.error || result.reason || 'Failed to send SMS');
    }

    return Response.json({
      success: result.success,
      suppressed: result.suppressed || false,
      reason: result.reason,
      message_sid: result.provider_message_id,
      outbox_id: result.outbox?.id,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
