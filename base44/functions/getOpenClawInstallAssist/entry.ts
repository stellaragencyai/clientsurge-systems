import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { requireAdminUser, AuthGuardError } from "../_shared/authGuards.js";
import {
  buildInstallSnapshot,
  getOrderConfigurationSummary,
  mapPipelineStatusToOrderStatus,
} from "../_shared/installPipeline.js";
import { buildAssistedDeploymentOverview } from "../_shared/assistedDeployment.js";
import { buildRemoteSetupWorkspace } from "../_shared/remoteSetupWorkspace.js";
import { buildOpenClawInstallAssist } from "../_shared/openClawAssist.js";

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
    await requireAdminUser(base44);

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
    const [client, clientProject, onboardingClient, events] = await Promise.all([
      safeGetEntity(base44.asServiceRole.entities.Client, order.client_id),
      safeGetEntity(base44.asServiceRole.entities.ClientProject, order.client_project_id),
      safeGetEntity(base44.asServiceRole.entities.OnboardingClient, order.onboarding_client_id),
      base44.asServiceRole.entities.CommunicationEvent.filter({ order_id: order.id }, "-created_date", 100),
    ]);

    const remoteSetupWorkspace = await buildRemoteSetupWorkspace({
      base44,
      order: {
        ...order,
        items: snapshot.normalizedItems,
        install_configuration: snapshot.installConfiguration,
      },
      orderEvents: events || [],
    });

    const orderDetail = {
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
      pipeline_error: order.pipeline_error,
      client_id: order.client_id,
      client_project_id: order.client_project_id,
      onboarding_client_id: order.onboarding_client_id,
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
        allowed_next_statuses: serviceState.allowed_next_statuses,
        required_actions: serviceState.required_actions,
        go_live_readiness: serviceState.go_live_readiness,
        test_summary: serviceState.test_summary,
        operator_summary: serviceState.operator_summary,
      })),
      provider_readiness: remoteSetupWorkspace.provider_readiness,
      latest_provider_tests: remoteSetupWorkspace.latest_provider_tests,
      required_actions: remoteSetupWorkspace.required_actions,
      workspace_summary: remoteSetupWorkspace.workspace_summary,
      assisted_deployment: {
        overview: buildAssistedDeploymentOverview({
          workspace: remoteSetupWorkspace,
        }),
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
        business_name: clientProject.business_name,
        plan: clientProject.plan,
      } : null,
      onboarding_client: onboardingClient ? {
        id: onboardingClient.id,
        business_name: onboardingClient.business_name,
        status: onboardingClient.status,
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
      })),
    };

    return Response.json({
      success: true,
      assist: buildOpenClawInstallAssist({ orderDetail }),
    });
  } catch (error) {
    const status =
      error instanceof AuthGuardError ? error.status :
      error instanceof Error && error.message === "Order not found" ? 404 :
      error instanceof Error && error.message === "order_id is required" ? 400 :
      500;
    const message = error instanceof Error ? error.message : "Failed to build OpenClaw install assist payload";

    return Response.json({ error: message }, { status });
  }
});
