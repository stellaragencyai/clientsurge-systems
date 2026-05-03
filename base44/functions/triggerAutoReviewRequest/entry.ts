import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

import {
  buildLegacyEndpointResponse,
  logLegacyEndpointWarning,
} from "../_shared/legacyQuarantine.js";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  await logLegacyEndpointWarning({
    base44,
    endpointName: "triggerAutoReviewRequest",
    metadata: {
      method: req.method,
    },
    messageBody:
      "triggerAutoReviewRequest is blocked during canonical lockdown. Review Request Automation must run only through the canonical order-backed runtime and explicit admin tests.",
  });

  return buildLegacyEndpointResponse("triggerAutoReviewRequest");
});
