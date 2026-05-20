import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const { order_id } = await req.json();
    if (!order_id) {
      return Response.json({ error: "order_id required" }, { status: 400 });
    }

    return Response.json(
      {
        success: false,
        retired: true,
        order_id,
        code: "legacy_ai_package_orchestrator_retired",
        error:
          "aiPackageOrchestrator is retired. Use the canonical install pipeline and remote setup workspace instead.",
        replacement_function: "installPipeline",
      },
      { status: 410 }
    );
  } catch (error) {
    console.error("[aiPackageOrchestrator] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
