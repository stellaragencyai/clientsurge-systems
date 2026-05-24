import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { processCommunicationOutboxRetries } from "../_shared/communicationOutbox.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let user = null;
    try {
      user = await base44.auth.me();
    } catch (_) {}
    if (user && user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const payload = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const result = await processCommunicationOutboxRetries({
      base44,
      now: payload.now || new Date().toISOString(),
      dryRun: Boolean(payload.dry_run),
      limit: Number(payload.limit || 50),
      env: (name) => Deno.env.get(name),
      fetchImpl: fetch,
    });

    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to process communication outbox retries" },
      { status: 500 }
    );
  }
});
