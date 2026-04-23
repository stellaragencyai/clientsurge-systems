import {
  buildCommunicationEvent,
  buildInstallSnapshot,
  updateTrackedServiceInstallStatus,
} from "./installPipeline.js";
import {
  executeBookingSimulation,
  executeLeadReactivationTest,
  executeNurtureSequenceTest,
  executeOrderServiceRuntime,
  executeReviewRequestTest,
  RuntimeExecutionError,
} from "./installRuntime.js";
import { buildRemoteSetupWorkspace } from "./remoteSetupWorkspace.js";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isBlankValue(value) {
  if (value == null) {
    return true;
  }

  if (typeof value === "string") {
    return value.trim() === "";
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return false;
}

function cloneValue(value) {
  if (value == null) {
    return value;
  }

  return JSON.parse(JSON.stringify(value));
}

function createAssistedDeploymentEvent({
  order,
  subject,
  messageBody,
  status = "processed",
  metadata = {},
}) {
  return buildCommunicationEvent({
    order,
    event_type: "workflow_triggered",
    provider: "internal",
    status,
    subject,
    message_body: messageBody,
    metadata: {
      context_type: "assisted_deployment",
      ...metadata,
    },
  });
}

function mergeInstallConfiguration(currentConfig = {}, patch = {}) {
  const nextShared = {
    ...(currentConfig.shared || {}),
    ...(patch.shared || {}),
  };

  const nextServices = {
    ...(currentConfig.services || {}),
  };

  for (const [serviceKey, servicePatch] of Object.entries(patch.services || {})) {
    nextServices[serviceKey] = {
      ...(currentConfig.services?.[serviceKey] || {}),
      ...(servicePatch || {}),
    };
  }

  return {
    shared: nextShared,
    services: nextServices,
  };
}

function getSavableSuggestionFields(serviceKey) {
  if (serviceKey === "instant_lead_response" || serviceKey === "missed_call_text_back") {
    return new Set(["sms_template"]);
  }

  if (serviceKey === "ai_booking_agent") {
    return new Set(["booking_mode", "intake_fields", "confirmation_template", "reminder_template"]);
  }

  if (serviceKey === "lead_reactivation") {
    return new Set(["target_segment", "message_template"]);
  }

  if (serviceKey === "review_request") {
    return new Set(["channel", "message_template"]);
  }

  return new Set();
}

function derivePreparedPatch({ order, workspace }) {
  const currentConfig = order.install_configuration || { shared: {}, services: {} };
  const patch = {
    shared: {},
    services: {},
  };
  const suggestionsApplied = [];

  const sharedSuggestions = workspace.workspace_summary?.shared_suggestions?.fields || {};
  for (const suggestion of Object.values(sharedSuggestions)) {
    if (!suggestion?.available) {
      continue;
    }

    const currentValue = currentConfig.shared?.[suggestion.field];
    if (isBlankValue(currentValue) && !isBlankValue(suggestion.value)) {
      patch.shared[suggestion.field] = cloneValue(suggestion.value);
      suggestionsApplied.push({
        scope: "shared",
        field: `shared.${suggestion.field}`,
        label: suggestion.label,
        source_labels: suggestion.source_labels || [],
      });
    }
  }

  for (const service of workspace.services || []) {
    const servicePatch = {};
    const currentServiceConfig = currentConfig.services?.[service.service_key] || {};
    const allowedFields = getSavableSuggestionFields(service.service_key);
    const fieldSuggestions = service.config_suggestions?.fields || {};

    for (const suggestion of Object.values(fieldSuggestions)) {
      if (!suggestion?.available) {
        continue;
      }

      if (!allowedFields.has(suggestion.field)) {
        continue;
      }

      const currentValue = currentServiceConfig?.[suggestion.field];
      if (isBlankValue(currentValue) && !isBlankValue(suggestion.value)) {
        servicePatch[suggestion.field] = cloneValue(suggestion.value);
        suggestionsApplied.push({
          scope: "service",
          service_key: service.service_key,
          service_display_name: service.display_name,
          field: `services.${service.service_key}.${suggestion.field}`,
          label: suggestion.label,
          source_labels: suggestion.source_labels || [],
        });
      }
    }

    const starterPreset = service.config_suggestions?.presets?.starter_sequence;
    if (
      service.service_key === "nurture_sequence_14d" &&
      starterPreset?.available &&
      starterPreset?.value &&
      !currentServiceConfig.sms_enabled &&
      !currentServiceConfig.email_enabled &&
      (!Array.isArray(currentServiceConfig.steps) || currentServiceConfig.steps.length === 0)
    ) {
      Object.assign(servicePatch, cloneValue(starterPreset.value));
      suggestionsApplied.push({
        scope: "service",
        service_key: service.service_key,
        service_display_name: service.display_name,
        field: `services.${service.service_key}.starter_sequence`,
        label: starterPreset.label,
        source_labels: starterPreset.source_labels || [],
      });
    }

    if (Object.keys(servicePatch).length > 0) {
      patch.services[service.service_key] = servicePatch;
    }
  }

  if (Object.keys(patch.shared).length === 0) {
    delete patch.shared;
  }

  if (Object.keys(patch.services).length === 0) {
    delete patch.services;
  }

  return {
    patch,
    suggestions_applied: suggestionsApplied,
  };
}

function getSummaryServices(services, predicate) {
  return services.filter(predicate).map((service) => ({
    service_key: service.service_key,
    display_name: service.display_name,
    install_status: service.install_status,
  }));
}

export function buildAssistedDeploymentOverview({ workspace }) {
  const services = workspace.services || [];
  const blockers = (workspace.workspace_summary?.next_best_actions || []).filter((action) => action.level === "blocker");

  const sequenceReady = getSummaryServices(
    services,
    (service) =>
      service.configuration_complete &&
      !service.test_summary?.successful_test_exists &&
      (
        service.install_status === "Ready for Install" ||
        service.install_status === "Configuring" ||
        service.install_status === "Testing"
      )
  );

  return {
    can_prepare_setup: (workspace.workspace_summary?.setup_assist?.safe_autofill_count || 0) > 0,
    can_run_setup_sequence: sequenceReady.length > 0,
    services_ready_for_sequence: sequenceReady,
    services_requiring_manual_input: getSummaryServices(
      services,
      (service) => (service.operator_summary?.blocker_count || 0) > 0
    ),
    services_ready_for_live: getSummaryServices(
      services,
      (service) => service.go_live_readiness?.can_move_to_live
    ),
    expected_blockers: blockers.map((action) => ({
      title: action.title,
      detail: action.detail,
      service_display_name: action.service_display_name || null,
    })),
    counts: {
      safe_autofill: workspace.workspace_summary?.setup_assist?.safe_autofill_count || 0,
      manual_required: workspace.workspace_summary?.setup_assist?.manual_required_count || 0,
      sequence_ready: sequenceReady.length,
      live_ready: services.filter((service) => service.go_live_readiness?.can_move_to_live).length,
    },
  };
}

async function buildWorkspaceForOrder(base44, order) {
  const snapshot = buildInstallSnapshot(order);
  const hydratedOrder = {
    ...order,
    items: snapshot.normalizedItems,
    install_configuration: snapshot.installConfiguration,
  };
  const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
    { order_id: order.id },
    "-created_date",
    200
  );
  const workspace = await buildRemoteSetupWorkspace({
    base44,
    order: hydratedOrder,
    orderEvents: events || [],
  });

  return {
    order: hydratedOrder,
    workspace,
    events: events || [],
  };
}

