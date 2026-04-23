import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { handleTrustedResendWebhook } from "../_shared/webhookHandlers.js";
import {
  buildWebhookAuthErrorResponse,
  verifySvixWebhookRequest,
} from "../_shared/webhookSecurity.js";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const rawPayload = await req.text();

    const verification = await verifySvixWebhookRequest({
      payload: rawPayload,
      headers: req.headers,
      secret: Deno.env.get("RESEND_WEBHOOK_SECRET"),
    });

    if (!verification.ok) {
      console.warn("Rejected untrusted Resend webhook", {
        code: verification.code,
        reason: verification.reason,
      });
      return buildWebhookAuthErrorResponse({
        provider: "resend",
        code: verification.code,
      });
    }

    const payload = JSON.parse(rawPayload);
    const result = await handleTrustedResendWebhook({ base44, payload });
    if (result?.error) {
      return Response.json({ error: result.error }, { status: result.status || 400 });
    }

    console.info("Accepted trusted Resend webhook", {
      message_id: verification.messageId,
      updated_event_id: result?.updated_event_id || null,
      status: result?.status,
    });

    return Response.json(result);
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ error: error instanceof Error ? error.message : "Resend webhook processing failed" }, { status: 500 });
  }
});
