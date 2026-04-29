import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";
import { processDueNurtureSequenceSteps } from "../_shared/canonicalAutomationRuntime.js";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const authHeader = req.headers.get("authorization");
    const cronSecret = Deno.env.get("NURTURE_SEQUENCE_RUNTIME_SECRET");
    const isCronAuthorized = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isCronAuthorized) {
      await requireAdminUser(base44);
    }

    const payload = await req.json().catch(() => ({}));
    const result = await processDueNurtureSequenceSteps({
      base44,
      orderId: typeof payload?.order_id === "string" ? payload.order_id : "",
      limit: Number(payload?.limit) || 100,
      now: payload?.now || new Date().toISOString(),
    });

    return Response.json(result);
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return Response.json({ error: error.message, code: error.code }, { status: error.status });
    }

    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to process nurture sequence runtime",
      },
      { status: 500 }
    );
  }
});

