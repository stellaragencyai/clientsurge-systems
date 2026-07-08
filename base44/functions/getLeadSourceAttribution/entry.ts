import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const MAX_LEADS = 1000;
const MAX_EVENTS = 2000;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return Response.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const leadLimit = Math.min(Math.max(Number(body.limit) || MAX_LEADS, 1), MAX_LEADS);

    const leads = await base44.asServiceRole.entities.Leads.list('-created_date', leadLimit);
    const leadIds = (leads || []).map((lead: any) => lead.id).filter(Boolean);

    const communicationEvents = leadIds.length
      ? await base44.asServiceRole.entities.CommunicationEvent.filter(
          { lead_id: { $in: leadIds } },
          '-created_date',
          MAX_EVENTS
        ).catch(() => [])
      : [];

    return Response.json({
      success: true,
      leads: leads || [],
      communicationEvents: communicationEvents || [],
      limits: {
        leads: leadLimit,
        events: MAX_EVENTS,
      },
    });
  } catch (error: any) {
    console.error('[getLeadSourceAttribution]', error?.message || error);
    return Response.json(
      {
        success: false,
        error: 'Failed to load lead source attribution',
        detail: error?.message || String(error),
      },
      { status: 500 }
    );
  }
});