export async function buildPreparedSetupProposal({ base44, order }) {
  const current = await buildWorkspaceForOrder(base44, order);
  const prepared = derivePreparedPatch({
    order: current.order,
    workspace: current.workspace,
  });
  const simulatedConfig = mergeInstallConfiguration(current.order.install_configuration, prepared.patch);
  const simulatedOrder = {
    ...current.order,
    install_configuration: simulatedConfig,
  };
  const simulatedWorkspace = await buildRemoteSetupWorkspace({
    base44,
    order: simulatedOrder,
    orderEvents: current.events,
  });

  return {
    generated_at: new Date().toISOString(),
    patch: prepared.patch,
    suggestions_applied: prepared.suggestions_applied,
    deployment_summary: {
      will_configure: prepared.suggestions_applied,
      will_test: getSummaryServices(
        simulatedWorkspace.services || [],
        (service) => service.go_live_readiness?.can_move_to_testing || service.install_status === "Testing"
      ),
      will_remain_manual: simulatedWorkspace.workspace_summary?.setup_assist?.manual_required || [],
      expected_blockers: (simulatedWorkspace.workspace_summary?.next_best_actions || [])
        .filter((action) => action.level === "blocker")
        .map((action) => ({
          title: action.title,
          detail: action.detail,
          service_display_name: action.service_display_name || null,
        })),
      counts: {
        suggested_updates: prepared.suggestions_applied.length,
        ready_for_testing_after_prepare: simulatedWorkspace.services.filter((service) => service.go_live_readiness?.can_move_to_testing).length,
        ready_for_live_after_prepare: simulatedWorkspace.services.filter((service) => service.go_live_readiness?.can_move_to_live).length,
        manual_items_after_prepare: simulatedWorkspace.workspace_summary?.setup_assist?.manual_required_count || 0,
      },
    },
    current_overview: buildAssistedDeploymentOverview({ workspace: current.workspace }),
    post_prepare_overview: buildAssistedDeploymentOverview({ workspace: simulatedWorkspace }),
  };
}

