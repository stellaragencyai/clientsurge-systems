import { secureJson } from "../_shared/response.ts";
/**
 * selfHealingMonitor — #496
 * Runs every 6 hours (scheduled automation).
 * Checks: stalled orders, failed services, incomplete installs.
 * Auto-retries where possible, Telegrams Nolan for manual cases.
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const TELEGRAM_BOT = Deno.env.get("TELEGRAM_BOT_TOKEN") || "8495239862:AAF_ScgymDF8MlcwGVKzrPfTldxpSMunZn4";
const TELEGRAM_NOLAN = Deno.env.get("TELEGRAM_NOLAN_ID") || "7776809236";
const STALL_THRESHOLD_HOURS = 2;

async function sendTelegram(message: string) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_NOLAN, text: message, parse_mode: "HTML" }),
    });
  } catch (e) {
    console.warn("[selfHealingMonitor] Telegram failed:", e.message);
  }
}

function hoursSince(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / 3600000;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const issues: string[] = [];
    let autoFixed = 0;

    // --- CHECK 1: Orders stuck in "Configuring" > STALL_THRESHOLD_HOURS ---
    const stalledOrders = await base44.asServiceRole.entities.Order.filter({ workflow_stage: "Configuring" });
    for (const order of stalledOrders || []) {
      if (order.updated_date && hoursSince(order.updated_date) > STALL_THRESHOLD_HOURS) {
        issues.push(`⚠️ Order <b>${order.business_name || order.id}</b> stuck in "Configuring" for ${Math.round(hoursSince(order.updated_date))}h`);
        // Auto-retry: re-trigger installPipeline
        try {
          await base44.functions.invoke("installPipeline", { action: "initialize", order_id: order.id });
          autoFixed++;
          issues[issues.length - 1] += " → auto-retried ✅";
        } catch (e) {
          issues[issues.length - 1] += ` → retry failed: ${e.message}`;
        }
      }
    }

    // --- CHECK 2: ClientInstallationOS records with failed services ---
    const installs = await base44.asServiceRole.entities.ClientInstallationOS.filter({ workflow_stage: "Failed" });
    for (const install of installs || []) {
      issues.push(`🔴 Install <b>${install.order_id}</b> in Failed state since ${install.updated_date?.split('T')[0]}`);
    }

    // --- CHECK 3: Orders paid but no install record after 1 hour ---
    const paidOrders = await base44.asServiceRole.entities.Order.filter({ payment_status: "paid", workflow_stage: "Pending" });
    for (const order of paidOrders || []) {
      if (order.paid_at && hoursSince(order.paid_at) > 1) {
        issues.push(`⚠️ Paid order <b>${order.business_name || order.id}</b> has no install initialized after ${Math.round(hoursSince(order.paid_at))}h`);
        // Auto-fix: trigger install init
        try {
          await base44.functions.invoke("installPipeline", { action: "initialize", order_id: order.id });
          autoFixed++;
          issues[issues.length - 1] += " → install initialized ✅";
        } catch (e) {
          issues[issues.length - 1] += ` → init failed: ${e.message}`;
        }
      }
    }

    // --- LOG TO AgentLog ---
    await base44.asServiceRole.entities.AgentLog.create({
      agent_name: "Agent Smith",
      log_type: issues.length > 0 ? "WARNING" : "INFO",
      summary: `selfHealingMonitor: ${issues.length} issues found, ${autoFixed} auto-fixed`,
      details: issues.join('\n') || "All systems healthy",
      service: "selfHealingMonitor",
      requires_nolan: issues.length > autoFixed,
      resolved: issues.length === 0,
    });

    // --- ALERT NOLAN if unfixed issues remain ---
    const unfixed = issues.filter(i => !i.includes("auto-retried ✅") && !i.includes("initialized ✅"));
    if (unfixed.length > 0) {
      await sendTelegram(
        `🚨 <b>SelfHealingMonitor Alert</b>\n\n${unfixed.join('\n\n')}\n\n<i>Requires manual review</i>`
      );
    }

    console.log(`[selfHealingMonitor] Done — ${issues.length} issues, ${autoFixed} auto-fixed`);
    return secureJson({ success: true, issues_found: issues.length, auto_fixed: autoFixed, issues });
  } catch (err) {
    console.error("[selfHealingMonitor] Fatal:", err.message);
    return secureJson({ error: err.message }, { status: 500 });
  }
});
