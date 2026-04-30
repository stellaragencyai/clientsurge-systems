import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  return Response.json(
    {
      error: "This endpoint has been deprecated. Use submitLeadCapture instead.",
      code: "ENDPOINT_DEPRECATED",
    },
    { status: 410 }
  );
});