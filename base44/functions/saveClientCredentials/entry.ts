/**
 * saveClientCredentials
 * Called when a client submits the /setup/credentials wizard.
 *
 * Steps:
 *   1. Write install_configuration to Order
 *   2. Advance ClientInstallationOS.workflow_stage to "credentials_complete"
 *   3. Run aiOnboardingIntelligence (pre-flight check + auto-fill defaults)
 *   4. If ready_to_activate → leave the order ready for the canonical install workspace
 *   5. Send admin notification that credentials were submitted
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { getAppUrl } from "../_shared/appUrl.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id, install_configuration } = await req.json();

    if (!order_id) {
      return Response.json({ error: "order_id required" }, { status: 400 });
    }
    if (!install_configuration) {
      return Response.json({ error: "install_configuration required" }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    await base44.asServiceRole.entities.Order.update(order_id, {
      install_configuration,
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
        workflow_stage: "credentials_complete",
      });
      console.log("[saveClientCredentials] workflow_stage → credentials_complete");
    }

    let intelligenceResult = null;
    try {
      intelligenceResult = await base44.asServiceRole.functions.invoke("aiOnboardingIntelligence", {
        order_id,
      });
      console.log(
        `[saveClientCredentials] pre-flight check: ready=${intelligenceResult?.ready_to_activate}, blockers=${intelligenceResult?.blockers?.length || 0}`
      );
    } catch (error) {
      console.warn(`[saveClientCredentials] aiOnboardingIntelligence warning: ${error.message}`);
    }

    let activationDeferredReason = null;
    if (intelligenceResult?.ready_to_activate) {
      activationDeferredReason =
        "Legacy aiPackageOrchestrator is retired. Continue activation from the canonical install workspace.";
      console.log(`[saveClientCredentials] ${activationDeferredReason}`);
    } else {
      console.log(
        `[saveClientCredentials] activation deferred — blockers present: ${(intelligenceResult?.blockers || []).join(", ")}`
      );
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

    return Response.json({
      success: true,
      ready_to_activate: intelligenceResult?.ready_to_activate || false,
      blockers: intelligenceResult?.blockers || [],
      auto_filled: intelligenceResult?.auto_filled || [],
      activation_launched: false,
      activation_deferred_reason: activationDeferredReason,
    });
  } catch (error) {
    console.error("[saveClientCredentials] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
