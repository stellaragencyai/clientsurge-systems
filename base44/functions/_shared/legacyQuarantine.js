const LEGACY_ENDPOINTS = {
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
  autoProvisionTwilioNumber: {
    replacement: [
      "Canonical Twilio routing migration (pending)",
    ],
    reason:
      "This provisioning flow still points purchased numbers at retired Twilio handlers and should stay paused until canonical live routing is finalized.",
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
