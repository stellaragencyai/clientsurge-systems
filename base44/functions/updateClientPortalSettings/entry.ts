import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resolveClientPortalAccess } from "../_shared/portalOwnership.js";

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const settings = payload?.settings || {};

    const fullName = cleanString(settings.full_name);
    const email = cleanString(settings.email).toLowerCase();
    const businessName = cleanString(settings.business_name);
    const phoneNumber = cleanString(settings.phone_number);

    if (!fullName) {
      return Response.json({ error: "Full name is required" }, { status: 400 });
    }

    if (!email || !isValidEmail(email)) {
      return Response.json({ error: "A valid email address is required" }, { status: 400 });
    }

    if (!businessName) {
      return Response.json({ error: "Business name is required" }, { status: 400 });
    }

    const resolution = await resolveClientPortalAccess({
      base44,
      userEmail: user.email,
    });

    if (resolution.status !== "resolved" || !resolution.project) {
      return Response.json(
        { error: "No portal project is linked to this account yet." },
        { status: 404 }
      );
    }

    if (email !== user.email.toLowerCase()) {
      const emailResolution = await resolveClientPortalAccess({
        base44,
        userEmail: email,
      });

      if (
        (emailResolution.status === "resolved" && emailResolution.project?.id !== resolution.project.id) ||
        emailResolution.status === "ambiguous"
      ) {
        return Response.json(
          { error: "That email address is already linked to another portal account." },
          { status: 409 }
        );
      }
    }

    const notificationPreferences = {
      email_notifications: settings.email_notifications !== false,
      sms_notifications: Boolean(settings.sms_notifications),
      phone_number: phoneNumber,
      notify_on_new_lead: settings.notify_on_new_lead !== false,
      notify_on_reply: settings.notify_on_reply !== false,
      notify_on_booking: settings.notify_on_booking !== false,
      notification_frequency:
        settings.notification_frequency === "daily" || settings.notification_frequency === "weekly"
          ? settings.notification_frequency
          : "immediate",
      updated_at: new Date().toISOString(),
    };

    const updatedUser = await base44.auth.updateMe({
      full_name: fullName,
      email,
      phone: phoneNumber,
      notification_preferences: notificationPreferences,
    });

    const projectPatch = {
      client_name: fullName,
      client_email: email,
      business_name: businessName,
    };

    const updates: Promise<unknown>[] = [
      base44.asServiceRole.entities.ClientProject.update(resolution.project.id, projectPatch),
    ];

    if (resolution.client?.id) {
      updates.push(
        base44.asServiceRole.entities.Client.update(resolution.client.id, {
          full_name: fullName,
          business_name: businessName,
          email,
          phone: phoneNumber,
        })
      );
    }

    if (resolution.order?.id) {
      updates.push(
        base44.asServiceRole.entities.Order.update(resolution.order.id, {
          customer_name: fullName,
          customer_email: email,
          customer_phone: phoneNumber,
          business_name: businessName,
        })
      );
    }

    await Promise.all(updates);

    const refreshedResolution = await resolveClientPortalAccess({
      base44,
      userEmail: email,
    });

    return Response.json({
      success: true,
      user: updatedUser,
      project:
        refreshedResolution.status === "resolved" && refreshedResolution.project
          ? refreshedResolution.project
          : resolution.project,
      notification_preferences: notificationPreferences,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update portal settings";
    return Response.json({ error: message }, { status: 500 });
  }
});
