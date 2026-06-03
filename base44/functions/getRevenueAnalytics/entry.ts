/**
 * getRevenueAnalytics — revenue attribution backed by paid Orders + Leads.
 * Fixes the admin revenue attribution dashboard so it no longer depends on a missing function.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { secureJson } from "../_shared/response.ts";

const LEAD_LIMIT = 10000;
const ORDER_LIMIT = 10000;

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizePhone(value: unknown) {
  return typeof value === "string" ? value.replace(/\D/g, "") : "";
}

function normalizeBusiness(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeSource(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().toLowerCase() : "unknown";
}

function roundMoney(value: number) {
  return Math.round((value || 0) * 100) / 100;
}

function getPeriodStart(period: string) {
  const now = new Date();
  const start = new Date(now);

  switch (period) {
    case "today":
      start.setHours(0, 0, 0, 0);
      return start;
    case "this_week": {
      const day = start.getDay();
      const diff = day === 0 ? 6 : day - 1;
      start.setDate(start.getDate() - diff);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case "this_month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      return start;
    default:
      return null;
  }
}

function isOnOrAfter(dateLike: unknown, start: Date | null) {
  if (!start) return true;
  const stamp = new Date(typeof dateLike === "string" ? dateLike : "").getTime();
  return Number.isFinite(stamp) && stamp >= start.getTime();
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    let user = null;
    try {
      user = await base44.auth.me();
    } catch {
      user = null;
    }
    if (!user || user.role !== "admin") {
      return secureJson({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const projectId = body?.project_id || null;
    const period = body?.period || "this_month";
    const periodStart = getPeriodStart(period);

    const [leads, orders] = await Promise.all([
      base44.asServiceRole.entities.Leads.list("-created_date", LEAD_LIMIT),
      base44.asServiceRole.entities.Order.list("-created_date", ORDER_LIMIT),
    ]);

    const allLeads = (leads || []).filter((lead: any) => {
      if (projectId && lead.client_project_id && lead.client_project_id !== projectId) return false;
      return isOnOrAfter(lead.created_date, periodStart);
    });

    const paidOrders = (orders || []).filter((order: any) => {
      if (order.payment_status !== "paid") return false;
      if (projectId && order.client_project_id && order.client_project_id !== projectId) return false;
      return isOnOrAfter(order.created_date, periodStart);
    });

    const leadsByEmail = new Map<string, any>();
    const leadsByPhone = new Map<string, any>();
    const leadsByBusiness = new Map<string, any>();

    for (const lead of allLeads) {
      const email = normalizeEmail(lead.email);
      const phone = normalizePhone(lead.phone);
      const business = normalizeBusiness(lead.business_name);
      if (email && !leadsByEmail.has(email)) leadsByEmail.set(email, lead);
      if (phone && !leadsByPhone.has(phone)) leadsByPhone.set(phone, lead);
      if (business && !leadsByBusiness.has(business)) leadsByBusiness.set(business, lead);
    }

    const bySource: Record<string, any> = {};
    const ensureSource = (source: string) => {
      if (!bySource[source]) {
        bySource[source] = {
          total_leads: 0,
          booked_leads: 0,
          total_revenue: 0,
          average_ltv: 0,
          booking_rate: 0,
        };
      }
      return bySource[source];
    };

    for (const lead of allLeads) {
      const source = normalizeSource(lead.source);
      ensureSource(source).total_leads += 1;
    }

    for (const order of paidOrders) {
      const matchedLead =
        leadsByEmail.get(normalizeEmail(order.customer_email)) ||
        leadsByPhone.get(normalizePhone(order.customer_phone)) ||
        leadsByBusiness.get(normalizeBusiness(order.business_name));

      const source = normalizeSource(matchedLead?.source);
      const bucket = ensureSource(source);
      bucket.booked_leads += 1;
      bucket.total_revenue = roundMoney(
        bucket.total_revenue +
        (Number(order.total_setup) || 0) +
        (Number(order.total_monthly) || 0)
      );
    }

    for (const stats of Object.values(bySource) as any[]) {
      stats.booking_rate = stats.total_leads > 0
        ? Math.round((stats.booked_leads / stats.total_leads) * 100)
        : 0;
      stats.average_ltv = stats.booked_leads > 0
        ? roundMoney(stats.total_revenue / stats.booked_leads)
        : 0;
    }

    const totalRevenue = roundMoney(
      paidOrders.reduce(
        (sum: number, order: any) => sum + (Number(order.total_setup) || 0) + (Number(order.total_monthly) || 0),
        0,
      ),
    );
    const totalLeads = allLeads.length;
    const totalBooked = paidOrders.length;

    return secureJson({
      success: true,
      period,
      summary: {
        total_revenue: totalRevenue,
        total_leads: totalLeads,
        overall_booking_rate: totalLeads > 0 ? Math.round((totalBooked / totalLeads) * 100) : 0,
        average_lead_value: totalLeads > 0 ? roundMoney(totalRevenue / totalLeads) : 0,
      },
      by_source: bySource,
      data_window: {
        leads_limit: LEAD_LIMIT,
        orders_limit: ORDER_LIMIT,
      },
    });
  } catch (error) {
    console.error("getRevenueAnalytics error:", error);
    return secureJson({ error: error instanceof Error ? error.message : "Failed to load revenue analytics" }, { status: 500 });
  }
});
