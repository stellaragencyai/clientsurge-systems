import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import {
  createQaCustomerFixture,
  QaCustomerFixtureError,
} from "../_shared/qaCustomerFixture.js";

async function requireAdmin(base44: ReturnType<typeof createClientFromRequest>) {
  const user = await base44.auth.me();
  if (!user || user.role !== "admin") {
    throw new Error("Admin access required");
  }
}

function resolvePortalUrl(req: Request) {
  const origin = req.headers.get("origin");
  if (origin) {
    return `${origin.replace(/\/$/, "")}/client-portal`;
  }

  return "https://apexflow.base44.app/client-portal";
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    await requireAdmin(base44);

    const payload = await req.json().catch(() => ({}));
    const result = await createQaCustomerFixture({
      base44,
      payload,
      portalUrl: resolvePortalUrl(req),
    });

    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create QA customer fixture";
    const status =
      message === "Admin access required" ? 403 :
      error instanceof QaCustomerFixtureError ? error.status :
      500;

    return Response.json(
      {
        error: message,
        code: error instanceof QaCustomerFixtureError ? error.code : undefined,
        details: error instanceof QaCustomerFixtureError ? error.details : undefined,
      },
      { status }
    );
  }
});
