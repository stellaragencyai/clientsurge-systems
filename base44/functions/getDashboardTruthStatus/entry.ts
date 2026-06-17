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

function normalizeServiceKey(raw) {
  if (!raw) return { canonical: "", wasAlias: false };
  const k = raw.trim().toLowerCase();
  if (CANONICAL_KEYS.includes(k)) return { canonical: k, wasAlias: false };
  if (LEGACY_ALIASES[k]) return { canonical: LEGACY_ALIASES[k], wasAlias: true };
  return { canonical: k, wasAlias: false };
}

function classifyEnv(email, name, domain) {
  for (const c of [email, name, domain].filter(Boolean)) {
    for (const p of QA_PATTERNS) { if (p.test(c)) return true; }
  }
  return false;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    
    const body = await req.json().catch(() => ({}));
    const { order_id, client_project_id, customer_email, include_non_production } = body;

    const results = { truth_status: "unknown", safe_to_show_client: false, safe_to_show_admin: false, safe_to_launch: false, blockers: [], warnings: [], customer_action_required: [], admin_action_required: [], normalized_services: [], source_records: {}, evidence_summary: "" };
    const evidence = [];

    // --- Load order ---
    let order = null;
    if (order_id) {
      const orders = await base44.asServiceRole.entities.Order.filter({ id: order_id });
      order = orders[0] || null;
      if (order) results.source_records.order = order;
    }
    
    // Fallback: search by client_project_id
    if (!order && client_project_id) {
      const orders = await base44.asServiceRole.entities.Order.filter({ client_project_id }, '', 5);
      order = orders[0] || null;
      if (order) results.source_records.order = order;
    }

    // --- Rule G: Block non-production ---
    const env = order?.environment || "unknown";
    const isQa = classifyEnv(order?.customer_email, order?.customer_name, order?.business_name) || ["qa","smoke","demo","internal"].includes(env);
    if (isQa && !include_non_production) {
      results.blockers.push({ code: "BLOCK_NON_PRODUCTION", severity: "critical_blocker", message: "Order classified as non-production (QA/demo/internal). Excluded from client dashboard.", entity_name: "Order", record_id: order?.id, fix_action: "Set environment=production or use include_non_production=true" });
      results.truth_status = "blocked";
      results.safe_to_show_client = false;
      results.safe_to_show_admin = true;
      results.safe_to_launch = false;
      results.evidence_summary = evidence.join("; ");
      return Response.json(results);
    }

    // --- Rule A: Paid but missing client_project_id ---
    if (order && order.payment_status === "paid" && !order.client_project_id) {
      results.blockers.push({ code: "BLOCK_PAID_NO_PROJECT", severity: "critical_blocker", message: "Order is paid but has no linked ClientProject.", entity_name: "Order", record_id: order.id, fix_action: "Create a ClientProject and link client_project_id on the Order." });
      results.truth_status = "blocked";
      results.safe_to_show_client = false;
      results.safe_to_launch = false;
    }

    // --- Rule B: Paid but ClientProject doesn't exist ---
    let project = null;
    if (order?.client_project_id) {
      const projects = await base44.asServiceRole.entities.ClientProject.filter({ id: order.client_project_id });
      project = projects[0] || null;
      if (project) results.source_records.client_project = project;
    }
    if (order?.payment_status === "paid" && order.client_project_id && !project) {
      results.blockers.push({ code: "BLOCK_PAID_PROJECT_MISSING", severity: "critical_blocker", message: `Order references client_project_id=${order.client_project_id} but no ClientProject record found.`, entity_name: "ClientProject", record_id: order.client_project_id, fix_action: "Create the missing ClientProject or remove the dangling reference." });
    }

    // --- Rule C: Live order with missing/pending automation checklists ---
    const isLive = order?.order_status === "fully_live" || order?.order_status === "partially_live" || order?.pipeline_status === "Live";
    if (isLive) {
      const checklists = await base44.asServiceRole.entities.AutomationChecklist.filter({ order_id: order.id }, '', 50);
      results.source_records.automation_checklists = checklists;
      
      const purchasedServices = order?.pricing_summary?.selected_service_keys || order?.pricing_summary?.package_service_keys || [];
      const checklistKeys = checklists.map(c => c.service_key);
      
      for (const sk of purchasedServices) {
        const { canonical, wasAlias } = normalizeServiceKey(sk);
        if (!checklistKeys.includes(canonical) && !checklistKeys.includes(sk)) {
          results.blockers.push({ code: "BLOCK_LIVE_NO_CHECKLIST", severity: "launch_blocker", message: `Live order missing AutomationChecklist for service: ${canonical}`, entity_name: "AutomationChecklist", record_id: null, fix_action: `Create AutomationChecklist record for ${canonical}` });
        }
      }
      
      const pendingChecklists = checklists.filter(c => c.status !== "active" && c.status !== "failed");
      if (pendingChecklists.length > 0) {
        results.warnings.push({ code: "WARN_LIVE_PENDING_CHECKLISTS", severity: "launch_blocker", message: `${pendingChecklists.length} automation checklists not active for live order.`, entity_name: "AutomationChecklist", record_id: pendingChecklists[0]?.id, fix_action: "Complete and activate pending automation checklists." });
      }
    }

    // --- Rule D/E: Service key normalization ---
    const allServiceKeys = [...(order?.pricing_summary?.selected_service_keys || []), ...(order?.pricing_summary?.package_service_keys || [])];
    for (const sk of allServiceKeys) {
      const { canonical, wasAlias } = normalizeServiceKey(sk);
      if (wasAlias) {
        results.warnings.push({ code: "WARN_LEGACY_SERVICE_KEY", severity: "advisory", message: `Service key "${sk}" is a legacy alias for "${canonical}".`, entity_name: "Order", record_id: order?.id, fix_action: `Update service key to canonical: ${canonical}` });
      }
      if (!CANONICAL_KEYS.includes(canonical) && !Object.values(LEGACY_ALIASES).includes(canonical)) {
        results.blockers.push({ code: "BLOCK_INVALID_SERVICE_KEY", severity: "launch_blocker", message: `Unrecognized service key: "${sk}"`, entity_name: "Order", record_id: order?.id, fix_action: "Correct the service key or add it to the canonical registry." });
      }
      if (!results.normalized_services.includes(canonical)) {
        results.normalized_services.push(canonical);
      }
    }

    // --- Rule F: Missing client_id but email-linked project exists ---
    if (!order?.client_id && order?.customer_email) {
      const clientsByEmail = await base44.asServiceRole.entities.Client.filter({ email: order.customer_email }, '', 5);
      if (clientsByEmail.length > 0) {
        results.warnings.push({ code: "WARN_MISSING_CLIENT_LINK", severity: "advisory", message: "Order has no client_id but a Client record exists with matching email.", entity_name: "Order", record_id: order?.id, fix_action: `Link client_id=${clientsByEmail[0].id} on the Order.` });
      }
    }

    // --- Rule H: MetricsSnapshot healthy but automations_active=0 ---
    const cpId = order?.client_project_id || client_project_id;
    if (cpId) {
      const snapshots = await base44.asServiceRole.entities.MetricsSnapshot.filter({ client_project_id: cpId }, '-snapshot_date', 3);
      results.source_records.metrics_snapshots = snapshots;
      if (snapshots.length > 0) {
        const latest = snapshots[0];
        if (latest.system_health_status === "healthy" && latest.automations_active === 0) {
          results.blockers.push({ code: "BLOCK_HEALTHY_BUT_NO_AUTOMATIONS", severity: "critical_blocker", message: "MetricsSnapshot says healthy but automations_active=0.", entity_name: "MetricsSnapshot", record_id: latest.id, fix_action: "Verify automations are actually running and update MetricsSnapshot." });
        }
        // Rule I: Stale metrics
        const snapDate = new Date(latest.snapshot_date);
        const hoursAgo = (Date.now() - snapDate.getTime()) / 3600000;
        if (hoursAgo > 24) {
          results.warnings.push({ code: "WARN_STALE_METRICS", severity: "advisory", message: `Latest MetricsSnapshot is ${Math.round(hoursAgo)}h old (>24h stale).`, entity_name: "MetricsSnapshot", record_id: latest.id, fix_action: "Run the metrics snapshot job." });
        }
      }

      // --- Rule J: Missing ConversionFunnel ---
      const funnels = await base44.asServiceRole.entities.ConversionFunnel.filter({ client_project_id: cpId }, '', 3);
      results.source_records.conversion_funnels = funnels;
      if (funnels.length === 0) {
        results.blockers.push({ code: "BLOCK_NO_CONVERSION_FUNNEL", severity: "advisory", message: "No ConversionFunnel record exists for this client_project.", entity_name: "ConversionFunnel", record_id: null, fix_action: "Compute ConversionFunnel for this client_project." });
      }
    }

    // --- Rule K: ClientInstallationOS activation_status ---
    if (order?.id) {
      const installOS = await base44.asServiceRole.entities.ClientInstallationOS.filter({ order_id: order.id }, '', 5);
      if (installOS.length > 0) {
        results.source_records.installation_os = installOS[0];
        const validStatuses = ["not_ready","ready_for_approval","activated","paused"];
        if (!validStatuses.includes(installOS[0].activation_status)) {
          results.blockers.push({ code: "BLOCK_INVALID_ACTIVATION_STATUS", severity: "launch_blocker", message: `ClientInstallationOS has non-canonical activation_status: "${installOS[0].activation_status}"`, entity_name: "ClientInstallationOS", record_id: installOS[0].id, fix_action: "Set activation_status to a canonical value." });
        }
      } else if (isLive) {
        results.warnings.push({ code: "WARN_NO_INSTALL_OS", severity: "launch_blocker", message: "Live order has no ClientInstallationOS record.", entity_name: "ClientInstallationOS", record_id: null, fix_action: "Create ClientInstallationOS for this order." });
      }
    }

    // --- Rule L: Missing support/qa status on ClientProject ---
    if (project && (!project.support_status || project.support_status === "No Open Issues")) {
      // Not a blocker, just informational
    }

    // --- Final assessment ---
    if (results.blockers.length > 0) {
      results.truth_status = "blocked";
    } else if (results.warnings.length > 0) {
      results.truth_status = "warning";
    } else {
      results.truth_status = "trusted";
    }

    results.safe_to_show_admin = true;
    results.safe_to_show_client = results.truth_status !== "blocked" && !isQa;
    results.safe_to_launch = results.truth_status === "trusted" && results.blockers.length === 0;
    results.evidence_summary = evidence.join("; ") || `Truth check completed: ${results.truth_status}`;

    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});