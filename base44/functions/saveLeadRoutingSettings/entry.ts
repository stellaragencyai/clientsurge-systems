import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";

const ALLOWED_CATEGORIES = new Set(["High-Value", "Standard"]);

function normalizePhone(value) {
  if (!value) return "";
  return String(value).trim();
}

function validatePhone(phone) {
  if (!phone) return null;
  return /^\+\d{10,15}$/.test(phone)
    ? null
    : "Phone must include a country code and contain 10 to 15 digits, for example +16025550100.";
}

function validateCategories(categories) {
  if (!Array.isArray(categories)) {
    return "routing_categories must be an array.";
  }

  const invalid = categories.filter((category) => !ALLOWED_CATEGORIES.has(category));
  return invalid.length ? `Unsupported routing categories: ${invalid.join(", ")}` : null;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await requireAdminUser(base44);
    const body = await req.json().catch(() => ({}));

    const userId = body?.user_id ?? null;
    if (!userId) {
      return Response.json({ error: "user_id is required" }, { status: 400 });
    }

    const phone = normalizePhone(body?.phone);
    const routingActive = Boolean(body?.routing_active);
    const maxActiveLeads = Number(body?.max_active_leads);
    const routingCategories = Array.isArray(body?.routing_categories) ? body.routing_categories : [];

    const phoneError = validatePhone(phone);
    if (phoneError) {
      return Response.json({ error: phoneError }, { status: 400 });
    }

    const categoryError = validateCategories(routingCategories);
    if (categoryError) {
      return Response.json({ error: categoryError }, { status: 400 });
    }

    if (!Number.isFinite(maxActiveLeads) || maxActiveLeads < 1 || maxActiveLeads > 200) {
      return Response.json({ error: "max_active_leads must be a number between 1 and 200." }, { status: 400 });
    }

    const existingUser = await base44.asServiceRole.entities.User.get(userId);
    if (!existingUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const updatedUser = await base44.asServiceRole.entities.User.update(userId, {
      phone,
      routing_active: routingActive,
      max_active_leads: maxActiveLeads,
      routing_categories: routingCategories,
    });

    await base44.asServiceRole.entities.CommunicationEvent.create({
      channel: "internal",
      direction: "system",
      event_type: "workflow_triggered",
      provider: "internal",
      status: "processed",
      subject: "Lead routing settings updated",
      message_body: `Lead routing settings updated for ${existingUser.email} by ${user.email}.`,
      context_type: "lead_routing_settings",
      context_id: userId,
      metadata_json: JSON.stringify({
        entry_kind: "lead_routing_settings_update",
        updated_by: user.email,
        routing_active: routingActive,
        max_active_leads: maxActiveLeads,
        routing_categories: routingCategories,
      }),
    });

    return Response.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("saveLeadRoutingSettings error:", error);
    if (error instanceof AuthGuardError) {
      return Response.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return Response.json({ error: error.message || "Failed to save routing settings" }, { status: 500 });
  }
});
