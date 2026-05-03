const LEGACY_ENDPOINTS = {
  configureService: {
    replacement: [
      "updateInstallConfiguration",
      "updateInstallStatus",
      "InstallOrderWorkspace",
    ],
    reason:
      "This legacy service configurator mutates unsupported template, webhook, and job records outside the canonical Order -> installPipeline.js -> installRuntime.js flow.",
  },
  installPipeline: {
    replacement: [
      "updateInstallStatus",
      "listInstallQueue",
      "initializePaidOrderInstallPipeline",
    ],
    reason:
      "This older installPipeline entrypoint duplicates status logic and must not bypass the canonical shared installPipeline.js guardrails.",
  },
  createLeadAndDispatch: {
    replacement: [
      "submitLeadCapture",
      "submitContactInquiry",
      "scheduleDemoBooking",
    ],
    reason:
      "This legacy lead creation endpoint writes to deprecated Lead/AutomationJob/ConversationThread flows and bypasses the canonical Leads and CommunicationEvent path.",
  },
  handleNewLead: {
    replacement: [
      "Order-backed runtime execution",
      "sendTestLead",
      "simulateMissedCall",
    ],
    reason:
      "This legacy handler mutates Leads through generic sendSMS/sendEmail behavior and bypasses canonical order-backed service gating.",
  },
  sendLeadInstantSms: {
    replacement: [
      "Order-backed runtime execution",
      "sendTestLead",
    ],
    reason:
      "This legacy SMS path reads AdminSettings and Lead records instead of canonical Order.install_configuration and Order.items install state.",
  },
  receiveTwilioSMS: {
    replacement: [
      "receiveTwilioStatusWebhook",
      "Order-backed runtime execution",
    ],
    reason:
      "This legacy Twilio path writes to Messages and old AI reply flows instead of canonical CommunicationEvent and order-backed service runtime.",
  },
  receiveTwilioInboundWebhook: {
    replacement: [
      "receiveTwilioStatusWebhook",
    ],
    reason:
      "This legacy inbound Twilio webhook writes to deprecated Lead and ConversationThread records and can drift from canonical order-backed runtime state.",
  },
  scheduleFollowUpEmails: {
    replacement: [
      "Canonical order-backed runtime and CommunicationEvent flows",
    ],
    reason:
      "This legacy scheduler creates unsupported AutomationJob types against deprecated Lead-based nurturing flow.",
  },
  scheduleFollowUpSMS: {
    replacement: [
      "Canonical order-backed runtime and CommunicationEvent flows",
    ],
    reason:
      "This legacy scheduler sends generic SMS and writes Messages records outside the canonical install/runtime model.",
  },
  autoEndToEndTest: {
    replacement: [
      "Admin install workspace runtime actions",
      "sendTestLead",
      "simulateMissedCall",
    ],
    reason:
      "This legacy E2E check validates createLeadAndDispatch-era behavior and no longer reflects the canonical install/runtime pipeline.",
  },
  autoSendWebhookInstructions: {
    replacement: [
      "Canonical paid-order install workspace",
    ],
    reason:
      "This legacy instruction flow distributes createLeadAndDispatch webhook URLs that bypass the canonical forward path.",
  },
  autoProvisionTwilioNumber: {
    replacement: [
      "Canonical Twilio routing migration (pending)",
    ],
    reason:
      "This provisioning flow still points purchased numbers at retired Twilio handlers and should stay paused until canonical live routing is finalized.",
  },
  autoAdvanceInstallPipeline: {
    replacement: [
      "InstallOrderWorkspace",
      "updateInstallStatus",
      "runOrderProviderProof",
    ],
    reason:
      "This legacy auto-live scheduler can advance orders to Live without the current guarded install workspace and proof flow.",
  },
  sendLeadConfirmationEmail: {
    replacement: [
      "submitContactInquiry",
      "scheduleDemoBooking",
      "CommunicationEvent-backed website funnel notifications",
    ],
    reason:
      "This legacy confirmation flow reads deprecated Lead records and should not be used as a canonical website or customer CRM notification path.",
  },
  sendAdminLeadNotification: {
    replacement: [
      "submitContactInquiry",
      "scheduleDemoBooking",
      "CommunicationEvent-backed website funnel notifications",
    ],
    reason:
      "This legacy admin notification flow reads deprecated Lead records and bypasses the explicit WebsiteLead versus Leads boundary.",
  },
  sendFollowUpEmail: {
    replacement: [
      "triggerFollowUpSequence",
      "processDripCampaigns",
      "Canonical CommunicationEvent-backed outreach flows",
    ],
    reason:
      "This legacy follow-up email flow reads deprecated Lead/AutomationJob state and is not approved for launch-critical CRM runtime.",
  },
  onLeadCreated: {
    replacement: [
      "submitLeadCapture",
      "submitContactInquiry",
      "scheduleDemoBooking",
    ],
    reason:
      "This legacy webhook fan-out assumes an old generic lead model and is not an approved canonical runtime boundary.",
  },
  handleBookingTrigger: {
    replacement: [
      "Canonical order-backed booking runtime",
      "Admin customer-lead CRM actions",
    ],
    reason:
      "This legacy booking trigger sends outreach through generic helper functions instead of the canonical guarded runtime and CommunicationEvent flow.",
  },
  sendBookingEmail: {
    replacement: [
      "Canonical order-backed booking runtime",
      "Admin customer-lead CRM actions",
    ],
    reason:
      "This legacy booking email helper bypasses canonical runtime guards and should not be used for launch-critical lead outreach.",
  },
  sendBookingLinkSMS: {
    replacement: [
      "Canonical order-backed booking runtime",
      "Admin customer-lead CRM actions",
    ],
    reason:
      "This legacy booking-link automation triggers direct SMS without canonical order-backed gating and should remain quarantined.",
  },
  processAutomationJobs: {
    replacement: [
      "InstallOrderWorkspace",
      "runLeadReactivationTest",
      "Canonical order-backed runtime and CommunicationEvent flows",
    ],
    reason:
      "This legacy job runner sends direct Twilio and Resend messages from AutomationJob records outside the canonical order-backed install runtime.",
  },
  processDripCampaigns: {
    replacement: [
      "runNurtureSequenceTest",
      "InstallOrderWorkspace",
      "Canonical order-backed nurture runtime",
    ],
    reason:
      "This legacy drip scheduler sends direct Twilio and Resend messages from DripCampaign records and is not the canonical order-backed nurture runtime.",
  },
  processMissedCallFollowUps: {
    replacement: [
      "receiveTwilioStatusWebhook",
      "runOrderProviderProof",
      "Canonical missed_call_text_back runtime",
    ],
    reason:
      "This legacy follow-up scheduler sends duplicate outreach outside the canonical missed_call_text_back service runtime and CommunicationEvent gating.",
  },
  processNurtureCampaigns: {
    replacement: [
      "runNurtureSequenceTest",
      "Canonical order-backed nurture runtime",
    ],
    reason:
      "This legacy nurture scheduler runs against NurtureCampaign instead of the canonical order-backed service install/runtime path.",
  },
  triggerAutoReviewRequest: {
    replacement: [
      "runReviewRequestTest",
      "InstallOrderWorkspace",
      "Canonical review-request runtime",
    ],
    reason:
      "This legacy entity automation sends review requests through a duplicate path outside the canonical install workspace and service runtime.",
  },
  sendReviewRequest: {
    replacement: [
      "runReviewRequestTest",
      "InstallOrderWorkspace",
      "Canonical review-request runtime",
    ],
    reason:
      "This legacy review-request sender bypasses the canonical order-backed runtime and should not be used as a production delivery path.",
  },
  triggerFollowUpSequence: {
    replacement: [
      "webhookLeadCapture",
      "sendTestLead",
      "Canonical order-backed runtime and CommunicationEvent flows",
    ],
    reason:
      "This legacy manual follow-up sender reads generic AdminSettings and Leads data instead of the canonical order-backed install runtime.",
  },
  submitLeadCapture: {
    replacement: [
      "webhookLeadCapture",
    ],
    reason:
      "This platform WebsiteLead intake path is disabled during canonical lockdown so paid-service traffic cannot split away from canonical Leads and CommunicationEvent logging.",
  },
  receiveTwilioInboundSms: {
    replacement: [
      "receiveTwilioStatusWebhook",
    ],
    reason:
      "This inbound SMS handler only mutates WebsiteLead-era automation state and is disabled during canonical runtime lockdown.",
  },
};

