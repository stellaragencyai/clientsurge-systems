import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── Canonical service key registry ──
const CANONICAL_KEYS = [
  "instant_lead_response","missed_call_text_back","nurture_sequence_14d",
  "ai_booking_agent","daily_lead_digest","inbound_sms_assistant",
  "ai_voice_receptionist","lead_reactivation","review_request"
];

const LEGACY_ALIASES = {
  missed_call_textback:"missed_call_text_back",
  missed_call_txt_back:"missed_call_text_back",
  missedcall:"missed_call_text_back",
  appointment_booking:"ai_booking_agent",
  booking_automation:"ai_booking_agent",
  auto_booking:"ai_booking_agent",
  followup_sequences:"nurture_sequence_14d",
  follow_up_sequences:"nurture_sequence_14d",
  nurture_sequence:"nurture_sequence_14d",
  followup:"nurture_sequence_14d",
  lead_reactivation_sequence:"lead_reactivation",
  win_back:"lead_reactivation",
  reactivation:"lead_reactivation",
  instant_lead_sms:"instant_lead_response",
  lead_response:"instant_lead_response",
  instant_response:"instant_lead_response",
  review_automation:"review_request",
  review_capture:"review_request",
  reputation:"review_request",
  inbound_sms:"inbound_sms_assistant",
  sms_assistant:"inbound_sms_assistant",
  voice_receptionist:"ai_voice_receptionist",
  ai_voice_agent:"ai_voice_receptionist",
  voice_agent:"ai_voice_receptionist",
  daily_digest:"daily_lead_digest",
  lead_digest:"daily_lead_digest",
};

const QA_PATTERNS = [
  { pattern: /smoke/i, env: "smoke" },
  { pattern: /proof/i, env: "qa" },
  { pattern: /test/i, env: "qa" },
  { pattern: /qa/i, env: "qa" },
  { pattern: /runtime\.checkout/i, env: "qa" },
  { pattern: /webhook-proof/i, env: "qa" },
  { pattern: /@clientsurge\.test/i, env: "internal" },
  { pattern: /@clientsurge-install\.internal/i, env: "internal" },
  { pattern: /example\.com/i, env: "internal" },
  { pattern: /demo/i, env: "demo" },
];

const VALID_ACTIVATION_STATUSES = ["not_ready","ready_for_approval","activated","paused"];

// ── Helpers ──
function normalizeServiceKey(raw) {
  if (!raw) return { canonical: "", wasAlias: false, original: raw };
  const k = raw.trim().toLowerCase();
  if (CANONICAL_KEYS.includes(k)) return { canonical: k, wasAlias: false, original: raw };
  if (LEGACY_ALIASES[k]) return { canonical: LEGACY_ALIASES[k], wasAlias: true, original: raw };
  return { canonical: k, wasAlias: false, original: raw };
}

function classifyEnvLabel(email, name, domain) {
  const candidates = [email, name, domain].filter(Boolean);
  for (const candidate of candidates) {
    for (const { pattern, env } of QA_PATTERNS) {
      if (pattern.test(candidate)) return env;
    }
  }
  return null;
}

// ── Blocker builder ──
function blocker(code, severity, message, entityName, recordId, extra = {}) {
return {
code, severity, message, entity_name: entityName, record_id: recordId || null,
order_id: extra.order_id || null,
client_project_id: extra.client_project_id || null,
customer_email: extra.customer_email || null,
business_name: extra.business_name || null,
environment_guess: extra.environment_guess || null,
fix_action: extra.fix_action || "",
};
}

function blockerLite(b) {
return {
code: b.code, severity: b.severity, message: b.message,
entity_name: b.entity_name, record_id: b.record_id,
order_id: b.order_id, customer_email: b.customer_email,
business_name: b.business_name, environment_guess: b.environment_guess,
fix_action: b.fix_action,
};
}

