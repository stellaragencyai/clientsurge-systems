import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { getStripeClient, safeStripeError } from "../_shared/stripeInit.js";

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return secureJson({ error: 'Unauthorized' }, { status: 401 });

    const { return_url } = await req.json().catch(() => ({}));

    // Find the client project for this user
    const projects = await base44.asServiceRole.entities.ClientProject.filter({ client_email: user.email });
    const project = projects?.[0];
    if (!project) return secureJson({ error: 'No project found' }, { status: 404 });

    // Get stripe customer ID from order
    const orders = await base44.asServiceRole.entities.Order.filter({ customer_email: user.email });
    const stripeCustomerId = orders?.[0]?.stripe_customer_id;

    if (!stripeCustomerId) {
      return secureJson({ error: 'No Stripe customer found. Please contact support.' }, { status: 404 });
    }

    let stripe;
    try {
      ({ stripe } = getStripeClient());
    } catch (error) {
      const safeError = safeStripeError(error);
      console.error('[getStripeCustomerPortalUrl] Stripe is not configured', {
        requestId,
        code: safeError.code,
      });
      return secureJson(
        { error: safeError.userMessage, code: safeError.code, request_id: requestId },
        { status: safeError.status }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: return_url || 'https://app.base44.com',
    });

    return secureJson({ url: session.url, request_id: requestId });
  } catch (error) {
    const safeError = safeStripeError(error, 'Unable to open the billing portal. Please contact support.');
    console.error('[getStripeCustomerPortalUrl] Stripe portal error', {
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
