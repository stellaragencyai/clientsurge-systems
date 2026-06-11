import {
  buildPricingSummaryForProducts,
  buildStoredPricingSummary,
  getPackageOffer,
  normalizePackageKey,
} from "../../../src/lib/salesCatalog.js";
import { normalizeInstallConfiguration } from "../createCheckoutSession/installPipeline.shared.js";
import { initializePaidOrderInstallPipeline } from "./installPipeline.js";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value) {
  return cleanString(value).toLowerCase();
}

function normalizeBusinessName(value) {
  return cleanString(value).toLowerCase();
}

function isPaidOrder(order) {
  return order?.payment_status === "paid" && order?.payment_source !== "invoice_pending";
}

function orderMatchesLead(order, lead) {
  if (!order || !lead) {
    return false;
  }

  const leadEmail = normalizeEmail(lead.email);
  const orderEmail = normalizeEmail(order.customer_email || order.client_email);
  if (leadEmail && orderEmail && leadEmail !== orderEmail) {
    return false;
  }

  const leadBusiness = normalizeBusinessName(lead.business_name);
  const orderBusiness = normalizeBusinessName(order.business_name);
  if (leadBusiness && orderBusiness && leadBusiness !== orderBusiness) {
    return false;
  }

  return true;
}

async function findOrders(base44, query, limit = 20) {
  return base44.asServiceRole.entities.Order.filter(query, "-created_date", limit).catch(() => []);
}

export async function resolvePaidOrderForLead(base44, lead) {
  if (!lead) {
    return null;
  }

  const directOrderId = cleanString(lead.order_id);
  if (directOrderId) {
    const order = await base44.asServiceRole.entities.Order.get(directOrderId).catch(() => null);
    if (isPaidOrder(order) && orderMatchesLead(order, lead)) {
      return order;
    }
  }

  const leadIds = [lead.id, lead.crm_lead_id, lead.lead_id].map(cleanString).filter(Boolean);
  for (const leadId of [...new Set(leadIds)]) {
    const byCrmLead = await findOrders(base44, { crm_lead_id: leadId });
    const byLead = await findOrders(base44, { lead_id: leadId });
    const match = [...byCrmLead, ...byLead].find((order) => isPaidOrder(order) && orderMatchesLead(order, lead));
    if (match) {
      return match;
    }
  }

  const email = normalizeEmail(lead.email);
  if (email) {
    const byEmail = await findOrders(base44, { customer_email: email });
    const match = byEmail.find((order) => isPaidOrder(order) && orderMatchesLead(order, lead));
    if (match) {
      return match;
    }
  }

  return null;
}

export async function buildWonPendingPaymentPatch({ base44, lead, note = "", now = new Date().toISOString() }) {
  const paidOrder = await resolvePaidOrderForLead(base44, lead);
  if (paidOrder) {
    return {
      blocked: false,
      paidOrder,
      patch: {
        order_id: paidOrder.id,
        payment_source: paidOrder.payment_source || "stripe",
        onboarding_blocked_reason: "",
      },
    };
  }

  return {
    blocked: true,
    paidOrder: null,
    patch: {
      status: "Qualified",
      crm_stage: "Won Pending Payment",
      payment_source: "order_required",
      onboarding_blocked_reason: "won_pending_payment_order_required",
      last_activity_at: now,
      notes: [lead?.notes, note, "Won pending payment: package and payment source are required before onboarding starts."]
        .filter(Boolean)
        .join("\n"),
    },
  };
}

function buildOrderItemsForPackage(packageOffer) {
  return (packageOffer?.included_services || []).map((item) => ({
    product_id: item.product_id,
    product_name: item.name,
    setup_price_id: item.setup_price_id,
    monthly_price_id: item.monthly_price_id,
    setup_fee: item.setup_fee,
    monthly_fee: item.monthly_fee,
    compare_at_setup_fee: item.compare_at_setup_fee,
    compare_at_monthly_fee: item.compare_at_monthly_fee,
    setup_discount_fee: item.setup_discount_fee,
    monthly_discount_fee: item.monthly_discount_fee,
    source_package_key: packageOffer.package_key,
    source_package_name: packageOffer.name,
    status: "pending",
    service_key: item.service_key,
    tracking_enabled: Boolean(item.service_key),
    service_access_status: "active",
  }));
}

async function createManualPaidOrder({ base44, lead, packageKey, adminEmail, now }) {
  const packageOffer = getPackageOffer(packageKey);
  if (!packageOffer) {
    throw Object.assign(new Error("A valid package_key is required for manual paid bridge."), {
      status: 400,
      code: "manual_paid_package_required",
    });
  }

  const orderItems = buildOrderItemsForPackage(packageOffer);
  const pricingSummary = buildPricingSummaryForProducts(orderItems.map((item) => item.product_id));
  const storedPricingSummary = buildStoredPricingSummary(pricingSummary.priced_items);

  return base44.asServiceRole.entities.Order.create({
    customer_email: lead.email,
    customer_name: lead.full_name || lead.owner_contact_name || lead.business_name,
    customer_phone: lead.phone || "",
    lead_id: lead.id,
    crm_lead_id: lead.id,
    website_lead_id: lead.website_lead_id || "",
    business_name: lead.business_name,
    items: orderItems,
    total_setup: packageOffer.setup_total,
    total_monthly: packageOffer.monthly_total,
    pricing_summary: storedPricingSummary,
    install_configuration: normalizeInstallConfiguration({}, orderItems),
    payment_status: "paid",
    payment_source: "manual_payment",
    manual_payment_recorded_at: now,
    manual_payment_recorded_by: adminEmail || "admin",
    order_status: "paid_setup_in_progress",
    selected_package_type: packageOffer.package_key,
    package_type: packageOffer.package_key,
    plan_type: packageOffer.name,
  });
}

