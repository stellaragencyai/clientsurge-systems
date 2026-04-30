import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2024-06-20' });

Deno.serve(async (req) => {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  try {
    if (event.type === 'invoice.paid') {
      const stripeInvoice = event.data.object;
      const stripeInvoiceId = stripeInvoice.id;

      // Find matching invoice in our DB
      const invoices = await base44.asServiceRole.entities.Invoice.filter(
        { stripe_invoice_id: stripeInvoiceId },
        '-created_date',
        1
      );

      if (invoices?.length) {
        const invoice = invoices[0];
        await base44.asServiceRole.entities.Invoice.update(invoice.id, {
          payment_status: 'paid',
          status: 'paid',
          amount_paid: (stripeInvoice.amount_paid || 0) / 100,
          amount_outstanding: 0,
          paid_at: new Date().toISOString(),
        });

        // Send receipt email
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: invoice.client_email,
          subject: `Payment Received — Invoice ${invoice.invoice_number}`,
          body: `<p>Hi,</p><p>We've received your payment of <strong>$${((stripeInvoice.amount_paid || 0) / 100).toFixed(2)}</strong> for invoice <strong>${invoice.invoice_number}</strong>.</p><p>Thank you for your business!</p><p>— ClientSurge Systems</p>`,
        });

        console.log(`Invoice ${invoice.id} marked paid via Stripe webhook`);
      } else {
        console.warn(`No matching Invoice found for Stripe invoice ${stripeInvoiceId}`);
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const stripeInvoice = event.data.object;
      const invoices = await base44.asServiceRole.entities.Invoice.filter(
        { stripe_invoice_id: stripeInvoice.id },
        '-created_date',
        1
      );
      if (invoices?.length) {
        await base44.asServiceRole.entities.Invoice.update(invoices[0].id, {
          status: 'overdue',
        });
        console.log(`Invoice ${invoices[0].id} marked overdue (payment failed)`);
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('stripeInvoiceWebhook processing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});