export function getLegacyEndpointQuarantine(endpointName) {
  const definition = LEGACY_ENDPOINTS[endpointName];
  if (!definition) {
    throw new Error(`Unknown legacy endpoint quarantine target: ${endpointName}`);
  }

  return {
    error: `${endpointName} has been quarantined`,
    code: "legacy_endpoint_quarantined",
    endpoint: endpointName,
    reason: definition.reason,
    replacement: definition.replacement,
    status: 410,
  };
}

export function buildLegacyEndpointResponse(endpointName) {
  const payload = getLegacyEndpointQuarantine(endpointName);
  return Response.json(payload, { status: payload.status });
}

export async function logLegacyEndpointWarning({
  base44,
  endpointName,
  order = null,
  serviceKey = "",
  subject,
  messageBody,
  metadata = {},
}) {
  if (!base44?.asServiceRole?.entities?.CommunicationEvent?.create) {
    return null;
  }

  const definition = getLegacyEndpointQuarantine(endpointName);
  const eventPayload = {
    channel: "internal",
    direction: "system",
    event_type: "status_update",
    provider: "internal",
    status: "failed",
    subject: subject || `Legacy endpoint blocked: ${endpointName}`,
    message_body:
      messageBody ||
      `${endpointName} was triggered but blocked during canonical lockdown. ${definition.reason}`,
    service_key: serviceKey || undefined,
    order_id: order?.id || undefined,
    client_id: order?.client_id || undefined,
    client_project_id: order?.client_project_id || undefined,
    onboarding_client_id: order?.onboarding_client_id || undefined,
    context_type: "legacy_endpoint_quarantine",
    context_id: order?.id ? `${endpointName}:${order.id}` : endpointName,
    metadata_json: JSON.stringify({
      endpoint: endpointName,
      replacement: definition.replacement,
      ...metadata,
    }),
  };

  try {
    return await base44.asServiceRole.entities.CommunicationEvent.create(eventPayload);
  } catch (error) {
    console.warn(`[legacyQuarantine] Failed to log blocked legacy endpoint ${endpointName}:`, error?.message || error);
    return null;
  }
}
