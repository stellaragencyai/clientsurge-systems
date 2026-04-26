import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import {
  buildLeadPipelineSnapshot,
  LEAD_PIPELINE_MAX_FETCH,
} from '../_shared/leadPipeline.js';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 250;
const EVENT_LIMIT = 5000;

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

    const filters = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(Number(filters.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
    const offset = Math.max(Number(filters.offset) || 0, 0);

    const [leads, events] = await Promise.all([
      base44.asServiceRole.entities.Leads.list('-updated_date', LEAD_PIPELINE_MAX_FETCH),
      base44.asServiceRole.entities.CommunicationEvent.list('-created_date', EVENT_LIMIT),
    ]);

    const snapshot = buildLeadPipelineSnapshot({
      leads: leads || [],
      events: events || [],
      filters,
      limit,
      offset,
    });

    return Response.json(snapshot);
  } catch (error) {
    console.error('Error in getLeadPipelineSummary:', error);
    return Response.json({ error: error.message || 'Failed to load lead pipeline summary' }, { status: 500 });
  }
});
