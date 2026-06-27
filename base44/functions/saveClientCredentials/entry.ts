import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * saveClientCredentials — #408 #408a #408b #408c #408d #410 #410a #410b #410c
 * FIX: Removed broken _shared/response.ts and _shared/appUrl.js imports.
 * FIX: Upgraded SDK to 0.8.31.
 * FIX: Added admin_bypass flag (#410c).
 * FIX: After submission, now redirects path progresses to setup/status via workflow_stage.
 */

// #410a: Required fields per tier
const REQUIRED_FIELDS_BY_TIER = {
  starter_system: ["business_name", "business_phone", "booking_link"],
  growth_system: ["business_name", "business_phone", "booking_link", "website_url", "google_business_url"],
  pro_system: ["business_name", "business_phone", "booking_link", "website_url", "google_business_url", "industry", "tone_of_voice"],
  elite_system: ["business_name", "business_phone", "booking_link", "website_url", "google_business_url", "industry", "tone_of_voice"],
};

// #410b: Field-level error messages
const FIELD_MESSAGES = {
  business_name: "Business name is required for SMS personalization",
  business_phone: "Business phone is required for Twilio SMS setup",
  booking_link: "Booking link is required for the AI Booking Agent",
  website_url: "Website URL is required for Growth setup",
  google_business_url: "Google Business Profile URL is required for review request setup",
  industry: "Industry selection is required for AI template generation",
  tone_of_voice: "Brand voice is required for AI-personalized messaging",
};

function getAppUrl() {
  return Deno.env.get("APP_URL") || Deno.env.get("VITE_BASE44_APP_BASE_URL") || "https://clientsurgesystems.com";
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Frame-Options": "DENY" },
  });
}

