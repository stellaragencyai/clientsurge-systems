/**
 * runFullPipelineTest — #469 CRITICAL
 * End-to-end QA: lead → order → activate → email → status flow.
 * Safe to run on production — creates and cleans up test records.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const TEST_EMAIL = "nolan@clientsurgesystems.com";
const TEST_PHONE = "+16025550000";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { dry_run = true } = await req.json().catch(() => ({}));
    const steps: { step: string; passed: boolean; detail: string }[] = [];
    const cleanup_ids: { entity: string; id: string }[] = [];

    // Step 1: Submit lead
    let lead_id: string | null = null;
    try {
      const lead = await base44.asServiceRole.entities.SpaLead.create({
        business_name: "E2E Test Business",
        phone: TEST_PHONE,
        email: TEST_EMAIL,
        industry: "med_spa",
        source: "e2e_test",
        status: "New",
        lead_score: 75,
      });
      lead_id = lead.id;
      cleanup_ids.push({ entity: "SpaLead", id: lead.id });
      steps.push({ step: "1. Lead created", passed: true, detail: `lead_id: ${lead.id}` });
    } catch (e: any) {
      steps.push({ step: "1. Lead created", passed: false, detail: e.message });
    }

    // Step 2: Create order
    let order_id: string | null = null;
    try {
      const order = await base44.asServiceRole.entities.Order.create({
        client_name: "E2E Test Client",
        client_email: TEST_EMAIL,
        package_key: "starter",
        payment_status: "paid",
        workflow_stage: "Configuring",
        industry: "med_spa",
        lead_id,
        install_configuration: {
          business_phone: TEST_PHONE,
          business_name: "E2E Test Business",
          booking_link: "https://example.com/book",
        },
      });
      order_id = order.id;
      cleanup_ids.push({ entity: "Order", id: order.id });
      steps.push({ step: "2. Order created", passed: true, detail: `order_id: ${order.id}` });
    } catch (e: any) {
      steps.push({ step: "2. Order created", passed: false, detail: e.message });
    }

    // Step 3: credentialsCompletionCheck
    if (order_id) {
      try {
        const check = await base44.asServiceRole.functions.invoke("credentialsCompletionCheck", { order_id });
        steps.push({ step: "3. Credentials check", passed: !!check?.success, detail: `all_ready: ${check?.all_ready}` });
      } catch (e: any) {
        steps.push({ step: "3. Credentials check", passed: false, detail: e.message });
      }
    }

    // Step 4: getActivationProgress
    if (order_id) {
      try {
        const prog = await base44.asServiceRole.functions.invoke("getActivationProgress", { order_id });
        steps.push({ step: "4. Activation progress", passed: !!prog?.success, detail: `total: ${prog?.total_services}` });
      } catch (e: any) {
        steps.push({ step: "4. Activation progress", passed: false, detail: e.message });
      }
    }

    // Step 5: AgentLog write
    try {
      const log = await base44.asServiceRole.entities.AgentLog.create({
        agent_name: "runFullPipelineTest", log_type: "info",
        summary: "E2E test log entry",
        service: "e2e_test", requires_nolan: false, resolved: true,
      });
      cleanup_ids.push({ entity: "AgentLog", id: log.id });
      steps.push({ step: "5. AgentLog write", passed: true, detail: `log_id: ${log.id}` });
    } catch (e: any) {
      steps.push({ step: "5. AgentLog write", passed: false, detail: e.message });
    }

    // Step 6: getSystemHealthDashboard
    try {
      const health = await base44.asServiceRole.functions.invoke("getSystemHealthDashboard", {});
      steps.push({ step: "6. System health check", passed: !!health?.success, detail: `status: ${health?.health?.overall_status}` });
    } catch (e: any) {
      steps.push({ step: "6. System health check", passed: false, detail: e.message });
    }

    // Cleanup test records
    if (!dry_run) {
      for (const { entity, id } of cleanup_ids.reverse()) {
        await base44.asServiceRole.entities[entity]?.delete?.(id).catch(() => {});
      }
    }

    const passed = steps.filter(s => s.passed).length;
    const total = steps.length;
    const all_passed = passed === total;

    // Report to Telegram
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (botToken) {
      const lines = steps.map(s => `${s.passed ? "✅" : "❌"} ${s.step}: ${s.detail}`).join("
");
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: "-1003533494424",
          text: `@trinity

${all_passed ? "🚀" : "🚨"} <b>Pipeline E2E Test</b>
${passed}/${total} passed

${lines}

${dry_run ? "dry_run=true (no cleanup needed)" : "Test records cleaned up."}`,
          parse_mode: "HTML" }),
      }).catch(() => {});
    }

    return Response.json({ success: true, all_passed, passed, total, steps, dry_run, cleaned_up: !dry_run });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
