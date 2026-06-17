import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CANONICAL_KEYS = [
  "instant_lead_response","missed_call_text_back","nurture_sequence_14d",
  "ai_booking_agent","daily_lead_digest","inbound_sms_assistant",
  "ai_voice_receptionist","lead_reactivation","review_request"
];

const LEGACY_ALIASES = {
  missed_call_textback:"missed_call_text_back", appointment_booking:"ai_booking_agent",
  followup_sequences:"nurture_sequence_14d", follow_up_sequences:"nurture_sequence_14d",
  nurture_sequence:"nurture_sequence_14d", lead_reactivation_sequence:"lead_reactivation",
  booking_automation:"ai_booking_agent", win_back:"lead_reactivation",
  review_automation:"review_request", voice_receptionist:"ai_voice_receptionist",
};

const QA_PATTERNS = [/smoke/i,/proof/i,/test/i,/qa/i,/runtime\.checkout/i,/webhook-proof/i,/@clientsurge\.test/i,/@clientsurge-install\.internal/i,/example\.com/i,/demo/i];
const ENV_LABELS = ["smoke","qa","qa","qa","qa","qa","internal","internal","internal","demo"];

function normalizeServiceKey(raw) {
  if (!raw) return { canonical: "", wasAlias: false };
  const k = raw.trim().toLowerCase();
  if (CANONICAL_KEYS.includes(k)) return { canonical: k, wasAlias: false };
  if (LEGACY_ALIASES[k]) return { canonical: LEGACY_ALIASES[k], wasAlias: true };
  return { canonical: k, wasAlias: false };
}

