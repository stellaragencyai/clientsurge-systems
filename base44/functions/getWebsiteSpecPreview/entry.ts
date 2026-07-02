import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { canAccessOrder, cleanString, forbiddenOrderResponse } from "../_shared/orderAccess.ts";

async function getOrderForSpec(base44, spec) {
  const orderId = cleanString(spec?.order_id);
  if (!orderId) return null;
  return base44.asServiceRole.entities.Order.get(orderId).catch(() => null);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const specId = cleanString(body.spec_id || body.specId);
    const previewToken = cleanString(body.preview_token || body.token || body.access_token);

    if (!specId) {
      return Response.json({ error: "spec_id required" }, { status: 400 });
    }

    const results = await base44.asServiceRole.entities.WebsiteSpec.filter({ id: specId }, "-created_date", 1).catch(() => []);
    const spec = results?.[0] || null;
    if (!spec) {
      return Response.json({ error: "Website spec not found" }, { status: 404 });
    }

    const order = await getOrderForSpec(base44, spec);
    if (!order || !canAccessOrder(base44, order, previewToken)) {
      return forbiddenOrderResponse();
    }

    return Response.json({ success: true, spec });
  } catch (error) {
    console.error("[getWebsiteSpecPreview]", error instanceof Error ? error.message : String(error));
    return Response.json({ error: "Unable to load website preview." }, { status: 500 });
  }
});
