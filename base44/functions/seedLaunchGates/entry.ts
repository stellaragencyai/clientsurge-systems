import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const GATES = [
  { gate_key: "website_cta_gate", gate_name: "Website CTA Verification", section_label: "Public Website", description: "All public CTAs point to correct routes and trigger analytics.", required_categories: ["website"], required_tasks: ["verify_all_ctas","check_mobile_ctas"], required_proofs: ["cta_screenshot_desktop","cta_screenshot_mobile"] },
  { gate_key: "lead_capture_gate", gate_name: "Lead Capture Gate", section_label: "Lead Pipeline", description: "Lead forms submit correctly and create WebsiteLead records.", required_categories: ["lead_capture"], required_tasks: ["test_form_submission","verify_lead_created","check_consent"], required_proofs: ["test_lead_record"] },
  { gate_key: "booking_flow_gate", gate_name: "Booking Flow Gate", section_label: "Booking", description: "Booking links work and appointments flow through to confirmation.", required_categories: ["booking"], required_tasks: ["verify_booking_link","test_booking_flow"], required_proofs: ["test_booking_confirmation"] },
  { gate_key: "stripe_payment_gate", gate_name: "Stripe Payment Gate", section_label: "Billing", description: "Stripe checkout creates paid Order records with correct metadata.", required_categories: ["billing"], required_tasks: ["verify_stripe_webhook","check_order_created","validate_pricing"], required_proofs: ["test_payment_order"] },
  { gate_key: "resend_email_gate", gate_name: "Resend Email Gate", section_label: "Email", description: "Transactional emails send correctly via Resend.", required_categories: ["email"], required_tasks: ["verify_resend_webhook","test_email_delivery"], required_proofs: ["test_email_record"] },
  { gate_key: "twilio_sms_gate", gate_name: "Twilio SMS Gate", section_label: "SMS", description: "SMS messages send and receive correctly via Twilio.", required_categories: ["sms"], required_tasks: ["verify_twilio_webhook","test_sms_send_receive","check_opt_out"], required_proofs: ["test_sms_record"] },
  { gate_key: "analytics_gate", gate_name: "Analytics Gate", section_label: "Analytics", description: "ConversionFunnel and MetricsSnapshot compute correctly.", required_categories: ["analytics"], required_tasks: ["verify_conversion_funnel","check_metrics_snapshot"], required_proofs: ["conversion_funnel_record","metrics_snapshot_record"] },
  { gate_key: "security_gate", gate_name: "Security Gate", section_label: "Security", description: "SSL, auth flows, and access controls verified.", required_categories: ["security"], required_tasks: ["verify_ssl","check_auth_flows","validate_rls"], required_proofs: ["ssl_certificate"] },
  { gate_key: "client_portal_gate", gate_name: "Client Portal Gate", section_label: "Client Portal", description: "Client portal loads for authenticated users with correct data.", required_categories: ["client_portal"], required_tasks: ["verify_client_login","check_dashboard_loads","validate_data_access"], required_proofs: ["client_portal_screenshot"] },
  { gate_key: "admin_dashboard_gate", gate_name: "Admin Dashboard Gate", section_label: "Admin Dashboard", description: "Admin dashboard loads with correct metrics and controls.", required_categories: ["admin_dashboard"], required_tasks: ["verify_admin_login","check_metrics_load","validate_controls"], required_proofs: ["admin_dashboard_screenshot"] },
  { gate_key: "install_os_gate", gate_name: "Install OS Gate", section_label: "ClientInstallationOS", description: "ClientInstallationOS records have canonical status values.", required_categories: ["install_os"], required_tasks: ["verify_activation_status","check_workflow_stages"], required_proofs: ["install_os_record"] },
  { gate_key: "dashboard_truth_gate", gate_name: "Dashboard Truth Gate", section_label: "Truth Layer", description: "Dashboard truth checks pass for production records — no misleading Live/Healthy states.", required_categories: ["dashboard_truth"], required_tasks: ["run_reconciliation","verify_no_blockers","check_environment_classification"], required_proofs: ["reconciliation_run_record","dashboard_truth_check_record"] },
  { gate_key: "voice_frontline_gate", gate_name: "Voice Frontline Gate", section_label: "Voice", description: "ElevenLabs voice agent is configured with agent ID and phone number.", required_categories: ["voice"], required_tasks: ["verify_elevenlabs_agent","verify_elevenlabs_phone","test_outbound_call"], required_proofs: ["voice_call_record"] },
  { gate_key: "elevenlabs_postcall_logging_gate", gate_name: "ElevenLabs Post-Call Logging Gate", section_label: "Voice", description: "ElevenLabs post-call webhook logs CommunicationEvent records.", required_categories: ["voice"], required_tasks: ["verify_postcall_webhook","verify_communication_event_created"], required_proofs: ["postcall_event_record"] },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

    const existing = await base44.asServiceRole.entities.LaunchGate.list('', 50);
    const existingKeys = new Set(existing.map(g => g.gate_key));
    const seeded = [];
    const skipped = [];

    for (const gate of GATES) {
      if (existingKeys.has(gate.gate_key)) {
        skipped.push(gate.gate_key);
        continue;
      }
      await base44.asServiceRole.entities.LaunchGate.create({
        gate_key: gate.gate_key,
        gate_name: gate.gate_name,
        section_label: gate.section_label,
        description: gate.description,
        status: "blocked",
        severity: "launch_blocker",
        completion_percent: 0,
        proof_percent: 0,
        required_categories: gate.required_categories,
        required_tasks: gate.required_tasks,
        required_proofs: gate.required_proofs,
        current_blocker: "Not yet verified",
        next_action: "Run verification checks for this gate",
        approval_required: true,
        last_checked_at: new Date().toISOString(),
        evidence_summary: "Gate seeded — awaiting first proof run",
        unlock_condition_summary: `All required tasks (${gate.required_tasks.length}) and proofs (${gate.required_proofs.length}) must pass`,
        last_verdict: "Seeded — blocked by default"
      });
      seeded.push(gate.gate_key);
    }

    return Response.json({
      seeded: seeded.length,
      skipped: skipped.length,
      seeded_keys: seeded,
      skipped_keys: skipped
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});