async function executeServiceRuntimeTest({
  base44,
  order,
  serviceKey,
  targetPhone,
  targetEmail,
  now,
}) {
  if (serviceKey === "instant_lead_response") {
    return executeOrderServiceRuntime({
      base44,
      order,
      serviceKey,
      runtimeType: "test_lead",
      recipientPhone: targetPhone,
      runtimeData: {
        lead_name: "Setup Sequence Test Lead",
        lead_phone: targetPhone,
      },
      now,
    });
  }

  if (serviceKey === "missed_call_text_back") {
    return executeOrderServiceRuntime({
      base44,
      order,
      serviceKey,
      runtimeType: "simulate_missed_call",
      recipientPhone: targetPhone,
      runtimeData: {
        caller_name: "Setup Sequence Caller",
        caller_phone: targetPhone,
        call_status: "no-answer",
      },
      now,
    });
  }

  if (serviceKey === "nurture_sequence_14d") {
    return executeNurtureSequenceTest({
      base44,
      order,
      recipientPhone: targetPhone,
      recipientEmail: targetEmail,
      stepIndex: 0,
      now,
    });
  }

  if (serviceKey === "ai_booking_agent") {
    return executeBookingSimulation({
      base44,
      order,
      leadName: "Setup Sequence Booking Lead",
      leadEmail: targetEmail,
      leadPhone: targetPhone,
      scheduledAt: now,
      now,
    });
  }

  if (serviceKey === "lead_reactivation") {
    return executeLeadReactivationTest({
      base44,
      order,
      maxTestLeads: 3,
      now,
    });
  }

  if (serviceKey === "review_request") {
    return executeReviewRequestTest({
      base44,
      order,
      recipientPhone: targetPhone,
      recipientEmail: targetEmail,
      customerName: order.customer_name || "Setup Sequence Customer",
      triggerEvent: order.install_configuration?.services?.review_request?.trigger_event || "manual_trigger",
      now,
    });
  }

  throw new RuntimeExecutionError("Unsupported service test runtime", {
    status: 400,
    code: "unsupported_service_runtime",
    details: { service_key: serviceKey },
  });
}

