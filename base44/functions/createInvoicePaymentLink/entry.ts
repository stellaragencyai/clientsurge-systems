import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';
import { resolveClientPortalAccess } from '../_shared/portalOwnership.js';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', { apiVersion: '2024-06-20' });

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { invoice_id } = body;

    if (!invoice_id) {
      return Response.json({ error: 'Missing invoice_id' }, { status: 400 });
    }

    const invoice = await base44.asServiceRole.entities.Invoice.get(invoice_id).catch(() => null);
    if (!invoice) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (user.role !== 'admin') {
      const resolution = await resolveClientPortalAccess({
        base44,
        userEmail: user.email,
      });

      if (resolution.status !== 'resolved' || !resolution.project || resolution.project.id !== invoice.project_id) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (invoice.payment_status === 'paid') {
      return Response.json({
        error: 'Invoice already paid',
        payment_link: null,
      }, { status: 400 });
    }

    if (!invoice.stripe_invoice_id) {
      return Response.json({ error: 'This invoice is not linked to Stripe yet.' }, { status: 409 });
    }

    // Always re-fetch from Stripe to avoid stale/expired cached links
    const stripeInvoice = await stripe.invoices.retrieve(invoice.stripe_invoice_id);
    const paymentLink = stripeInvoice.hosted_invoice_url || stripeInvoice.invoice_pdf || null;

    if (!paymentLink) {
      return Response.json({ error: 'Stripe invoice does not have a hosted payment URL.' }, { status: 409 });
    }

    await base44.asServiceRole.entities.Invoice.update(invoice_id, {
      payment_link: paymentLink,
    });

    return Response.json({
      success: true,
      payment_link: paymentLink,
      invoice_id,
      amount: invoice.amount_outstanding || invoice.amount,
    });
  } catch (error) {
    console.error('Error creating payment link:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});