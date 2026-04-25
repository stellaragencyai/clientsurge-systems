import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;
const MAX_FETCH = 5000;

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(Number(body.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
    const offset = Math.max(Number(body.offset) || 0, 0);
    const fetchLimit = Math.min(limit + offset, MAX_FETCH);

    // Fetch all leads
    const allFetchedLeads = await base44.asServiceRole.entities.Leads.list('-updated_date', fetchLimit) || [];
    const leads = allFetchedLeads.slice(offset, offset + limit);

    // Calculate summary statistics
    const total_leads = allFetchedLeads.length;
    const status_counts = {};
    const segment_counts = {
      follow_up: 0,
      awaiting_close: 0,
      reactivation: 0,
      nurture: 0,
      high_value_outreach: 0,
      demo_requested: 0,
    };
    const recommended_offer_counts = {
      starter_system: 0,
      growth_system: 0,
      pro_system: 0,
      single_service: 0,
    };

    // Process leads and calculate segments
    const priorityQueue = [];
    const recentActivity = [];

    allFetchedLeads.forEach(lead => {
      // Status counts
      status_counts[lead.status] = (status_counts[lead.status] || 0) + 1;

      // Segment logic
      if (lead.status === 'Contacted' || lead.status === 'Replied') {
        segment_counts.follow_up++;
      }
      if (lead.status === 'Qualified') {
        segment_counts.awaiting_close++;
      }
      if (lead.status === 'Booked') {
        segment_counts.demo_requested++;
      }
      if (lead.status === 'New') {
        segment_counts.high_value_outreach++;
      }

      // Recommended offer
      const leadScore = lead.lead_score || 0;
      if (leadScore >= 80) {
        recommended_offer_counts.pro_system++;
      } else if (leadScore >= 60) {
        recommended_offer_counts.growth_system++;
      } else if (leadScore >= 40) {
        recommended_offer_counts.starter_system++;
      } else {
        recommended_offer_counts.single_service++;
      }

      // Priority queue (top 10 by lead score)
      priorityQueue.push({
        id: lead.id,
        full_name: lead.full_name,
        business_name: lead.business_name,
        status: lead.status,
        lead_score: lead.lead_score || 0,
        activation_priority: lead.activation_priority || (leadScore >= 80 ? 'High' : leadScore >= 60 ? 'Medium' : 'Low'),
        next_action: {
          label: lead.status === 'Booked' ? 'Follow-up Demo' : lead.status === 'Qualified' ? 'Send Booking Link' : 'Reach Out',
          detail: lead.status === 'Booked' ? 'Prepare demo materials' : lead.status === 'Qualified' ? 'Send booking link via SMS' : 'Initial contact sequence',
        },
        recommended_offer: {
          package_name: leadScore >= 80 ? 'Pro System' : leadScore >= 60 ? 'Growth System' : 'Starter System',
          primary_service_name: leadScore >= 80 ? 'Full Stack' : 'Response + Nurture',
        },
      });

      // Recent activity
      recentActivity.push({
        id: lead.id,
        full_name: lead.full_name,
        business_name: lead.business_name,
        status: lead.status,
        last_activity_at: lead.updated_date,
        recent_movement: {
          detail: `Updated ${new Date(lead.updated_date).toLocaleDateString()}`,
        },
      });
    });

    // Sort priority queue by score
    priorityQueue.sort((a, b) => b.lead_score - a.lead_score);

    // Recent activity (last 5)
    const recent = recentActivity
      .sort((a, b) => new Date(b.last_activity_at || 0).getTime() - new Date(a.last_activity_at || 0).getTime())
      .slice(0, 5);

    const dayBuckets = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      dayBuckets[key] = 0;
    }
    for (const lead of allFetchedLeads) {
      const key = lead.created_date ? new Date(lead.created_date).toISOString().slice(0, 10) : null;
      if (key && key in dayBuckets) {
        dayBuckets[key]++;
      }
    }
    const last7Days = Object.entries(dayBuckets).map(([date, count]) => ({ date, leads: count }));

    return Response.json({
      summary: {
        total_leads,
        status_counts,
        segment_counts,
        recommended_offer_counts,
        priority_queue: priorityQueue.slice(0, 10),
        recent_lead_activity: recent,
        last7Days,
      },
      leads,
      pagination: { limit, offset, total: total_leads },
      filter_options: { statuses: Object.keys(status_counts) },
    });
  } catch (error) {
    console.error('Error in getLeadPipelineSummary:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
