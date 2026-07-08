import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * saveClientCredentials — #408 #408a #408b #408c #408d #410 #410a #410b #410c
 * FIX: Removed broken _shared/response.ts and _shared/appUrl.js imports.
 * FIX: Upgraded SDK to 0.8.31.
 * FIX: Added admin_bypass flag (#410c).
 * FIX: After submission, now redirects path progresses to setup/status via workflow_stage.
 * FIX: Aligns required validation with the public credentials wizard payload.
 */

// Hidden tier-only requirements caused valid wizard submissions to fail because the UI
// never collected the old canonical keys. Keep submission requirements limited to fields
// the wizard actually marks as required; downstream readiness checks can surface optional
// blockers without rejecting the save.
const REQUIRED_FIELDS_BY_TIER = {
  starter_system: ["business_name", "business_phone", "booking_link", "lead_notification_email"],
  growth_system: ["business_name", "business_phone", "booking_link", "lead_notification_email"],
  pro_system: ["business_name", "business_phone", "booking_link", "lead_notification_email"],
  elite_system: ["business_name", "business_phone", "booking_link", "lead_notification_email"],
};

// #410b: Field-level error messages
const FIELD_MESSAGES = {
  business_name: "Business name is required for SMS personalization",
  business_phone: "Business phone is required for Twilio SMS setup",
  booking_link: "Booking link is required for the AI Booking Agent",
  lead_notification_email: "Lead notification email is required for notifications",
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

function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (value !== undefined && value !== null && typeof value !== "string") return value;
  }
  return "";
}

function getRequiredFieldValue(field, config = {}) {
  const brand = config.brand || {};
  const shared = config.shared || {};
  const messaging = config.messaging || {};
  const integrations = config.integrations || {};
  const services = config.services || {};

  const aliases = {
    business_name: [brand.business_name, config.business_name],
    business_phone: [brand.business_phone, shared.business_phone, shared.twilio_business_phone, config.business_phone],
    booking_link: [messaging.booking_link, services.ai_booking_agent?.booking_link, config.booking_link],
    lead_notification_email: [messaging.lead_notification_email, config.lead_notification_email],
    website_url: [brand.website_url, brand.website, config.website_url, config.website],
    google_business_url: [integrations.google_business_url, integrations.google_review_link, services.review_request?.review_link, config.google_business_url],
    industry: [brand.industry, config.industry],
    tone_of_voice: [brand.tone_of_voice, brand.brand_voice, config.tone_of_voice, config.brand_voice],
  };

  return firstNonEmpty(...(aliases[field] || [config[field]]));
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
      const validationErrors = [];

      for (const field of requiredFields) {
        const value = getRequiredFieldValue(field, install_configuration);
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
    const shared = install_configuration.shared || {};
    const messaging = install_configuration.messaging || {};
    const integrations = install_configuration.integrations || {};
    const services = install_configuration.services || {};

    const businessPhone = firstNonEmpty(brand.business_phone, shared.business_phone, shared.twilio_business_phone);
    const twilioBusinessPhone = firstNonEmpty(shared.twilio_business_phone, businessPhone);
    const bookingLink = firstNonEmpty(messaging.booking_link, services.ai_booking_agent?.booking_link);
    const reviewLink = firstNonEmpty(integrations.google_business_url, integrations.google_review_link, services.review_request?.review_link);
    const toneOfVoice = firstNonEmpty(brand.tone_of_voice, brand.brand_voice);
    const websiteUrl = firstNonEmpty(brand.website_url, brand.website);

    const normalizedConfig = {
      ...install_configuration,
      shared: {
        ...shared,
        business_phone: businessPhone,
        twilio_business_phone: twilioBusinessPhone,
        business_hours: shared.business_hours || brand.business_hours || "",
      },
      services: {
        ...services,
        // #408b: booking_link → ai_booking_agent.booking_link
        ai_booking_agent: {
          ...(services.ai_booking_agent || {}),
          booking_link: bookingLink,
          booking_mode: services.ai_booking_agent?.booking_mode || "external_link",
        },
        review_request: {
          ...(services.review_request || {}),
          review_link: reviewLink,
        },
      },
      brand: {
        ...brand,
        business_phone: businessPhone,
        website_url: websiteUrl,
        website: brand.website || websiteUrl,
        tone_of_voice: toneOfVoice,
        brand_voice: brand.brand_voice || toneOfVoice,
        logo_url: brand.logo_url || "",
        primary_color: brand.primary_color || "#00AEEF",
        secondary_color: brand.secondary_color || "#003B8F",
      },
      messaging: {
        ...messaging,
        booking_link: bookingLink,
      },
      integrations: {
        ...integrations,
        google_business_url: reviewLink,
        google_review_link: integrations.google_review_link || reviewLink,
      },
    };

    await base44.asServiceRole.entities.Order.update(order_id, {
      install_configuration: normalizedConfig,
      install_configuration_updated_at: new Date().toISOString(),
    });
    console.log(`[saveClientCredentials] Saved install_configuration for order ${order_id}`);

    // #408d: Advance workflow_stage to a valid ClientInstallationOS enum value.
    const existing = await base44.asServiceRole.entities.ClientInstallationOS.filter(
      { order_id },
      "-created_date",
      1
    ).catch(() => []);

    if (existing?.length > 0) {
      await base44.asServiceRole.entities.ClientInstallationOS.update(existing[0].id, {
        workflow_stage: "website_building",
      }).catch(e => console.warn("[saveClientCredentials] workflow_stage update failed:", e.message));
      console.log("[saveClientCredentials] workflow_stage → website_building");
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
