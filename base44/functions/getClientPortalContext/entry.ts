import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

function secureJson(data, options = {}) {
  return new Response(JSON.stringify(data), {
    status: options.status || 200,
    headers: { "Content-Type": "application/json" },
  });
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isAdminRole(user) {
  if (!user) return false;
  const role = (user.role || "").toLowerCase();
  return role === "admin" || role === "super_admin";
}

async function fetchRecentEvents(base44, order, project, limit = 50) {
  const clientId = order?.client_id || project?.client_id || null;
  const projectId = order?.client_project_id || project?.id || null;
  const query = {};
  if (clientId) query.client_id = clientId;
  if (projectId) query.client_project_id = projectId;
  if (!clientId && !projectId) return [];

  try {
    const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
      query, "-created_date", limit
    );
    return events || [];
  } catch {
    return [];
  }
}

function normalizePackageKey(key) {
  if (!key) return null;
  return String(key).toLowerCase().replace(/\s+/g, "_");
}

function getPackageDisplayLabel(pricingSummary) {
  if (!pricingSummary) return "Custom Service Bundle";
  return pricingSummary.package_name || "Custom Service Bundle";
}

function buildServiceStates(order) {
  const items = order?.items || [];
  return items.map((item) => ({
    service_key: item.service_key || item.product_id,
    display_name: item.product_name || item.service_key || "Service",
    install_status: item.install_status || "Paid",
    configuration_complete: Boolean(item.install_status && item.install_status !== "Paid"),
    missing_configuration_fields: [],
  }));
}

