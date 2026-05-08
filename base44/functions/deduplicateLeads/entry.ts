/**
 * Lead Deduplication & Merge
 * Detects same person with different entries
 * Merges silently before automations run
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

// #144: normalize phone for robust dedup
function normalizePhone(p = "") { return p.replace(/\D/g, "").slice(-10); }

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id } = await req.json();

    if (!lead_id) {
      return Response.json({ error: "lead_id required" }, { status: 400 });
    }

    console.log(`[Dedupe] Checking for duplicates for ${lead_id}`);

    // 1. Get the lead
    const lead = await base44.asServiceRole.entities.Leads.get(lead_id);
    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    // 2. Get all leads
    const allLeads = await base44.asServiceRole.entities.Leads.filter(
      {},
      "-created_date",
      1000
    );

    // 3. Normalize and find matches
    const normalize = (str) =>
      str
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .trim();

    const primaryPhone = normalize(lead.phone || "");
    const primaryPhoneNorm = normalizePhone(lead.phone || ""); // #144
    const primaryEmail = normalize(lead.email || "");
    const primaryName = normalize(lead.full_name || "");

    const duplicates = allLeads.filter((other) => {
      if (other.id === lead.id) return false;

      const otherPhone = normalize(other.phone || "");
      const otherEmail = normalize(other.email || "");
      const otherName = normalize(other.full_name || "");

      // Match if phone OR email matches exactly
      const phoneMatch = primaryPhone && primaryPhone === otherPhone;
      const emailMatch = primaryEmail && primaryEmail === otherEmail;

      // Or if name + phone match (fuzzy)
      const nameAndPhoneMatch =
        primaryName &&
        primaryPhone &&
        primaryName.substring(0, 3) === otherName.substring(0, 3) &&
        otherPhone === primaryPhone;

      const phoneNormMatch = primaryPhoneNorm.length >= 10 && normalizePhone(other.phone || "") === primaryPhoneNorm; // #144
      return phoneMatch || phoneNormMatch || emailMatch || nameAndPhoneMatch;
    });

    // 4. Merge if duplicates found
    let mergeCount = 0;
    if (duplicates.length > 0) {
      for (const duplicate of duplicates) {
        // Merge events to primary
        const dupEvents = await base44.asServiceRole.entities.CommunicationEvent.filter(
          { lead_id: duplicate.id },
          "-created_date"
        );

        if (dupEvents && dupEvents.length > 0) {
          for (const event of dupEvents) {
            await base44.asServiceRole.entities.CommunicationEvent.update(
              event.id,
              { lead_id }
            );
          }
        }

        // Delete duplicate
        await base44.asServiceRole.entities.Leads.delete(duplicate.id);
        mergeCount++;
      }

      console.log(`[Dedupe] Merged ${mergeCount} duplicates into ${lead_id}`);
    }

    return Response.json({
      success: true,
      lead_id,
      duplicates_found: duplicates.length,
      duplicates_merged: mergeCount,
      merged_leads: duplicates.map((d) => d.id),
      recommendation:
        mergeCount > 0
          ? `Merged ${mergeCount} duplicate entries, all events consolidated`
          : "No duplicates found",
    });
  } catch (error) {
    console.error("[Dedupe] Error:", error.message);
    return Response.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});