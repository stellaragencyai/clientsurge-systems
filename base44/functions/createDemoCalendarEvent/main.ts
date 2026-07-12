import { secureJson } from "../_shared/response.ts";

/**
 * Real external calendar creation is not configured for ClientSurge yet.
 *
 * This function intentionally does not mutate the Lead and does not claim an
 * event was created. Public booking flows record a DemoRequest with status
 * `requested`; an operator confirms the appointment before changing CRM state
 * to Booked.
 */
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return secureJson({ error: "Method not allowed" }, { status: 405 });
  }

  const payload = await req.json().catch(() => ({}));
  const title = String(payload?.title || "").trim();
  const startTime = String(payload?.start_time || "").trim();

  if (!title || !startTime) {
    return secureJson({ error: "title and start_time are required" }, { status: 400 });
  }

  return secureJson(
    {
      success: false,
      calendar_created: false,
      code: "CALENDAR_PROVIDER_NOT_CONFIGURED",
      message: "Calendar provider is not connected. The preferred time remains pending manual confirmation.",
      lead_id: payload?.lead_id || null,
      requested_start_time: startTime,
    },
    { status: 501 },
  );
});
