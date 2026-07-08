import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

function secureJson(data, options = {}) {
  return new Response(JSON.stringify(data), {
    status: options.status || 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...(options.headers || {}),
    },
  });
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isAdminRole(user) {
  const role = cleanString(user?.role).toLowerCase();
  return role === "admin" || role === "super_admin";
}

function normalizePackageKey(key) {
  if (!key) return null;
  return String(key).toLowerCase().replace(/[\s-]+/g, "_");
}

function paid(order) {
  return ["paid", "succeeded", "complete"].includes(cleanString(order?.payment_status).toLowerCase());
}

function ts(value) {
  const ms = Date.parse(value || "");
  return Number.isFinite(ms) ? ms : 0;
}

function latest(records = []) {
  const ms = records.reduce((max, row) => Math.max(max, ts(row?.updated_date || row?.created_date)), 0);
  return ms ? new Date(ms).toISOString() : null;
}

function serviceLabel(item) {
  return item?.product_name || item?.service_name || item?.display_name || item?.service_key || item?.product_id || "Automation Service";
}

function buildServices(order) {
  return (Array.isArray(order?.items) ? order.items : []).map((item) => {
    const status = cleanString(item.install_status || item.service_access_status || item.status) || "Paid";
    return {
      service_key: item.service_key || item.product_id || item.key || serviceLabel(item).toLowerCase().replace(/\W+/g, "_"),
      display_name: serviceLabel(item),
      install_status: status,
      configuration_complete: Boolean(status && !["paid", "pending", "not_started"].includes(status.toLowerCase())),
      missing_configuration_fields: Array.isArray(item.missing_configuration_fields) ? item.missing_configuration_fields : [],
    };
  });
}

function summarizeOrder(order) {
  if (!order) return null;
  const services = buildServices(order);
  const statuses = services.map((service) => cleanString(service.install_status).toLowerCase());
  let pipeline = cleanString(order.pipeline_status || order.workflow_stage || order.order_status) || "Paid";
  if (statuses.length) {
    if (statuses.every((status) => status === "live" || status === "installed")) pipeline = "Live";
    else if (statuses.some((status) => status.includes("error") || status.includes("fail"))) pipeline = "Issue";
    else if (statuses.some((status) => status.includes("testing"))) pipeline = "Testing";
    else if (statuses.some((status) => status.includes("config") || status.includes("install"))) pipeline = "Configuring";
    else if (statuses.some((status) => status.includes("ready"))) pipeline = "Ready for Install";
  }
  const packageKey = normalizePackageKey(order?.pricing_summary?.package_key || order?.selected_package_type || order?.package_type);
  return {
    id: order.id,
    payment_status: order.payment_status,
    billing_status: order.billing_status,
    subscription_status: order.subscription_status,
    pipeline_status: pipeline,
    workflow_stage: order.workflow_stage || null,
    order_status: order.order_status,
    client_id: order.client_id || null,
    client_project_id: order.client_project_id || null,
    onboarding_client_id: order.onboarding_client_id || null,
    selected_package_type: packageKey,
    package_type: packageKey,
    plan_type: order.pricing_summary?.package_name || order.plan_type || order.package_name || "Custom Service Bundle",
    business_name: order.business_name || null,
    customer_name: order.customer_name || null,
    customer_email: order.customer_email || null,
    total_setup: order.total_setup,
    total_monthly: order.total_monthly,
    current_period_start: order.current_period_start,
    current_period_end: order.current_period_end,
    pricing_summary: order.pricing_summary || null,
    services,
    updated_date: order.updated_date || order.created_date || null,
  };
}

function summarizeProject(project) {
  if (!project) return null;
  return {
    ...project,
    quick_start_completed: project.quick_start_completed === true,
    onboarding_wizard_completed: project.onboarding_wizard_completed === true,
  };
}

function summarizeSubscription(order, project) {
  if (!order) return null;
  const services = buildServices(order);
  return {
    id: order.stripe_subscription_id || order.subscription_id || null,
    status: order.subscription_status || order.billing_status || order.payment_status || "unknown",
    plan_type: order.pricing_summary?.package_name || order.plan_type || project?.plan || "Custom Service Bundle",
    plan_name: order.pricing_summary?.package_name || order.plan_type || project?.plan || "Custom Service Bundle",
    plan_key: normalizePackageKey(order.pricing_summary?.package_key || order.selected_package_type || order.package_type),
    amount: Math.round(Number(order.total_monthly || 0) * 100),
    currency: "usd",
    interval: "month",
    current_period_start: order.current_period_start,
    current_period_end: order.current_period_end,
    cancel_at_period_end: Boolean(order.cancel_at_period_end),
    services_included: services.map((service) => service.service_key),
    change_request_status: project?.plan_change_request && project.plan_change_request !== "None" ? "pending_review" : "none",
  };
}

