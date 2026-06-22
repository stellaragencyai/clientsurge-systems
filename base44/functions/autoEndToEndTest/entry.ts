// #112 #381 #525 - autoEndToEndTest — requires admin role check, full pipeline test
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Frame-Options": "DENY",
      ...(init.headers || {}),
    },
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // #381: Admin guard — anyone with URL should NOT be able to run this
    let user;
    try {
      user = await base44.auth.me();
    } catch {
      return secureJson({ error: "Authentication required" }, { status: 401 });
    }

    if (!user || user.role !== "admin") {
      return secureJson({ error: "Admin access required" }, { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));

    const result = await base44.functions.invoke("runFullPipelineTest", {
      dry_run: payload.dry_run !== false,
      persist_records: payload.persist_records === true,
      notify_telegram: payload.notify_telegram === true,
      scenario: payload.scenario || "checkout_webhook_email_status_cleanup",
    });

    return secureJson({ success: true, result: result?.data || result, extended: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return secureJson({ error: message }, { status: 500 });
  }
});