function buildOrderSummary(order) {
  const packageKey = normalizePackageKey(
    order?.pricing_summary?.package_key ||
      order?.selected_package_type ||
      order?.package_type
  );
  const services = buildServiceStates(order);
  const statuses = services.map((s) => s.install_status);
  let pipelineStatus = "Paid";
  if (statuses.every((s) => s === "Live")) pipelineStatus = "Live";
  else if (statuses.some((s) => s === "Error")) pipelineStatus = "Error";
  else if (statuses.some((s) => s === "Testing")) pipelineStatus = "Testing";
  else if (statuses.some((s) => s === "Configuring")) pipelineStatus = "Configuring";
  else if (statuses.some((s) => s === "Ready for Install")) pipelineStatus = "Ready for Install";

  return {
    id: order.id,
    payment_status: order.payment_status,
    billing_status: order.billing_status,
    subscription_status: order.subscription_status,
    pipeline_status: pipelineStatus,
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
    services_included: services.map((s) => s.service_key),
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
  if (!project) return null;
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

    // Check paid orders first
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
      // Fallback: check for a ClientProject directly linked by client_email (demo/manual accounts)
      const projectsByEmail = await base44.asServiceRole.entities.ClientProject.filter(
        { client_email: email },
        "-created_date",
        5
      );
      const directProject = (projectsByEmail || []).find(
        (p) => cleanString(p.client_email).toLowerCase() === email
      );

      if (directProject) {
        const projectSummary = buildProjectSummary(directProject);
        await logPortalLoginEvent(base44, {
          user,
          email,
          linkStatus: "direct_project_link",
          project: directProject,
        });
        return secureJson({
          success: true,
          project: projectSummary,
          order: null,
          subscription: null,
          link_status: "direct_project_link",
          empty_state: false,
          is_admin_preview: false,
          user_role: user?.role || "user",
        });
      }

      await logPortalLoginEvent(base44, { user, email, linkStatus: "no_paid_order" });
      const isAdmin = isAdminRole(user);
      return secureJson({
        success: true,
        project: null,
        order: null,
        subscription: null,
        link_status: "no_paid_order",
        empty_state: true,
        is_admin_preview: isAdmin,
        user_role: user?.role || "user",
        message: isAdmin
          ? "Admin Preview Mode — no client selected."
          : "No paid order is linked to this login yet. Complete checkout or contact support.",
      });
    }

    const businessNames = [
      ...new Set(paidOrders.map((order) => cleanString(order.business_name)).filter(Boolean)),
    ];
    if (businessNames.length > 1) {
      await logPortalLoginEvent(base44, { user, email, linkStatus: "ambiguous_paid_orders" });
      return secureJson({
        success: true,
        project: null,
        order: null,
        subscription: null,
        link_status: "ambiguous_paid_orders",
        empty_state: false,
        is_admin_preview: false,
        user_role: user?.role || "user",
        message: "Multiple paid businesses are linked to this email. Support needs to finish portal routing before access can be shown safely.",
      });
    }

    const order = paidOrders[0];
    const orderSummary = buildOrderSummary(order);

    if (!order.client_project_id || !order.client_id) {
      await logPortalLoginEvent(base44, { user, email, linkStatus: "missing_canonical_links", order });
      return secureJson({
        success: true,
        project: null,
        order: orderSummary,
        subscription: null,
        link_status: "missing_canonical_links",
        empty_state: false,
        is_admin_preview: false,
        user_role: user?.role || "user",
        message: "Your payment is confirmed, but your client/project linkage is not complete yet. Our team needs to finish linking your portal records.",
      });
    }

    const [project, client] = await Promise.all([
      base44.asServiceRole.entities.ClientProject.get(order.client_project_id).catch(() => null),
      base44.asServiceRole.entities.Client.get(order.client_id).catch(() => null),
    ]);

    if (!project || !client) {
      await logPortalLoginEvent(base44, { user, email, linkStatus: "linked_records_missing", order });
      return secureJson({
        success: true,
        project: null,
        order: orderSummary,
        subscription: null,
        link_status: "linked_records_missing",
        empty_state: false,
        is_admin_preview: false,
        user_role: user?.role || "user",
        message: "Your order is paid, but the linked client records are incomplete. Support needs to repair the portal linkage.",
      });
    }

    const projectSummary = buildProjectSummary(project);
    const subscription = buildSubscriptionSummary(order, projectSummary);

    // Fetch onboarding orchestration for progress tracker
    let onboardingRecord = null;
    try {
      const onboardingRecords = await base44.asServiceRole.entities.OnboardingOrchestration.filter(
        { order_id: order.id }, "-created_date", 1
      );
      onboardingRecord = (onboardingRecords || [])[0] || null;
    } catch {
      // Non-critical — tracker degrades gracefully
    }

    // Fetch recent events for health/readiness panels
    const recentEvents = await fetchRecentEvents(base44, order, projectSummary, 100);
    const failedEvents = (recentEvents || []).filter((e) => e.status === "failed");
    const proofEvents = (recentEvents || []).filter(
      (e) => e.status !== "failed" && e.direction !== "inbound" && !(e.event_type || "").includes("portal_login")
    );

    // Readiness check — not "Live" if recent critical failures exist
    const hasFailedNonProof = failedEvents.some(
      (e) =>
        e.event_type &&
        !e.event_type.includes("simulation") &&
        !e.event_type.includes("test") &&
        !e.event_type.includes("proof")
    );
    const allLive = (orderSummary.services || []).length > 0 &&
      (orderSummary.services || []).every((s) => s.install_status === "Live");
    const readinessStatus = allLive && !hasFailedNonProof ? "Live" : orderSummary.pipeline_status;

    await logPortalLoginEvent(base44, { user, email, linkStatus: "linked", order, client, project: projectSummary });

    return secureJson({
      success: true,
      project: projectSummary,
      client,
      order: orderSummary,
      subscription,
      link_status: "linked",
      empty_state: false,
      is_admin_preview: false,
      user_role: user?.role || "user",
      onboarding: onboardingRecord ? {
        unified_stage: onboardingRecord.unified_stage || "intake_received",
        stage_progression: onboardingRecord.stage_progression || [],
        completion_metrics: onboardingRecord.completion_metrics || {},
        blockers: onboardingRecord.blockers || [],
        missing_setup_items: onboardingRecord.missing_setup_items || [],
        ready_to_go_live: onboardingRecord.ready_to_go_live || false,
      } : null,
      health: {
        readiness_status: readinessStatus,
        recent_failed_events_count: failedEvents.length,
        recent_proof_events_count: proofEvents.length,
        recent_events: recentEvents.slice(0, 50),
      },
    });
  } catch (error) {
    console.error("[getClientPortalContext] Error:", error.message);
    return secureJson({ error: error.message }, { status: 500 });
  }
});