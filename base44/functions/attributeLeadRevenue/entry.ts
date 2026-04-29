/**
 * Attribute Lead Revenue
 * Called when lead books/pays
 * Tracks revenue per source & calculates LTV
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, booking_id, revenue_amount, service_type } =
      await req.json();

    if (!lead_id || !booking_id || !revenue_amount) {
      return Response.json(
        { error: "lead_id, booking_id, revenue_amount required" },
        { status: 400 }
      );
    }

    console.log(
      `[Attribution] Recording ${revenue_amount} revenue for lead ${lead_id}`
    );

    // 1. Get lead
    const lead = await base44.asServiceRole.entities.Leads.get(lead_id);
    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    // 2. Get all previous revenue records for this lead
    const previousRevenue =
      await base44.asServiceRole.entities.LeadRevenue.filter(
        { lead_id },
        "-revenue_date"
      );

    // 3. Calculate lifetime value
    const previousLTV = previousRevenue
      ? previousRevenue.reduce((sum, r) => sum + (r.revenue_amount || 0), 0)
      : 0;
    const totalLTV = previousLTV + revenue_amount;
    const totalBookings = (previousRevenue?.length || 0) + 1;
    const isRepeat = previousRevenue && previousRevenue.length > 0;

    // 4. Create revenue record
    const revenueRecord =
      await base44.asServiceRole.entities.LeadRevenue.create({
        lead_id,
        source: lead.source,
        booking_id,
        revenue_amount,
        service_type: service_type || "standard",
        repeat_customer: isRepeat,
        booking_date: new Date().toISOString(),
        revenue_date: new Date().toISOString(),
        lifetime_value: totalLTV,
        total_bookings: totalBookings,
      });

    console.log(
      `[Attribution] Revenue record created. LTV: ${totalLTV}, Total bookings: ${totalBookings}`
    );

    // 5. Update lead with LTV info (optional, for quick access)
    // Note: Not all fields may be writable, so we skip this
    // await base44.asServiceRole.entities.Leads.update(lead_id, {
    //   lifetime_value: totalLTV,
    //   total_bookings: totalBookings,
    // });

    return Response.json({
      success: true,
      lead_id,
      revenue_recorded: revenue_amount,
      lifetime_value: totalLTV,
      total_bookings: totalBookings,
      is_repeat: isRepeat,
    });
  } catch (error) {
    console.error("[Attribution] Error:", error.message);
    return Response.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});