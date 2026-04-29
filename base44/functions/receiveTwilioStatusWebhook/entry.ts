import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import {
  buildWebhookAuthErrorResponse,
  verifyTwilioWebhookRequest,
} from "../_shared/webhookSecurity.js";
import {
  handleTrustedTwilioSmsWebhook,
  handleTrustedTwilioStatusWebhook,
} from "../_shared/webhookHandlers.js";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const formData = await req.formData();
    const verification = await verifyTwilioWebhookRequest({
      req,
      formData,
    });

    if (!verification.ok) {
      return buildWebhookAuthErrorResponse({
        provider: "twilio",
        code: verification.code,
        status: verification.code === "webhook_verification_not_configured" ? 500 : 401,
      });
    }

    const base44 = createClientFromRequest(req);
    const hasSmsReplyPayload = Boolean(formData.get("From") && formData.get("Body")) &&
      !formData.get("MessageStatus") &&
      !formData.get("CallStatus");

    const result = hasSmsReplyPayload
      ? await handleTrustedTwilioSmsWebhook({ base44, formData })
      : await handleTrustedTwilioStatusWebhook({ base44, formData });

    const status = result?.status && Number.isInteger(result.status)
      ? Number(result.status)
      : 200;

    return Response.json(result, { status });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to handle Twilio status webhook",
      },
      { status: 500 }
    );
  }
});

