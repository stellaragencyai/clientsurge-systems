import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    let order_id = url.searchParams.get("order_id");

    // Also accept order_id from request body (for SDK invoke calls)
    if (!order_id) {
      try {
        const body = await req.json();
        order_id = body?.order_id;
      } catch {}
    }

    if (!order_id) return json({ error: "order_id required" }, 400);

    const existing = await base44.asServiceRole.entities.SetupAuthorization.filter(
      { order_id, authorization_status: "accepted" },
      "-created_date",
      1
    ).catch(() => []);

    if (existing?.length > 0) {
      return json({
        authorized: true,
        authorization: {
          id: existing[0].id,
          accepted_at: existing[0].accepted_at,
          accepted_by_email: existing[0].accepted_by_email,
          agreement_version: existing[0].agreement_version,
          accepted_scopes: existing[0].accepted_scopes || [],
        },
      });
    }

    return json({ authorized: false });
  } catch (error) {
    console.error("[checkSetupAuthorization] Error:", error.message);
    return json({ error: error.message }, 500);
  }
});