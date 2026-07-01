export async function invokeCompliantSms(base44, payload) {
  const invoker = base44.asServiceRole?.functions || base44.functions;
  if (!invoker?.invoke) {
    throw new Error("Base44 function invoker unavailable for sendCompliantSms");
  }
  const result = await invoker.invoke("sendCompliantSms", payload);
  const data = result?.data || result || {};
  if (data?.error || data?.blocked) {
    const reason = data?.reason || data?.error || "SMS blocked";
    throw new Error(reason);
  }
  return data;
}

export function buildSmsPayload({ to, body, lead, lead_id, context_id, reason, sms_consent, allow_quiet_hours = false }) {
  return {
    to,
    body,
    lead_id: lead_id || lead?.id || undefined,
    context_id: context_id || lead?.id || undefined,
    reason,
    sms_consent: sms_consent === true || lead?.sms_consent === true || lead?.sms_opt_in === true || lead?.consent_sms === true || lead?.phone_sms_consent === true,
    allow_quiet_hours,
  };
}
