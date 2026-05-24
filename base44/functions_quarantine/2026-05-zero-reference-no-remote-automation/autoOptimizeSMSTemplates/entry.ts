import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import {
  applySmsTemplateWinner,
  ensureSmsTemplateVariants,
  evaluateSmsTemplateVariants,
} from "../_shared/smsTemplateOptimizer.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (_) {}
    if (user && user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { order_id, service_keys, threshold = 50 } = await req.json().catch(() => ({}));
    const orders = order_id
      ? [await base44.asServiceRole.entities.Order.get(order_id).catch(() => null)].filter(Boolean)
      : await base44.asServiceRole.entities.Order.filter({ payment_status: "paid" }, "-created_date", 100).catch(() => []);

    const results = [];
    for (const order of orders) {
      let installConfiguration = order.install_configuration || {};
      const services = installConfiguration.services || {};
      const keys = Array.isArray(service_keys) && service_keys.length
        ? service_keys
        : Object.keys(services).filter((key) => services[key]?.sms_template || services[key]?.sms_template_variants);
      let changed = false;

      const events = await base44.asServiceRole.entities.CommunicationEvent.filter({ order_id: order.id }, "-created_date", 1000).catch(() => []);

      for (const serviceKey of keys) {
        const serviceConfig = services[serviceKey] || {};
        const variants = ensureSmsTemplateVariants(serviceConfig);
        const evaluation = evaluateSmsTemplateVariants(events, variants, { threshold });

        if (!Array.isArray(serviceConfig.sms_template_variants) || serviceConfig.sms_template_variants.length < 2) {
          installConfiguration = {
            ...installConfiguration,
            services: {
              ...(installConfiguration.services || {}),
              [serviceKey]: {
                ...serviceConfig,
                sms_template_variants: variants,
                active_sms_template_variant: serviceConfig.active_sms_template_variant || variants[0]?.id,
              },
            },
          };
          changed = true;
        }

        if (evaluation.ready && evaluation.winner) {
          installConfiguration = applySmsTemplateWinner(
            installConfiguration,
            serviceKey,
            variants,
            evaluation.winner
          );
          changed = true;
        }

        results.push({
          order_id: order.id,
          service_key: serviceKey,
          ready: evaluation.ready,
          winner: evaluation.winner?.variant_id || null,
          variants: evaluation.variants,
        });
      }

      if (changed) {
        await base44.asServiceRole.entities.Order.update(order.id, {
          install_configuration: installConfiguration,
          install_configuration_updated_at: new Date().toISOString(),
        });
        await base44.asServiceRole.entities.CommunicationEvent.create({
          order_id: order.id,
          channel: "internal",
          direction: "system",
          event_type: "ai_generated",
          provider: "internal",
          status: "processed",
          subject: "SMS templates optimized",
          metadata_json: JSON.stringify({ source: "autoOptimizeSMSTemplates", results: results.filter((r) => r.order_id === order.id) }),
        }).catch(() => {});
      }
    }

    return Response.json({ success: true, processed_orders: orders.length, results });
  } catch (error) {
    console.error("[autoOptimizeSMSTemplates]", error);
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
});
