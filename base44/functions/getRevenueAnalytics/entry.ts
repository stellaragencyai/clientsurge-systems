/**
 * Get Revenue Analytics
 * Returns source-by-source ROI breakdown
 * Used by dashboard for visualization
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { project_id, period = "this_month" } = await req.json();

    console.log(`[Analytics] Calculating revenue for period: ${period}`);

    // 1. Get date range
    const now = new Date();
    let startDate = new Date();

    if (period === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "this_week") {
      startDate.setDate(now.getDate() - now.getDay());
    } else if (period === "this_month") {
      startDate.setDate(1);
    } else if (period === "all_time") {
      startDate = new Date("2020-01-01");
    }

    // 2. Get all revenue records for period
    const revenues = await base44.asServiceRole.entities.LeadRevenue.filter(
      {},
      "-revenue_date",
      1000
    );

    const relevantRevenues = (revenues || []).filter((r) => {
      const recordDate = new Date(r.revenue_date);
      return recordDate >= startDate;
    });

    // 3. Get all leads
    const leads = await base44.asServiceRole.entities.Leads.filter(
      {},
      "-created_date",
      1000
    );

    // 4. Aggregate by source
    const sourceStats = {};
    const sources = ["phone", "form", "referral", "ad", "sms", "email", "social"];

    for (const source of sources) {
      const leadsFromSource = (leads || []).filter(
        (l) => l.source === source
      );
      const revenueFromSource = relevantRevenues.filter(
        (r) => r.source === source
      );

      const totalLeads = leadsFromSource.length;
      const bookedLeads = revenueFromSource.length;
      const totalRevenue = revenueFromSource.reduce(
        (sum, r) => sum + (r.revenue_amount || 0),
        0
      );
      const bookingRate =
        totalLeads > 0 ? ((bookedLeads / totalLeads) * 100).toFixed(1) : 0;
      const avgLTV =
        bookedLeads > 0 ? (totalRevenue / bookedLeads).toFixed(2) : 0;
      const costPerLead =
        totalLeads > 0 && totalRevenue > 0
          ? (totalRevenue / totalLeads).toFixed(2)
          : 0;

      sourceStats[source] = {
        total_leads: totalLeads,
        booked_leads: bookedLeads,
        booking_rate: parseFloat(bookingRate),
        total_revenue: totalRevenue,
        average_ltv: parseFloat(avgLTV),
        cost_per_lead: parseFloat(costPerLead),
        roi_multiplier: parseFloat(costPerLead) > 0 ? (parseFloat(costPerLead) / 1).toFixed(1) : 0,
      };
    }

    // 5. Calculate totals
    const totalLeads = Object.values(sourceStats).reduce(
      (sum, s) => sum + s.total_leads,
      0
    );
    const totalBooked = Object.values(sourceStats).reduce(
      (sum, s) => sum + s.booked_leads,
      0
    );
    const totalRevenue = Object.values(sourceStats).reduce(
      (sum, s) => sum + s.total_revenue,
      0
    );
    const overallBookingRate =
      totalLeads > 0 ? ((totalBooked / totalLeads) * 100).toFixed(1) : 0;

    console.log(
      `[Analytics] Period: ${period}, Total Revenue: $${totalRevenue}`
    );

    return Response.json({
      success: true,
      period,
      start_date: startDate.toISOString(),
      end_date: now.toISOString(),
      by_source: sourceStats,
      summary: {
        total_leads: totalLeads,
        total_booked: totalBooked,
        overall_booking_rate: parseFloat(overallBookingRate),
        total_revenue: totalRevenue,
        average_lead_value: totalBooked > 0 ? (totalRevenue / totalBooked).toFixed(2) : 0,
      },
    });
  } catch (error) {
    console.error("[Analytics] Error:", error.message);
    return Response.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});