// ── Main handler ──
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { run_type = "full_audit", dry_run = true } = body;

    const adminEmail = user.email || "system";
    const startedAt = new Date().toISOString();

    // ── Accumulators ──
    const allBlockers = [];
    const allWarnings = [];
    let recordsUpdated = 0;
    const auditLogs = [];
    const recordsScanned = { Order: 0, ClientProject: 0, ClientInstallationOS: 0, AutomationChecklist: 0, MetricsSnapshot: 0, ConversionFunnel: 0, LaunchGate: 0 };
    let productionRecords = 0, nonProductionRecords = 0, unknownRecords = 0;

    function logAudit(action, entityName, recordId, before, after, notes) {
      auditLogs.push({
        admin_email: adminEmail, action, entity_name: entityName,
        record_id: recordId, before: JSON.stringify(before),
        after: JSON.stringify(after), timestamp: new Date().toISOString(), notes
      });
    }

    function addBlocker(b) { allBlockers.push(b); }

    function addWarning(w) { allWarnings.push(w); }

    // ═══════════════════════════════════════════
    // STEP 1 — Classify all Orders by environment
    // ═══════════════════════════════════════════
    const allOrders = await base44.asServiceRole.entities.Order.list('-created_date', 200);
    recordsScanned.Order = allOrders.length;

    for (const order of allOrders) {
      const envMatch = classifyEnvLabel(order.customer_email, order.customer_name, order.business_name);
      if (envMatch) {
        nonProductionRecords++;
        addBlocker(blocker(
          "QA_SMOKE_DEMO_RECORD_INCLUDED", "critical_blocker",
          `Order "${order.business_name || order.customer_email}" matches ${envMatch} pattern.`,
          "Order", order.id,
          { order_id: order.id, customer_email: order.customer_email, business_name: order.business_name, environment_guess: envMatch,
            fix_action: `Set environment="${envMatch}" and dashboard_excluded=true on this Order.` }
        ));
        if (!dry_run) {
          await base44.asServiceRole.entities.Order.update(order.id, {
            environment: envMatch,
            dashboard_excluded: true,
            dashboard_exclusion_reason: "Reconciliation auto-classified: " + envMatch + " pattern match",
            dashboard_truth_status: "blocked",
            dashboard_truth_notes: "Reconciliation " + startedAt + ": non-production (" + envMatch + ")"
          });
          logAudit("reconciliation_classify", "Order", order.id, { environment: order.environment || "unknown" }, { environment: envMatch, dashboard_excluded: true }, "Classified as " + envMatch);
          recordsUpdated++;
        }
      } else if (!order.environment || order.environment === "unknown") {
        unknownRecords++;
      } else if (order.environment === "production") {
        productionRecords++;
      } else {
        nonProductionRecords++;
      }
    }

    // ═══════════════════════════════════════════
    // STEP 2 — Paid orders: missing linkage checks
    // ═══════════════════════════════════════════
    const paidOrders = allOrders.filter(o => o.payment_status === "paid");

    for (const order of paidOrders) {
      const envGuess = classifyEnvLabel(order.customer_email, order.customer_name, order.business_name);
      const orderCtx = { order_id: order.id, customer_email: order.customer_email, business_name: order.business_name, environment_guess: envGuess || "unknown" };

      // 2a — Missing client_project_id
      if (!order.client_project_id) {
        addBlocker(blocker(
          "PAID_ORDER_MISSING_CLIENT_PROJECT", "critical_blocker",
          `Paid order "${order.business_name || order.customer_email}" has no client_project_id.`,
          "Order", order.id,
          { ...orderCtx, fix_action: "Create a ClientProject and link client_project_id on this Order." }
        ));
        if (!dry_run) {
          await base44.asServiceRole.entities.Order.update(order.id, {
            dashboard_truth_status: "blocked",
            dashboard_truth_notes: "Paid order missing client_project_id (" + startedAt + ")"
          });
          logAudit("reconciliation_block", "Order", order.id, {}, { dashboard_truth_status: "blocked" }, "Paid order missing client_project_id");
          recordsUpdated++;
        }
        continue; // skip further checks — no project to validate
      }

      // 2b — ClientProject exists?
      const projects = await base44.asServiceRole.entities.ClientProject.filter({ id: order.client_project_id }, '', 1);
      recordsScanned.ClientProject++;
      if (projects.length === 0) {
        addBlocker(blocker(
          "PAID_ORDER_CLIENT_PROJECT_NOT_FOUND", "critical_blocker",
          `Paid order references client_project_id="${order.client_project_id}" but no ClientProject exists.`,
          "ClientProject", order.client_project_id,
          { ...orderCtx, client_project_id: order.client_project_id,
            fix_action: "Create the missing ClientProject or fix the dangling client_project_id reference." }
        ));
        if (!dry_run) {
          await base44.asServiceRole.entities.Order.update(order.id, {
            dashboard_truth_status: "blocked",
            dashboard_truth_notes: "Dangling client_project_id: " + order.client_project_id
          });
          logAudit("reconciliation_dangling_project", "Order", order.id, {}, { dashboard_truth_status: "blocked" }, "ClientProject not found: " + order.client_project_id);
          recordsUpdated++;
        }
      }

      // 2c — Missing client_id
      if (!order.client_id) {
        addWarning(blocker(
          "PAID_ORDER_MISSING_CLIENT_ID", "launch_blocker",
          `Paid order has no client_id.`,
          "Order", order.id,
          { ...orderCtx, fix_action: "Link a Client record via client_id." }
        ));
      }

      // 2d — Missing onboarding_client / onboarding_client_id
      if (!order.onboarding_client_id) {
        addWarning(blocker(
          "PAID_ORDER_MISSING_ONBOARDING_CLIENT", "advisory",
          `Paid order has no onboarding_client_id.`,
          "Order", order.id,
          { ...orderCtx, fix_action: "Link an OnboardingClient record." }
        ));
      }
    }

    // ═══════════════════════════════════════════
    // STEP 3 — Live orders: automation checklist + metrics + funnel
    // ═══════════════════════════════════════════
    const liveOrders = allOrders.filter(o =>
      o.order_status === "fully_live" || o.order_status === "partially_live" || o.pipeline_status === "Live"
    );

    for (const order of liveOrders) {
      const envGuess = classifyEnvLabel(order.customer_email, order.customer_name, order.business_name);
      const orderCtx = { order_id: order.id, customer_email: order.customer_email, business_name: order.business_name, environment_guess: envGuess || "unknown", client_project_id: order.client_project_id };

      // 3a — AutomationChecklist check
      const checklists = await base44.asServiceRole.entities.AutomationChecklist.filter({ order_id: order.id }, '', 50);
      recordsScanned.AutomationChecklist += checklists.length;
      const activeCount = checklists.filter(c => c.status === "active").length;

      if (checklists.length === 0) {
        addBlocker(blocker(
          "LIVE_ORDER_MISSING_AUTOMATION_CHECKLIST", "launch_blocker",
          `Live order "${order.business_name || order.customer_email}" has zero AutomationChecklist records.`,
          "Order", order.id,
          { ...orderCtx, fix_action: "Create AutomationChecklist records for each purchased service." }
        ));
        if (!dry_run) {
          await base44.asServiceRole.entities.Order.update(order.id, {
            dashboard_truth_status: "blocked",
            dashboard_truth_notes: "Live order has zero automation checklists (" + startedAt + ")"
          });
          logAudit("reconciliation_no_checklists", "Order", order.id, {}, { dashboard_truth_status: "blocked" }, "Zero AutomationChecklist records");
          recordsUpdated++;
        }
      } else if (activeCount === 0 && checklists.some(c => c.status === "in_progress" || c.status === "not_started")) {
        addBlocker(blocker(
          "LIVE_ORDER_PENDING_AUTOMATION_CHECKLIST", "launch_blocker",
          `Live order has ${checklists.length} checklist(s) but none active.`,
          "Order", order.id,
          { ...orderCtx, fix_action: "Complete and activate pending automation checklists." }
        ));
      }

      // 3b — MetricsSnapshot: healthy but zero automations
      if (order.client_project_id) {
        const snapshots = await base44.asServiceRole.entities.MetricsSnapshot.filter({ client_project_id: order.client_project_id }, '-snapshot_date', 3);
        recordsScanned.MetricsSnapshot += snapshots.length;
        if (snapshots.length > 0) {
          const latest = snapshots[0];
          if (latest.system_health_status === "healthy" && (latest.automations_active === 0 || latest.automations_active == null)) {
            addBlocker(blocker(
              "LIVE_ORDER_HEALTHY_WITH_ZERO_AUTOMATIONS", "critical_blocker",
              `Live order MetricsSnapshot says healthy but automations_active=0.`,
              "MetricsSnapshot", latest.id,
              { ...orderCtx, fix_action: "Verify automations are running; update MetricsSnapshot." }
            ));
          }
          // Stale metrics (>24h)
          const snapDate = new Date(latest.snapshot_date);
          const hoursAgo = (Date.now() - snapDate.getTime()) / 3600000;
          if (hoursAgo > 24) {
            addWarning(blocker(
              "STALE_METRICS_SNAPSHOT", "advisory",
              `Latest MetricsSnapshot is ${Math.round(hoursAgo)}h old (>24h).`,
              "MetricsSnapshot", latest.id,
              { ...orderCtx, fix_action: "Run the metrics snapshot job." }
            ));
          }
        }

        // 3c — Missing ConversionFunnel
        const funnels = await base44.asServiceRole.entities.ConversionFunnel.filter({ client_project_id: order.client_project_id }, '', 3);
        recordsScanned.ConversionFunnel += funnels.length;
        if (funnels.length === 0) {
          addBlocker(blocker(
            "MISSING_CONVERSION_FUNNEL", "advisory",
            `No ConversionFunnel for client_project_id="${order.client_project_id}".`,
            "ConversionFunnel", null,
            { ...orderCtx, fix_action: "Compute ConversionFunnel for this client_project." }
          ));
        }
      }
    }

    // ═══════════════════════════════════════════
    // STEP 4 — Normalize service keys on AutomationChecklist
    // ═══════════════════════════════════════════
    const allChecklists = await base44.asServiceRole.entities.AutomationChecklist.list('-created_date', 200);
    recordsScanned.AutomationChecklist += allChecklists.length;

    for (const checklist of allChecklists) {
      const { canonical, wasAlias, original } = normalizeServiceKey(checklist.service_key);
      if (wasAlias && canonical !== checklist.service_key) {
        addBlocker(blocker(
          "LEGACY_SERVICE_KEY_NORMALIZED", "advisory",
          `AutomationChecklist service_key "${original}" normalized to "${canonical}".`,
          "AutomationChecklist", checklist.id,
          { order_id: checklist.order_id, business_name: checklist.business_name,
            fix_action: `Update service_key from "${original}" to "${canonical}".` }
        ));
        if (!dry_run) {
          await base44.asServiceRole.entities.AutomationChecklist.update(checklist.id, {
            service_key: canonical,
            dashboard_truth_notes: "Normalized from \"" + original + "\" to \"" + canonical + "\" (" + startedAt + ")"
          });
          logAudit("reconciliation_normalize_key", "AutomationChecklist", checklist.id,
            { service_key: original }, { service_key: canonical }, "Normalized service key");
          recordsUpdated++;
        }
      }
      // Check if the resulting canonical is actually in the canonical list
      if (!CANONICAL_KEYS.includes(canonical) && canonical !== "" && !Object.values(LEGACY_ALIASES).includes(canonical)) {
        addBlocker(blocker(
          "INVALID_OR_UNKNOWN_SERVICE_KEY", "launch_blocker",
          `AutomationChecklist has unrecognized service_key "${checklist.service_key}".`,
          "AutomationChecklist", checklist.id,
          { order_id: checklist.order_id, business_name: checklist.business_name,
            fix_action: "Correct the service_key to a canonical value or add it to the registry." }
        ));
      }
    }

    // ═══════════════════════════════════════════
    // STEP 5 — ClientInstallationOS validation
    // ═══════════════════════════════════════════
    const installOSRecords = await base44.asServiceRole.entities.ClientInstallationOS.list('-created_date', 100);
    recordsScanned.ClientInstallationOS = installOSRecords.length;

    for (const os of installOSRecords) {
      if (os.activation_status && !VALID_ACTIVATION_STATUSES.includes(os.activation_status)) {
        addBlocker(blocker(
          "INVALID_INSTALL_OS_STATUS", "launch_blocker",
          `ClientInstallationOS has non-canonical activation_status "${os.activation_status}".`,
          "ClientInstallationOS", os.id,
          { order_id: os.order_id, business_name: os.business_name,
            fix_action: `Reset activation_status from "${os.activation_status}" to "not_ready".` }
        ));
        if (!dry_run) {
          await base44.asServiceRole.entities.ClientInstallationOS.update(os.id, {
            activation_status: "not_ready",
            dashboard_truth_status: "warning",
            dashboard_truth_notes: "Non-canonical activation_status \"" + os.activation_status + "\" reset to not_ready (" + startedAt + ")"
          });
          logAudit("reconciliation_fix_activation", "ClientInstallationOS", os.id,
            { activation_status: os.activation_status }, { activation_status: "not_ready" }, "Reset to not_ready");
          recordsUpdated++;
        }
      }
    }

    // Check live orders with no InstallOS
    for (const order of liveOrders) {
      const osForOrder = installOSRecords.filter(o => o.order_id === order.id);
      if (osForOrder.length === 0) {
        addBlocker(blocker(
          "MISSING_INSTALL_OS", "launch_blocker",
          `Live order "${order.business_name || order.customer_email}" has no ClientInstallationOS record.`,
          "Order", order.id,
          { order_id: order.id, customer_email: order.customer_email, business_name: order.business_name,
            client_project_id: order.client_project_id, environment_guess: classifyEnvLabel(order.customer_email, order.customer_name, order.business_name) || "unknown",
            fix_action: "Create a ClientInstallationOS record for this order." }
        ));
      }
    }

    // ═══════════════════════════════════════════
    // STEP 6 — LaunchGate check
    // ═══════════════════════════════════════════
    const launchGates = await base44.asServiceRole.entities.LaunchGate.list('', 50);
    recordsScanned.LaunchGate = launchGates.length;
    if (launchGates.length === 0) {
      addBlocker(blocker(
        "EMPTY_LAUNCH_GATES", "launch_blocker",
        "No LaunchGate records exist. Seed them before marking anything live.",
        "LaunchGate", null,
        { fix_action: "Run seedLaunchGates to create the 12 canonical gates." }
      ));
    }
    // Check for gates that are still locked/blocked
    for (const gate of launchGates) {
      if (gate.status === "locked" || gate.status === "blocked") {
        addWarning(blocker(
          "EMPTY_LAUNCH_GATES", "advisory",
          `LaunchGate "${gate.gate_name}" is still ${gate.status}.`,
          "LaunchGate", gate.id,
          { fix_action: gate.next_action || "Complete the required proofs for this gate." }
        ));
      }
    }

    // ═══════════════════════════════════════════
    // STEP 7 — Missing provider health proof (heuristic)
    // ═══════════════════════════════════════════
    const metricsSnapshots = await base44.asServiceRole.entities.MetricsSnapshot.list('-snapshot_date', 50);
    recordsScanned.MetricsSnapshot = Math.max(recordsScanned.MetricsSnapshot, metricsSnapshots.length);
    let healthyWithIntegrations = 0;
    for (const ms of metricsSnapshots) {
      if (ms.system_health_status === "healthy" && ms.integrations_healthy && ms.integrations_healthy.length > 0) {
        healthyWithIntegrations++;
      }
    }
    if (healthyWithIntegrations === 0 && metricsSnapshots.length > 0) {
      addWarning(blocker(
        "MISSING_PROVIDER_HEALTH_PROOF", "advisory",
        "No MetricsSnapshot shows healthy with active integrations. Provider health unproven.",
        "MetricsSnapshot", null,
        { fix_action: "Verify provider integrations (Twilio, Resend) and update MetricsSnapshot." }
      ));
    }

    // ═══════════════════════════════════════════
    // STEP 8 — Write DashboardTruthCheck rows (apply mode only)
    // ═══════════════════════════════════════════
    if (!dry_run) {
      // Write for each paid order
      for (const order of paidOrders) {
        const orderBlockers = allBlockers.filter(b => b.order_id === order.id || b.record_id === order.id);
        const orderWarnings = allWarnings.filter(w => w.order_id === order.id || w.record_id === order.id);

        await base44.asServiceRole.entities.DashboardTruthCheck.create({
          order_id: order.id,
          client_id: order.client_id || null,
          client_project_id: order.client_project_id || null,
          customer_email: order.customer_email,
          business_name: order.business_name,
          environment: order.environment || classifyEnvLabel(order.customer_email, order.customer_name, order.business_name) || "unknown",
          scope: "order",
          truth_status: orderBlockers.length > 0 ? "blocked" : (orderWarnings.length > 0 ? "warning" : "trusted"),
          safe_to_show_client: orderBlockers.length === 0,
          safe_to_show_admin: true,
          safe_to_launch: orderBlockers.length === 0 && orderWarnings.length === 0,
          blocker_count: orderBlockers.length,
          warning_count: orderWarnings.length,
          blockers: orderBlockers.map(b => ({ code: b.code, severity: b.severity, message: b.message, entity_name: b.entity_name, record_id: b.record_id, fix_action: b.fix_action })),
          warnings: orderWarnings.map(w => ({ code: w.code, severity: w.severity, message: w.message, entity_name: w.entity_name, record_id: w.record_id, fix_action: w.fix_action })),
          evidence_summary: orderBlockers.map(b => b.code).join(", ") || "No blockers",
          last_checked_at: startedAt
        });
        recordsUpdated++;
      }
    }

    // ═══════════════════════════════════════════
    // STEP 9 — Build details_json
    // ═══════════════════════════════════════════
    const byCode = {};
    for (const b of allBlockers) { byCode[b.code] = (byCode[b.code] || 0) + 1; }
    for (const w of allWarnings) { byCode[w.code] = (byCode[w.code] || 0) + 1; }

    const topNextActions = [
      ...new Set(allBlockers.filter(b => b.fix_action).map(b => b.fix_action))
    ].slice(0, 10);

    // Group blockers by code for truncated output
    const blockersByCode = {};
    for (const b of allBlockers) {
      if (!blockersByCode[b.code]) blockersByCode[b.code] = [];
      blockersByCode[b.code].push(blockerLite(b));
    }
    const warningsByCode = {};
    for (const w of allWarnings) {
      if (!warningsByCode[w.code]) warningsByCode[w.code] = [];
      warningsByCode[w.code].push(blockerLite(w));
    }

    // Truncate: keep max 3 examples per code in the full arrays to stay under field size limits
    const truncatedBlockers = [];
    const truncatedWarnings = [];
    for (const [code, items] of Object.entries(blockersByCode)) {
      truncatedBlockers.push(...items.slice(0, 3));
    }
    for (const [code, items] of Object.entries(warningsByCode)) {
      truncatedWarnings.push(...items.slice(0, 3));
    }

    const detailsJson = {
      dry_run,
      run_type,
      summary: {
        total_records_checked: Object.values(recordsScanned).reduce((a, b) => a + b, 0),
        records_updated: dry_run ? 0 : recordsUpdated,
        blockers_found: allBlockers.length,
        warnings_found: allWarnings.length,
        production_records: productionRecords,
        non_production_records: nonProductionRecords,
        unknown_environment_records: unknownRecords,
      },
      blockers: truncatedBlockers,
      warnings: truncatedWarnings,
      by_code: byCode,
      top_next_actions: topNextActions,
      records_scanned: recordsScanned,
      _note: "Blockers/warnings arrays contain 3 examples per code. Use by_code for full counts. Full per-record details available in DashboardTruthCheck rows after apply mode.",
    };

    // ═══════════════════════════════════════════
    // STEP 10 — Write ReconciliationRun
    // ═══════════════════════════════════════════
    const totalChecked = Object.values(recordsScanned).reduce((a, b) => a + b, 0);

    const run = await base44.asServiceRole.entities.ReconciliationRun.create({
      run_type,
      status: allBlockers.length > 0 ? "completed_with_blockers" : "completed",
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      total_records_checked: totalChecked,
      records_updated: dry_run ? 0 : recordsUpdated,
      blockers_found: allBlockers.length,
      warnings_found: allWarnings.length,
      safe_summary: dry_run
        ? "DRY RUN: " + allBlockers.length + " blockers, " + allWarnings.length + " warnings found. No writes made."
        : allBlockers.length + " blockers, " + allWarnings.length + " warnings. " + recordsUpdated + " records updated.",
      details_json: JSON.stringify(detailsJson),
      triggered_by: adminEmail
    });

    // ═══════════════════════════════════════════
    // STEP 11 — Write AuditLog records (apply mode only)
    // ═══════════════════════════════════════════
    if (!dry_run && auditLogs.length > 0) {
      for (const log of auditLogs) {
        await base44.asServiceRole.entities.AuditLog.create(log);
      }
    }

    return Response.json({
      reconciliation_run_id: run.id,
      run_type,
      dry_run,
      total_records_checked: totalChecked,
      records_updated: dry_run ? 0 : recordsUpdated,
      blockers_found: allBlockers.length,
      warnings_found: allWarnings.length,
      summary: run.safe_summary
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});