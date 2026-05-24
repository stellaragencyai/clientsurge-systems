const DEFAULT_VARIANT_SUFFIXES = [
  "Want me to send the fastest next step?",
  "Reply here and we can help get this moving.",
];

function safeJson(value) {
  if (!value || typeof value !== "string") return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function normalizeVariantId(value, fallback) {
  return String(value || fallback || "").trim().toLowerCase();
}

export function ensureSmsTemplateVariants(serviceConfig = {}) {
  const existing = Array.isArray(serviceConfig.sms_template_variants)
    ? serviceConfig.sms_template_variants.filter((variant) => variant?.body)
    : [];

  if (existing.length >= 2) {
    return existing.slice(0, 2).map((variant, index) => ({
      ...variant,
      id: normalizeVariantId(variant.id, `variant_${index + 1}`),
    }));
  }

  const baseTemplate = serviceConfig.sms_template || "Hi {name}, thanks for reaching out. {booking_link}";
  const variants = [...existing];
  while (variants.length < 2) {
    const index = variants.length;
    variants.push({
      id: `variant_${index + 1}`,
      label: `Variant ${index + 1}`,
      body: `${baseTemplate}\n\n${DEFAULT_VARIANT_SUFFIXES[index]}`,
      status: index === 0 ? "active" : "testing",
    });
  }

  return variants;
}

export function evaluateSmsTemplateVariants(events = [], variants = [], options = {}) {
  const threshold = Number.isInteger(options.threshold) ? options.threshold : 50;
  const stats = new Map();

  for (const variant of variants) {
    stats.set(normalizeVariantId(variant.id), {
      variant_id: normalizeVariantId(variant.id),
      sends: 0,
      replies: 0,
      reply_rate: 0,
    });
  }

  for (const event of events) {
    const metadata = safeJson(event.metadata_json);
    const variantId = normalizeVariantId(
      metadata.sms_template_variant || metadata.template_variant || metadata.replying_to_variant
    );
    if (!variantId || !stats.has(variantId)) continue;

    const record = stats.get(variantId);
    const eventType = String(event.event_type || "").toLowerCase();
    const direction = String(event.direction || "").toLowerCase();
    if (direction === "outbound" && eventType.includes("sms_sent")) {
      record.sends += 1;
    }
    if (direction === "inbound" || eventType.includes("sms_received")) {
      record.replies += 1;
    }
  }

  const results = [...stats.values()].map((record) => ({
    ...record,
    reply_rate: record.sends > 0 ? record.replies / record.sends : 0,
  }));
  const ready = results.length >= 2 && results.every((record) => record.sends >= threshold);
  const winner = ready
    ? [...results].sort((a, b) => b.reply_rate - a.reply_rate || b.replies - a.replies)[0]
    : null;

  return { ready, threshold, variants: results, winner };
}

export function applySmsTemplateWinner(installConfiguration = {}, serviceKey, variants = [], winner) {
  const services = { ...(installConfiguration.services || {}) };
  const currentService = { ...(services[serviceKey] || {}) };
  const winningVariant = variants.find((variant) => normalizeVariantId(variant.id) === winner?.variant_id);
  if (!winningVariant) return installConfiguration;

  services[serviceKey] = {
    ...currentService,
    sms_template: winningVariant.body,
    active_sms_template_variant: winningVariant.id,
    sms_template_variants: variants.map((variant) => ({
      ...variant,
      status: normalizeVariantId(variant.id) === winner.variant_id ? "active" : "archived",
    })),
    sms_template_optimized_at: new Date().toISOString(),
  };

  return {
    ...installConfiguration,
    services,
  };
}
