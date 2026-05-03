import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== "admin") {
      return Response.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Basic health check — confirms function executes, DB is reachable, and auth works
    const testRead = await base44.asServiceRole.entities.Order.list("-created_date", 1);

    return Response.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      admin_email: user.email,
      db_reachable: true,
      latest_order_id: testRead?.[0]?.id || null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});