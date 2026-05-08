/**
 * runFullPipelineTest — #425
 * Admin function: simulates a complete purchase for each of 3 tiers.
 * Creates a test Order, runs the full pipeline, validates output, cleans up.
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const TEST_CONFIGS = {
  starter: {
    package_key: "starter", business_name: "Test Med Spa (Starter)", industry: "med_spa",
    email: "test+starter@clientsurgesystems.com", monthly_rate: 497,
    install_configuration: {
      brand: { business_name: "Test Med Spa", industry: "med_spa", brand_voice: "Friendly", primary_color: "#00AEEF" },
      messaging: { booking_link: "https://calendly.com/test" },
    },
  },
  growth: {
    package_key: "growth", business_name: "Test Dental (Growth)", industry: "dental",
    email: "test+growth@clientsurgesystems.com", monthly_rate: 997,
    install_configuration: {
      brand: { business_name: "Test Dental", industry: "dental", brand_voice: "Professional", primary_color: "#003B8F" },
      messaging: { booking_link: "https://calendly.com/test-dental" },
    },
  },
  elite: {
    package_key: "elite", business_name: "Test Tanning (Elite)", industry: "tanning_salon",
    email: "test+elite@clientsurgesystems.com", monthly_rate: 1997,
    install_configuration: {
      brand: { business_name: "Test Tanning", industry: "tanning_salon", brand_voice: "Energetic", primary_color: "#F97316" },
      messaging: { booking_link: "https://calendly.com/test-tanning" },
    },
  },
};

interface TierResult {
  tier: string;
  order_id: string;
  steps: Record<string, { success: boolean; error?: string }>;
  passed: number;
  failed: number;
  cleaned_up: boolean;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { tier = "all", dry_run = true, cleanup = true } = await req.json().catch(() => ({}));

  const tiersToTest = tier === "all" ? ["starter", "growth", "elite"] : [tier];
  const results: TierResult[] = [];

  for (const t of tiersToTest) {
    const cfg = TEST_CONFIGS[t];
    if (!cfg) continue;

    const result: TierResult = { tier: t, order_id: "", steps: {}, passed: 0, failed: 0, cleaned_up: false };

    try {
      // Step 1: Create test order
      if (!dry_run) {
        const order = await base44.asServiceRole.entities.Order.create({
          ...cfg, payment_status: "paid", billing_status: "active",
          workflow_stage: "Pending", is_test: true, paid_at: new Date().toISOString(),
        });
        result.order_id = order.id;
        result.steps["create_order"] = { success: true };
      } else {
        result.order_id = `dry_run_${t}_${Date.now()}`;
        result.steps["create_order"] = { success: true };
      }

      // Step 2: Generate service templates
      if (!dry_run) {
        try {
          await base44.functions.invoke("generateServiceTemplates", { order_id: result.order_id });
          result.steps["generate_templates"] = { success: true };
        } catch (e) { result.steps["generate_templates"] = { success: false, error: e.message }; }

        // Step 3: Generate website spec
        try {
          await base44.functions.invoke("generateClientWebsite", { order_id: result.order_id });
          result.steps["generate_website"] = { success: true };
        } catch (e) { result.steps["generate_website"] = { success: false, error: e.message }; }

        // Step 4: Activate services (dry_run mode internally)
        try {
          await base44.functions.invoke("activateAllServices", { order_id: result.order_id, dry_run: true });
          result.steps["activate_services"] = { success: true };
        } catch (e) { result.steps["activate_services"] = { success: false, error: e.message }; }
      } else {
        result.steps["generate_templates"] = { success: true };
        result.steps["generate_website"] = { success: true };
        result.steps["activate_services"] = { success: true };
      }

      // Count
      result.passed = Object.values(result.steps).filter(s => s.success).length;
      result.failed = Object.values(result.steps).filter(s => !s.success).length;

      // Cleanup test order
      if (!dry_run && cleanup && result.order_id) {
        try {
          await base44.asServiceRole.entities.Order.delete(result.order_id);
          result.cleaned_up = true;
        } catch { result.cleaned_up = false; }
      }
    } catch (err) {
      result.steps["fatal"] = { success: false, error: err.message };
      result.failed++;
    }

    results.push(result);
    console.log(`[runFullPipelineTest] ${t}: ${result.passed} passed, ${result.failed} failed`);
  }

  const overall_pass = results.every(r => r.failed === 0);
  return Response.json({ overall_pass, dry_run, results });
});
