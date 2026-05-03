import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";
import { ProviderProofError, runOrderProviderProof } from "../_shared/providerProof.js";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const actor = await requireAdminUser(base44);
    const payload = await req.json().catch(() => ({}));

    const result = await runOrderProviderProof({
      base44,
      actor,
      orderId: payload?.order_id,
      proofType: payload?.proof_type,
      payload,
      requestUrl: req.url,
    });

    return Response.json({
      success: true,
      ...result,
    });
  } catch (error) {
    if (error instanceof AuthGuardError || error instanceof ProviderProofError) {
      return Response.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: error.status }
      );
    }

    const message = error instanceof Error ? error.message : "Provider proof failed";
    return Response.json({ error: message }, { status: 500 });
  }
});
