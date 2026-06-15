import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Returns billing summary with clear Setup vs Monthly separation
 */

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get('order_id');

    if (!orderId) {
      return Response.json({ error: 'order_id required' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const orders = await base44.asServiceRole.entities.Order.filter({ id: orderId });

    if (!orders || orders.length === 0) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orders[0];
    const summary = {
      order_id: order.id,
      setup_fee: order.total_setup || 0,
      monthly_fee: order.total_monthly || 0,
      billing_start_date: order.current_period_start,
      billing_day: 1, // Default to 1st; can be configured
      subscription_updates: [],
    };

    // Fetch subscription for recurring details
    if (order.subscription_id) {
      const subscriptions = await base44.asServiceRole.entities.Subscription.filter(
        { id: order.subscription_id }
      );

      if (subscriptions && subscriptions.length > 0) {
        const sub = subscriptions[0];
        summary.monthly_fee = sub.amount || order.total_monthly;
        summary.current_period_end = sub.current_period_end;
        
        // Check for upcoming changes
        if (sub.update_pending) {
          summary.subscription_updates.push({
            change_type: 'Upgrade' in sub.update_pending ? 'Upgrade' : 'Downgrade',
            new_amount: sub.update_pending.new_amount,
            effective_date: sub.update_pending.effective_date,
          });
        }
      }
    }

    // Fetch invoices
    const invoices = await base44.asServiceRole.entities.Invoice.filter(
      { order_id: orderId },
      '-created_date',
      12 // Last 12 invoices
    );

    const invoiceList = (invoices || []).map(inv => ({
      id: inv.id,
      amount: inv.total,
      date: inv.created_date,
      status: inv.status,
    }));

    return Response.json({
      success: true,
      summary,
      invoices: invoiceList,
    });
  } catch (error) {
    console.error('getBillingSummary error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});