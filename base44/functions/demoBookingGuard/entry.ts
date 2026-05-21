import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { validateBookingDate } from "../shared/demoBookingGuard.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { date } = await req.json();

    if (!date) {
      return Response.json({ error: "date required (YYYY-MM-DD)" }, { status: 400 });
    }

    const result = await validateBookingDate(base44, date);
    return Response.json({ success: true, ...result });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
