import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function secureJson(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return secureJson({ error: "Admin access required", code: "FORBIDDEN" }, { status: 403 });
    }

    const records = await base44.asServiceRole.entities.AdminSettings.list(null, 1);
    const settings = records?.[0] || {};

    return secureJson({ success: true, settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load admin settings";
    return secureJson({ error: message }, { status: 500 });
  }
});