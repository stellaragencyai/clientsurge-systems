import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";
import { listCommunicationOutboxItems } from "../_shared/communicationOutbox.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    await requireAdminUser(base44);

    const payload = req.method === "POST"
      ? await req.json().catch(() => ({}))
      : Object.fromEntries(new URL(req.url).searchParams.entries());

    const filters = {
      status: payload.status,
      channel: payload.channel,
      provider: payload.provider,
      message_type: payload.message_type,
      client_project_id: payload.client_project_id,
      order_id: payload.order_id,
      lead_id: payload.lead_id,
      date_from: payload.date_from,
      date_to: payload.date_to,
      failed_or_suppressed: payload.failed_or_suppressed === true || payload.failed_or_suppressed === "true",
    };

    const result = await listCommunicationOutboxItems({
      base44,
      filters,
      limit: Number(payload.limit || 100),
    });

    return Response.json(result);
  } catch (error) {
    const status = error instanceof AuthGuardError ? error.status : 500;
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to list communication outbox",
        code: error.code || "list_communication_outbox_error",
      },
      { status }
    );
  }
});
