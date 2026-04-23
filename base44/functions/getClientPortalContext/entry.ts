import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resolveClientPortalAccess } from "../_shared/portalOwnership.js";
import { buildInstallSnapshot } from "../_shared/installPipeline.js";
import { buildSubscriptionSummary } from "../_shared/subscriptionSync.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.email) {
      return Response.json(
        {
          error: "Authentication required",
          code: "portal_auth_required",
        },
        { status: 401 }
      );
    }

    const resolution = await resolveClientPortalAccess({
      base44,
      userEmail: user.email,
    });

    if (resolution.status === "ambiguous") {
      return Response.json(
        {
          error: "We found multiple portal records for this account. Please contact support.",
          code: resolution.code,
        },
        { status: 409 }
      );
    }

    if (resolution.status !== "resolved" || !resolution.project) {
      return Response.json(
        {
          error: "No portal project is linked to this account yet.",
          code: resolution.code || "portal_project_not_found",
        },
        { status: 404 }
      );
    }

    const linkedSubscription =
      (resolution.order?.subscription_id
        ? await base44.asServiceRole.entities.Subscription.get(resolution.order.subscription_id).catch(() => null)
        : null) ||
      ((resolution.order?.stripe_subscription_id
        ? await base44.asServiceRole.entities.Subscription.filter({
            stripe_subscription_id: resolution.order.stripe_subscription_id,
          })
        : []) || [])[0] ||
      null;

    const orderSummary = resolution.order
      ? (() => {
          const snapshot = buildInstallSnapshot(resolution.order);
          return {
            id: resolution.order.id,
            payment_status: resolution.order.payment_status,
            pipeline_status: resolution.order.pipeline_status,
            order_status: resolution.order.order_status,
            client_id: resolution.order.client_id,
            client_project_id: resolution.order.client_project_id,
            onboarding_client_id: resolution.order.onboarding_client_id,
            stripe_subscription_id: resolution.order.stripe_subscription_id || null,
            subscription_status: resolution.order.subscription_status || "",
            current_period_end: resolution.order.current_period_end || null,
            plan_type: resolution.order.plan_type || "",
            services: snapshot.serviceStates.map((service) => ({
              service_key: service.service_key,
              display_name: service.display_name,
              install_status: service.install_status,
            })),
          };
        })()
      : null;

    return Response.json({
      success: true,
      resolution_type: resolution.resolution_type,
      project: resolution.project,
      client: resolution.client,
      order: orderSummary,
      subscription: buildSubscriptionSummary(linkedSubscription) || (resolution.order
        ? {
            id: resolution.order.subscription_id || null,
            client_id: resolution.order.client_id || null,
            stripe_customer_id: resolution.order.stripe_customer_id || null,
            stripe_subscription_id: resolution.order.stripe_subscription_id || null,
            plan_type: resolution.order.plan_type || "",
            status: resolution.order.subscription_status || "",
            current_period_start: resolution.order.current_period_start || null,
            current_period_end: resolution.order.current_period_end || null,
            services_included: resolution.order.pricing_summary?.selected_service_keys || [],
            change_request_type: "",
            requested_plan_type: "",
            change_request_status: "",
            cancel_requested_at: null,
          }
        : null),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load portal context";
    return Response.json({ error: message }, { status: 500 });
  }
});
