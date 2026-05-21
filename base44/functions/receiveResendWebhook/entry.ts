import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { handleTrustedResendWebhook } from "../_shared/webhookHandlers.js";
import {
  buildWebhookAuthErrorResponse,
  verifySvixWebhookRequest,
} from "../_shared/webhookSecurity.js";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const rawPayload = await req.text();

    const verification = await verifySvixWebhookRequest({
      payload: rawPayload,
      headers: req.headers,
      secret: Deno.env.get("RESEND_WEBHOOK_SECRET"),
    });

    if (!verification.ok) {
      console.warn("[receiveResendWebhook] Rejected untrusted Resend webhook", {
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
      return secureJson({ error: result.error }, { status: result.status || 400 });
    }

    console.info("[receiveResendWebhook] Accepted trusted Resend webhook", {
      message_id: verification.messageId,
      updated_event_id: result?.updated_event_id || null,
      status: result?.status,
    });

    return secureJson(result);
  } catch (error) {
    console.error("[receiveResendWebhook] Error:", error);
    return secureJson({ error: error instanceof Error ? error.message : "Resend webhook processing failed" }, { status: 500 });
  }
});
