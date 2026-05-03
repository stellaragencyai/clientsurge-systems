import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

import {
  buildLegacyEndpointResponse,
  logLegacyEndpointWarning,
} from "../_shared/legacyQuarantine.js";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  await logLegacyEndpointWarning({
    base44,
    endpointName: "processMissedCallFollowUps",
    metadata: {
      method: req.method,
    },
    messageBody:
      "processMissedCallFollowUps is blocked during canonical lockdown. Missed Call Text-Back must run only through the canonical order-backed runtime and Twilio webhook path.",
  });

  return buildLegacyEndpointResponse("processMissedCallFollowUps");
});
