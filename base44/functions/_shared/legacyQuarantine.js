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
      "listInstallQueue",
      "getInstallConfiguration",
      "updateInstallConfiguration",
      "updateInstallStatus",
      "runAssistedSetupSequence",
    ],
    reason:
      "This auto-advance path can mark paid services Live without the canonical install workspace, runtime test proof, and per-service status guards.",
  },
  twilioinbound: {
    replacement: [
      "receiveTwilioStatusWebhook",
      "receiveTwilioInboundSms",
      "Canonical order-backed missed-call runtime",
    ],
    reason:
      "This legacy Twilio call handler writes Leads and AutomationJob records outside the canonical WebsiteLead and order-backed install/runtime flow.",
  },
  receiveTwilioMissedCallWebhook: {
    replacement: [
      "receiveTwilioStatusWebhook",
      "Canonical order-backed missed-call runtime",
    ],
    reason:
      "This deprecated Twilio missed-call webhook reads WebsiteLead and AdminSettings instead of canonical paid Order.install_configuration and Live service gating.",
  },
  processNurtureCampaigns: {
    replacement: [
      "processNurtureSequenceRuntime",
      "Canonical 14-day nurture runner",
    ],
    reason:
      "This legacy nurture scheduler operates on NurtureCampaign records and a retired 30-day email-only flow instead of the canonical order-backed 14-day nurture runtime.",
  },
  reactivateLeadOutreach: {
    replacement: [
      "runLeadReactivationBatch",
      "Canonical manual-approved reactivation batch",
    ],
    reason:
      "This legacy reactivation flow queues AutomationJob records against LeadReactivation instead of using the canonical manual-approved batch on order-backed service config.",
  },
  handleBookingTrigger: {
    replacement: [
      "runBookingAgentTest",
      "Canonical booking handoff placeholder",
    ],
    reason:
      "This legacy booking trigger sends generic SMS/email outside the canonical order-backed booking handoff model and should stay retired until a real provider is chosen.",
  },
  stripeInvoiceWebhook: {
    replacement: [
      "stripeWebhookOrders",
      "Canonical Subscription and Order billing sync",
    ],
    reason:
      "This duplicate Stripe invoice webhook conflicts with the canonical order-backed billing sync path and can create divergent invoice and subscription truth.",
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
