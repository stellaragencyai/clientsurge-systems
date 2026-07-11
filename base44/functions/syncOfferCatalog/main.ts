import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";
import { secureJson } from "../_shared/response.ts";
import {
  CANONICAL_SERVICE_PRODUCTS,
  PACKAGE_OFFERS,
} from "../createCheckoutSession/salesCatalog.shared.js";

const APPLY_CONFIRMATION = "SYNC OFFER CATALOG";

const MODULE_METADATA = {
  instant_lead_response: {
    category: "lead_capture",
    min_package_tier: "starter",
    trigger_type: "event",
    action_type: "send_sms",
    dependencies: [],
    default_module_params: { response_delay_seconds: 0, channel: "sms" },
  },
  missed_call_text_back: {
    category: "lead_capture",
    min_package_tier: "starter",
    trigger_type: "webhook",
    action_type: "send_sms",
    dependencies: [],
    default_module_params: { response_delay_seconds: 60, channel: "sms" },
  },
  nurture_sequence_14d: {
    category: "nurture",
    min_package_tier: "growth",
    trigger_type: "scheduled",
    action_type: "send_email_sms",
    dependencies: ["instant_lead_response"],
    default_module_params: { sequence_days: 14, channel: "email_sms" },
  },
  ai_booking_agent: {
    category: "booking",
    min_package_tier: "growth",
    trigger_type: "event",
    action_type: "booking_handoff",
    dependencies: ["instant_lead_response"],
    default_module_params: { booking_window_hours: 48 },
  },
  lead_reactivation: {
    category: "reactivation",
    min_package_tier: "pro",
    trigger_type: "scheduled",
    action_type: "send_sms",
    dependencies: ["instant_lead_response"],
    default_module_params: { max_batch_size: 25 },
  },
  review_request: {
    category: "growth",
    min_package_tier: "pro",
    trigger_type: "event",
    action_type: "send_sms_email",
    dependencies: [],
    default_module_params: { send_delay_minutes: 15 },
  },
};

function comparable(value) {
  if (Array.isArray(value)) return value.map(comparable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, comparable(nested)]),
    );
  }
  return value ?? null;
}

function changedFields(existing, target) {
  return Object.keys(target).filter(
    (key) => JSON.stringify(comparable(existing?.[key])) !== JSON.stringify(comparable(target[key])),
  );
}

function buildModuleRecords() {
  return CANONICAL_SERVICE_PRODUCTS.map((service, index) => {
    const metadata = MODULE_METADATA[service.service_key];
    if (!metadata) throw new Error(`Missing module metadata for ${service.service_key}`);
    return {
      module_key: service.service_key,
      display_name: service.name,
      description: service.description,
      category: metadata.category,
      min_package_tier: metadata.min_package_tier,
      dependencies: metadata.dependencies,
      default_module_params: metadata.default_module_params,
      trigger_type: metadata.trigger_type,
      action_type: metadata.action_type,
      status: "enabled",
      sort_order: index + 1,
    };
  });
}

function buildTierRecords() {
  const serviceNameByKey = Object.fromEntries(
    CANONICAL_SERVICE_PRODUCTS.map((service) => [service.service_key, service.name]),
  );

  return PACKAGE_OFFERS.map((offer, index) => ({
    tier_key: offer.package_key.replace(/_system$/, ""),
    name: offer.name,
    rank: index + 1,
    description: offer.description,
    enabled_module_keys: [...offer.included_service_keys],
    stripe_product_id: offer.stripe_product_id,
    stripe_price_id: offer.monthly_price_id,
    one_time_price_id: offer.setup_price_id,
    monthly_price_cents: offer.monthly_total * 100,
    setup_fee_cents: offer.setup_total * 100,
    upgrade_path: PACKAGE_OFFERS[index + 1]?.package_key.replace(/_system$/, "") || null,
    features_summary: offer.included_service_keys.map((key) => serviceNameByKey[key]).filter(Boolean),
    status: "active",
  }));
}

async function reconcileRecords({ entityApi, keyField, targets, dryRun }) {
  const results = [];

  for (const target of targets) {
    const keyValue = target[keyField];
    const existingRows = await entityApi.filter({ [keyField]: keyValue }, null, 5);
    const existing = existingRows?.[0] || null;
    const duplicateIds = (existingRows || []).slice(1).map((row) => row.id);
    const fields = existing ? changedFields(existing, target) : Object.keys(target);
    const action = !existing ? "create" : fields.length > 0 ? "update" : "unchanged";

    if (!dryRun && action === "create") {
      await entityApi.create(target);
    } else if (!dryRun && action === "update") {
      await entityApi.update(existing.id, target);
    }

    results.push({
      key: keyValue,
      action,
      changed_fields: fields,
      duplicate_record_ids: duplicateIds,
    });
  }

  return results;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    await requireAdminUser(base44);
    const body = await req.json().catch(() => ({}));
    const dryRun = body?.dry_run !== false;

    if (!dryRun && body?.confirm_phrase !== APPLY_CONFIRMATION) {
      return secureJson(
        {
          error: `confirm_phrase must equal "${APPLY_CONFIRMATION}" when dry_run is false`,
          code: "OFFER_CATALOG_CONFIRMATION_REQUIRED",
        },
        { status: 400 },
      );
    }

    const moduleResults = await reconcileRecords({
      entityApi: base44.asServiceRole.entities.AutomationModule,
      keyField: "module_key",
      targets: buildModuleRecords(),
      dryRun,
    });

    const tierResults = await reconcileRecords({
      entityApi: base44.asServiceRole.entities.PackageTier,
      keyField: "tier_key",
      targets: buildTierRecords(),
      dryRun,
    });

    const allResults = [...moduleResults, ...tierResults];
    const summary = {
      dry_run: dryRun,
      create: allResults.filter((item) => item.action === "create").length,
      update: allResults.filter((item) => item.action === "update").length,
      unchanged: allResults.filter((item) => item.action === "unchanged").length,
      duplicate_records_found: allResults.reduce(
        (sum, item) => sum + item.duplicate_record_ids.length,
        0,
      ),
      modules: moduleResults,
      tiers: tierResults,
      completed_at: new Date().toISOString(),
    };

    return secureJson({
      success: true,
      message: dryRun
        ? "Offer catalog audit completed; no Base44 records were changed"
        : "Offer catalog synchronized",
      apply_confirmation_phrase: dryRun ? APPLY_CONFIRMATION : undefined,
      summary,
    });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return secureJson({ error: error.message, code: error.code }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Offer catalog sync failed";
    console.error("[syncOfferCatalog]", error);
    return secureJson({ error: message }, { status: 500 });
  }
});
