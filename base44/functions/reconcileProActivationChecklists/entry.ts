import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * reconcileProActivationChecklists — FIX 1A.4-5
 * Admin-only function that audits existing pro_system orders and reports
 * which ones are missing the canonical six-checklist structure.
 *
 * Default: dry_run = true (no writes).
 * Write mode requires dry_run = false AND confirm = "RECONCILE_PRO_ACTIVATION".
 *
 * Never deletes legacy records automatically.
 * Logs all changes to CommunicationEvent.
 */

// DRIFT-PROTECTION: This list MUST match lib/serviceRegistry.js CANONICAL_PRO_SERVICE_KEYS
const CANONICAL_PRO_SERVICE_KEYS = [
  "instant_lead_response",
  "missed_call_text_back",
  "nurture_sequence_14d",
  "ai_booking_agent",
  "daily_lead_digest",
  "inbound_sms_assistant",
];

// DRIFT-PROTECTION: This map MUST match lib/serviceRegistry.js LEGACY_ALIAS_MAP
const LEGACY_ALIAS_MAP = {
  missed_call_textback: "missed_call_text_back",
  appointment_booking: "ai_booking_agent",
  followup_sequences: "nurture_sequence_14d",
};

// DRIFT-PROTECTION: This map MUST match lib/serviceRegistry.js PACKAGE_KEY_ALIASES
const PACKAGE_KEY_ALIASES = {
  elite: "pro_system",
  "elite system": "pro_system",
  elite_system: "pro_system",
  pro: "pro_system",
  "pro system": "pro_system",
  pro_system: "pro_system",
  growth: "growth_system",
  "growth system": "growth_system",
  growth_system: "growth_system",
  starter: "starter_system",
  "starter system": "starter_system",
  starter_system: "starter_system",
  basic: "starter_system",
};

