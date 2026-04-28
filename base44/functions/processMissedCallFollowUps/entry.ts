import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { processMissedCallFollowUps } from "../_shared/missedCallRecovery.js";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const authHeader = req.headers.get("authorization");
    const cronSecret = Deno.env.get("MISSED_CALL_FOLLOW_UP_SECRET");

    const isCronAuthorized = cronSecret && authHeader === `Bearer ${cronSecret}`;
    if (!isCronAuthorized) {
      await requireAdminUser(base44);
    }

    const body = await req.json().catch(() => ({}));
    const now = body?.now || new Date().toISOString();
    const result = await processMissedCallFollowUps({ base44, now });
    return Response.json(result);
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return Response.json({ error: error.message, code: error.code }, { status: error.status });
    }

    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to process missed call follow-ups" },
      { status: 500 }
    );
  }
});