function classifyEnvLabel(email, name, domain) {
  for (const c of [email, name, domain].filter(Boolean)) {
    for (let i = 0; i < QA_PATTERNS.length; i++) {
      if (QA_PATTERNS[i].test(c)) return ENV_LABELS[i];
    }
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { run_type = "full_audit", dry_run = true } = body;

    const adminEmail = user.email || "system";
    const startedAt = new Date().toISOString();
    let totalChecked = 0;
    let recordsUpdated = 0;
    let blockersFound = 0;
    let warningsFound = 0;
    const auditLogs = [];

    function logAudit(action, entityName, recordId, before, after, notes) {
      auditLogs.push({
        admin_email: adminEmail, action, entity_name: entityName,
        record_id: recordId, before: JSON.stringify(before),
        after: JSON.stringify(after), timestamp: new Date().toISOString(), notes
      });
    }

    // STEP 1: Scan Orders for non-production
    const allOrders = await base44.asServiceRole.entities.Order.list('-created_date', 200);
    totalChecked += allOrders.length;

    for (const order of allOrders) {
      const envMatch = classifyEnvLabel(order.customer_email, order.customer_name, order.business_name);
      if (envMatch) {
        if (!dry_run) {
          await base44.asServiceRole.entities.Order.update(order.id, {
            environment: envMatch,
            dashboard_excluded: true,
            dashboard_exclusion_reason: "Auto-classified: " + envMatch + " pattern",
            dashboard_truth_status: "blocked",
            dashboard_truth_notes: "Reconciliation " + startedAt + ": classified as " + envMatch
          });
          logAudit("reconciliation_classify", "Order", order.id,
            { environment: order.environment }, { environment: envMatch }, "Classified as " + envMatch);
          recordsUpdated++;
        }
        blockersFound++;
      }
    }

    // STEP 2: Paid orders with missing client_project_id
    const paidOrders = allOrders.filter(o => o.payment_status === "paid");
    for (const order of paidOrders) {
      if (!order.client_project_id) {
        blockersFound++;
        if (!dry_run) {
          await base44.asServiceRole.entities.Order.update(order.id, {
            dashboard_truth_status: "blocked",
            dashboard_truth_notes: "Paid order missing client_project_id (" + startedAt + ")"
          });
          logAudit("reconciliation_block", "Order", order.id, {},
            { dashboard_truth_status: "blocked" }, "Paid order missing client_project_id");
          recordsUpdated++;
        }
      }
    }

    // STEP 3: Live orders missing automation checklists
    const liveOrders = allOrders.filter(o =>
      o.order_status === "fully_live" || o.order_status === "partially_live" || o.pipeline_status === "Live"
    );
    for (const order of liveOrders) {
      const checklists = await base44.asServiceRole.entities.AutomationChecklist.filter({ order_id: order.id }, '', 50);
      const activeCount = checklists.filter(c => c.status === "active").length;
      if (checklists.length === 0) {
        blockersFound++;
        if (!dry_run) {
          await base44.asServiceRole.entities.Order.update(order.id, {
            dashboard_truth_status: "blocked",
            dashboard_truth_notes: "Live order has zero automation checklists"
          });
          logAudit("reconciliation_no_checklists", "Order", order.id, {},
            { dashboard_truth_status: "blocked" }, "No AutomationChecklist records");
          recordsUpdated++;
        }
      } else if (activeCount === 0) {
        warningsFound++;
      }
    }

    // STEP 4: Normalize service keys on AutomationChecklist
    const allChecklists = await base44.asServiceRole.entities.AutomationChecklist.list('-created_date', 200);
    totalChecked += allChecklists.length;

    for (const checklist of allChecklists) {
      const { canonical, wasAlias } = normalizeServiceKey(checklist.service_key);
      if (wasAlias && canonical !== checklist.service_key) {
        warningsFound++;
        if (!dry_run) {
          await base44.asServiceRole.entities.AutomationChecklist.update(checklist.id, {
            service_key: canonical,
            dashboard_truth_notes: "Normalized from \"" + checklist.service_key + "\" to \"" + canonical + "\""
          });
          logAudit("reconciliation_normalize_key", "AutomationChecklist", checklist.id,
            { service_key: checklist.service_key }, { service_key: canonical }, "Normalized service key");
          recordsUpdated++;
        }
      }
    }

    // STEP 5: Check ClientInstallationOS activation_status
    const installOSRecords = await base44.asServiceRole.entities.ClientInstallationOS.list('-created_date', 100);
    totalChecked += installOSRecords.length;
    const validStatuses = ["not_ready","ready_for_approval","activated","paused"];

    for (const os of installOSRecords) {
      if (os.activation_status && !validStatuses.includes(os.activation_status)) {
        blockersFound++;
        if (!dry_run) {
          await base44.asServiceRole.entities.ClientInstallationOS.update(os.id, {
            activation_status: "not_ready",
            dashboard_truth_status: "warning",
            dashboard_truth_notes: "Non-canonical activation_status reset to not_ready"
          });
          logAudit("reconciliation_fix_activation", "ClientInstallationOS", os.id,
            { activation_status: os.activation_status }, { activation_status: "not_ready" }, "Reset to not_ready");
          recordsUpdated++;
        }
      }
    }

    // STEP 6: Write DashboardTruthCheck rows
    if (!dry_run) {
      for (const order of paidOrders.filter(o => !o.client_project_id)) {
        await base44.asServiceRole.entities.DashboardTruthCheck.create({
          order_id: order.id,
          customer_email: order.customer_email,
          business_name: order.business_name,
          environment: order.environment || "unknown",
          scope: "order",
          truth_status: "blocked",
          safe_to_show_client: false,
          safe_to_show_admin: true,
          safe_to_launch: false,
          blocker_count: 1,
          warning_count: 0,
          blockers: [{ code: "BLOCK_PAID_NO_PROJECT", severity: "critical_blocker", message: "Paid order has no linked ClientProject.", entity_name: "Order", record_id: order.id, fix_action: "Create ClientProject and link client_project_id" }],
          warnings: [],
          evidence_summary: "Paid order missing client_project_id",
          last_checked_at: startedAt
        });
        recordsUpdated++;
      }
    }

    // STEP 7: Write ReconciliationRun
    const run = await base44.asServiceRole.entities.ReconciliationRun.create({
      run_type,
      status: blockersFound > 0 ? "completed_with_blockers" : "completed",
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      total_records_checked: totalChecked,
      records_updated: dry_run ? 0 : recordsUpdated,
      blockers_found: blockersFound,
      warnings_found: warningsFound,
      safe_summary: dry_run
        ? "DRY RUN: " + blockersFound + " blockers, " + warningsFound + " warnings found. No writes made."
        : blockersFound + " blockers, " + warningsFound + " warnings. " + recordsUpdated + " records updated.",
      details_json: JSON.stringify({ dry_run, run_type }),
      triggered_by: adminEmail
    });

    // STEP 8: Write AuditLog records
    if (!dry_run) {
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
      blockers_found: blockersFound,
      warnings_found: warningsFound,
      summary: run.safe_summary
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});