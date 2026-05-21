import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return secureJson({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { project_id, limit = 50 } = body;

    // Get the client project to verify ownership
    let projects = await base44.asServiceRole.entities.ClientProject.filter({ client_email: user.email });
    const project = projects?.[0];

    if (!project) return secureJson({ error: 'No project found for this user' }, { status: 404 });

    // Get leads associated with this client (filtered at DB level)
    const leads = await base44.asServiceRole.entities.Leads.filter({ created_by: user.email }, '-created_date', 200);
    const leadIds = leads.map(l => l.id);

    if (leadIds.length === 0) {
      return secureJson({ jobs: [], stats: { total: 0, completed: 0, queued: 0, processing: 0, failed: 0 }, events: [] });
    }

    // Get all automation jobs then filter client-side (no bulk filter by array in SDK)
    let jobs = await base44.asServiceRole.entities.AutomationJob.list('-created_date', limit);

    // Filter to only jobs for this client's leads
    const clientJobs = jobs.filter(j => leadIds.includes(j.lead_id));

    // Enrich jobs with lead info
    const leadMap = {};
    leads.forEach(l => { leadMap[l.id] = l; });

    const enrichedJobs = clientJobs.map(job => ({
      ...job,
      lead_name: leadMap[job.lead_id]?.full_name || 'Unknown Lead',
      lead_business: leadMap[job.lead_id]?.business_name || '',
    }));

    // Compute stats
    const stats = {
      total: enrichedJobs.length,
      completed: enrichedJobs.filter(j => j.status === 'completed').length,
      queued: enrichedJobs.filter(j => j.status === 'queued').length,
      processing: enrichedJobs.filter(j => j.status === 'processing').length,
      failed: enrichedJobs.filter(j => j.status === 'failed').length,
    };

    // Get communication events for activity log
    const recentEvents = await base44.asServiceRole.entities.CommunicationEvent.list('-created_date', 30);
    const clientEvents = recentEvents.filter(e => leadIds.includes(e.lead_id)).map(e => ({
      ...e,
      lead_name: leadMap[e.lead_id]?.full_name || 'Unknown Lead',
      lead_business: leadMap[e.lead_id]?.business_name || '',
    }));

    return secureJson({ jobs: enrichedJobs, stats, events: clientEvents });
  } catch (error) {
    console.error('[getClientTaskJobs] getClientTaskJobs error:', error);
    return secureJson({ error: error.message }, { status: 500 });
  }
});