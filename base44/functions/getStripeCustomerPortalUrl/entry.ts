import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2023-10-16' });

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { return_url } = await req.json().catch(() => ({}));

    // Find the client project for this user
    const projects = await base44.asServiceRole.entities.ClientProject.filter({ client_email: user.email });
    const project = projects?.[0];
    if (!project) return Response.json({ error: 'No project found' }, { status: 404 });

    // Get stripe customer ID from order
    const orders = await base44.asServiceRole.entities.Order.filter({ customer_email: user.email });
    const stripeCustomerId = orders?.[0]?.stripe_customer_id;

    if (!stripeCustomerId) {
      return Response.json({ error: 'No Stripe customer found. Please contact support.' }, { status: 404 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: return_url || 'https://app.base44.com',
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('[getStripeCustomerPortalUrl] Stripe portal error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});