function resolvePackageKey(raw) {
  if (!raw) return null;
  const k = String(raw).toLowerCase().trim();
  if (k.includes("pro") || k.includes("elite")) return "pro_system";
  if (k.includes("growth")) return "growth_system";
  return "starter_system";
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { order_id, install_configuration, admin_bypass } = body;

    if (!order_id) return json({ error: "order_id required" }, 400);
    if (!install_configuration) return json({ error: "install_configuration required" }, 400);

    // #410c: Admin bypass — skip field validation
    let isAdminBypass = false;
    if (admin_bypass === true) {
      const user = await base44.auth.me().catch(() => null);
      if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
        return json({ error: "admin_bypass requires admin role" }, 403);
      }
      isAdminBypass = true;
      console.log(`[saveClientCredentials] Admin bypass by ${user.email} for order ${order_id}`);
    }

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return json({ error: "Order not found" }, 404);

    // FIX 1A.4-4: Server-side authorization gate — blocks sensitive setup data until SetupAuthorization accepted
    if (!isAdminBypass) {
      const authCheck = await base44.asServiceRole.entities.SetupAuthorization.filter(
        { order_id, authorization_status: "accepted" }, "-created_date", 1
      ).catch(() => []);
      if (!authCheck || authCheck.length === 0) {
        return json({ error: "Setup Authorization Agreement must be accepted before submitting setup data.", code: "authorization_required" }, 403);
      }
    }

    // Determine tier for field validation
    const pkgKey = resolvePackageKey(order.package_key || order.package_type || order.selected_package_type);
    const requiredFields = REQUIRED_FIELDS_BY_TIER[pkgKey] || REQUIRED_FIELDS_BY_TIER.starter_system;

    // #410b: Field-level validation errors (skip if admin bypass)
    if (!isAdminBypass) {
      const brand = install_configuration.brand || {};
      const messaging = install_configuration.messaging || {};
      const validationErrors = [];

      for (const field of requiredFields) {
        const value = brand[field] || messaging[field] || install_configuration[field];
        if (!value || (typeof value === "string" && !value.trim())) {
          validationErrors.push({
            field,
            message: FIELD_MESSAGES[field] || `${field} is required`,
          });
        }
      }

      if (validationErrors.length > 0) {
        return json({
          error: `Missing required fields: ${validationErrors.map(e => e.field).join(", ")}`,
          validation_errors: validationErrors,
        }, 400);
      }
    }

    // #408a #408b #408c: Map fields into install_configuration structure
    const brand = install_configuration.brand || {};
    const normalizedConfig = {
      ...install_configuration,
      shared: {
        ...(install_configuration.shared || {}),
        // #408a: business_phone → twilio_business_phone
        twilio_business_phone: install_configuration.shared?.twilio_business_phone || brand.business_phone || "",
      },
      services: {
        ...(install_configuration.services || {}),
        // #408b: booking_link → ai_booking_agent.booking_link
        ai_booking_agent: {
          ...(install_configuration.services?.ai_booking_agent || {}),
          booking_link: install_configuration.services?.ai_booking_agent?.booking_link || brand.booking_link || "",
        },
        // #408c: logo_url, primary_color → brand
      },
      brand: {
        ...brand,
        // Ensure logo_url and colors are at the canonical path
        logo_url: brand.logo_url || "",
        primary_color: brand.primary_color || "#00AEEF",
        secondary_color: brand.secondary_color || "#003B8F",
      },
    };

    await base44.asServiceRole.entities.Order.update(order_id, {
      install_configuration: normalizedConfig,
      install_configuration_updated_at: new Date().toISOString(),
    });
    console.log(`[saveClientCredentials] Saved install_configuration for order ${order_id}`);

    // #408d: Advance workflow_stage to "credentials_complete"
    const existing = await base44.asServiceRole.entities.ClientInstallationOS.filter(
      { order_id },
      "-created_date",
      1
    ).catch(() => []);

    if (existing?.length > 0) {
      await base44.asServiceRole.entities.ClientInstallationOS.update(existing[0].id, {
        workflow_stage: "credentials_complete",
      }).catch(e => console.warn("[saveClientCredentials] workflow_stage update failed:", e.message));
      console.log("[saveClientCredentials] workflow_stage → credentials_complete");
    }

    // Run aiOnboardingIntelligence pre-flight check
    let intelligenceResult = null;
    try {
      intelligenceResult = await base44.asServiceRole.functions.invoke("aiOnboardingIntelligence", { order_id });
      console.log(`[saveClientCredentials] pre-flight: ready=${intelligenceResult?.ready_to_activate}, blockers=${intelligenceResult?.blockers?.length || 0}`);
    } catch (e) {
      console.warn(`[saveClientCredentials] aiOnboardingIntelligence warning: ${e.message}`);
    }

    // Send admin notification
    try {
      const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || "nolan@clientsurgesystems.com";
      const appUrl = getAppUrl();
      const blockers = intelligenceResult?.blockers || [];
      const isReady = intelligenceResult?.ready_to_activate;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: adminEmail,
        from_name: "ClientSurge Systems",
        subject: `✅ Credentials Submitted — ${order.business_name || order.customer_email}`,
        body: `<div style="font-family:sans-serif;max-width:600px;padding:32px 20px;">
          <h2 style="color:#0A1628;">Credentials Submitted</h2>
          <p><strong>${order.business_name}</strong> (${order.customer_email}) completed the setup intake.</p>
          <p style="color:${isReady ? "#16a34a" : "#92400e"};font-weight:bold;">
            ${isReady ? "✅ Ready for install review" : "⚠️ Blockers found — review required"}
          </p>
          ${blockers.length > 0 ? `<ul>${blockers.map(b => `<li>${b}</li>`).join("")}</ul>` : ""}
          <a href="${appUrl}/admin/onboarding" style="display:inline-block;background:#0A1628;color:#fff;padding:12px 28px;border-radius:9999px;text-decoration:none;font-weight:600;font-size:14px;">View in Admin →</a>
        </div>`,
      });
    } catch (e) {
      console.warn(`[saveClientCredentials] Admin notification failed: ${e.message}`);
    }

    return json({
      success: true,
      ready_to_activate: intelligenceResult?.ready_to_activate || false,
      blockers: intelligenceResult?.blockers || [],
      auto_filled: intelligenceResult?.auto_filled || [],
      redirect_to: `/setup/status/${order_id}`,
    });
  } catch (err) {
    console.error("[saveClientCredentials] Error:", err.message);
    return json({ error: err.message }, 500);
  }
});