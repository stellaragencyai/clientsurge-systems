/**
 * quickApproveChecklistItem — Admin-only "Quick Approve" for manually-audited
 * AutomationChecklist records.
 *
 * Moves a checklist from blocked/not_started/in_progress → active + client_approved.
 * Marks all pending/failed AutomationChecklistStep records as complete.
 *
 * Guardrails:
 *   - Does NOT set went_live_at (no public/client launch implication)
 *   - Does NOT change evidence_quality
 *   - Does NOT modify LaunchGate or LaunchReadinessState
 *   - Does NOT send external communications
 *   - Admin-only (403 for non-admins)
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { checklist_id, note } = body;

    if (!checklist_id) {
      return Response.json({ error: "checklist_id is required" }, { status: 400 });
    }

    const approverEmail = user.email || user.full_name || "admin";
    const now = new Date().toISOString();
    const cleanNote = (note || "").trim();
    const auditNote = cleanNote || "Manually audited and quick-approved by admin";

    // Fetch the checklist
    const checklist = await base44.asServiceRole.entities.AutomationChecklist.get(checklist_id);
    if (!checklist) {
      return Response.json({ error: "AutomationChecklist not found" }, { status: 404 });
    }

    // Prevent re-approving already-live checklists
    if (checklist.went_live_at) {
      return Response.json({
        error: "Checklist is already live (went_live_at is set). Quick approve is not applicable.",
      }, { status: 400 });
    }

    // Update the checklist
    const checklistUpdate = {
      status: "active",
      client_approved: true,
      communication_event_logging_verified: true,
      test_response_received: true,
      dashboard_truth_status: "trusted",
      dashboard_truth_notes: `Quick-approved by ${approverEmail} on ${now}. ${auditNote}`,
      last_tested_at: now,
    };

    await base44.asServiceRole.entities.AutomationChecklist.update(checklist_id, checklistUpdate);

    // Mark all pending/failed steps as complete
    let stepsUpdated = 0;
    try {
      const steps = await base44.asServiceRole.entities.AutomationChecklistStep.filter(
        { automation_checklist_id: checklist_id },
        "-step_order",
        100
      );
      const pendingSteps = (steps || []).filter(
        (s) => s.status === "pending" || s.status === "in_progress" || s.status === "failed"
      );
      for (const step of pendingSteps) {
        await base44.asServiceRole.entities.AutomationChecklistStep.update(step.id, {
          status: "complete",
          completed_at: now,
          completed_by: approverEmail,
          notes: `Quick-approved: ${auditNote}`,
          error_message: null,
        });
        stepsUpdated++;
      }
    } catch (err) {
      console.warn(`[quickApproveChecklistItem] Step update failed: ${err.message}`);
    }

    // Log to AuditLog
    try {
      await base44.asServiceRole.entities.AuditLog.create({
        action: "quick_approve_checklist",
        entity_type: "AutomationChecklist",
        entity_id: checklist_id,
        performed_by: approverEmail,
        details: JSON.stringify({
          service_key: checklist.service_key,
          business_name: checklist.business_name,
          note: auditNote,
          steps_completed: stepsUpdated,
        }),
        created_at: now,
      });
    } catch (err) {
      console.warn(`[quickApproveChecklistItem] AuditLog write failed: ${err.message}`);
    }

    return Response.json({
      success: true,
      checklist_id,
      service_key: checklist.service_key,
      business_name: checklist.business_name,
      approved_by: approverEmail,
      approved_at: now,
      steps_completed: stepsUpdated,
      went_live_at_set: false,
      note: auditNote,
    });
  } catch (error) {
    console.error("[quickApproveChecklistItem] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});