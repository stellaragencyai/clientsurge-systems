import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import {
  buildInstallSnapshot,
} from "../_shared/installPipeline.js";
import {
  getPackageDisplayLabel,
  normalizePackageKey,
} from "../../../src/lib/salesCatalog.js";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function buildServiceStates(order) {
  const snapshot = buildInstallSnapshot(order);
  return snapshot.serviceStates.map((service) => ({
    service_key: service.service_key,
    display_name: service.display_name,
    install_status: service.install_status,
    configuration_complete: service.configuration_complete,
    missing_configuration_fields: service.missing_configuration_fields,
  }));
}

function buildOrderSummary(order) {
  const packageKey = normalizePackageKey(
    order?.pricing_summary?.package_key ||
      order?.selected_package_type ||
      order?.package_type
  );
  const services = buildServiceStates(order);

  return {
    id: order.id,
    payment_status: order.payment_status,
    billing_status: order.billing_status,
    subscription_status: order.subscription_status,
    pipeline_status: buildInstallSnapshot(order).pipelineStatus,
    order_status: order.order_status,
    client_id: order.client_id,
    client_project_id: order.client_project_id,
    onboarding_client_id: order.onboarding_client_id,
    selected_package_type: packageKey,
    package_type: packageKey,
    plan_type:
      order.pricing_summary?.package_name ||
      order.plan_type ||
      getPackageDisplayLabel(order.pricing_summary),
    total_setup: order.total_setup,
    total_monthly: order.total_monthly,
    current_period_start: order.current_period_start,
    current_period_end: order.current_period_end,
    pricing_summary: order.pricing_summary || null,
    services,
  };
}

function buildSubscriptionSummary(order, project) {
  const services = buildServiceStates(order);
  return {
    id: order.stripe_subscription_id || order.subscription_id || null,
    status: order.subscription_status || order.billing_status || order.payment_status,
    plan_type:
      order.pricing_summary?.package_name || order.plan_type || project?.plan || "Custom Service Bundle",
    plan_name:
      order.pricing_summary?.package_name || order.plan_type || project?.plan || "Custom Service Bundle",
    plan_key: normalizePackageKey(
      order.pricing_summary?.package_key ||
        order.selected_package_type ||
        order.package_type
    ),
    amount: Math.round(Number(order.total_monthly || 0) * 100),
    currency: "usd",
    interval: "month",
    current_period_start: order.current_period_start,
    current_period_end: order.current_period_end,
    cancel_at_period_end: false,
    services_included: services.map((service) => service.service_key),
    change_request_status:
      project?.plan_change_request && project.plan_change_request !== "None"
        ? "pending_review"
        : "none",
    change_request_type:
      project?.plan_change_request && project.plan_change_request !== "None"
        ? project.plan_change_request === project.plan
          ? "current"
          : "change"
        : null,
    requested_plan_type:
      project?.plan_change_request && project.plan_change_request !== "None"
        ? project.plan_change_request
        : null,
  };
}

function buildProjectSummary(project) {
  if (!project) {
    return null;
  }

  return {
    ...project,
    quick_start_completed: project.quick_start_completed === true,
  };
}

function buildPortalLoginEvent({ user, email, linkStatus, order = null, client = null, project = null }) {
  const clientId = client?.id || order?.client_id || null;
  const clientProjectId = project?.id || order?.client_project_id || null;
  const contextId = order?.id
    ? `portal_login:${order.id}:${linkStatus}`
    : `portal_login:${email}:${linkStatus}`;

  return {
    channel: "internal",
    direction: "system",
    event_type: "portal_login",
    provider: "internal",
    status: "processed",
    subject: "Client portal login",
    message_body: `Authenticated portal login resolved with status: ${linkStatus}.`,
    description: `Authenticated portal login for ${email} resolved as ${linkStatus}.`,
    order_id: order?.id,
    client_id: clientId,
    client_project_id: clientProjectId,
    context_type: "client_portal",
    context_id: contextId,
    metadata_json: JSON.stringify({
      link_status: linkStatus,
      user_id: user?.id || null,
      user_email: email,
      order_id: order?.id || null,
      client_id: clientId,
      client_project_id: clientProjectId,
      has_paid_order: Boolean(order?.id),
    }),
  };
}