export class AssistedDeploymentError extends Error {
  constructor(message, { status = 409, code = "assisted_deployment_failed", details = {} } = {}) {
    super(message);
    this.name = "AssistedDeploymentError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function executeAssistedSetupSequence({
  base44,
  order,
  confirmed = false,
  selectedServiceKeys = [],
  targetPhone = "",
  targetEmail = "",
  note = "",
  now = new Date().toISOString(),
}) {
  if (!confirmed) {
    throw new AssistedDeploymentError("Operator confirmation is required before running setup sequence", {
      status: 400,
      code: "operator_confirmation_required",
    });
  }

  let currentOrder = order;
  let currentWorkspaceBundle = await buildWorkspaceForOrder(base44, currentOrder);
  const selectedSet = selectedServiceKeys.length > 0 ? new Set(selectedServiceKeys) : null;
  const manualServices = [];
  const candidateServices = [];

  for (const service of currentWorkspaceBundle.workspace.services || []) {
    if (selectedSet && !selectedSet.has(service.service_key)) {
      continue;
    }

    if (service.install_status === "Live" || service.go_live_readiness?.tested) {
      continue;
    }

    if (!service.configuration_complete) {
      manualServices.push({
        service_key: service.service_key,
        display_name: service.display_name,
        reason: "Configuration is incomplete and must be saved before sequence execution.",
      });
      continue;
    }

    candidateServices.push(service);
  }

  if (candidateServices.length === 0) {
    throw new AssistedDeploymentError("No sequence-ready services were found on this order", {
      status: 409,
      code: "no_sequence_ready_services",
      details: {
        manual_services: manualServices,
      },
    });
  }

  const startEvent = await base44.asServiceRole.entities.CommunicationEvent.create(
    createAssistedDeploymentEvent({
      order: currentOrder,
      subject: "Assisted setup sequence started",
      messageBody: `Assisted setup sequence started for ${candidateServices.length} service(s).`,
      metadata: {
        assisted_deployment_type: "setup_sequence",
        selected_service_keys: candidateServices.map((service) => service.service_key),
        manual_services: manualServices,
        note,
      },
    })
  );

  const results = [];

  try {
    for (const service of candidateServices) {
      const serviceResult = {
        service_key: service.service_key,
        display_name: service.display_name,
        starting_status: service.install_status,
        steps: [],
      };

      currentWorkspaceBundle = await buildWorkspaceForOrder(base44, currentOrder);
      const currentService = currentWorkspaceBundle.workspace.services.find(
        (entry) => entry.service_key === service.service_key
      );

      if (!currentService) {
        throw new AssistedDeploymentError("Tracked service not found during assisted sequence", {
          code: "assisted_service_not_found",
          details: {
            service_key: service.service_key,
            partial_results: results,
            start_event_id: startEvent.id,
          },
        });
      }

      if (currentService.install_status === "Ready for Install") {
        currentOrder = await updateTrackedServiceInstallStatus({
          base44,
          order: currentOrder,
          serviceKey: currentService.service_key,
          nextStatus: "Configuring",
          note: note || "Assisted setup sequence",
          now,
        });
        serviceResult.steps.push({
          action: "transition",
          to_status: "Configuring",
        });
      }

      currentWorkspaceBundle = await buildWorkspaceForOrder(base44, currentOrder);
      const configuringService = currentWorkspaceBundle.workspace.services.find(
        (entry) => entry.service_key === service.service_key
      );

      if (configuringService?.install_status === "Configuring") {
        currentOrder = await updateTrackedServiceInstallStatus({
          base44,
          order: currentOrder,
          serviceKey: configuringService.service_key,
          nextStatus: "Testing",
          note: note || "Assisted setup sequence",
          now,
        });
        serviceResult.steps.push({
          action: "transition",
          to_status: "Testing",
        });
      }

      currentWorkspaceBundle = await buildWorkspaceForOrder(base44, currentOrder);
      const testingService = currentWorkspaceBundle.workspace.services.find(
        (entry) => entry.service_key === service.service_key
      );

      const resolvedPhone = cleanString(targetPhone) || cleanString(currentWorkspaceBundle.workspace.workspace_summary?.runtime_targets?.suggested_phone) || cleanString(currentOrder.customer_phone);
      const resolvedEmail = cleanString(targetEmail) || cleanString(currentWorkspaceBundle.workspace.workspace_summary?.runtime_targets?.suggested_email) || cleanString(currentOrder.customer_email);

      const runtimeResult = await executeServiceRuntimeTest({
        base44,
        order: currentOrder,
        serviceKey: service.service_key,
        targetPhone: resolvedPhone,
        targetEmail: resolvedEmail,
        now,
      });

      serviceResult.steps.push({
        action: "runtime_test",
        result: {
          success: runtimeResult.success === true,
          runtime_type: runtimeResult.runtime_type,
          created_event_ids: runtimeResult.created_event_ids || [],
        },
      });

      currentWorkspaceBundle = await buildWorkspaceForOrder(base44, currentOrder);
      const verifiedService = currentWorkspaceBundle.workspace.services.find(
        (entry) => entry.service_key === service.service_key
      );
      serviceResult.ending_status = verifiedService?.install_status || currentService.install_status;
      serviceResult.successful_test_exists = Boolean(verifiedService?.test_summary?.successful_test_exists);
      results.push(serviceResult);
    }

    const completionEvent = await base44.asServiceRole.entities.CommunicationEvent.create(
      createAssistedDeploymentEvent({
        order: currentOrder,
        subject: "Assisted setup sequence completed",
        messageBody: `Assisted setup sequence completed for ${results.length} service(s).`,
        metadata: {
          assisted_deployment_type: "setup_sequence",
          result: "completed",
          start_event_id: startEvent.id,
          service_results: results,
          manual_services: manualServices,
          note,
        },
      })
    );

    const finalWorkspace = await buildWorkspaceForOrder(base44, currentOrder);

    return {
      success: true,
      order_id: currentOrder.id,
      start_event_id: startEvent.id,
      completion_event_id: completionEvent.id,
      service_results: results,
      manual_services: manualServices,
      final_overview: buildAssistedDeploymentOverview({
        workspace: finalWorkspace.workspace,
      }),
    };
  } catch (error) {
    const normalizedError = error instanceof AssistedDeploymentError
      ? error
      : error instanceof RuntimeExecutionError
      ? new AssistedDeploymentError(error.message, {
          status: error.status || 409,
          code: error.code || "runtime_sequence_failed",
          details: error.details || {},
        })
      : new AssistedDeploymentError(error instanceof Error ? error.message : "Assisted setup sequence failed", {
          status: 500,
          code: "assisted_setup_sequence_failed",
        });

    const failureEvent = await base44.asServiceRole.entities.CommunicationEvent.create(
      createAssistedDeploymentEvent({
        order: currentOrder,
        subject: "Assisted setup sequence stopped",
        messageBody: normalizedError.message,
        status: "failed",
        metadata: {
          assisted_deployment_type: "setup_sequence",
          result: "failed",
          start_event_id: startEvent.id,
          partial_results: results,
          manual_services: manualServices,
          error_code: normalizedError.code,
          error_details: normalizedError.details,
          note,
        },
      })
    );

    throw new AssistedDeploymentError(normalizedError.message, {
      status: normalizedError.status || 409,
      code: normalizedError.code || "assisted_setup_sequence_failed",
      details: {
        ...(normalizedError.details || {}),
        partial_results: results,
        manual_services: manualServices,
        start_event_id: startEvent.id,
        failure_event_id: failureEvent.id,
      },
    });
  }
}
