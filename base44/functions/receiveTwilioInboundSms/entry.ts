/**
 * Disabled during canonical lockdown.
 * This legacy inbound SMS handler only targeted WebsiteLead-era follow-up state.
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

import { logLegacyEndpointWarning } from "../_shared/legacyQuarantine.js";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const formData = req.method === "POST" ? await req.formData().catch(() => null) : null;
  const payload = formData ? Object.fromEntries(formData) : {};

  await logLegacyEndpointWarning({
    base44,
    endpointName: "receiveTwilioInboundSms",
    metadata: {
      method: req.method,
      message_sid: payload?.MessageSid || null,
      from: payload?.From || null,
      to: payload?.To || null,
    },
    messageBody:
      "receiveTwilioInboundSms is disabled during canonical lockdown because it mutates non-canonical WebsiteLead follow-up state instead of the canonical order-backed automation engine.",
  });

  return Response.json(
    {
      success: false,
      blocked: true,
      endpoint: "receiveTwilioInboundSms",
      code: "legacy_endpoint_quarantined",
      message: "Inbound SMS processing is disabled on this legacy endpoint during canonical lockdown.",
      replacement: ["receiveTwilioStatusWebhook"],
    },
    { status: 200 }
  );
});
