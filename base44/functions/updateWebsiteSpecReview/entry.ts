import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { canAccessOrder, cleanString, forbiddenOrderResponse } from "../_shared/orderAccess.ts";

async function loadSpecAndOrder(base44, specId) {
  const results = await base44.asServiceRole.entities.WebsiteSpec.filter({ id: specId }, "-created_date", 1).catch(() => []);
  const spec = results?.[0] || null;
  if (!spec) return { spec: null, order: null };
  const orderId = cleanString(spec.order_id);
  const order = orderId ? await base44.asServiceRole.entities.Order.get(orderId).catch(() => null) : null;
  return { spec, order };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const specId = cleanString(body.spec_id || body.specId);
    const action = cleanString(body.action).toLowerCase();
    const previewToken = cleanString(body.preview_token || body.token || body.access_token);
    const revisionNotes = cleanString(body.revision_notes || body.notes);

    if (!specId) return Response.json({ error: "spec_id required" }, { status: 400 });
    if (!["approve", "request_revision"].includes(action)) {
      return Response.json({ error: "action must be approve or request_revision" }, { status: 400 });
    }

    const { spec, order } = await loadSpecAndOrder(base44, specId);
    if (!spec) return Response.json({ error: "Website spec not found" }, { status: 404 });
    if (!order || !canAccessOrder(base44, order, previewToken)) return forbiddenOrderResponse();

    const patch = action === "approve"
      ? { status: "approved", approved_at: new Date().toISOString(), revision_requested: false }
      : { revision_requested: true, revision_notes: revisionNotes };

    const updated = await base44.asServiceRole.entities.WebsiteSpec.update(specId, patch);
    return Response.json({ success: true, spec: updated || { ...spec, ...patch } });
  } catch (error) {
    console.error("[updateWebsiteSpecReview]", error instanceof Error ? error.message : String(error));
    return Response.json({ error: "Unable to update website preview." }, { status: 500 });
  }
});
