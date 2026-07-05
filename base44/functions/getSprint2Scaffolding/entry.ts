/**
 * getSprint2Scaffolding — Admin-only read function returning Sprint 2 scaffolding data.
 *
 * Returns:
 *   - Intent classification matrix (7 labels)
 *   - Nurture 14-day cadence (6 steps)
 *   - Proof workflow cards (5 workflows)
 *   - Opt-out/pause rules
 *   - Gate and checklist statuses
 *   - Next most important action
 *
 * Does NOT send messages. Does NOT create records. Read-only.
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

const INTENT_LABELS = [
  { key: "booking_intent", label: "Booking Intent", description: "Lead wants to book an appointment or schedule a call", example_triggers: ["book", "schedule", "appointment", "available", "when can I come in"], scaffolding_status: "defined" },
  { key: "pricing_question", label: "Pricing Question", description: "Lead is asking about cost, pricing, or payment options", example_triggers: ["price", "cost", "how much", "rate", "quote", "fee"], scaffolding_status: "defined" },
  { key: "service_question", label: "Service Question", description: "Lead is asking about services offered, scope, or capabilities", example_triggers: ["do you offer", "can you", "service", "what do you", "do you do"], scaffolding_status: "defined" },
  { key: "objection_or_hesitation", label: "Objection / Hesitation", description: "Lead expresses doubt, concern, or hesitation about moving forward", example_triggers: ["not sure", "maybe later", "thinking about it", "too expensive", "not ready"], scaffolding_status: "defined" },
  { key: "stop_opt_out", label: "STOP / Opt-Out", description: "Lead requests to stop receiving messages — must suppress all future sends and stop nurture", example_triggers: ["stop", "unsubscribe", "opt out", "remove", "cancel", "quit"], scaffolding_status: "defined" },
  { key: "human_help_needed", label: "Human Help Needed", description: "Lead explicitly requests human assistance or conversation is too complex for AI", example_triggers: ["talk to someone", "human", "real person", "call me", "manager", "speak to a person"], scaffolding_status: "defined" },
  { key: "unknown", label: "Unknown / Unclassified", description: "Message does not match any intent — should be flagged for admin review", example_triggers: ["ambiguous text", "unclear message", "gibberish"], scaffolding_status: "defined" },
];

const NURTURE_CADENCE = [
  { day: 0, step_name: "Value + Booking CTA", purpose: "Deliver immediate value and offer booking link", content_guidance: "Welcome message, confirm opt-in, share booking link, no fake revenue claims", channel: "sms_or_email", scaffolding_status: "defined" },
  { day: 1, step_name: "Problem / Friction Framing", purpose: "Acknowledge the problem the lead is experiencing", content_guidance: "Identify common friction point, empathize, no exaggerated claims", channel: "email", scaffolding_status: "defined" },
  { day: 3, step_name: "Automation Benefit / Truthful Value", purpose: "Explain how automation solves the problem", content_guidance: "Truthful automation benefit, real workflow description, no fake case studies", channel: "email", scaffolding_status: "defined" },
  { day: 7, step_name: "FAQ / Objection Handling", purpose: "Address common questions and objections", content_guidance: "Honest FAQ, address pricing/timing concerns, no pressure tactics", channel: "email", scaffolding_status: "defined" },
  { day: 10, step_name: "Diagnostic / Urgency Angle", purpose: "Offer a diagnostic or assessment to re-engage", content_guidance: "Offer free assessment or audit, honest urgency (limited availability), no fake scarcity", channel: "sms_or_email", scaffolding_status: "defined" },
  { day: 14, step_name: "Final Follow-Up / Clean Exit", purpose: "Final helpful message and clean exit if no response", content_guidance: "Final check-in, offer to answer questions, clean exit, no guilt-trip language", channel: "sms_or_email", scaffolding_status: "defined" },
];

const PROOF_WORKFLOWS = [
  {
    key: "inbound_reply_classification_test",
    label: "Inbound Reply Classification Test",
    service_key: "inbound_sms_assistant",
    required_evidence: [
      "Inbound SMS CommunicationEvent exists (direction=inbound, channel=sms)",
      "metadata_json contains sprint2_intent or intent field",
      "Intent label matches one of the 7 defined labels",
      "Phone number matched to WebsiteLead or Lead where possible",
    ],
    current_status: "pending",
    blocker: "No inbound SMS events with intent classification found in CommunicationEvent metadata",
    next_action: "Send a test inbound SMS to the Twilio number, then verify receiveTwilioInboundSms classifies intent in metadata",
    safe_to_pass: false,
  },
  {
    key: "stop_reply_test",
    label: "STOP Reply Test",
    service_key: "inbound_sms_assistant",
    required_evidence: [
      "Inbound SMS with STOP/opt-out intent classified (sprint2_intent=stop_opt_out)",
      "Lead opted_out flag set or NurtureCampaign stopped with stop_reason=opted_out",
      "No further outbound SMS sent to the lead after opt-out",
    ],
    current_status: "pending",
    blocker: "No STOP/opt-out handling proof — no events with stop_opt_out intent, no campaigns stopped due to opt-out",
    next_action: "Send a test STOP message to the Twilio number, verify opt-out handling suppresses future sends",
    safe_to_pass: false,
  },
  {
    key: "enrollment_test",
    label: "Nurture Enrollment Test",
    service_key: "nurture_sequence_14d",
    required_evidence: [
      "NurtureCampaign record created with status=active",
      "Enrollment CommunicationEvent logged (event_type=workflow_triggered)",
      "Lead has consent_given=true and sms_permission=true (for SMS touches)",
      "Campaign steps scheduled per 14-day cadence (Day 0/1/3/7/10/14)",
    ],
    current_status: "pending",
    blocker: "No enrollment events found, no active 14-day NurtureCampaign records",
    next_action: "Enroll a test lead in the 14-day nurture sequence and verify enrollment events are logged",
    safe_to_pass: false,
  },
  {
    key: "pause_on_reply_test",
    label: "Pause-on-Reply Test",
    service_key: "nurture_sequence_14d",
    required_evidence: [
      "Inbound reply received from enrolled lead",
      "NurtureCampaign status changed to paused or stopped",
      "NurtureCampaign stop_reason=inbound_reply",
      "No further nurture messages sent after pause",
    ],
    current_status: "pending",
    blocker: "No pause-on-reply proof — no NurtureCampaigns paused/stopped due to inbound reply",
    next_action: "Enroll a test lead, then send a reply to verify nurture pauses automatically",
    safe_to_pass: false,
  },
  {
    key: "opt_out_exclusion_test",
    label: "Opt-Out Exclusion Test",
    service_key: "nurture_sequence_14d",
    required_evidence: [
      "Lead sends STOP/opt-out message",
      "NurtureCampaign stopped with stop_reason=opted_out",
      "Lead excluded from all future nurture enrollment",
      "No further nurture messages sent after opt-out",
    ],
    current_status: "pending",
    blocker: "No opt-out exclusion proof — no campaigns stopped due to opted_out",
    next_action: "Enroll a test lead, then send STOP to verify nurture stops and lead is excluded",
    safe_to_pass: false,
  },
];

const NURTURE_RULES = [
  { key: "consent_required", label: "Consent Required", description: "Lead must have consent_given=true before enrollment", status: "defined" },
  { key: "sms_permission_required", label: "SMS Permission Required", description: "Lead must have sms_permission=true for SMS touches", status: "defined" },
  { key: "opt_out_exclusion", label: "Opt-Out Exclusion", description: "Opted-out leads excluded from all future nurture", status: "defined" },
  { key: "pause_on_reply", label: "Pause on Reply", description: "Nurture pauses when lead sends a meaningful reply", status: "defined" },
  { key: "no_fake_claims", label: "No Fake Revenue/Case Studies", description: "Templates must not contain fake revenue guarantees or fabricated case studies", status: "defined" },
  { key: "internal_test_excluded", label: "Internal/Test Excluded", description: "Internal/test records excluded from production proof", status: "defined" },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return Response.json({ error: "Admin only" }, { status: 403 });
    }

    const svc = base44.asServiceRole;
    const now = new Date().toISOString();

    // ── Load gates ──
    const allGates = await svc.entities.LaunchGate.list("", 100).catch(() => []);
    const inboundGate = (allGates || []).find(g => g.gate_key === "inbound_sms_assistant");
    const nurtureGate = (allGates || []).find(g => g.gate_key === "nurture_sequence_14d");
    const combinedGate = (allGates || []).find(g => g.gate_key === "sprint2_inbound_and_nurture_gate");

    // ── Load proof logs for Sprint 2 ──
    const proofLogs = await svc.entities.AutomationProofLog.filter(
      { service_key: { $in: ["inbound_sms_assistant", "nurture_sequence_14d"] } },
      "-created_date",
      20
    ).catch(() => []);

    // ── Load checklists for Sprint 2 ──
    const checklists = await svc.entities.AutomationChecklist.filter(
      { service_key: { $in: ["inbound_sms_assistant", "nurture_sequence_14d"] } },
      "-created_date",
      20
    ).catch(() => []);

    // ── Check for real evidence ──
    let inboundSmsEvents = [];
    try {
      inboundSmsEvents = await svc.entities.CommunicationEvent.filter(
        { event_type: "sms_received", direction: "inbound" },
        "-created_date",
        50
      );
    } catch (_) {}

    const hasInboundSmsEvents = (inboundSmsEvents || []).length > 0;
    const eventsWithIntent = (inboundSmsEvents || []).filter(e => {
      try {
        const meta = JSON.parse(e.metadata_json || "{}");
        return meta.sprint2_intent || meta.intent;
      } catch { return false; }
    });
    const hasIntentClassification = eventsWithIntent.length > 0;

    const stopOptOutEvents = (inboundSmsEvents || []).filter(e => {
      try {
        const meta = JSON.parse(e.metadata_json || "{}");
        return meta.sprint2_intent === "stop_opt_out";
      } catch { return false; }
    });
    const hasStopOptOutHandling = stopOptOutEvents.length > 0;

    let pausedNurtureCampaigns = [];
    try {
      pausedNurtureCampaigns = await svc.entities.NurtureCampaign.filter(
        { status: { $in: ["paused", "stopped"] }, stop_reason: { $in: ["inbound_reply", "opted_out"] } },
        "-created_date",
        20
      );
    } catch (_) {}
    const hasNurturePauseOnReply = (pausedNurtureCampaigns || []).filter(c => c.stop_reason === "inbound_reply").length > 0;
    const hasOptOutExclusion = (pausedNurtureCampaigns || []).filter(c => c.stop_reason === "opted_out").length > 0;

    let activeNurtureCampaigns = [];
    try {
      activeNurtureCampaigns = await svc.entities.NurtureCampaign.filter(
        { status: "active" },
        "-enrolled_at",
        50
      );
    } catch (_) {}
    const hasActiveNurtureCampaigns = (activeNurtureCampaigns || []).length > 0;

    let enrollmentEvents = [];
    try {
      enrollmentEvents = await svc.entities.CommunicationEvent.filter(
        { event_type: "workflow_triggered", channel: "internal" },
        "-created_date",
        50
      );
    } catch (_) {}
    const nurtureEnrollmentEvents = (enrollmentEvents || []).filter(e => {
      try {
        const meta = JSON.parse(e.metadata_json || "{}");
        return meta.service_key === "nurture_sequence_14d";
      } catch { return false; }
    });
    const hasEnrollmentEvents = nurtureEnrollmentEvents.length > 0;

    // ── Update proof workflow statuses based on real evidence ──
    const updatedWorkflows = PROOF_WORKFLOWS.map(wf => {
      const updated = { ...wf };
      const inboundProofLogs = (proofLogs || []).filter(p => p.service_key === "inbound_sms_assistant");
      const nurtureProofLogs = (proofLogs || []).filter(p => p.service_key === "nurture_sequence_14d");

      if (wf.key === "inbound_reply_classification_test") {
        const proofPassed = inboundProofLogs.some(p => p.test_type === "inbound_reply_classification_test" && p.status === "pass");
        if (proofPassed) {
          updated.current_status = "pass";
          updated.blocker = null;
          updated.next_action = "Proof log exists — admin may review evidence";
          updated.safe_to_pass = true;
        } else if (hasInboundSmsEvents && hasIntentClassification) {
          updated.current_status = "ready_for_proof";
          updated.blocker = "Evidence exists but no AutomationProofLog with status=pass created yet";
          updated.next_action = "Review evidence and create AutomationProofLog if qualifying";
          updated.safe_to_pass = true;
        } else {
          updated.current_status = "pending";
          updated.blocker = `No inbound SMS events with intent classification found. Inbound events: ${inboundSmsEvents?.length || 0}, with intent: ${eventsWithIntent?.length || 0}`;
          updated.next_action = "Send a test inbound SMS and verify intent classification in metadata";
          updated.safe_to_pass = false;
        }
      }

      if (wf.key === "stop_reply_test") {
        const proofPassed = inboundProofLogs.some(p => p.test_type === "stop_reply_test" && p.status === "pass");
        if (proofPassed) {
          updated.current_status = "pass";
          updated.blocker = null;
          updated.next_action = "Proof log exists — admin may review evidence";
          updated.safe_to_pass = true;
        } else if (hasStopOptOutHandling) {
          updated.current_status = "ready_for_proof";
          updated.blocker = "STOP/opt-out events found but no AutomationProofLog created";
          updated.next_action = "Review STOP handling evidence and create proof log";
          updated.safe_to_pass = true;
        } else {
          updated.current_status = "pending";
          updated.blocker = "No STOP/opt-out handling proof — no events with stop_opt_out intent";
          updated.next_action = "Send a test STOP message and verify opt-out handling";
          updated.safe_to_pass = false;
        }
      }

      if (wf.key === "enrollment_test") {
        const proofPassed = nurtureProofLogs.some(p => p.test_type === "enrollment_test" && p.status === "pass");
        if (proofPassed) {
          updated.current_status = "pass";
          updated.blocker = null;
          updated.next_action = "Proof log exists — admin may review evidence";
          updated.safe_to_pass = true;
        } else if (hasActiveNurtureCampaigns && hasEnrollmentEvents) {
          updated.current_status = "ready_for_proof";
          updated.blocker = "Active campaigns and enrollment events exist but no AutomationProofLog created";
          updated.next_action = "Review enrollment evidence and create proof log";
          updated.safe_to_pass = true;
        } else {
          updated.current_status = "pending";
          updated.blocker = `No enrollment events. Active campaigns: ${activeNurtureCampaigns?.length || 0}, enrollment events: ${nurtureEnrollmentEvents?.length || 0}`;
          updated.next_action = "Enroll a test lead in the 14-day nurture sequence";
          updated.safe_to_pass = false;
        }
      }

      if (wf.key === "pause_on_reply_test") {
        const proofPassed = nurtureProofLogs.some(p => p.test_type === "enrollment_test" && p.status === "pass" && hasNurturePauseOnReply);
        if (proofPassed) {
          updated.current_status = "pass";
          updated.blocker = null;
          updated.next_action = "Proof log exists — admin may review evidence";
          updated.safe_to_pass = true;
        } else if (hasNurturePauseOnReply) {
          updated.current_status = "ready_for_proof";
          updated.blocker = "Paused campaigns found but no AutomationProofLog created";
          updated.next_action = "Review pause-on-reply evidence and create proof log";
          updated.safe_to_pass = true;
        } else {
          updated.current_status = "pending";
          updated.blocker = "No pause-on-reply proof — no NurtureCampaigns paused due to inbound reply";
          updated.next_action = "Enroll a test lead, then send a reply to verify nurture pauses";
          updated.safe_to_pass = false;
        }
      }

      if (wf.key === "opt_out_exclusion_test") {
        const proofPassed = nurtureProofLogs.some(p => p.test_type === "enrollment_test" && p.status === "pass" && hasOptOutExclusion);
        if (proofPassed) {
          updated.current_status = "pass";
          updated.blocker = null;
          updated.next_action = "Proof log exists — admin may review evidence";
          updated.safe_to_pass = true;
        } else if (hasOptOutExclusion) {
          updated.current_status = "ready_for_proof";
          updated.blocker = "Opted-out campaigns found but no AutomationProofLog created";
          updated.next_action = "Review opt-out exclusion evidence and create proof log";
          updated.safe_to_pass = true;
        } else {
          updated.current_status = "pending";
          updated.blocker = "No opt-out exclusion proof — no campaigns stopped due to opted_out";
          updated.next_action = "Enroll a test lead, then send STOP to verify nurture stops and exclusion";
          updated.safe_to_pass = false;
        }
      }

      return updated;
    });

    // ── Determine next most important action ──
    let next_most_important_action;
    const pendingWorkflows = updatedWorkflows.filter(w => w.current_status === "pending");
    const readyWorkflows = updatedWorkflows.filter(w => w.current_status === "ready_for_proof");

    if (pendingWorkflows.length === updatedWorkflows.length) {
      next_most_important_action = "All 5 proof workflows are pending. Start with: send a test inbound SMS to verify intent classification (inbound_reply_classification_test).";
    } else if (readyWorkflows.length > 0) {
      next_most_important_action = `${readyWorkflows.length} workflow(s) have evidence ready. Review evidence and create AutomationProofLog records: ${readyWorkflows.map(w => w.key).join(", ")}.`;
    } else if (updatedWorkflows.every(w => w.current_status === "pass")) {
      next_most_important_action = "All proof workflows passed. Admin may review evidence and approve for internal launch.";
    } else {
      const next = pendingWorkflows[0];
      next_most_important_action = `Next: ${next.label} — ${next.next_action}`;
    }

    // ── Checklist reconciliation warnings ──
    const checklistWarnings = [];
    const inboundChecklist = (checklists || []).find(c => c.service_key === "inbound_sms_assistant");
    const nurtureChecklist = (checklists || []).find(c => c.service_key === "nurture_sequence_14d");

    if (!inboundChecklist) checklistWarnings.push("No AutomationChecklist row for inbound_sms_assistant — run seedSprint2Scaffolding");
    if (!nurtureChecklist) checklistWarnings.push("No AutomationChecklist row for nurture_sequence_14d — run seedSprint2Scaffolding");

    if (inboundGate?.status === "proof_passed" && inboundChecklist && inboundChecklist.status !== "active" && inboundChecklist.status !== "in_progress") {
      checklistWarnings.push("inbound_sms_assistant gate is proof_passed but checklist is not active — reconciliation needed");
    }
    if (nurtureGate?.status === "proof_passed" && nurtureChecklist && nurtureChecklist.status !== "active" && nurtureChecklist.status !== "in_progress") {
      checklistWarnings.push("nurture_sequence_14d gate is proof_passed but checklist is not active — reconciliation needed");
    }
    if (inboundChecklist?.client_approved) {
      checklistWarnings.push("inbound_sms_assistant checklist has client_approved=true — should not be approved until proof passes");
    }
    if (nurtureChecklist?.client_approved) {
      checklistWarnings.push("nurture_sequence_14d checklist has client_approved=true — should not be approved until proof passes");
    }

    return Response.json({
      success: true,
      checked_at: now,
      no_provider_calls: true,
      read_only: true,
      intent_labels: INTENT_LABELS,
      nurture_cadence: NURTURE_CADENCE,
      nurture_rules: NURTURE_RULES,
      proof_workflows: updatedWorkflows,
      gates: {
        inbound_sms_assistant: inboundGate ? {
          status: inboundGate.status,
          completion_percent: inboundGate.completion_percent,
          proof_percent: inboundGate.proof_percent,
          evidence_quality: inboundGate.evidence_quality,
          current_blocker: inboundGate.current_blocker,
          next_action: inboundGate.next_action,
        } : null,
        nurture_sequence_14d: nurtureGate ? {
          status: nurtureGate.status,
          completion_percent: nurtureGate.completion_percent,
          proof_percent: nurtureGate.proof_percent,
          evidence_quality: nurtureGate.evidence_quality,
          current_blocker: nurtureGate.current_blocker,
          next_action: nurtureGate.next_action,
        } : null,
        sprint2_combined: combinedGate ? {
          status: combinedGate.status,
          completion_percent: combinedGate.completion_percent,
          proof_percent: combinedGate.proof_percent,
          current_blocker: combinedGate.current_blocker,
        } : null,
      },
      checklists: {
        inbound_sms_assistant: inboundChecklist ? {
          exists: true,
          status: inboundChecklist.status,
          client_approved: inboundChecklist.client_approved,
          went_live_at: inboundChecklist.went_live_at,
          dashboard_excluded: inboundChecklist.dashboard_excluded,
        } : { exists: false },
        nurture_sequence_14d: nurtureChecklist ? {
          exists: true,
          status: nurtureChecklist.status,
          client_approved: nurtureChecklist.client_approved,
          went_live_at: nurtureChecklist.went_live_at,
          dashboard_excluded: nurtureChecklist.dashboard_excluded,
        } : { exists: false },
      },
      evidence_summary: {
        inbound_sms_events: inboundSmsEvents?.length || 0,
        events_with_intent: eventsWithIntent?.length || 0,
        stop_opt_out_events: stopOptOutEvents?.length || 0,
        active_nurture_campaigns: activeNurtureCampaigns?.length || 0,
        enrollment_events: nurtureEnrollmentEvents?.length || 0,
        paused_nurture_campaigns: pausedNurtureCampaigns?.length || 0,
        opt_out_campaigns: (pausedNurtureCampaigns || []).filter(c => c.stop_reason === "opted_out").length,
        sprint2_proof_logs: proofLogs?.length || 0,
      },
      checklist_warnings: checklistWarnings,
      next_most_important_action,
    });
  } catch (error) {
    console.error("[getSprint2Scaffolding] error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});