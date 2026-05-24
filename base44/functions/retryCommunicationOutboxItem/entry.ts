import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";
import { retryCommunicationOutboxRecord } from "../_shared/communicationOutbox.js";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await requireAdminUser(base44);
    const payload = await req.json().catch(() => ({}));
    const outboxId = payload.outbox_id || payload.id;

    if (!outboxId) {
      return Response.json({ error: "outbox_id is required" }, { status: 400 });
    }

    const result = await retryCommunicationOutboxRecord({
      base44,
      outboxId,
      manual: true,
      adminEmail: user.email || null,
      dryRun: Boolean(payload.dry_run),
      env: (name) => Deno.env.get(name),
      fetchImpl: fetch,
    });

    return Response.json(result, { status: result.success || result.skipped ? 200 : 409 });
  } catch (error) {
    const status = error instanceof AuthGuardError ? error.status : 500;
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to retry communication outbox item",
        code: error.code || "retry_communication_outbox_error",
      },
      { status }
    );
  }
});
