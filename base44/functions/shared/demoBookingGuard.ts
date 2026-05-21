export type BookingDateValidation = { valid: true } | { valid: false; reason: string };

export function validateWeekdayBookingDate(dateStr: string): BookingDateValidation {
  const date = new Date(`${dateStr}T12:00:00Z`);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || Number.isNaN(date.getTime())) {
    return { valid: false, reason: "Invalid booking date. Please choose a valid weekday." };
  }

  const day = date.getUTCDay();
  if (day === 0 || day === 6) {
    return { valid: false, reason: "Weekend bookings are not available. Please pick a weekday." };
  }

  return { valid: true };
}

export async function validateBookingDate(base44: any, dateStr: string): Promise<BookingDateValidation> {
  const weekday = validateWeekdayBookingDate(dateStr);
  if (!weekday.valid) return weekday;

  const settings = await base44.asServiceRole.entities.AdminSettings?.list?.().catch(() => []);
  const blockedDates: string[] = settings?.[0]?.blocked_dates || [];

  if (blockedDates.includes(dateStr)) {
    return { valid: false, reason: `${dateStr} is blocked. Please choose another date.` };
  }

  return { valid: true };
}

export async function assertBookingDateAvailable(base44: any, dateStr: string) {
  const result = await validateBookingDate(base44, dateStr);

  if (!result.valid) {
    throw Object.assign(new Error(result.reason), { status: 400 });
  }

  return true;
}
