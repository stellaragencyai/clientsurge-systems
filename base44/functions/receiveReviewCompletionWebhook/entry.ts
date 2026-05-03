import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { allowAnonymousAutomation } from "../_shared/automationSecurity.js";
import {
  processReviewCompletionTrigger,
  ReviewCompletionTriggerError,
  RuntimeExecutionError,
} from "../_shared/reviewCompletionWebhook.js";

function resolveUnauthorizedStatus(user: { role?: string } | null) {
  if (user && user.role !== "admin") {
    return 403;
  }

  return 401;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if ((!user || user.role !== "admin") && !allowAnonymousAutomation(req)) {
      return Response.json(
        { error: user ? "Admin access required" : "Unauthorized" },
        { status: resolveUnauthorizedStatus(user) }
      );
    }

    const payload = await req.json().catch(() => ({}));
    const result = await processReviewCompletionTrigger({
      base44,
      payload,
    });

    return Response.json(result);
  } catch (error) {
    if (error instanceof ReviewCompletionTriggerError || error instanceof RuntimeExecutionError) {
      return Response.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: error.status || 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Review completion webhook failed";
    return Response.json({ error: message }, { status: 500 });
  }
});
