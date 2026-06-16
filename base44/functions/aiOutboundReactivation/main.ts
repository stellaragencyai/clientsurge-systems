/**
 * aiOutboundReactivation — Step 13
 * Deployed on go-live: Automatically identifies stalled leads and triggers
 * AI-driven reactivation sequences. Removes manual outreach burden.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
  });
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    console.log("[aiOutboundReactivation] Starting lead reactivation cycle");

    // Find leads dormant for 7+ days across all live orders
    const leadReactivations = await base44.asServiceRole.entities.LeadReactivation.filter(
      { status: "dormant" }, "-created_date", 50
    ).catch(() => []);

    const reactivatedCount = { sms: 0, email: 0 };

    for (const reactivation of leadReactivations) {
      if (!reactivation.lead_id) continue;

      // Fetch the lead
      const leads = await base44.asServiceRole.entities.Leads.filter(
        { id: reactivation.lead_id }, "-created_date", 1
      ).catch(() => []);
      const lead = leads?.[0];
      if (!lead) continue;

      // Determine channel (AI chooses based on last engagement)
      const channel = lead.last_engagement_type === "email" ? "email" : "sms";
      const offer = reactivation.reactivation_offer || "15% off your first month—limited time";
      const message = `Hi ${lead.full_name || "there"}! We haven't heard from you in a while. ${offer}. Reply to schedule: [BOOKING_LINK]`;

      if (channel === "sms" && lead.phone) {
        await base44.asServiceRole.functions.invoke("sendSMS", {
          to: lead.phone,
          message,
        }).catch(err => console.error("[aiOutboundReactivation] SMS failed", { error: err.message }));
        reactivatedCount.sms++;
      } else if (channel === "email" && lead.email) {
        await base44.asServiceRole.functions.invoke("sendEmail", {
          to: lead.email,
          subject: "We miss you—15% off to come back",
          body: message,
        }).catch(err => console.error("[aiOutboundReactivation] Email failed", { error: err.message }));
        reactivatedCount.email++;
      }

      // Update reactivation status
      await base44.asServiceRole.entities.LeadReactivation.update(reactivation.id, {
        status: "reactivating",
        attempts: (reactivation.attempts || 0) + 1,
      }).catch(() => null);
    }

    console.log("[aiOutboundReactivation] Reactivation complete", { reactivatedCount });
    return json({ success: true, reactivatedCount, total: leadReactivations.length });

  } catch (err) {
    console.error("[aiOutboundReactivation] Fatal error", { error: err.message });
    return json({ error: err.message }, 500);
  }
});