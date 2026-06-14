import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  return secureJson(
    {
      error: "This endpoint has been deprecated. Use submitLeadCapture instead.",
      code: "ENDPOINT_DEPRECATED",
    },
    { status: 410 }
  );
});