function coverage({ requestId, email, linkStatus, orders = [], projects = [], events = [], clientFound = false, warnings = [] }) {
  return {
    request_id: requestId,
    user_email: email,
    link_status: linkStatus,
    orders_sampled: orders.length,
    projects_sampled: projects.length,
    client_record_found: clientFound,
    communication_events_sampled: events.length,
    latest_order_at: latest(orders),
    latest_project_at: latest(projects),
    latest_event_at: latest(events),
    warnings,
    proof_label: "Portal status is based on Base44 records only — not live provider proof.",
  };
}

async function safeFilter(entity, query, sort = "-created_date", limit = 50) {
  try {
    if (!entity?.filter) return [];
    return (await entity.filter(query, sort, limit)) || [];
  } catch {
    return [];
  }
}

async function recentEvents(base44, order, project, limit = 100) {
  const queries = [];
  if (order?.client_id || project?.client_id) queries.push({ client_id: order?.client_id || project?.client_id });
  if (order?.client_project_id || project?.id) queries.push({ client_project_id: order?.client_project_id || project?.id });
  if (!queries.length) return [];
  const rows = (await Promise.all(queries.map((query) => safeFilter(base44.asServiceRole.entities.CommunicationEvent, query, "-created_date", limit)))).flat();
  const seen = new Set();
  return rows.filter((row) => {
    const key = row?.id || `${row?.created_date}:${row?.event_type}:${row?.status}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => ts(b.created_date) - ts(a.created_date)).slice(0, limit);
}

function loginEvent({ user, email, linkStatus, order = null, client = null, project = null, requestId }) {
  const clientId = client?.id || order?.client_id || null;
  const projectId = project?.id || order?.client_project_id || null;
  return {
    channel: "internal",
    direction: "system",
    event_type: "portal_login",
    provider: "internal",
    status: "processed",
    subject: "Client portal login",
    message_body: `Authenticated portal login resolved with status: ${linkStatus}.`,
    order_id: order?.id,
    client_id: clientId,
    client_project_id: projectId,
    context_type: "client_portal",
    context_id: order?.id ? `portal_login:${order.id}:${linkStatus}` : `portal_login:${email}:${linkStatus}`,
    metadata_json: JSON.stringify({ request_id: requestId, link_status: linkStatus, user_id: user?.id || null, user_email: email, order_id: order?.id || null, client_id: clientId, client_project_id: projectId, has_paid_order: Boolean(order?.id) }),
  };
}

async function logPortalLogin(base44, args) {
  try {
    await base44.asServiceRole.entities.CommunicationEvent.create(loginEvent(args));
  } catch (error) {
    console.error("[getClientPortalContext] portal login event failed:", error.message);
  }
}

Deno.serve(async (req) => {
  const requestId = `portal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed", code: "method_not_allowed", request_id: requestId }, { status: 405, headers: { Allow: "POST" } });
    }
    const base44 = createClientFromRequest(req);
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : String(authError);
      if (/authentication required/i.test(message)) return secureJson({ error: "Authentication required", code: "portal_auth_required", request_id: requestId }, { status: 401 });
      throw authError;
    }
    if (!user?.email) return secureJson({ error: "Authentication required", code: "portal_auth_required", request_id: requestId }, { status: 401 });

    const email = cleanString(user.email).toLowerCase();
    const orders = await safeFilter(base44.asServiceRole.entities.Order, { customer_email: email }, "-created_date", 50);
    const matchingOrders = orders.filter((order) => cleanString(order.customer_email).toLowerCase() === email);
    const paidOrders = matchingOrders.filter(paid);
    const role = user?.role || "user";

    if (!paidOrders.length) {
      const projects = await safeFilter(base44.asServiceRole.entities.ClientProject, { client_email: email }, "-created_date", 5);
      const directProject = projects.find((project) => cleanString(project.client_email).toLowerCase() === email);
      if (directProject) {
        await logPortalLogin(base44, { user, email, linkStatus: "direct_project_link", project: directProject, requestId });
        return secureJson({ success: true, request_id: requestId, project: summarizeProject(directProject), order: null, subscription: null, link_status: "direct_project_link", empty_state: false, is_admin_preview: false, user_role: role, portal_truth_label: "Project-only portal context. Billing/order proof is not linked yet.", data_coverage: coverage({ requestId, email, orders: matchingOrders, projects, linkStatus: "direct_project_link", warnings: ["No paid order is linked to this portal context."] }) });
      }
      await logPortalLogin(base44, { user, email, linkStatus: "no_paid_order", requestId });
      return secureJson({ success: true, request_id: requestId, project: null, order: null, subscription: null, link_status: "no_paid_order", empty_state: true, is_admin_preview: isAdminRole(user), user_role: role, portal_truth_label: "No paid order or client project is linked to this login.", message: isAdminRole(user) ? "Admin Preview Mode — no client selected." : "No paid order is linked to this login yet. Complete checkout or contact support.", data_coverage: coverage({ requestId, email, orders: matchingOrders, projects: [], linkStatus: "no_paid_order", warnings: ["No paid order found for authenticated email."] }) });
    }

    const businessNames = [...new Set(paidOrders.map((order) => cleanString(order.business_name)).filter(Boolean))];
    if (businessNames.length > 1) {
      await logPortalLogin(base44, { user, email, linkStatus: "ambiguous_paid_orders", requestId });
      return secureJson({ success: true, request_id: requestId, project: null, order: null, subscription: null, link_status: "ambiguous_paid_orders", empty_state: false, is_admin_preview: false, user_role: role, portal_truth_label: "Multiple paid businesses are linked. Portal routing must be resolved manually.", message: "Multiple paid businesses are linked to this email. Support needs to finish portal routing before access can be shown safely.", data_coverage: coverage({ requestId, email, orders: paidOrders, projects: [], linkStatus: "ambiguous_paid_orders", warnings: ["Multiple paid business names found for the same login."] }) });
    }

    const order = paidOrders[0];
    const orderSummary = summarizeOrder(order);
    if (!order.client_project_id || !order.client_id) {
      const warnings = ["Paid order exists, but client_id or client_project_id is missing."];
      await logPortalLogin(base44, { user, email, linkStatus: "missing_canonical_links", order, requestId });
      return secureJson({ success: true, request_id: requestId, project: null, order: orderSummary, subscription: null, link_status: "missing_canonical_links", empty_state: false, is_admin_preview: false, user_role: role, portal_truth_label: "Payment confirmed, but canonical client/project linkage is incomplete.", message: "Your payment is confirmed, but your client/project linkage is not complete yet. Our team needs to finish linking your portal records.", data_coverage: coverage({ requestId, email, orders: paidOrders, projects: [], linkStatus: "missing_canonical_links", warnings }) });
    }

    const [project, client] = await Promise.all([base44.asServiceRole.entities.ClientProject.get(order.client_project_id).catch(() => null), base44.asServiceRole.entities.Client.get(order.client_id).catch(() => null)]);
    if (!project || !client) {
      const warnings = ["Paid order points to missing Client or ClientProject records."];
      await logPortalLogin(base44, { user, email, linkStatus: "linked_records_missing", order, requestId });
      return secureJson({ success: true, request_id: requestId, project: null, order: orderSummary, subscription: null, link_status: "linked_records_missing", empty_state: false, is_admin_preview: false, user_role: role, portal_truth_label: "Payment confirmed, but linked client records are missing.", message: "Your order is paid, but the linked client records are incomplete. Support needs to repair the portal linkage.", data_coverage: coverage({ requestId, email, orders: paidOrders, projects: [], linkStatus: "linked_records_missing", warnings }) });
    }

    const projectSummary = summarizeProject(project);
    const subscription = summarizeSubscription(order, projectSummary);
    const events = await recentEvents(base44, order, projectSummary, 100);
    const failed = events.filter((event) => event.status === "failed");
    const proof = events.filter((event) => event.status !== "failed" && event.direction !== "inbound" && !(event.event_type || "").includes("portal_login"));
    const hasCriticalFailure = failed.some((event) => event.event_type && !/simulation|test|proof/i.test(event.event_type));
    const allLive = orderSummary.services.length > 0 && orderSummary.services.every((service) => service.install_status === "Live");
    const readiness = allLive && !hasCriticalFailure ? "Live" : orderSummary.pipeline_status;

    await logPortalLogin(base44, { user, email, linkStatus: "linked", order, client, project: projectSummary, requestId });
    return secureJson({ success: true, request_id: requestId, project: projectSummary, client, order: orderSummary, subscription, link_status: "linked", empty_state: false, is_admin_preview: false, user_role: role, portal_truth_label: "Portal status is based on Base44 order, project, client, and communication records.", data_coverage: coverage({ requestId, email, orders: paidOrders, projects: [projectSummary], events, clientFound: true, linkStatus: "linked" }), health: { readiness_status: readiness, recent_failed_events_count: failed.length, recent_proof_events_count: proof.length, recent_events: events.slice(0, 50), proof_label: "Recent activity is sampled CommunicationEvent data, not direct provider proof." } });
  } catch (error) {
    console.error("[getClientPortalContext] Error:", error.message);
    return secureJson({ error: error.message || "Failed to resolve client portal context", request_id: requestId }, { status: 500 });
  }
});
