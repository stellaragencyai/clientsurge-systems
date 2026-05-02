/**
 * manageWebhookRegistration
 * CRUD + secret generation for webhook registrations
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

function generateSecret() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "whsec_";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { action, id, data } = body;

    if (action === "list") {
      const registrations = await base44.asServiceRole.entities.WebhookRegistration.list("-created_date", 50);
      return Response.json({ success: true, registrations });
    }

    if (action === "create") {
      const secret = generateSecret();
      const record = await base44.asServiceRole.entities.WebhookRegistration.create({
        ...data,
        secret_key: secret,
        status: "active",
        failure_count: 0,
        created_at: new Date().toISOString(),
      });
      return Response.json({ success: true, registration: record });
    }

    if (action === "update") {
      const record = await base44.asServiceRole.entities.WebhookRegistration.update(id, data);
      return Response.json({ success: true, registration: record });
    }

    if (action === "delete") {
      await base44.asServiceRole.entities.WebhookRegistration.delete(id);
      return Response.json({ success: true });
    }

    if (action === "regenerate_secret") {
      const secret = generateSecret();
      const record = await base44.asServiceRole.entities.WebhookRegistration.update(id, { secret_key: secret });
      return Response.json({ success: true, registration: record });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("[WebhookRegistration] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});