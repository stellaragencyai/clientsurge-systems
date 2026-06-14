import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Stripe Activation Guarantee: Verify and retry failed post-payment onboarding
 * Ensures every paid Order triggers:
 * - Client creation
 * - ClientProject creation
 * - Subscription creation
 * - ClientInstallationOS initialization
 * - OnboardingClient workflow start
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id } = await req.json();

    if (!order_id) {
      return Response.json({ error: 'Missing order_id' }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    // Skip if not paid
    if (order.payment_status !== 'paid') {
      return Response.json({
        success: true,
        skipped: true,
        reason: 'Order not paid',
        payment_status: order.payment_status,
      });
    }

    const results = {
      order_id,
      guarantees: {},
    };

    // G1: Client exists
    if (!order.client_id) {
      try {
        const client = await base44.asServiceRole.entities.Client.create({
          full_name: order.customer_name,
          business_name: order.business_name,
          email: order.customer_email,
          phone: order.customer_phone,
          status: 'In Setup',
          lifecycle_stage: 'setup_in_progress',
          onboarding_started_at: new Date().toISOString(),
          notes: `[GUARANTEE] Auto-created from Order ${order.id}`,
        });

        await base44.asServiceRole.entities.Order.update(order.id, {
          client_id: client.id,
        });

        results.guarantees.client = { status: 'created', id: client.id };
      } catch (error) {
        results.guarantees.client = { status: 'error', error: error.message };
      }
    } else {
      results.guarantees.client = { status: 'exists', id: order.client_id };
    }

    // G2: ClientProject exists
    if (!order.client_project_id && order.client_id) {
      try {
        const project = await base44.asServiceRole.entities.ClientProject.create({
          client_id: order.client_id,
          client_email: order.customer_email,
          contact_email: order.customer_email,
          client_name: order.customer_name,
          business_name: order.business_name,
          plan: order.selected_package_type || 'Starter System',
          client_project_status: 'Onboarding Pending',
          step_onboarding: 'in_progress',
        });

        await base44.asServiceRole.entities.Order.update(order.id, {
          client_project_id: project.id,
        });

        results.guarantees.client_project = { status: 'created', id: project.id };
      } catch (error) {
        results.guarantees.client_project = { status: 'error', error: error.message };
      }
    } else {
      results.guarantees.client_project = {
        status: 'exists',
        id: order.client_project_id,
      };
    }

    // G3: Subscription exists (if monthly fees)
    if (!order.subscription_id && order.total_monthly > 0) {
      try {
        const subscription = await base44.asServiceRole.entities.Subscription.create({
          client_id: order.client_id,
          order_id: order.id,
          stripe_customer_id: order.stripe_customer_id,
          stripe_subscription_id: order.stripe_subscription_id,
          plan_type: order.selected_package_type || 'starter_system',
          status: order.subscription_status || 'active',
          current_period_start: order.current_period_start,
          current_period_end: order.current_period_end,
          services_included: order.pricing_summary?.selected_service_keys || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        await base44.asServiceRole.entities.Order.update(order.id, {
          subscription_id: subscription.id,
        });

        results.guarantees.subscription = { status: 'created', id: subscription.id };
      } catch (error) {
        results.guarantees.subscription = { status: 'error', error: error.message };
      }
    } else if (order.subscription_id) {
      results.guarantees.subscription = { status: 'exists', id: order.subscription_id };
    } else {
      results.guarantees.subscription = { status: 'skipped', reason: 'no_monthly_fees' };
    }

    // G4: ClientInstallationOS exists
    if (order.client_id) {
      const installations = await base44.asServiceRole.entities.ClientInstallationOS.filter(
        { client_id: order.client_id },
        '-created_date',
        1
      ).catch(() => []);

      if (installations.length === 0) {
        try {
          const installation = await base44.asServiceRole.entities.ClientInstallationOS.create({
            order_id: order.id,
            client_id: order.client_id,
            client_email: order.customer_email,
            business_name: order.business_name,
            workflow_stage: 'intake_received',
            activation_status: 'not_ready',
            admin_notes: `[GUARANTEE] Workflow initialized from Order ${order.id}`,
          });

          results.guarantees.installation_os = { status: 'created', id: installation.id };
        } catch (error) {
          results.guarantees.installation_os = { status: 'error', error: error.message };
        }
      } else {
        results.guarantees.installation_os = {
          status: 'exists',
          id: installations[0].id,
        };
      }
    }

    // G5: OnboardingClient exists
    if (order.client_id) {
      const onboardings = await base44.asServiceRole.entities.OnboardingClient.filter(
        { client_id: order.client_id },
        '-created_date',
        1
      ).catch(() => []);

      if (onboardings.length === 0) {
        try {
          const onboarding = await base44.asServiceRole.entities.OnboardingClient.create({
            client_id: order.client_id,
            email: order.customer_email,
            business_name: order.business_name,
            status: 'pending',
            admin_notes: `[GUARANTEE] Onboarding initiated from Order ${order.id}`,
          });

          results.guarantees.onboarding_client = { status: 'created', id: onboarding.id };
        } catch (error) {
          results.guarantees.onboarding_client = { status: 'error', error: error.message };
        }
      } else {
        results.guarantees.onboarding_client = {
          status: 'exists',
          id: onboardings[0].id,
        };
      }
    }

    results.all_guaranteed = Object.values(results.guarantees).every(
      g => g.status !== 'error'
    );

    return Response.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('[stripeActivationGuarantee] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});