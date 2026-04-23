import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";
import { runProviderConnectionTests } from "../_shared/providerTests.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await requireAdminUser(base44);

    const { provider_type } = await req.json().catch(() => ({}));

    if (!provider_type) {
      return Response.json({ error: "provider_type required" }, { status: 400 });
    }

    const { results, testedAt } = await runProviderConnectionTests({
      base44,
      actor: user,
      providerType: provider_type,
    });

    return Response.json({
      success: true,
      results,
      tested_at: testedAt,
    });
  } catch (error) {
    console.error("Error:", error);

    if (error instanceof AuthGuardError) {
      return Response.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.status }
      );
    }

    return Response.json({ error: error.message }, { status: 500 });
  }
});
