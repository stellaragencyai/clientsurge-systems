const HIGH_RISK_ACTIONS = [
  {
    action: "Move service to Live",
    reason: "Live activation changes canonical install state and must stay explicitly operator-approved.",
  },
  {
    action: "Any client-facing outbound production messaging",
    reason: "OpenClaw should never send unsupervised production traffic outside the canonical guarded test flows.",
  },
  {
    action: "Any direct entity mutation",
    reason: "Source-of-truth records must only change through canonical backend endpoints so guards and CommunicationEvent logging stay intact.",
  },
];

function formatEventType(eventType) {
  return eventType ? eventType.replaceAll("_", " ") : "unknown";
}

function getServiceTimelineSummary(orderDetail, service) {
  const serviceEvents = (orderDetail.timeline || []).filter(
    (event) => event.service_key === service.service_key
  );
  const latestEvent = serviceEvents[0] || null;
  const latestFailure =
    serviceEvents.find((event) => event.event_type === "provider_send_failed" || event.event_type === "runtime_attempt_blocked") ||
    null;

  return {
    latest_event_type: latestEvent?.event_type || null,
    latest_event_at: latestEvent?.created_date || null,
    latest_failure_type: latestFailure?.event_type || null,
    latest_failure_at: latestFailure?.created_date || null,
    recent_event_count: serviceEvents.length,
  };
}

export function buildOpenClawInstallAssist({ orderDetail }) {
  const workspaceSummary = orderDetail.workspace_summary || {};
  const services = orderDetail.services || [];
  const timeline = orderDetail.timeline || [];
  const blockers = [
    ...(orderDetail.required_actions?.order || []),
    ...services.flatMap((service) =>
      (service.required_actions || []).map((action) => ({
        ...action,
        service_key: service.service_key,
        service_display_name: service.display_name,
      }))
    ),
  ].filter((action) => action.level === "blocker");

  const recentEvents = timeline.slice(0, 12).map((event) => ({
    created_date: event.created_date,
    event_type: event.event_type,
    event_title: event.subject || formatEventType(event.event_type),
    provider: event.provider || null,
    status: event.status || null,
    service_key: event.service_key || null,
    error_message: event.error_message || null,
  }));

  return {
    generated_at: new Date().toISOString(),
    mode: "operator_assist",
    safety_rules: [
      "Read canonical backend state only.",
      "Use canonical backend endpoints for any writes.",
      "Do not approve or trigger Live automatically.",
      "Do not bypass backend guards or CommunicationEvent logging.",
    ],
    order: {
      id: orderDetail.id,
      business_name: orderDetail.business_name,
      customer_name: orderDetail.customer_name,
      customer_email: orderDetail.customer_email,
      payment_status: orderDetail.payment_status,
      pipeline_status: orderDetail.pipeline_status,
      order_status: orderDetail.order_status,
      pipeline_error: orderDetail.pipeline_error || null,
      tracked_service_count: services.length,
    },
    command_view: workspaceSummary.command_view || {
      configure_first: null,
      move_to_testing_now: null,
      test_now: null,
      go_live_now: null,
      primary_blocker: null,
    },
    top_actions: workspaceSummary.next_best_actions || [],
    blocker_queue: blockers.slice(0, 12),
    shared_configuration: workspaceSummary.shared_configuration || null,
    provider_readiness: orderDetail.provider_readiness || {},
    latest_provider_tests: orderDetail.latest_provider_tests || {},
    setup_assist: workspaceSummary.setup_assist || {
      safe_autofill_count: 0,
      manual_required_count: 0,
      safe_autofill: [],
      manual_required: [],
      blocker_summary: [],
    },
    assisted_deployment: {
      overview: orderDetail.assisted_deployment?.overview || {
        can_prepare_setup: false,
        can_run_setup_sequence: false,
        services_ready_for_sequence: [],
        services_requiring_manual_input: [],
        services_ready_for_live: [],
        expected_blockers: [],
        counts: {
          safe_autofill: 0,
          manual_required: 0,
          sequence_ready: 0,
          live_ready: 0,
        },
      },
      safe_commands: [
        {
          command: "prepareAssistedSetup",
          requires_confirmation: false,
          purpose: "Preview safe autofill suggestions and deployment summary without saving config.",
        },
        {
          command: "runAssistedSetupSequence",
          requires_confirmation: true,
          purpose: "Run guarded Configuring -> Testing -> test steps on saved canonical config only.",
        },
      ],
    },
    services: services.map((service) => ({
      service_key: service.service_key,
      display_name: service.display_name,
      install_status: service.install_status,
      configuration_complete: service.configuration_complete,
      allowed_next_statuses: service.allowed_next_statuses || [],
      blocker_count: service.operator_summary?.blocker_count || 0,
      next_action_title: service.operator_summary?.next_action_title || "No action required",
      next_action_detail: service.operator_summary?.next_action_detail || "",
      can_move_to_testing: service.go_live_readiness?.can_move_to_testing || false,
      can_move_to_live: service.go_live_readiness?.can_move_to_live || false,
      tested: service.go_live_readiness?.tested || false,
      blocking_items: service.go_live_readiness?.blocking_items || [],
      required_actions: service.required_actions || [],
      test_summary: service.test_summary || {},
      timeline_summary: getServiceTimelineSummary(orderDetail, service),
    })),
    timeline_summary: {
      total_events: timeline.length,
      blocked_events: timeline.filter((event) => event.event_type === "runtime_attempt_blocked" || event.event_type === "service_transition_blocked").length,
      failed_events: timeline.filter((event) => event.event_type === "provider_send_failed" || event.status === "failed").length,
      successful_send_events: timeline.filter((event) => event.event_type === "provider_send_succeeded").length,
      recent_events: recentEvents,
    },
    manual_approval_required: HIGH_RISK_ACTIONS,
  };
}
