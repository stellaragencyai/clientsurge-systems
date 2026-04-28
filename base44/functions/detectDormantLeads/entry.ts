/**
 * Detect Dormant Leads
 * Scheduled daily - finds leads inactive 30+ days
 * Creates LeadReactivation records for processing
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { project_id, dormant_days = 30 } = await req.json();

    console.log(
      `[DormantDetect] Scanning for leads inactive ${dormant_days}+ days`
    );

    // 1. Get all leads
    const allLeads = await base44.asServiceRole.entities.Leads.filter(
      { status: { $nin: ["Closed", "Booked"] } },
      "-last_contacted_at",
      1000
    );

    if (!allLeads?.length) {
      return Response.json({
        success: true,
        dormant_found: 0,
      });
    }

    // 2. Identify dormant leads
    const now = Date.now();
    const dormantLeads = [];

    for (const lead of allLeads) {
      const lastContactTime = lead.last_contacted_at
        ? new Date(lead.last_contacted_at).getTime()
        : new Date(lead.created_date).getTime();

      const daysSinceContact = Math.floor(
        (now - lastContactTime) / (1000 * 60 * 60 * 24)
      );

      // Mark as dormant if inactive 30+ days and not already reactivating
      if (daysSinceContact >= dormant_days) {
        dormantLeads.push({
          lead_id: lead.id,
          last_contact_date: lead.last_contacted_at || lead.created_date,
          days_dormant: daysSinceContact,
          lead_name: lead.full_name,
          business: lead.business_name,
        });
      }
    }

    if (dormantLeads.length === 0) {
      console.log(`[DormantDetect] No dormant leads found`);
      return Response.json({
        success: true,
        dormant_found: 0,
      });
    }

    // 3. Create reactivation records (avoid duplicates)
    let created = 0;
    for (const dormant of dormantLeads) {
      try {
        // Check if already in reactivation
        const existing = await base44.asServiceRole.entities.LeadReactivation.filter(
          {
            lead_id: dormant.lead_id,
            status: { $ne: "unrecoverable" },
          },
          "-created_at",
          1
        );

        if (existing?.length > 0) {
          // Already being reactivated, skip
          continue;
        }

        // Create new reactivation record
        await base44.asServiceRole.entities.LeadReactivation.create({
          lead_id: dormant.lead_id,
          last_contact_date: dormant.last_contact_date,
          days_dormant: dormant.days_dormant,
          status: "dormant",
          reactivation_stage: "identified",
          trigger_reason: "no_response",
          created_at: new Date().toISOString(),
        });

        created++;
      } catch (err) {
        console.warn(
          `[DormantDetect] Failed to create reactivation for ${dormant.lead_id}:`,
          err.message
        );
      }
    }

    console.log(
      `[DormantDetect] Found ${dormantLeads.length} dormant leads, created ${created} reactivation records`
    );

    return Response.json({
      success: true,
      dormant_found: dormantLeads.length,
      reactivation_records_created: created,
    });
  } catch (error) {
    console.error("[DormantDetect] Error:", error.message);
    return Response.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});