async function createBridgeEvent({ base44, lead, order, status, subject, message, metadata = {} }) {
  return base44.asServiceRole.entities.CommunicationEvent.create({
    lead_id: lead?.id,
    order_id: order?.id,
    channel: "internal",
    direction: "system",
    event_type: "workflow_triggered",
    provider: "internal",
    status,
    subject,
    message_body: message,
    context_type: "crm_won_bridge",
    context_id: lead?.id || order?.id,
    metadata_json: JSON.stringify({
      lead_id: lead?.id || null,
      order_id: order?.id || null,
      ...metadata,
    }),
  });
}

export async function bridgeCrmWonToPayment({
  base44,
  lead,
  package_key,
  payment_source,
  follow_up_date = "",
  note = "",
  adminEmail = "",
  now = new Date().toISOString(),
}) {
  const paymentSource = cleanString(payment_source);
  const packageKey = normalizePackageKey(package_key || lead?.package_interest);

  if (!lead?.id) {
    throw Object.assign(new Error("Lead not found"), { status: 404, code: "lead_not_found" });
  }

  if (paymentSource === "manual_payment") {
    const existingPaidOrder = await resolvePaidOrderForLead(base44, lead);
    const paidOrder = existingPaidOrder || await createManualPaidOrder({
      base44,
      lead,
      packageKey,
      adminEmail,
      now,
    });
    const initialized = await initializePaidOrderInstallPipeline({
      base44,
      order: paidOrder,
      eventSource: "crm_won_bridge:manual_payment",
      now,
    });

    const updatedLead = await base44.asServiceRole.entities.Leads.update(lead.id, {
      status: "Closed",
      crm_stage: "Won",
      order_id: initialized.order.id,
      package_interest: initialized.order.pricing_summary?.package_name || initialized.order.plan_type,
      payment_source: "manual_payment",
      manual_payment_recorded_at: now,
      manual_payment_recorded_by: adminEmail || "admin",
      onboarding_blocked_reason: "",
      last_activity_at: now,
      notes: [lead.notes, note].filter(Boolean).join("\n"),
    });

    await createBridgeEvent({
      base44,
      lead: updatedLead,
      order: initialized.order,
      status: "processed",
      subject: "CRM Won manual paid bridge completed",
      message: `Lead ${lead.id} was marked Won from a manual paid order ${initialized.order.id}.`,
      metadata: { payment_source: "manual_payment" },
    });

    return {
      success: true,
      status: "won_manual_paid",
      lead: updatedLead,
      order: initialized.order,
    };
  }

  const paidOrder = await resolvePaidOrderForLead(base44, lead);
  if (paidOrder) {
    const updatedLead = await base44.asServiceRole.entities.Leads.update(lead.id, {
      status: "Closed",
      crm_stage: "Won",
      order_id: paidOrder.id,
      package_interest: paidOrder.pricing_summary?.package_name || paidOrder.plan_type || lead.package_interest,
      payment_source: paidOrder.payment_source || "stripe",
      onboarding_blocked_reason: "",
      last_activity_at: now,
      notes: [lead.notes, note].filter(Boolean).join("\n"),
    });

    await createBridgeEvent({
      base44,
      lead: updatedLead,
      order: paidOrder,
      status: "processed",
      subject: "CRM Won linked to paid order",
      message: `Lead ${lead.id} was marked Won from existing paid order ${paidOrder.id}.`,
      metadata: { payment_source: paidOrder.payment_source || "stripe" },
    });

    return {
      success: true,
      status: "won_existing_paid_order",
      lead: updatedLead,
      order: paidOrder,
    };
  }

  const blockedPatch = {
    status: "Qualified",
    crm_stage: "Won Pending Payment",
    package_interest: getPackageOffer(packageKey)?.name || lead.package_interest || packageKey || "",
    payment_source: paymentSource === "invoice_pending" ? "invoice_pending" : "order_required",
    onboarding_blocked_reason: "won_pending_payment_order_required",
    follow_up_date: follow_up_date || lead.follow_up_date || undefined,
    next_follow_up_at: follow_up_date || lead.next_follow_up_at || undefined,
    last_activity_at: now,
    notes: [lead.notes, note, "Won pending payment: no paid/manual order was available, so onboarding was blocked."]
      .filter(Boolean)
      .join("\n"),
  };
  const updatedLead = await base44.asServiceRole.entities.Leads.update(lead.id, blockedPatch);

  await createBridgeEvent({
    base44,
    lead: updatedLead,
    order: null,
    status: "processed",
    subject: "CRM Won blocked pending payment",
    message: `Lead ${lead.id} moved to Won Pending Payment. Onboarding was not started.`,
    metadata: {
      payment_source: blockedPatch.payment_source,
      package_key: packageKey || null,
    },
  });

  return {
    success: true,
    status: "won_pending_payment",
    onboarding_blocked: true,
    code: "won_pending_payment_order_required",
    lead: updatedLead,
  };
}
