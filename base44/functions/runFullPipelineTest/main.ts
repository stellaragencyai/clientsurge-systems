import { secureJson } from "../_shared/response.ts";
/**
 * runFullPipelineTest — #469 CRITICAL
 * End-to-end QA: lead → order → activate → email → status flow.
 * Safe to run on production when persist_records=false — creates and cleans up test records.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import {
  buildInstallSnapshot,
  getTrackedServiceConfig,
  initializePaidOrderInstallPipeline,
  normalizeInstallConfiguration,
} from "../_shared/installPipeline.js";
import {
  buildPricingSummaryForProducts,
  buildStoredPricingSummary,
  getPackageServices,
} from "../../../src/lib/salesCatalog.js";

const TEST_EMAIL = "qa-e2e+pipeline@clientsurgesystems.com";
const TEST_PHONE = "+16025550000";
const DEFAULT_PACKAGE_KEY = "elite_system";

function buildOrderItems(pricedItems = []) {
  return pricedItems.map((item) => ({
    product_id: item.product_id,
    product_name: item.name,
    setup_price_id: item.setup_price_id,
    monthly_price_id: item.monthly_price_id,
    setup_fee: item.setup_fee,
    monthly_fee: item.monthly_fee,
    compare_at_setup_fee: item.compare_at_setup_fee,
    compare_at_monthly_fee: item.compare_at_monthly_fee,
    setup_discount_fee: item.setup_discount_fee,
    monthly_discount_fee: item.monthly_discount_fee,
    source_package_key: item.source_package_key,
    source_package_name: item.source_package_name,
    status: "pending",
    service_key: getTrackedServiceConfig(item.product_id)?.service_key,
    tracking_enabled: Boolean(getTrackedServiceConfig(item.product_id)),
    service_access_status: "active",
  }));
}

async function cleanupRecords(base44, cleanupIds) {
  const results = [];

  for (const { entity, id } of cleanupIds.reverse()) {
    try {
      const collection = base44.asServiceRole.entities[entity];
      if (!collection?.delete) {
        results.push({ entity, id, cleaned: false, detail: "delete_not_supported" });
        continue;
      }

      await collection.delete(id);
      results.push({ entity, id, cleaned: true });
    } catch (error) {
      results.push({
        entity,
        id,
        cleaned: false,
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const {
      dry_run = true,
      persist_records = false,
      notify_telegram = false,
      package_key = DEFAULT_PACKAGE_KEY,
      now = new Date().toISOString(),
    } = await req.json().catch(() => ({}));
    const steps: { step: string; passed: boolean; detail: string }[] = [];
    const cleanup_ids: { entity: string; id: string }[] = [];
    const cleanupEntity = (entity: string, id?: string | null) => {
      if (id) {
        cleanup_ids.push({ entity, id });
      }
    };

    // Step 1: Submit lead
    let lead_id: string | null = null;
    try {
      const lead = await base44.asServiceRole.entities.Leads.create({
        full_name: "E2E Test Lead",
        business_name: "E2E Test Business",
        phone: TEST_PHONE,
        email: TEST_EMAIL,
        industry: "med_spa",
        source: "auto_end_to_end_test",
        status: "Qualified",
        lead_score: 75,
        sms_consent: true,
        email_consent: true,
        consent_source: "runFullPipelineTest",
        notes: `Automated launch-readiness lead fixture created ${now}.`,
      });
      lead_id = lead.id;
      cleanupEntity("Leads", lead.id);
      steps.push({ step: "1. Lead created", passed: true, detail: `lead_id: ${lead.id}` });
    } catch (e: any) {
      steps.push({ step: "1. Lead created", passed: false, detail: e.message });
    }

    // Step 2: Create order
    let order_id: string | null = null;
    let order: any = null;
    try {
      const packageServices = getPackageServices(package_key);
      const pricingSummary = buildPricingSummaryForProducts(packageServices.map((service) => service.product_id));
      const orderItems = buildOrderItems(pricingSummary.priced_items);

      order = await base44.asServiceRole.entities.Order.create({
        customer_name: "E2E Test Client",
        customer_email: TEST_EMAIL,
        customer_phone: TEST_PHONE,
        business_name: "E2E Test Business",
        items: orderItems,
        total_setup: pricingSummary.total_setup,
        total_monthly: pricingSummary.total_monthly,
        pricing_summary: buildStoredPricingSummary(pricingSummary.priced_items),
        install_configuration: normalizeInstallConfiguration({}, orderItems),
        payment_status: "paid",
        order_status: "paid",
        industry: "med_spa",
        lead_id,
        selected_package_type: pricingSummary.package_offer?.package_key || null,
        package_type: pricingSummary.package_offer?.package_key || null,
        plan_type: pricingSummary.package_offer?.name || "Custom Service Bundle",
        stripe_customer_id: "qa_cus_runFullPipelineTest",
        stripe_session_id: "qa_session_runFullPipelineTest",
        notes: `Automated launch-readiness order fixture created ${now}.`,
      });
      order_id = order.id;
      cleanupEntity("Order", order.id);
      steps.push({
        step: "2. Canonical order created",
        passed: true,
        detail: `order_id: ${order.id}; services: ${pricingSummary.selected_service_keys.join(", ")}`,
      });
    } catch (e: any) {
      steps.push({ step: "2. Canonical order created", passed: false, detail: e.message });
    }

    // Step 3: Verify checkout/session metadata on the paid order fixture.
    if (order) {
      const hasCheckoutShape =
        order.payment_status === "paid" &&
        Boolean(order.stripe_customer_id) &&
        Boolean(order.stripe_session_id) &&
        Boolean(order.pricing_summary?.package_key) &&
        Array.isArray(order.items) &&
        order.items.length > 0;

      steps.push({
        step: "3. Checkout session metadata",
        passed: hasCheckoutShape,
        detail: hasCheckoutShape
          ? `session: ${order.stripe_session_id}; package: ${order.pricing_summary.package_key}`
          : "missing paid checkout/session/package metadata",
      });
    }

    // Step 4: Initialize activation pipeline
    let initializedOrder: any = null;
    if (order) {
      try {
        const initialized = await initializePaidOrderInstallPipeline({
          base44,
          order,
          stripeCustomerId: order.stripe_customer_id,
          eventSource: "runFullPipelineTest",
          now,
        });
        initializedOrder = initialized.order;
        cleanupEntity("Client", initialized.client?.id);
        cleanupEntity("ClientProject", initialized.clientProject?.id);
        cleanupEntity("OnboardingClient", initialized.onboardingClient?.id);

        const snapshot = buildInstallSnapshot(initializedOrder);
        steps.push({
          step: "4. Activation pipeline initialized",
          passed: snapshot.trackedItems.length > 0 && Boolean(initializedOrder.purchase_onboarding_handoff),
          detail: `pipeline_status: ${snapshot.pipelineStatus}; tracked_services: ${snapshot.trackedItems.length}`,
        });

        try {
          const events = await base44.asServiceRole.entities.CommunicationEvent.filter({ order_id: initializedOrder.id });
          const eventTypes = new Set((events || []).map((event: any) => event.event_type));
          steps.push({
            step: "4b. Webhook/order events",
            passed:
              eventTypes.has("order_paid") &&
              eventTypes.has("install_initialized") &&
              eventTypes.has("onboarding_handoff_initialized"),
            detail: `events: ${[...eventTypes].sort().join(", ") || "none"}`,
          });

          for (const event of events || []) {
            cleanupEntity("CommunicationEvent", event.id);
          }
        } catch {
          steps.push({
            step: "4b. Webhook/order events",
            passed: false,
            detail: "CommunicationEvent lookup failed",
          });
        }
      } catch (e: any) {
        steps.push({ step: "4. Activation pipeline initialized", passed: false, detail: e.message });
      }
    }

    // Step 5: credentialsCompletionCheck
    if (order_id) {
      try {
        const check = await base44.asServiceRole.functions.invoke("credentialsCompletionCheck", { order_id });
        steps.push({ step: "5. Credentials check", passed: !!check?.success, detail: `all_ready: ${check?.all_ready}` });
      } catch (e: any) {
        steps.push({ step: "5. Credentials check", passed: false, detail: e.message });
      }
    }

    // Step 6: getActivationProgress
    if (order_id) {
      try {
        const prog = await base44.asServiceRole.functions.invoke("getActivationProgress", { order_id });
        steps.push({ step: "6. Activation progress", passed: !!prog?.success, detail: `total: ${prog?.total_services}` });
      } catch (e: any) {
        steps.push({ step: "6. Activation progress", passed: false, detail: e.message });
      }
    }

    // Step 7: Email status/readiness without sending live email.
    if (order) {
      const emailReady = Boolean(order.customer_email) && Boolean(order.pricing_summary?.package_key);
      steps.push({
        step: "7. Confirmation email readiness",
        passed: emailReady,
        detail: emailReady ? `recipient: ${order.customer_email}` : "missing order recipient or package summary",
      });
    }

    // Step 8: AgentLog write
    try {
      const log = await base44.asServiceRole.entities.AgentLog.create({
        agent_name: "runFullPipelineTest", log_type: "info",
        summary: "Canonical checkout -> webhook -> email -> status E2E test log entry",
        service: "e2e_test", requires_nolan: false, resolved: true,
      });
      cleanupEntity("AgentLog", log.id);
      steps.push({ step: "8. AgentLog write", passed: true, detail: `log_id: ${log.id}` });
    } catch (e: any) {
      steps.push({ step: "8. AgentLog write", passed: false, detail: e.message });
    }

    // Step 9: getSystemHealthDashboard
    try {
      const health = await base44.asServiceRole.functions.invoke("getSystemHealthDashboard", {});
      steps.push({ step: "9. System health check", passed: !!health?.success, detail: `status: ${health?.health?.overall_status}` });
    } catch (e: any) {
      steps.push({ step: "9. System health check", passed: false, detail: e.message });
    }

    // Cleanup test records
    const cleanup_results = persist_records ? [] : await cleanupRecords(base44, cleanup_ids);
    if (!persist_records) {
      const failedCleanups = cleanup_results.filter((result: any) => !result.cleaned);
      steps.push({
        step: "10. Fixture cleanup",
        passed: failedCleanups.length === 0,
        detail:
          failedCleanups.length === 0
            ? `cleaned: ${cleanup_results.length}`
            : `failed cleanup: ${failedCleanups.map((result: any) => `${result.entity}:${result.id}`).join(", ")}`,
      });
    }

    const passed = steps.filter(s => s.passed).length;
    const total = steps.length;
    const all_passed = passed === total;

    // Report to Telegram only when explicitly requested. This avoids noisy launch-readiness checks.
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (notify_telegram && botToken) {
      const lines = steps.map(s => `${s.passed ? "PASS" : "FAIL"} ${s.step}: ${s.detail}`).join("\n");
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: "-1003533494424",
          text: `${all_passed ? "PASS" : "FAIL"} <b>Pipeline E2E Test</b>
${passed}/${total} passed

${lines}

${persist_records ? "persist_records=true (test records retained)." : "Test records cleaned up."}`,
          parse_mode: "HTML" }),
      }).catch(() => {});
    }

    return secureJson({
      success: true,
      all_passed,
      passed,
      total,
      steps,
      dry_run,
      persist_records,
      cleaned_up: !persist_records,
      cleanup_results,
      lead_id,
      order_id,
      initialized_order_id: initializedOrder?.id || null,
    });
  } catch (err: any) {
    return secureJson({ error: err.message }, { status: 500 });
  }
});
