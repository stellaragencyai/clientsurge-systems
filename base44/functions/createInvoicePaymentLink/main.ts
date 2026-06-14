import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { resolveClientPortalAccess } from '../_shared/portalOwnership.js';
import { getStripeClient, safeStripeError } from "../_shared/stripeInit.js";

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  try {
    if (req.method !== 'POST') {
      return secureJson({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return secureJson({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { invoice_id } = body;

    if (!invoice_id) {
      return secureJson({ error: 'Missing invoice_id' }, { status: 400 });
    }

    const invoice = await base44.asServiceRole.entities.Invoice.get(invoice_id).catch(() => null);
    if (!invoice) {
      return secureJson({ error: 'Invoice not found' }, { status: 404 });
    }

    if (user.role !== 'admin') {
      const resolution = await resolveClientPortalAccess({
        base44,
        userEmail: user.email,
      });

      if (resolution.status !== 'resolved' || !resolution.project || resolution.project.id !== invoice.project_id) {
        return secureJson({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (invoice.payment_status === 'paid') {
      return secureJson({
        error: 'Invoice already paid',
        payment_link: null,
      }, { status: 400 });
    }

    if (!invoice.stripe_invoice_id) {
      return secureJson({ error: 'This invoice is not linked to Stripe yet.' }, { status: 409 });
    }

    let stripe;
    try {
      ({ stripe } = getStripeClient());
    } catch (error) {
      const safeError = safeStripeError(error);
      console.error('[createInvoicePaymentLink] Stripe is not configured', {
        requestId,
        invoice_id,
        code: safeError.code,
      });
      return secureJson(
        { error: safeError.userMessage, code: safeError.code, request_id: requestId },
        { status: safeError.status }
      );
    }

    // Always re-fetch from Stripe to avoid stale/expired cached links
    const stripeInvoice = await stripe.invoices.retrieve(invoice.stripe_invoice_id);
    const paymentLink = stripeInvoice.hosted_invoice_url || stripeInvoice.invoice_pdf || null;

    if (!paymentLink) {
      return secureJson({ error: 'Stripe invoice does not have a hosted payment URL.' }, { status: 409 });
    }

    await base44.asServiceRole.entities.Invoice.update(invoice_id, {
      payment_link: paymentLink,
    });

    return secureJson({
      success: true,
      payment_link: paymentLink,
      invoice_id,
      amount: invoice.amount_outstanding || invoice.amount,
      request_id: requestId,
    });
  } catch (error) {
    const safeError = safeStripeError(error, 'Unable to create an invoice payment link. Please contact support.');
    console.error('[createInvoicePaymentLink] Error creating payment link', {
      requestId,
      code: safeError.code,
      message: safeError.internalMessage,
    });
    return secureJson(
      { error: safeError.userMessage, code: safeError.code, request_id: requestId },
      { status: safeError.status }
    );
  }
});
