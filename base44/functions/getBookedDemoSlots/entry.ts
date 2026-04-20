import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { date } = await req.json();

    if (!date) {
      return Response.json({ error: 'Date required' }, { status: 400 });
    }

    // Fetch all DemoRequests for the given date
    const bookings = await base44.asServiceRole.entities.DemoRequest.filter({
      scheduled_date: date,
      status: { $in: ['requested', 'scheduled'] },
    });

    const bookedTimes = bookings.map(b => b.scheduled_time);

    return Response.json({ booked_times: bookedTimes });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});