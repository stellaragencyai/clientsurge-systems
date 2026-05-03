import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  const checks: Record<string, string> = {};
  let allOk = true;

  // DB check
  try {
    const base44 = createClientFromRequest(req);
    await base44.asServiceRole.entities.Order.list("-created_date", 1);
    checks.database = "ok";
  } catch {
    checks.database = "error";
    allOk = false;
  }

  // Env var checks — #107
  checks.stripe = Deno.env.get("STRIPE_SECRET_KEY") ? "configured" : "missing";
  checks.resend = Deno.env.get("RESEND_API_KEY") ? "configured" : "missing";
  checks.twilio_sid = Deno.env.get("TWILIO_ACCOUNT_SID") ? "configured" : "missing";
  checks.twilio_token = Deno.env.get("TWILIO_AUTH_TOKEN") ? "configured" : "missing";
  checks.openai = Deno.env.get("OPENAI_API_KEY") ? "configured" : "missing";

  if (checks.stripe === "missing" || checks.resend === "missing") allOk = false;

  return Response.json({
    status: allOk ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    service: "ClientSurge Systems",
    checks,
  }, { status: allOk ? 200 : 503 });
});
