/**
 * getClientAnalytics - real entity-backed client/admin analytics.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { buildClientAnalytics } from "../_shared/clientAnalytics.js";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value) {
  return cleanString(value).toLowerCase();
}

function clampPeriodDays(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 30;
  return Math.min(Math.max(Math.round(parsed), 1), 365);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

async function safeFilter(collection, query, sort = "-created_date", limit = 500) {
  try {
    return await collection.filter(query, sort, limit);
  } catch {
    return [];
  }
}

async function safeList(collection, sort = "-created_date", limit = 500) {
  try {
    return await collection.list(sort, limit);
  } catch {
    return [];
  }
}

async function resolveScopedOrders({ base44, user, orderId }) {
  const isAdmin = user?.role === "admin";
  if (orderId) {
    const orders = await safeFilter(base44.asServiceRole.entities.Order, { id: orderId }, "-created_date", 1);
    const order = orders[0] || null;
    if (!order) return [];
    if (!isAdmin && normalizeEmail(order.customer_email) !== normalizeEmail(user.email)) {
      const error = new Error("Forbidden");
      error.status = 403;
      throw error;
    }
    return [order];
  }

  if (isAdmin) {
    return safeFilter(base44.asServiceRole.entities.Order, { payment_status: "paid" }, "-created_date", 500);
  }

  return safeFilter(
    base44.asServiceRole.entities.Order,
    { customer_email: normalizeEmail(user.email) },
    "-created_date",
    100
  );
}

async function getScopedLeads(base44, customerEmails) {
  const leadGroups = await Promise.all(
    customerEmails.map((email) =>
      safeFilter(base44.asServiceRole.entities.Leads, { created_by: email }, "-created_date", 500)
    )
  );
  return leadGroups.flat();
}

async function getScopedEvents(base44, { orderIds, projectIds }) {
  const eventGroups = await Promise.all([
    ...orderIds.map((id) =>
      safeFilter(base44.asServiceRole.entities.CommunicationEvent, { order_id: id }, "-created_date", 500)
    ),
    ...projectIds.map((id) =>
      safeFilter(
        base44.asServiceRole.entities.CommunicationEvent,
        { client_project_id: id },
        "-created_date",
        500
      )
    ),
  ]);

  const seen = new Set();
  return eventGroups.flat().filter((event) => {
    const key = event.id || `${event.created_date}:${event.event_type}:${event.context_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const { order_id: orderId, period_days: rawPeriodDays = 30 } = await req.json().catch(() => ({}));
    const periodDays = clampPeriodDays(rawPeriodDays);
    const orders = await resolveScopedOrders({ base44, user, orderId });
    const paidOrders = orders.filter((order) => order.payment_status === "paid");
    const customerEmails = unique(paidOrders.map((order) => normalizeEmail(order.customer_email)));
    const orderIds = unique(paidOrders.map((order) => order.id));
    const projectIds = unique(paidOrders.map((order) => order.client_project_id));
    const isAdmin = user.role === "admin";

    const [leads, events] = await Promise.all([
      isAdmin ? safeList(base44.asServiceRole.entities.Leads, "-created_date", 500) : getScopedLeads(base44, customerEmails),
      getScopedEvents(base44, { orderIds, projectIds }),
    ]);

    return Response.json(
      buildClientAnalytics({
        orders: paidOrders,
        leads,
        events,
        periodDays,
      })
    );
  } catch (err) {
    const status = Number.isInteger(err?.status) ? err.status : 500;
    return Response.json({ error: err.message || "Failed to load analytics" }, { status });
  }
});
