import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import {
  buildInstallSnapshot,
  getOrderConfigurationSummary,
  mapPipelineStatusToOrderStatus,
} from "../_shared/installPipeline.js";
import { buildAssistedDeploymentOverview } from "../_shared/assistedDeployment.js";
import { buildRemoteSetupWorkspace } from "../_shared/remoteSetupWorkspace.js";
import { buildSubscriptionSummary } from "../_shared/subscriptionSync.js";

async function requireAdmin(base44: ReturnType<typeof createClientFromRequest>) {
  const user = await base44.auth.me();
  if (!user || user.role !== "admin") {
    throw new Error("Admin access required");
  }
}

async function safeGetEntity(
  collection: {
    get: (id: string) => Promise<Record<string, unknown>>;
  },
  id?: string | null
) {
  if (!id) {
    return null;
  }

  try {
    return await collection.get(id);
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    await requireAdmin(base44);

    const payload = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const orderId =
      payload?.order_id ||
      new URL(req.url).searchParams.get("order_id");

    if (!orderId) {
      return Response.json({ error: "order_id is required" }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.Order.get(orderId);
    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const snapshot = buildInstallSnapshot(order);
    const [client, clientProject, onboardingClient, directSubscription, fallbackSubscriptions, events] = await Promise.all([
      safeGetEntity(base44.asServiceRole.entities.Client, order.client_id),
      safeGetEntity(base44.asServiceRole.entities.ClientProject, order.client_project_id),
      safeGetEntity(base44.asServiceRole.entities.OnboardingClient, order.onboarding_client_id),
      safeGetEntity(base44.asServiceRole.entities.Subscription, order.subscription_id),
      order.stripe_subscription_id
        ? base44.asServiceRole.entities.Subscription.filter({ stripe_subscription_id: order.stripe_subscription_id })
        : Promise.resolve([]),
      base44.asServiceRole.entities.CommunicationEvent.filter({ order_id: order.id }, "-created_date", 100),
    ]);
    const linkedSubscription = directSubscription || fallbackSubscriptions?.[0] || null;
    const remoteSetupWorkspace = await buildRemoteSetupWorkspace({
      base44,
      order: {
        ...order,
        items: snapshot.normalizedItems,
        install_configuration: snapshot.installConfiguration,
      },
      orderEvents: events || [],
    });

    return Response.json({
      success: true,
      order: {
        id: order.id,
        business_name: order.business_name,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        payment_status: order.payment_status,
        pipeline_status: snapshot.pipelineStatus,
        order_status: mapPipelineStatusToOrderStatus({
          pipelineStatus: snapshot.pipelineStatus,
          trackedItems: snapshot.trackedItems,
          paymentStatus: order.payment_status,
        }),
        total_setup: order.total_setup,
        total_monthly: order.total_monthly,
        pricing_summary: order.pricing_summary || {
          pricing_version: "canonical_sales_catalog_v1",
          package_key: null,
          package_name: null,
          package_service_keys: [],
          add_on_service_keys: [],
          selected_service_keys: snapshot.serviceStates.map((serviceState) => serviceState.service_key),
          selected_product_ids: snapshot.serviceStates.map((serviceState) => serviceState.product_id),
          total_setup_before_discount: order.total_setup || 0,
          total_monthly_before_discount: order.total_monthly || 0,
          total_setup: order.total_setup || 0,
          total_monthly: order.total_monthly || 0,
          setup_discount_total: 0,
          monthly_discount_total: 0,
          compare_at_setup: null,
          compare_at_monthly: null,
        },
        stripe_session_id: order.stripe_session_id,
        stripe_customer_id: order.stripe_customer_id,
        subscription_id: order.subscription_id || null,
        stripe_subscription_id: order.stripe_subscription_id || null,
        subscription_status: order.subscription_status || "",
        billing_status: order.billing_status || "",
        current_period_start: order.current_period_start || null,
        current_period_end: order.current_period_end || null,
        plan_type: order.plan_type || "",
        created_date: order.created_date,
        install_initialized_at: order.install_initialized_at,
        install_configuration_updated_at: order.install_configuration_updated_at,
        last_install_event_at: order.last_install_event_at,
        pipeline_error: order.pipeline_error,
        client_id: order.client_id,
        client_project_id: order.client_project_id,
        onboarding_client_id: order.onboarding_client_id,
        notes: order.notes,
        install_configuration: snapshot.installConfiguration,
        items: snapshot.normalizedItems,
        configuration_summary: getOrderConfigurationSummary({
          ...order,
          items: snapshot.normalizedItems,
          install_configuration: snapshot.installConfiguration,
        }),
        services: remoteSetupWorkspace.services.map((serviceState) => ({
          service_key: serviceState.service_key,
          display_name: serviceState.display_name,
          install_status: serviceState.install_status,
          configuration: serviceState.configuration,
          configuration_complete: serviceState.configuration_complete,
          missing_configuration_fields: serviceState.missing_configuration_fields,
          missing_configuration_labels: serviceState.missing_configuration_labels,
          allowed_next_statuses: serviceState.allowed_next_statuses,
          required_actions: serviceState.required_actions,
          go_live_readiness: serviceState.go_live_readiness,
          test_summary: serviceState.test_summary || {
            latest_runtime_event_type: null,
            latest_runtime_at: null,
            latest_runtime_status: null,
            latest_booking_simulation_at: null,
            latest_batch_summary_at: null,
            latest_batch_summary: null,
            latest_review_trigger_at: null,
            latest_review_trigger: null,
            latest_success_at: null,
            latest_blocked_at: null,
            latest_failed_at: null,
            successful_test_exists: false,
          },
          target_size: serviceState.target_size ?? 0,
          target_lead_preview: serviceState.target_lead_preview || [],
          scheduler: serviceState.scheduler || null,
          playbook: serviceState.playbook || null,
          config_suggestions: serviceState.config_suggestions || {
            fields: {},
            presets: {},
            insights: {},
          },
          timeline_relevance: serviceState.timeline_relevance || {
            latest_event_type: null,
            latest_event_at: null,
            successful_test_exists: false,
          },
          operator_summary: serviceState.operator_summary || {
            blocker_count: 0,
            next_action_title: "No action required",
            next_action_detail: "",
            phase_summary: "",
          },
        })),
        provider_readiness: remoteSetupWorkspace.provider_readiness,
        integration_health_summary: remoteSetupWorkspace.integration_health_summary,
        latest_provider_tests: remoteSetupWorkspace.latest_provider_tests,
        subscription: buildSubscriptionSummary(linkedSubscription) || (order.subscription_id || order.stripe_subscription_id
          ? {
              id: order.subscription_id || null,
              client_id: order.client_id || null,
              stripe_customer_id: order.stripe_customer_id || null,
              stripe_subscription_id: order.stripe_subscription_id || null,
              plan_type: order.plan_type || "",
              status: order.subscription_status || "",
              current_period_start: order.current_period_start || null,
              current_period_end: order.current_period_end || null,
              services_included: order.pricing_summary?.selected_service_keys || [],
              change_request_type: "",
              requested_plan_type: "",
              change_request_status: "",
              cancel_requested_at: null,
            }
          : null),
        required_actions: remoteSetupWorkspace.required_actions,
        assisted_deployment: {
          overview: buildAssistedDeploymentOverview({
            workspace: remoteSetupWorkspace,
          }),
        },
        workspace_summary: remoteSetupWorkspace.workspace_summary || {
          headline: "Remote setup summary unavailable",
          detail: "",
          counts: {
            tracked_services: 0,
            configuration_ready: 0,
            ready_for_testing: 0,
            ready_for_live: 0,
            live: 0,
            blockers: 0,
          },
          shared_configuration: {
            required: false,
            complete: true,
            required_count: 0,
            present_count: 0,
            missing_fields: [],
            fields: [],
          },
          shared_suggestions: {
            fields: {},
          },
          next_best_actions: [],
          runtime_targets: {
            suggested_phone: order.customer_phone || "",
            suggested_email: order.customer_email || "",
          },
          setup_assist: {
            safe_autofill_count: 0,
            manual_required_count: 0,
            safe_autofill: [],
            manual_required: [],
            blocker_summary: [],
          },
          command_view: {
            configure_first: null,
            move_to_testing_now: null,
            test_now: null,
            go_live_now: null,
            primary_blocker: null,
          },
          service_filter_counts: {
            all: 0,
            blocked: 0,
            testing_ready: 0,
            live_ready: 0,
            in_testing: 0,
            live: 0,
          },
          deployment_summary: {
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
        },
        operator_sequence: remoteSetupWorkspace.operator_sequence,
        client: client ? {
          id: client.id,
          full_name: client.full_name,
          business_name: client.business_name,
          email: client.email,
          phone: client.phone,
          status: client.status,
        } : null,
        client_project: clientProject ? {
          id: clientProject.id,
          client_email: clientProject.client_email,
          client_name: clientProject.client_name,
          business_name: clientProject.business_name,
          plan: clientProject.plan,
          plan_change_request: clientProject.plan_change_request,
          go_live_date: clientProject.go_live_date,
          step_onboarding: clientProject.step_onboarding,
          step_payment: clientProject.step_payment,
          step_system_setup: clientProject.step_system_setup,
          step_sms: clientProject.step_sms,
          step_email: clientProject.step_email,
          step_booking: clientProject.step_booking,
          step_followup: clientProject.step_followup,
          step_live: clientProject.step_live,
        } : null,
        onboarding_client: onboardingClient ? {
          id: onboardingClient.id,
          business_name: onboardingClient.business_name,
          owner_name: onboardingClient.owner_name,
          email: onboardingClient.email,
          phone: onboardingClient.phone,
          status: onboardingClient.status,
          twilio_number: onboardingClient.twilio_number,
          monthly_rate: onboardingClient.monthly_rate,
          setup_fee: onboardingClient.setup_fee,
          step_twilio: onboardingClient.step_twilio,
          step_instant_response: onboardingClient.step_instant_response,
          step_missed_call: onboardingClient.step_missed_call,
          step_messages_customized: onboardingClient.step_messages_customized,
          step_tested: onboardingClient.step_tested,
          step_live: onboardingClient.step_live,
        } : null,
        timeline: (events || []).map((event: Record<string, unknown>) => ({
          id: event.id,
          created_date: event.created_date,
          event_type: event.event_type,
          channel: event.channel,
          direction: event.direction,
          provider: event.provider,
          status: event.status,
          service_key: event.service_key,
          subject: event.subject,
          message_body: event.message_body,
          error_message: event.error_message,
          metadata_json: event.metadata_json,
        })),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load install configuration";
    const status =
      message === "Admin access required" ? 403 :
      message === "Order not found" ? 404 :
      message === "order_id is required" ? 400 :
      500;

    return Response.json({ error: message }, { status });
  }
});
