import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

import {
  buildLegacyEndpointResponse,
  logLegacyEndpointWarning,
} from "../_shared/legacyQuarantine.js";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  await logLegacyEndpointWarning({
    base44,
    endpointName: "handleBookingTrigger",
    metadata: {
      method: req.method,
    },
    messageBody:
      "handleBookingTrigger is blocked during canonical lockdown. Booking-related runtime must stay inside the canonical order-backed install/runtime system.",
  });

  return buildLegacyEndpointResponse("handleBookingTrigger");
});
