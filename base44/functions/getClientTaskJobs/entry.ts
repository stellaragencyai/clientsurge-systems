import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { project_id, limit = 50 } = body;

    // Get the client project to verify ownership
    let projects = await base44.asServiceRole.entities.ClientProject.filter({ client_email: user.email });
    const project = projects?.[0];

    if (!project) return Response.json({ error: 'No project found for this user' }, { status: 404 });

    // Get automation jobs for this client's leads
    // First get leads associated with this client
    const leads = await base44.asServiceRole.entities.Leads.filter({ created_by: user.email }, '-created_date', 200);
    const leadIds = leads.map(l => l.id);

    // Get all automation jobs
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

    return Response.json({ jobs: enrichedJobs, stats, events: clientEvents });
  } catch (error) {
    console.error('getClientTaskJobs error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});