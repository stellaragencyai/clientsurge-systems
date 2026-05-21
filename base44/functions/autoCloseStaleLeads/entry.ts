/**
 * autoCloseStaleLeads — #120
 * Find all SpaLead records with no contact in past 30 days.
 * Set status = "Closed - Stale" and log the action.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

    // Find leads with no last_contacted or last_contacted > 30 days ago
    const leads = await base44.asServiceRole.entities.SpaLead.list().catch(() => []);
    
    const staleLeads = (leads || []).filter((l: any) => {
      if (!l.last_contacted) {
        // Never contacted — check creation date
        const created = new Date(l.created_date).getTime();
        return (Date.now() - created) > (30 * 86400000);
      }
      return l.last_contacted < thirtyDaysAgo;
    });

    // Close stale leads
    let closed = 0;
    for (const lead of staleLeads) {
      try {
        await base44.asServiceRole.entities.SpaLead.update(lead.id, {
          status: "Closed - Stale",
          closed_at: new Date().toISOString(),
          closed_reason: "No contact in 30+ days",
        });
        closed++;
      } catch (e) {
        console.error(`[autoCloseStaleLeads] Failed to close lead ${lead.id}:`, e);
      }
    }

    // Log action
    await base44.asServiceRole.entities.AgentLog.create({
      agent_name: "autoCloseStaleLeads", log_type: "info",
      summary: `Closed ${closed} stale leads (no contact 30+ days)`,
      details: JSON.stringify({ closed_count: closed, threshold_date: thirtyDaysAgo }),
      service: "lead_management",
      requires_nolan: false, resolved: true,
    }).catch(() => {});

    // Telegram alert
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (botToken && closed > 0) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: "-1003533494424",
          text: `@trinity\n\n✅ <b>Stale Leads Closed</b>\nClosed: ${closed} leads\nNo contact 30+ days\nStatus: Closed - Stale`,
          parse_mode: "HTML" }),
      }).catch(() => {});
    }

    return Response.json({ success: true, closed, stale_count: staleLeads.length });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
