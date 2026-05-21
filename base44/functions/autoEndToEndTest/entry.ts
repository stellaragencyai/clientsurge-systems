import { secureJson } from "../_shared/response.ts";
/**
 * autoEndToEndTest - #112/#525 extended.
 * Full checkout -> webhook -> email -> status flow with cleanup.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    await requireAdminUser(base44);

    const result = await base44.asServiceRole.functions.invoke("runFullPipelineTest", {
      dry_run: true,
      persist_records: false,
      notify_telegram: false,
      scenario: "checkout_webhook_email_status_cleanup",
    });
    return secureJson({ success: true, ...result, extended: true });
  } catch (err: any) {
    if (err instanceof AuthGuardError) {
      return secureJson({ error: err.message, code: err.code }, { status: err.status });
    }

    return secureJson({ error: err.message }, { status: 500 });
  }
});
