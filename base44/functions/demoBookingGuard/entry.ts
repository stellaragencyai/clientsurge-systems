import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const MAX_PER_DAY = 8;

async function validateBookingDate(base44, date) {
  const existing = await base44.asServiceRole.entities.DemoRequest.filter({
    scheduled_date: date,
    status: { $in: ['requested', 'scheduled', 'confirmed'] },
  });
  const booked = (existing || []).length;
  const available = Math.max(0, MAX_PER_DAY - booked);
  return { date, booked, available, is_available: available > 0 };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { date } = await req.json();

    if (!date) {
      return Response.json({ error: "date required (YYYY-MM-DD)" }, { status: 400 });
    }

    const result = await validateBookingDate(base44, date);
    return Response.json({ success: true, ...result });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});