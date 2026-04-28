import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { handleTrustedTwilioSmsWebhook } from "../_shared/webhookHandlers.js";
import {
  buildWebhookAuthErrorResponse,
  verifyTwilioWebhookRequest,
} from "../_shared/webhookSecurity.js";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const formData = await req.formData();

    const verification = await verifyTwilioWebhookRequest({ req, formData });
    if (!verification.ok) {
      console.warn("Rejected untrusted Twilio SMS webhook", {
        code: verification.code,
        reason: verification.reason,
      });
      return buildWebhookAuthErrorResponse({
        provider: "twilio",
        code: verification.code,
      });
    }

    const result = await handleTrustedTwilioSmsWebhook({ base44, formData });
    if (result?.error) {
      return Response.json({ error: result.error }, { status: result.status || 400 });
    }

    return Response.json(result);
  } catch (error) {
    console.error("Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Twilio SMS processing failed" },
      { status: 500 }
    );
  }
});
