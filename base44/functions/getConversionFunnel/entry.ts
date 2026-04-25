import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { resolveClientPortalAccess } from "../_shared/portalOwnership.js";

const MAX_LEADS = 5000;

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      const access = await resolveClientPortalAccess({
        base44,
        userEmail: user.email,
      });
      if (access.status !== 'resolved') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Fetch all leads
    const leads = await base44.asServiceRole.entities.Leads.list('-created_date', MAX_LEADS);

    if (!leads) {
      return Response.json({ stages: [] });
    }

    // Define funnel stages with status mapping
    const stages = [
      { name: 'Leads', statuses: ['New', 'Contacted', 'Replied', 'Qualified', 'Booking Prompt Sent', 'Booked', 'Closed'], color: 'blue' },
      { name: 'Contacted', statuses: ['Contacted', 'Replied', 'Qualified', 'Booking Prompt Sent', 'Booked', 'Closed'], color: 'purple' },
      { name: 'Replied', statuses: ['Replied', 'Qualified', 'Booking Prompt Sent', 'Booked', 'Closed'], color: 'indigo' },
      { name: 'Qualified', statuses: ['Qualified', 'Booking Prompt Sent', 'Booked', 'Closed'], color: 'amber' },
      { name: 'Booked', statuses: ['Booked', 'Closed'], color: 'green' },
    ];

    // Count leads at each stage
    const funnelData = stages.map((stage) => {
      const count = leads.filter((lead) =>
        stage.statuses.includes(lead.status)
      ).length;
      return { ...stage, count };
    });

    // Calculate conversion rates
    const totalLeads = funnelData[0]?.count || 0;
    const funnelWithRates = funnelData.map((stage, idx) => {
      const prevCount = idx === 0 ? totalLeads : funnelData[idx - 1].count;
      const conversionRate = prevCount > 0 ? Math.round((stage.count / prevCount) * 100) : 0;
      return { ...stage, conversionRate };
    });

    return Response.json({ stages: funnelWithRates });
  } catch (error) {
    console.error('Error fetching funnel:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
