/**
 * autoCloseStaleLeads — #120
 * Find and close all SpaLead records with no contact in past 30 days.
 * Set status = "Closed - Stale" and log the action.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const since30Days = new Date(Date.now() - 30 * 86400000).toISOString();

    // Find leads with last_contacted before 30 days ago
    const allLeads = await base44.asServiceRole.entities.SpaLead.list().catch(() => []);
    const staleLeads = (allLeads || []).filter((l: any) => {
      if (!l.last_contacted) return true; // never contacted = stale
      return new Date(l.last_contacted).getTime() < new Date(since30Days).getTime();
    });

    let closed = 0;
    for (const lead of staleLeads) {
      try {
        await base44.asServiceRole.entities.SpaLead.update(lead.id, {
          status: "Closed - Stale",
          closed_at: new Date().toISOString(),
          closed_reason: "No contact in 30 days",
        });
        closed++;
      } catch (e) {
        console.warn(`Failed to close lead ${lead.id}:`, e);
      }
    }

    // Log summary
    await base44.asServiceRole.entities.AgentLog.create({
      agent_name: "autoCloseStaleLeads", log_type: "info",
      summary: `Closed ${closed} stale leads (no contact in 30 days)`,
      details: JSON.stringify({ total_stale: staleLeads.length, actually_closed: closed, threshold_date: since30Days }),
      service: "lead_hygiene", requires_nolan: false, resolved: true,
    }).catch(() => {});

    // Telegram report
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (botToken && closed > 0) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: "-1003533494424",
          text: `@trinity

📋 <b>Stale Leads Closed</b>
Autoclosed: ${closed} leads
No contact: 30+ days
Threshold: ${new Date(since30Days).toLocaleDateString()}`,
          parse_mode: "HTML" }),
      }).catch(() => {});
    }

    return Response.json({ success: true, closed, total_stale: staleLeads.length });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