async function logPortalLoginEvent(base44, args) {
  try {
    await base44.asServiceRole.entities.CommunicationEvent.create(
      buildPortalLoginEvent(args)
    );
  } catch (error) {
    console.error("[getClientPortalContext] portal login event failed:", error.message);
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : String(authError);
      if (/authentication required/i.test(message)) {
        return secureJson(
          { error: "Authentication required", code: "portal_auth_required" },
          { status: 401 }
        );
      }
      throw authError;
    }

    if (!user?.email) {
      return secureJson(
        { error: "Authentication required", code: "portal_auth_required" },
        { status: 401 }
      );
    }

    const email = cleanString(user.email).toLowerCase();
    const orders = await base44.asServiceRole.entities.Order.filter(
      { customer_email: email },
      "-created_date",
      50
    );
    const matchingOrders = (orders || []).filter(
      (order) => cleanString(order.customer_email).toLowerCase() === email
    );
    const paidOrders = matchingOrders.filter(
      (order) => order.payment_status === "paid"
    );

    if (paidOrders.length === 0) {
      await logPortalLoginEvent(base44, {
        user,
        email,
        linkStatus: "no_paid_order",
      });

      return secureJson({
        success: true,
        project: null,
        order: null,
        subscription: null,
        link_status: "no_paid_order",
        empty_state: true,
        message:
          "No paid order is linked to this login yet. Complete checkout or contact support.",
      });
    }

    const businessNames = [
      ...new Set(paidOrders.map((order) => cleanString(order.business_name)).filter(Boolean)),
    ];
    if (businessNames.length > 1) {
      await logPortalLoginEvent(base44, {
        user,
        email,
        linkStatus: "ambiguous_paid_orders",
      });

      return secureJson({
        success: true,
        project: null,
        order: null,
        subscription: null,
        link_status: "ambiguous_paid_orders",
        empty_state: false,
        message:
          "Multiple paid businesses are linked to this email. Support needs to finish portal routing before access can be shown safely.",
      });
    }

    const order = paidOrders[0];
    const orderSummary = buildOrderSummary(order);

    if (!order.client_project_id || !order.client_id) {
      await logPortalLoginEvent(base44, {
        user,
        email,
        linkStatus: "missing_canonical_links",
        order,
      });

      return secureJson({
        success: true,
        project: null,
        order: orderSummary,
        subscription: null,
        link_status: "missing_canonical_links",
        empty_state: false,
        message:
          "Your payment is confirmed, but your client/project linkage is not complete yet. Our team needs to finish linking your portal records.",
      });
    }

    const [project, client] = await Promise.all([
      base44.asServiceRole.entities.ClientProject.get(order.client_project_id).catch(
        () => null
      ),
      base44.asServiceRole.entities.Client.get(order.client_id).catch(() => null),
    ]);

    if (!project || !client) {
      await logPortalLoginEvent(base44, {
        user,
        email,
        linkStatus: "linked_records_missing",
        order,
      });

      return secureJson({
        success: true,
        project: null,
        order: orderSummary,
        subscription: null,
        link_status: "linked_records_missing",
        empty_state: false,
        message:
          "Your order is paid, but the linked client records are incomplete. Support needs to repair the portal linkage.",
      });
    }

    const projectSummary = buildProjectSummary(project);
    const subscription = buildSubscriptionSummary(order, projectSummary);

    await logPortalLoginEvent(base44, {
      user,
      email,
      linkStatus: "linked",
      order,
      client,
      project: projectSummary,
    });

    return secureJson({
      success: true,
      project: projectSummary,
      client,
      order: orderSummary,
      subscription,
      link_status: "linked",
      empty_state: false,
    });
  } catch (error) {
    console.error("[getClientPortalContext] Error:", error.message);
    return secureJson({ error: error.message }, { status: 500 });
  }
});
