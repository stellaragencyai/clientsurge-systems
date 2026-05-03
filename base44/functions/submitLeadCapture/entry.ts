/**
 * PLATFORM-WEBSITE-ONLY
 * Disabled during canonical lockdown so service traffic cannot bypass
 * the canonical paid-customer automation engine.
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

import {
  buildLegacyEndpointResponse,
  logLegacyEndpointWarning,
} from "../_shared/legacyQuarantine.js";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  await logLegacyEndpointWarning({
    base44,
    endpointName: "submitLeadCapture",
    metadata: {
      method: req.method,
    },
    messageBody:
      "submitLeadCapture is disabled during canonical lockdown. New automation traffic must use the canonical webhookLeadCapture path so all paid leads stay in Leads and CommunicationEvent.",
  });

  return buildLegacyEndpointResponse("submitLeadCapture");
});
