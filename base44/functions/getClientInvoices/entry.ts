import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const projectId = body.project_id;

    if (!projectId) {
      return Response.json({ error: 'Missing project_id' }, { status: 400 });
    }

    // Fetch invoices for this project using filter (not list with 3rd arg)
    const invoices = await base44.asServiceRole.entities.Invoice.filter(
      { project_id: projectId },
      '-created_date',
      100
    ) || [];

    // Sort by due date, unpaid first
    invoices.sort((a, b) => {
      if (a.payment_status !== b.payment_status) {
        return a.payment_status === 'unpaid' ? -1 : 1;
      }
      return new Date(b.due_date || 0) - new Date(a.due_date || 0);
    });

    // Calculate summaries
    const summary = {
      total_invoices: invoices.length,
      total_outstanding: invoices
        .filter(i => i.payment_status !== 'paid')
        .reduce((sum, i) => sum + (i.amount_outstanding || 0), 0),
      unpaid_count: invoices.filter(i => i.payment_status === 'unpaid').length,
      overdue_count: invoices.filter(i => i.status === 'overdue').length,
    };

    return Response.json({
      success: true,
      invoices,
      summary,
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});