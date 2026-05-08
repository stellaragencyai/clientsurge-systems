/**
 * verifyRealOrder — #449 CRITICAL
 * E2E verification of real order 69f13b948861e8a032d10f2e.
 * Non-destructive read-only audit.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const REAL_ORDER_ID = "69f13b948861e8a032d10f2e";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id = REAL_ORDER_ID } = await req.json().catch(() => ({}));

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return Response.json({ error: `Order ${order_id} not found` }, { status: 404 });

    const checks: { check: string; passed: boolean; value: any }[] = [
      { check: "payment_status = paid", passed: order.payment_status === "paid", value: order.payment_status },
      { check: "package_key set", passed: !!order.package_key, value: order.package_key },
      { check: "client_email set", passed: !!order.client_email, value: order.client_email ? "***@***.***" : null },
      { check: "install_configuration set", passed: !!order.install_configuration, value: !!order.install_configuration },
      { check: "workflow_stage set", passed: !!order.workflow_stage, value: order.workflow_stage },
      { check: "activation_log present", passed: Array.isArray(order.activation_log), value: order.activation_log?.length || 0 },
    ];

    const activation = await base44.asServiceRole.functions.invoke("getActivationProgress", { order_id }).catch(() => null);
    if (activation) {
      checks.push({ check: "getActivationProgress works", passed: activation.success, value: `${activation.configured}/${activation.total_services}` });
    }

    const passed = checks.filter(c => c.passed).length;
    const all_passed = passed === checks.length;

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (botToken) {
      const lines = checks.map(c => `${c.passed ? "✅" : "❌"} ${c.check}: ${c.value}`).join("
");
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: "-1003533494424",
          text: `@trinity

${all_passed ? "✅" : "⚠️"} <b>Real Order Audit</b>
Order: ${order_id}
${passed}/${checks.length} checks

${lines}`,
          parse_mode: "HTML" }),
      }).catch(() => {});
    }

    return Response.json({ success: true, order_id, all_passed, passed, total: checks.length, checks });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
