/**
 * demoBookingGuard.ts — #100
 * Rejects weekend bookings (Sat/Sun) and AdminSettings.blocked_dates.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

export async function validateBookingDate(
  base44: any,
  date_str: string     // YYYY-MM-DD
): Promise<{ valid: boolean; reason?: string }> {
  const d = new Date(date_str + "T12:00:00");
  const dow = d.getUTCDay(); // 0=Sun 6=Sat
  if (dow === 0 || dow === 6) {
    return { valid: false, reason: "Weekend bookings are not available. Please pick a weekday." };
  }

  // Check AdminSettings blocked_dates
  const settings = await base44.asServiceRole.entities.AdminSettings?.list?.().catch(() => []);
  const blocked: string[] = settings?.[0]?.blocked_dates || [];
  if (blocked.includes(date_str)) {
    return { valid: false, reason: `${date_str} is blocked — please choose another date.` };
  }

  return { valid: true };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { date } = await req.json();
    if (!date) return Response.json({ error: "date required (YYYY-MM-DD)" }, { status: 400 });
    const result = await validateBookingDate(base44, date);
    return Response.json({ success: true, ...result });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
