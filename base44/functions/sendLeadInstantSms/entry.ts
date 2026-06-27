import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

/**
 * sendLeadInstantSms — legacy endpoint, redirects to sendInstantLeadResponseSms.
 * Maintained for backward compatibility with existing automations.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, message } = await req.json().catch(() => ({}));

    if (!lead_id) {
      return Response.json({ error: "lead_id required" }, { status: 400 });
    }

    // Delegate to the canonical instant SMS executor
    const result = await base44.functions.invoke("sendInstantLeadResponseSms", { lead_id, message });
    return Response.json(result.data || { success: true, delegated: true });
  } catch (error) {
    return Response.json({ error: error.message, success: false }, { status: 500 });
  }
});