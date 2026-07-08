import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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
    const limit = Math.min(Math.max(Number(body.limit) || 50, 1), 100);

    const leads = await base44.asServiceRole.entities.WebsiteLead.filter(
      { lead_status: { $in: ['new', 'contacted'] } },
      '-created_date',
      limit
    );

    return Response.json({
      success: true,
      leads: (leads || []).map((lead: any) => ({
        id: lead.id,
        full_name: lead.full_name || lead.name || 'Unknown lead',
        phone_number: lead.phone_number || lead.phone || '',
        email: lead.email || '',
        business_name: lead.business_name || '',
        lead_status: lead.lead_status || lead.status || 'unknown',
        created_date: lead.created_date,
      })),
    });
  } catch (error: any) {
    console.error('[getCommunicationLogLeadOptions]', error?.message || error);
    return Response.json(
      {
        success: false,
        error: 'Failed to load lead options',
        detail: error?.message || String(error),
      },
      { status: 500 }
    );
  }
});
