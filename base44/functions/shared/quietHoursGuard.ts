/**
 * quietHoursGuard.ts — #492
 * All outbound SMS must respect 8am–9pm recipient local time.
 * Import and call before every Twilio send.
 */

// Arizona is UTC-7 (no DST)
const ARIZONA_OFFSET = -7;

export function isWithinQuietHours(recipientTimezoneOffset = ARIZONA_OFFSET): boolean {
  const now = new Date();
  const recipientHour = (now.getUTCHours() + 24 + recipientTimezoneOffset) % 24;
  return recipientHour < 8 || recipientHour >= 21; // quiet if before 8am or at/after 9pm
}

export function canSendSMS(recipientTimezoneOffset = ARIZONA_OFFSET): { allowed: boolean; reason?: string; retry_after?: string } {
  if (isWithinQuietHours(recipientTimezoneOffset)) {
    const now = new Date();
    // Calculate next 8am in recipient timezone
    const nextAllowed = new Date(now);
    nextAllowed.setUTCHours(8 - recipientTimezoneOffset, 0, 0, 0);
    if (nextAllowed <= now) nextAllowed.setUTCDate(nextAllowed.getUTCDate() + 1);
    return {
      allowed: false,
      reason: "Outside allowed hours (8am–9pm recipient local time)",
      retry_after: nextAllowed.toISOString(),
    };
  }
  return { allowed: true };
}

// Middleware wrapper for any SMS send function
export async function withQuietHoursCheck<T>(
  sendFn: () => Promise<T>,
  options: { timezone_offset?: number; bypass_for_transactional?: boolean } = {}
): Promise<T | { skipped: true; reason: string; retry_after?: string }> {
  if (options.bypass_for_transactional) return sendFn(); // confirmations bypass quiet hours
  const check = canSendSMS(options.timezone_offset ?? ARIZONA_OFFSET);
  if (!check.allowed) {
    console.log(`[quietHours] SMS blocked: ${check.reason}. Retry after: ${check.retry_after}`);
    return { skipped: true, reason: check.reason!, retry_after: check.retry_after };
  }
  return sendFn();
}
