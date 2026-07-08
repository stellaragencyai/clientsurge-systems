export const REQUIRED_SETUP_FIELDS_BY_TIER: Record<string, string[]> = {
  starter_system: ["business_name", "business_phone", "booking_link", "lead_notification_email"],
  growth_system: ["business_name", "business_phone", "booking_link", "lead_notification_email"],
  pro_system: ["business_name", "business_phone", "booking_link", "lead_notification_email"],
  elite_system: ["business_name", "business_phone", "booking_link", "lead_notification_email"],
};

export const SETUP_FIELD_MESSAGES: Record<string, string> = {
  business_name: "Business name is required for SMS personalization",
  business_phone: "Business phone is required for Twilio SMS setup",
  booking_link: "Booking link is required for the AI Booking Agent",
  lead_notification_email: "Lead notification email is required for notifications",
};

export function firstNonEmpty(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (value !== undefined && value !== null && typeof value !== "string") return value;
  }
  return "";
}

export function resolvePackageKey(raw: unknown) {
  if (!raw) return "starter_system";
  const k = String(raw).toLowerCase().trim();
  if (k.includes("pro") || k.includes("elite")) return "pro_system";
  if (k.includes("growth")) return "growth_system";
  return "starter_system";
}

export function getRequiredFieldValue(field: string, config: any = {}) {
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
    google_business_url: [integrations.google_business_url, integrations.google_review_link, services.review_request?.review_link, brand.google_business_url, config.google_business_url],
    industry: [brand.industry, config.industry],
    tone_of_voice: [brand.tone_of_voice, brand.brand_voice, config.tone_of_voice, config.brand_voice],
  };

  return firstNonEmpty(...(aliases[field] || [config[field]]));
}

export function validateInstallConfiguration(config: any, packageKey: string, adminBypass = false) {
  if (adminBypass) return [];
  const requiredFields = REQUIRED_SETUP_FIELDS_BY_TIER[packageKey] || REQUIRED_SETUP_FIELDS_BY_TIER.starter_system;
  const validationErrors = [];

  for (const field of requiredFields) {
    const value = getRequiredFieldValue(field, config);
    if (!value || (typeof value === "string" && !value.trim())) {
      validationErrors.push({
        field,
        message: SETUP_FIELD_MESSAGES[field] || `${field} is required`,
      });
    }
  }

  return validationErrors;
}

export function normalizeInstallConfiguration(config: any = {}) {
  const brand = config.brand || {};
  const shared = config.shared || {};
  const messaging = config.messaging || {};
  const integrations = config.integrations || {};
  const services = config.services || {};

  const businessPhone = firstNonEmpty(brand.business_phone, shared.business_phone, shared.twilio_business_phone);
  const twilioBusinessPhone = firstNonEmpty(shared.twilio_business_phone, businessPhone);
  const bookingLink = firstNonEmpty(messaging.booking_link, services.ai_booking_agent?.booking_link);
  const reviewLink = firstNonEmpty(integrations.google_business_url, integrations.google_review_link, services.review_request?.review_link, brand.google_business_url);
  const toneOfVoice = firstNonEmpty(brand.tone_of_voice, brand.brand_voice);
  const websiteUrl = firstNonEmpty(brand.website_url, brand.website);

  return {
    ...config,
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
}
