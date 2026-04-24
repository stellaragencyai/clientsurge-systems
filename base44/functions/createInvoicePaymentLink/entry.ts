import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { invoice_id } = body;

    if (!invoice_id) {
      return Response.json({ error: 'Missing invoice_id' }, { status: 400 });
    }

    // Fetch invoice
    const invoices = await base44.asServiceRole.entities.Invoice.list('', 1, {
      id: invoice_id,
    });

    if (!invoices || invoices.length === 0) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = invoices[0];

    // Check if already paid
    if (invoice.payment_status === 'paid') {
      return Response.json({
        error: 'Invoice already paid',
        payment_link: null,
      }, { status: 400 });
    }

    // For demo: return a mock payment link (in production, integrate with Stripe)
    const paymentLink = `https://pay.stripe.com/pay/${Math.random().toString(36).substr(2, 9)}`;

    // Update invoice with payment link
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