import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * saveClientCredentials
 * Called when a client submits the /setup/credentials wizard.
 *
 * This function intentionally accepts the wizard's public payload shape and
 * normalizes it into the canonical install_configuration structure. Do not add
 * hidden required fields here unless the wizard visibly collects them.
 */

const REQUIRED_FIELDS_BY_TIER = {
  starter_system: ["business_name", "business_phone", "booking_link", "lead_notification_email"],
  growth_system: ["business_name", "business_phone", "booking_link", "lead_notification_email"],
  pro_system: ["business_name", "business_phone", "booking_link", "lead_notification_email"],
  elite_system: ["business_name", "business_phone", "booking_link", "lead_notification_email"],
};

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

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Frame-Options": "DENY",
    },
  });
}

function getAppUrl() {
  return Deno.env.get("APP_URL") || Deno.env.get("VITE_BASE44_APP_BASE_URL") || "https://clientsurgesystems.com";
}

function resolvePackageKey(raw: unknown) {
  if (!raw) return null;
  const k = String(raw).toLowerCase().trim();
  if (k.includes("pro") || k.includes("elite")) return "pro_system";
  if (k.includes("growth")) return "growth_system";
  return "starter_system";
}

function firstNonEmpty(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (value !== undefined && value !== null && typeof value !== "string") return value;
  }
  return "";
}

function getRequiredFieldValue(field: string, config: any = {}) {
  const brand = config.brand || {};
  const shared = config.shared || {};
  const messaging = config.messaging || {};
  const integrations = config.integrations || {};
  const services = config.services || {};

  const aliases: Record<string, unknown[]> = {
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

    if (!isAdminBypass) {
      const authCheck = await base44.asServiceRole.entities.SetupAuthorization.filter(
        { order_id, authorization_status: "accepted" },
        "-created_date",
        1
      ).catch(() => []);
      if (!authCheck || authCheck.length === 0) {
        return json({ error: "Setup Authorization Agreement must be accepted before submitting setup data.", code: "authorization_required" }, 403);
      }
    }

    const pkgKey = resolvePackageKey(order.package_key || order.package_type || order.selected_package_type);
    const requiredFields = REQUIRED_FIELDS_BY_TIER[pkgKey as keyof typeof REQUIRED_FIELDS_BY_TIER] || REQUIRED_FIELDS_BY_TIER.starter_system;

    if (!isAdminBypass) {
      const validationErrors = [];
      for (const field of requiredFields) {
        const value = getRequiredFieldValue(field, install_configuration);
        if (!value || (typeof value === "string" && !value.trim())) {
          validationErrors.push({
            field,
            message: FIELD_MESSAGES[field as keyof typeof FIELD_MESSAGES] || `${field} is required`,
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

    const brand = install_configuration.brand || {};
    const shared = install_configuration.shared || {};
    const messaging = install_configuration.messaging || {};
    const integrations = install_configuration.integrations || {};
    const services = install_configuration.services || {};

    const businessPhone = firstNonEmpty(brand.business_phone, shared.business_phone, shared.twilio_business_phone);
    const twilioBusinessPhone = firstNonEmpty(shared.twilio_business_phone, businessPhone);
    const bookingLink = firstNonEmpty(messaging.booking_link, services.ai_booking_agent?.booking_link);
    const reviewLink = firstNonEmpty(integrations.google_business_url, integrations.google_review_link, services.review_request?.review_link, brand.google_business_url);
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
        google_business_url: brand.google_business_url || reviewLink,
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
    console.log(`[saveClientCredentials] install_configuration saved for order ${order_id}`);

    const existing = await base44.asServiceRole.entities.ClientInstallationOS.filter(
      { order_id },
      "-created_date",
      1
    ).catch(() => []);

    if (existing?.length > 0) {
      await base44.asServiceRole.entities.ClientInstallationOS.update(existing[0].id, {
        workflow_stage: "website_building",
      }).catch((error) => console.warn(`[saveClientCredentials] workflow_stage update failed: ${error.message}`));
      console.log("[saveClientCredentials] workflow_stage → website_building");
    }

    let intelligenceResult = null;
    try {
      intelligenceResult = await base44.asServiceRole.functions.invoke("aiOnboardingIntelligence", { order_id });
      console.log(`[saveClientCredentials] pre-flight check: ready=${intelligenceResult?.ready_to_activate}, blockers=${intelligenceResult?.blockers?.length || 0}`);
    } catch (error) {
      console.warn(`[saveClientCredentials] aiOnboardingIntelligence warning: ${error.message}`);
    }

    let activationDeferredReason = null;
    if (intelligenceResult?.ready_to_activate) {
      activationDeferredReason = "Legacy aiPackageOrchestrator is retired. Continue activation from the canonical install workspace.";
      console.log(`[saveClientCredentials] ${activationDeferredReason}`);
    } else {
      console.log(`[saveClientCredentials] activation deferred — blockers present: ${(intelligenceResult?.blockers || []).join(", ")}`);
    }

    try {
      const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || "nolan@clientsurgesystems.com";
      const appUrl = getAppUrl();
      const blockers = intelligenceResult?.blockers || [];
      const autoFilled = intelligenceResult?.auto_filled || [];

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: adminEmail,
        from_name: "ClientSurge Systems",
        subject: `✅ Setup Credentials Submitted — ${order.business_name}`,
        body: `
<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:600px;margin:0 auto;padding:32px 20px;">
  <h2 style="color:#0A1628;margin:0 0 16px;">Credentials Submitted</h2>
  <p style="color:#555;margin:0 0 20px;"><strong>${order.business_name}</strong> (${order.customer_email}) just completed their setup intake form.</p>

  <div style="background:${intelligenceResult?.ready_to_activate ? "#f0fdf4" : "#fffbeb"};border:1px solid ${intelligenceResult?.ready_to_activate ? "#86efac" : "#fcd34d"};border-radius:10px;padding:16px;margin-bottom:20px;">
    <p style="font-weight:700;color:${intelligenceResult?.ready_to_activate ? "#16a34a" : "#92400e"};margin:0 0 8px;">
      ${intelligenceResult?.ready_to_activate ? "✅ Ready for Canonical Install Review" : "⚠️ Activation Deferred — Blockers Found"}
    </p>
    ${blockers.length > 0 ? `<ul style="margin:0;padding-left:20px;color:#92400e;font-size:13px;">${blockers.map((blocker) => `<li>${blocker}</li>`).join("")}</ul>` : ""}
    ${autoFilled.length > 0 ? `<p style="font-size:13px;color:#555;margin:8px 0 0;">Auto-filled: ${autoFilled.join(", ")}</p>` : ""}
    ${activationDeferredReason ? `<p style="font-size:13px;color:#166534;margin:8px 0 0;">${activationDeferredReason}</p>` : ""}
  </div>

  <a href="${appUrl}/admin/onboarding" style="display:inline-block;background:#0A1628;color:#fff;padding:12px 28px;border-radius:9999px;text-decoration:none;font-weight:600;font-size:14px;">View in Admin →</a>
</div>`,
      });
    } catch (error) {
      console.warn(`[saveClientCredentials] admin notification failed: ${error.message}`);
    }

    return json({
      success: true,
      ready_to_activate: intelligenceResult?.ready_to_activate || false,
      blockers: intelligenceResult?.blockers || [],
      auto_filled: intelligenceResult?.auto_filled || [],
      activation_launched: false,
      activation_deferred_reason: activationDeferredReason,
      redirect_to: `/setup/status/${order_id}`,
    });
  } catch (error) {
    console.error("[saveClientCredentials] Error:", error.message);
    return json({ error: error.message }, 500);
  }
});
