import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return secureJson({ error: 'Unauthorized' }, { status: 401 });

    const { job_id } = await req.json();
    if (!job_id) return secureJson({ error: 'job_id required' }, { status: 400 });

    // Verify the job belongs to this client's leads
    const projects = await base44.asServiceRole.entities.ClientProject.filter({ client_email: user.email });
    if (!projects?.[0]) return secureJson({ error: 'No project found' }, { status: 404 });

    const leads = await base44.asServiceRole.entities.Leads.filter({ created_by: user.email }, '-created_date', 200);
    const leadIds = new Set(leads.map(l => l.id));

    const jobs = await base44.asServiceRole.entities.AutomationJob.list('', 200);
    const job = jobs.find(j => j.id === job_id);

    if (!job) return secureJson({ error: 'Job not found' }, { status: 404 });
    if (!leadIds.has(job.lead_id)) return secureJson({ error: 'Unauthorized' }, { status: 403 });

    // Re-queue the job and clear stale timestamps
    await base44.asServiceRole.entities.AutomationJob.update(job_id, {
      status: 'queued',
      attempts: 0,
      last_error: null,
      processed_at: null,
      scheduled_for: new Date().toISOString(),
    });

    return secureJson({ success: true, message: 'Job re-queued successfully' });
  } catch (error) {
    console.error('[retriggerTaskJob] retriggerTaskJob error:', error);
    return secureJson({ error: error.message }, { status: 500 });
  }
});