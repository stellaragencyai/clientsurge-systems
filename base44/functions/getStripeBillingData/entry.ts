import { secureJson } from "../_shared/response.ts";
/**
 * getStripeBillingData
 * Returns live Stripe subscription + invoice data for the authenticated client.
 * Falls back to internal Invoice entity records if no Stripe customer found.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2023-10-16' });

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return secureJson({ error: 'Unauthorized' }, { status: 401 });

    // Find order with stripe customer id
    const orders = await base44.asServiceRole.entities.Order.filter(
      { customer_email: user.email }, '-created_date', 10
    );
    const order = orders?.[0];
    const stripeCustomerId = order?.stripe_customer_id;

    // If no Stripe customer, fall back to internal invoice entity
    if (!stripeCustomerId) {
      const project = (await base44.asServiceRole.entities.ClientProject.filter({ client_email: user.email }))?.[0];
      const internalInvoices = project
        ? await base44.asServiceRole.entities.Invoice.filter({ project_id: project.id }, '-created_date', 50)
        : [];

      return secureJson({
        success: true,
        source: 'internal',
        subscriptions: [],
        invoices: (internalInvoices || []).map(inv => ({
          id: inv.id,
          number: inv.invoice_number || `INV-${inv.id.slice(-6).toUpperCase()}`,
          description: inv.description || 'Service Invoice',
          amount_due: (inv.amount || 0) * 100,
          amount_paid: inv.payment_status === 'paid' ? (inv.amount || 0) * 100 : 0,
          currency: 'usd',
          status: inv.payment_status || 'draft',
          created: inv.issue_date ? Math.floor(new Date(inv.issue_date).getTime() / 1000) : null,
          due_date: inv.due_date ? Math.floor(new Date(inv.due_date).getTime() / 1000) : null,
          hosted_invoice_url: inv.payment_link || null,
          invoice_pdf: inv.pdf_url || null,
          period_start: null,
          period_end: null,
        })),
        summary: {
          has_stripe: false,
          total_invoices: internalInvoices?.length || 0,
          total_outstanding: (internalInvoices || [])
            .filter(i => i.payment_status !== 'paid')
            .reduce((s, i) => s + (i.amount || 0), 0),
          unpaid_count: (internalInvoices || []).filter(i => i.payment_status !== 'paid').length,
        },
      });
    }

    // Live Stripe data
    const [subscriptionsRes, invoicesRes] = await Promise.all([
      stripe.subscriptions.list({ customer: stripeCustomerId, limit: 10, expand: ['data.default_payment_method'] }),
      stripe.invoices.list({ customer: stripeCustomerId, limit: 50 }),
    ]);

    const subscriptions = subscriptionsRes.data.map(sub => {
      const pm = sub.default_payment_method;
      return {
        id: sub.id,
        status: sub.status,
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        cancel_at_period_end: sub.cancel_at_period_end,
        canceled_at: sub.canceled_at,
        plan_name: sub.items?.data?.[0]?.price?.nickname
          || sub.items?.data?.[0]?.plan?.nickname
          || 'Subscription',
        interval: sub.items?.data?.[0]?.plan?.interval || 'month',
        amount: sub.items?.data?.[0]?.plan?.amount || 0,
        currency: sub.items?.data?.[0]?.plan?.currency || 'usd',
        payment_method: pm ? {
          brand: pm.card?.brand || null,
          last4: pm.card?.last4 || null,
          exp_month: pm.card?.exp_month || null,
          exp_year: pm.card?.exp_year || null,
          type: pm.type || null,
        } : null,
      };
    });

    const invoices = invoicesRes.data.map(inv => ({
      id: inv.id,
      number: inv.number || `INV-${inv.id.slice(-6).toUpperCase()}`,
      description: inv.description || inv.lines?.data?.[0]?.description || 'Subscription Invoice',
      amount_due: inv.amount_due,
      amount_paid: inv.amount_paid,
      currency: inv.currency,
      status: inv.status,
      created: inv.created,
      due_date: inv.due_date,
      hosted_invoice_url: inv.hosted_invoice_url,
      invoice_pdf: inv.invoice_pdf,
      period_start: inv.period_start,
      period_end: inv.period_end,
    }));

    const outstanding = invoices
      .filter(i => i.status !== 'paid' && i.status !== 'void')
      .reduce((s, i) => s + (i.amount_due || 0), 0);

    return secureJson({
      success: true,
      source: 'stripe',
      subscriptions,
      invoices,
      summary: {
        has_stripe: true,
        total_invoices: invoices.length,
        total_outstanding: outstanding / 100,
        unpaid_count: invoices.filter(i => i.status !== 'paid' && i.status !== 'void').length,
      },
    });

  } catch (error) {
    console.error('[getStripeBillingData] error:', error);
    return secureJson({ error: error.message }, { status: 500 });
  }
});