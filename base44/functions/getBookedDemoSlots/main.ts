import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { cachedJson, secureJson } from "../_shared/response.ts";

// #116: filter by scheduled_date to avoid fetching all records
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { date } = await req.json();

    if (!date) {
      return secureJson({ error: 'Date required' }, { status: 400 });
    }

    // #116: explicit date filter — don't load all DemoRequests
    const bookings = await base44.asServiceRole.entities.DemoRequest.filter({
      scheduled_date: date,
      status: { $in: ['requested', 'scheduled', 'confirmed'] },
    }, '-created_date', 50); // limit 50 max per day

    const bookedTimes = (bookings || []).map(b => b.scheduled_time).filter(Boolean);

    return cachedJson({ booked_times: bookedTimes, date, count: bookedTimes.length }, 60);
  } catch (error) {
    return secureJson(
      { error: error instanceof Error ? error.message : "Failed to load booked demo slots" },
      { status: 500 }
    );
  }
});