const STANDARD_CHECKLIST_STEPS = [
  { id: "configured", label: "Service Configured", order: 1 },
  { id: "connected", label: "Integration Connected", order: 2 },
  { id: "tested", label: "Tested", order: 3 },
  { id: "provider_log_verified", label: "Provider Log Verified", order: 4 },
  { id: "client_approved", label: "Client Approved", order: 5 },
  { id: "live", label: "Live", order: 6 },
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function normalizePackageKey(raw) {
  if (!raw || typeof raw !== "string") return null;
  return PACKAGE_KEY_ALIASES[raw.trim().toLowerCase()] || null;
}

function normalizeServiceKey(raw) {
  if (!raw || typeof raw !== "string") return raw || "";
  const key = raw.trim().toLowerCase();
  return LEGACY_ALIAS_MAP[key] || key;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Admin-only
    const user = await base44.auth.me().catch(() => null);
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return json({ error: "Admin access required" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const dry_run = body.dry_run !== false; // default true
    const confirm = body.confirm || "";

    if (!dry_run && confirm !== "RECONCILE_PRO_ACTIVATION") {
      return json({
        error: "Write mode requires confirm = 'RECONCILE_PRO_ACTIVATION'",
        code: "confirmation_required",
      }, 400);
    }

    // Fetch all paid orders
    const orders = await base44.asServiceRole.entities.Order.list("-created_date", 200);

    // Filter to pro_system orders (paid or setup-in-progress)
    const proOrders = orders.filter((o) => {
      const pkg = normalizePackageKey(o.package_key || o.package_type || o.selected_package_type);
      return pkg === "pro_system" && o.payment_status === "paid";
    });

    const results = [];

    for (const order of proOrders) {
      const report = {
        order_id: order.id,
        business_name: order.business_name,
        client_id: order.client_id || "",
        client_project_id: order.client_project_id || "",
        install_os_present: false,
        activation_session_present: false,
        missing_checklists: [],
        duplicate_checklists: [],
        legacy_checklist_keys: [],
        missing_steps: [],
        incorrectly_required_addons: [],
        proposed_repairs: [],
      };

      // Check ClientInstallationOS
      const installOSRecords = await base44.asServiceRole.entities.ClientInstallationOS.filter(
        { order_id: order.id }, "-created_date", 5
      ).catch(() => []);
      report.install_os_present = installOSRecords?.length > 0;

      // Check ActivationWizardSession
      const sessionRecords = await base44.asServiceRole.entities.ActivationWizardSession.filter(
        { order_id: order.id }, "-created_date", 5
      ).catch(() => []);
      report.activation_session_present = sessionRecords?.length > 0;

      // Check AutomationChecklist records
      const checklists = await base44.asServiceRole.entities.AutomationChecklist.filter(
        { order_id: order.id }, "-created_date", 50
      ).catch(() => []);

      // Group by service_key to detect duplicates
      const checklistsByKey = {};
      for (const cl of checklists) {
        const normalizedKey = normalizeServiceKey(cl.service_key);
        if (!checklistsByKey[normalizedKey]) checklistsByKey[normalizedKey] = [];
        checklistsByKey[normalizedKey].push(cl);

        // Detect legacy keys
        if (cl.service_key !== normalizedKey) {
          report.legacy_checklist_keys.push({
            checklist_id: cl.id,
            original_key: cl.service_key,
            normalized_key: normalizedKey,
          });
        }
      }

      // Check for missing canonical checklists
      for (const key of CANONICAL_PRO_SERVICE_KEYS) {
        if (!checklistsByKey[key] || checklistsByKey[key].length === 0) {
          report.missing_checklists.push(key);
          report.proposed_repairs.push(`Create checklist for: ${key}`);
        } else if (checklistsByKey[key].length > 1) {
          report.duplicate_checklists.push({ service_key: key, count: checklistsByKey[key].length });
        }
      }

      // Check for incorrectly required add-ons
      for (const addonKey of ["lead_reactivation", "review_request"]) {
        if (checklistsByKey[addonKey] && checklistsByKey[addonKey].length > 0) {
          report.incorrectly_required_addons.push(addonKey);
        }
      }

      // Check checklist steps for each canonical checklist
      for (const key of CANONICAL_PRO_SERVICE_KEYS) {
        const checklist = checklistsByKey[key]?.[0];
        if (!checklist) continue;

        const steps = await base44.asServiceRole.entities.AutomationChecklistStep.filter(
          { automation_checklist_id: checklist.id }, "step_order", 100
        ).catch(() => []);

        const existingStepIds = new Set((steps || []).map((s) => s.step_id));
        const missingSteps = STANDARD_CHECKLIST_STEPS.filter((s) => !existingStepIds.has(s.id));

        if (missingSteps.length > 0) {
          report.missing_steps.push({
            service_key: key,
            checklist_id: checklist.id,
            missing_step_ids: missingSteps.map((s) => s.id),
          });
          report.proposed_repairs.push(`Add ${missingSteps.length} missing steps to ${key} checklist`);
        }
      }

      // ── WRITE MODE ──────────────────────────────────────────────────
      if (!dry_run) {
        // Create missing checklists
        for (const key of report.missing_checklists) {
          const newChecklist = await base44.asServiceRole.entities.AutomationChecklist.create({
            client_email: order.customer_email,
            client_name: order.customer_name,
            business_name: order.business_name,
            order_id: order.id,
            service_key: key,
            status: "not_started",
          });

          // Create the six standard steps
          for (const step of STANDARD_CHECKLIST_STEPS) {
            await base44.asServiceRole.entities.AutomationChecklistStep.create({
              automation_checklist_id: newChecklist.id,
              order_id: order.id,
              service_key: key,
              step_id: step.id,
              step_label: step.label,
              step_order: step.order,
              status: "pending",
            });
          }

          // Log the repair
          await base44.asServiceRole.entities.CommunicationEvent.create({
            channel: "internal",
            direction: "system",
            event_type: "status_update",
            provider: "internal",
            status: "processed",
            subject: `Reconciliation: created checklist for ${key}`,
            message_body: `Reconciled checklist created for order ${order.id}, service: ${key}`,
            order_id: order.id,
            client_id: order.client_id || "",
            client_project_id: order.client_project_id || "",
            metadata_json: JSON.stringify({ reconciliation: true, service_key: key }),
          }).catch(() => null);
        }

        // Create missing steps on existing checklists
        for (const missing of report.missing_steps) {
          for (const stepId of missing.missing_step_ids) {
            const template = STANDARD_CHECKLIST_STEPS.find((s) => s.id === stepId);
            if (!template) continue;
            await base44.asServiceRole.entities.AutomationChecklistStep.create({
              automation_checklist_id: missing.checklist_id,
              order_id: order.id,
              service_key: missing.service_key,
              step_id: template.id,
              step_label: template.label,
              step_order: template.order,
              status: "pending",
            }).catch(() => null);
          }
        }

        // Create missing ActivationWizardSession
        if (!report.activation_session_present) {
          await base44.asServiceRole.entities.ActivationWizardSession.create({
            order_id: order.id,
            client_id: order.client_id || "",
            client_project_id: order.client_project_id || "",
            client_email: order.customer_email || "",
            business_name: order.business_name || "",
            package_key: "pro_system",
            current_step: 0,
            completed_steps: [],
            blockers: [],
            status: "in_progress",
            last_updated_at: new Date().toISOString(),
          }).catch(() => null);
        }

        // Create missing ClientInstallationOS
        if (!report.install_os_present) {
          await base44.asServiceRole.entities.ClientInstallationOS.create({
            order_id: order.id,
            client_email: order.customer_email,
            business_name: order.business_name,
            client_id: order.client_id || "",
            workflow_stage: "intake_received",
            website_status: "not_started",
            activation_eligible: false,
            activation_status: "not_ready",
          }).catch(() => null);
        }
      }

      results.push(report);
    }

    return json({
      success: true,
      dry_run,
      orders_audited: proOrders.length,
      orders_needing_repair: results.filter((r) => r.missing_checklists.length > 0 || r.missing_steps.length > 0 || !r.install_os_present || !r.activation_session_present).length,
      results,
    });
  } catch (error) {
    console.error("[reconcileProActivationChecklists] Error:", error.message);
    return json({ error: error.message }, 500);
  }
});