import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { validateSetupLinkToken } from '../_shared/setupLinkToken.ts';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Request-ID": data?.request_id || "",
    },
  });
}

function cleanString(value) {
  return String(value || "").trim();
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    let order_id = url.searchParams.get("order_id");
    let setupToken = url.searchParams.get("token") || url.searchParams.get("setup_token") || "";

    if (!order_id) {
      try {
        const body = await req.json();
        order_id = body?.order_id;
        setupToken = body?.token || body?.setup_token || setupToken;
      } catch {}
    }

    order_id = cleanString(order_id);
    setupToken = cleanString(setupToken);
    if (!order_id) return json({ error: "order_id required", request_id: requestId }, 400);

    if (setupToken) {
      const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
      if (!order) return json({ error: "Order not found", request_id: requestId }, 404);
      const tokenResult = await validateSetupLinkToken(setupToken, order_id, order.customer_email || "");
      if (!tokenResult.valid) {
        return json({ error: "This setup link is expired or invalid.", code: tokenResult.reason, request_id: requestId }, 403);
      }
    }

    const existing = await base44.asServiceRole.entities.SetupAuthorization.filter(
      { order_id, authorization_status: "accepted" },
      "-created_date",
      1
    ).catch(() => []);

    if (existing?.length > 0) {
      return json({
        authorized: true,
        request_id: requestId,
        authorization: {
          id: existing[0].id,
          accepted_at: existing[0].accepted_at,
          accepted_by_email: existing[0].accepted_by_email,
          agreement_version: existing[0].agreement_version,
          accepted_scopes: existing[0].accepted_scopes || [],
        },
      });
    }

    return json({ authorized: false, request_id: requestId });
  } catch (error) {
    console.error(`[checkSetupAuthorization] Error: ${error.message}; request_id=${requestId}`);
    return json({ error: error.message, request_id: requestId }, 500);
  }
});
