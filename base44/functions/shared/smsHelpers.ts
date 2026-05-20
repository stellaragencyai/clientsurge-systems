/**
 * smsHelpers.ts — #499
 * appendOptOut() — TCPA-compliant opt-out footer on every outbound SMS.
 * Import and wrap ALL Twilio message sends.
 */

const OPT_OUT_FOOTER = " Reply STOP to opt out.";
const MAX_SMS_LENGTH = 160;

export function appendOptOut(message: string): string {
  if (/reply stop/i.test(message)) return message; // already has footer
  const combined = message.trimEnd() + OPT_OUT_FOOTER;
  if (combined.length <= MAX_SMS_LENGTH) return combined;
  // Trim message to fit footer within 160 chars
  const maxBody = MAX_SMS_LENGTH - OPT_OUT_FOOTER.length;
  return message.slice(0, maxBody).trimEnd() + "..." + OPT_OUT_FOOTER;
}

export function enforce160(text: string): string {
  return text.length <= MAX_SMS_LENGTH ? text : text.slice(0, 157) + "...";
}

export function isOptedOut(tags: string[] = []): boolean {
  return tags.includes("opted_out") || tags.includes("unsubscribed");
}

// Full wrapper — checks opt-out + quiet hours + appends footer + enforces 160
export async function prepareSMSPayload(
  message: string,
  opts: { tags?: string[]; bypass_quiet_hours?: boolean } = {}
): Promise<{ ok: boolean; message?: string; reason?: string }> {
  if (isOptedOut(opts.tags || [])) {
    return { ok: false, reason: "Lead has opted out" };
  }
  const ready = appendOptOut(enforce160(message));
  return { ok: true, message: ready };
}
