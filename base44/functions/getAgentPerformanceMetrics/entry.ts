/**
 * getAgentPerformanceMetrics
 * Returns per-agent conversion stats, lead volume, booking rates,
 * and a 30-day trend array for the AI Sales Command Center.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const AGENTS = [
  { key: 'sales_rep_med_spa',      name: 'Sarah',  industry: 'Med Spa' },
  { key: 'sales_rep_dental',       name: 'Marcus', industry: 'Dental' },
  { key: 'sales_rep_chiropractic', name: 'Jordan', industry: 'Chiropractic' },
  { key: 'sales_rep_hvac',         name: 'Tyler',  industry: 'HVAC' },
  { key: 'sales_rep_roofing',      name: 'Derek',  industry: 'Roofing' },
  { key: 'sales_rep_contractors',  name: 'Alex',   industry: 'Contractors' },
];

function dayKey(isoDate) {
  return isoDate ? isoDate.slice(0, 10) : null;
}

function last30Days() {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all leads and communication events in parallel
    const [allLeads, allEvents] = await Promise.all([
      base44.asServiceRole.entities.Leads.list('-created_date', 2000),
      base44.asServiceRole.entities.CommunicationEvent.list('-created_date', 5000),
    ]);

    const days = last30Days();
    const thirtyDaysAgo = days[0];

    // Per-agent metrics
    const agentMetrics = AGENTS.map(agent => {
      const leads = allLeads.filter(l => l.assigned_agent_name === agent.key);
      const recentLeads = leads.filter(l => dayKey(l.created_date) >= thirtyDaysAgo);

      const total = leads.length;
      const contacted = leads.filter(l => ['Contacted','Replied','Qualified','Booking Prompt Sent','Booked','Closed'].includes(l.status)).length;
      const replied = leads.filter(l => ['Replied','Qualified','Booking Prompt Sent','Booked','Closed'].includes(l.status)).length;
      const booked = leads.filter(l => ['Booked','Closed'].includes(l.status)).length;
      const closed = leads.filter(l => l.status === 'Closed').length;

      // Conversion rates
      const contactRate = total > 0 ? Math.round((contacted / total) * 100) : 0;
      const replyRate = contacted > 0 ? Math.round((replied / contacted) * 100) : 0;
      const bookingRate = replied > 0 ? Math.round((booked / replied) * 100) : 0;
      const closeRate = booked > 0 ? Math.round((closed / booked) * 100) : 0;

      // Voice calls
      const voiceCalls = leads.filter(l => l.voice_call_attempted).length;
      const voiceAnswered = leads.filter(l => l.voice_call_outcome === 'answered').length;

      // 30-day daily lead trend
      const trend = days.map(day => {
        const count = recentLeads.filter(l => dayKey(l.created_date) === day).length;
        const bookedCount = recentLeads.filter(l => dayKey(l.booked_at) === day).length;
        return { date: day, leads: count, booked: bookedCount };
      });

      // SMS/email events for this agent's leads
      const leadIds = new Set(leads.map(l => l.id));
      const agentEvents = allEvents.filter(e => leadIds.has(e.lead_id));
      const smsSent = agentEvents.filter(e => e.channel === 'sms' && e.status !== 'failed').length;
      const emailSent = agentEvents.filter(e => e.channel === 'email' && e.status !== 'failed').length;
      const failed = agentEvents.filter(e => e.status === 'failed').length;

      // Avg response time (minutes) — estimate from first outreach CommunicationEvent
      let avgResponseMin = null;
      const sampleLeads = recentLeads.slice(0, 50);
      const responseTimes = [];
      for (const lead of sampleLeads) {
        if (!lead.created_date || !lead.last_contacted_at) continue;
        const diff = (new Date(lead.last_contacted_at) - new Date(lead.created_date)) / 60000;
        if (diff > 0 && diff < 1440) responseTimes.push(diff);
      }
      if (responseTimes.length > 0) {
        avgResponseMin = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
      }

      return {
        agent_key: agent.key,
        name: agent.name,
        industry: agent.industry,
        total_leads: total,
        recent_leads: recentLeads.length,
        contacted,
        replied,
        booked,
        closed,
        contact_rate: contactRate,
        reply_rate: replyRate,
        booking_rate: bookingRate,
        close_rate: closeRate,
        voice_calls: voiceCalls,
        voice_answered: voiceAnswered,
        sms_sent: smsSent,
        email_sent: emailSent,
        failed_events: failed,
        avg_response_minutes: avgResponseMin,
        trend,
      };
    });

    // System-wide 30-day funnel trend (all agents combined)
    const systemTrend = days.map(day => {
      const dayLeads = allLeads.filter(l => dayKey(l.created_date) === day);
      return {
        date: day,
        leads: dayLeads.length,
        booked: allLeads.filter(l => dayKey(l.booked_at) === day).length,
        replied: dayLeads.filter(l => ['Replied','Qualified','Booking Prompt Sent','Booked','Closed'].includes(l.status)).length,
      };
    });

    // Totals
    const totalLeads = allLeads.length;
    const totalBooked = allLeads.filter(l => ['Booked','Closed'].includes(l.status)).length;
    const totalReplied = allLeads.filter(l => ['Replied','Qualified','Booking Prompt Sent','Booked','Closed'].includes(l.status)).length;
    const overallBookingRate = totalReplied > 0 ? Math.round((totalBooked / totalReplied) * 100) : 0;

    return Response.json({
      success: true,
      generated_at: new Date().toISOString(),
      agents: agentMetrics,
      system: {
        total_leads: totalLeads,
        total_booked: totalBooked,
        total_replied: totalReplied,
        overall_booking_rate: overallBookingRate,
        trend: systemTrend,
      },
    });

  } catch (error) {
    console.error('[getAgentPerformanceMetrics] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});