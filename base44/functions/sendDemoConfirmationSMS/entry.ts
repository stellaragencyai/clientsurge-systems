import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { invokeCompliantSms } from '../_shared/compliantSmsInvoker.ts';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { phone, full_name, scheduled_date, scheduled_time, lead_id, sms_consent } = await req.json();

    if (!phone || !scheduled_date || !scheduled_time) {
      return json({ error: 'Missing required fields' }, 400);
    }

    let friendlyDate = scheduled_date;
    try {
      const d = new Date(`${scheduled_date}T${scheduled_time}:00`);
      friendlyDate = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    } catch (_) {}

    const firstName = (full_name || 'there').split(' ')[0];
    const message = `Hi ${firstName}! Your ClientSurge Free Automation Audit is confirmed for ${friendlyDate} at ${scheduled_time} (AZ time). Nolan will call you directly at this number. Questions before then? Just reply here.`;

    const result = await invokeCompliantSms(base44, {
      to: phone,
      body: message,
      lead_id,
      context_id: lead_id,
      sms_consent: sms_consent === true,
      reason: 'demo_confirmation',
      allow_quiet_hours: true,
    });

    return json({ success: true, message_sid: result.sid || null });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
});
