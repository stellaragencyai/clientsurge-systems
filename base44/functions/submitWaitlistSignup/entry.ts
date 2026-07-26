import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_FIELDS = new Set(["first_name", "email", "business_name", "website"]);
const MAX_BODY_BYTES = 4096;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const rateBuckets = new Map<string, number[]>();

const json = (body: Record<string, unknown>, status = 200) =>
  Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });

function getClientIp(req: Request) {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    ""
  );
}

function exceedsRateLimit(key: string) {
  if (!key) return false;
  const now = Date.now();
  const active = (rateBuckets.get(key) || []).filter((timestamp) => now - timestamp < RATE_WINDOW_MS);
  if (active.length >= RATE_LIMIT) {
    rateBuckets.set(key, active);
    return true;
  }
  active.push(now);
  rateBuckets.set(key, active);

  if (rateBuckets.size > 1000) {
    for (const [bucketKey, timestamps] of rateBuckets.entries()) {
      if (!timestamps.some((timestamp) => now - timestamp < RATE_WINDOW_MS)) {
        rateBuckets.delete(bucketKey);
      }
    }
  }
  return false;
}

function isDuplicateError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");
  return /duplicate|unique|already exists|conflict/i.test(message);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  if (req.method !== "POST") {
    return json({ status: "error", message: "Method not allowed." }, 405);
  }

  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return json({ status: "error", message: "Request is too large." }, 413);
  }

  const clientIp = getClientIp(req);
  if (exceedsRateLimit(clientIp)) {
    return json(
      { status: "error", message: "Too many attempts. Please try again in a few minutes." },
      429
    );
  }

  try {
    const base44 = createClientFromRequest(req);

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ status: "error", message: "Invalid request body." }, 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return json({ status: "error", message: "Invalid request body." }, 400);
    }

    const unexpectedFields = Object.keys(body).filter((key) => !ALLOWED_FIELDS.has(key));
    if (unexpectedFields.length > 0) {
      return json({ status: "error", message: "Invalid request fields." }, 400);
    }

    // Honeypot: silently accept bot submissions without storing them.
    if (typeof body.website === "string" && body.website.trim()) {
      return json({
        status: "success",
        message: "You're on the ClientSurge founding waitlist.",
      });
    }

    const firstName = typeof body.first_name === "string" ? body.first_name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const businessName = typeof body.business_name === "string" ? body.business_name.trim() : "";

    if (!firstName) {
      return json(
        { status: "error", field: "first_name", message: "Please enter your first name." },
        400
      );
    }
    if (firstName.length > 100) {
      return json(
        { status: "error", field: "first_name", message: "First name is too long." },
        400
      );
    }
    if (!email || email.length > 320 || !EMAIL_RE.test(email)) {
      return json(
        { status: "error", field: "email", message: "Please enter a valid business email address." },
        400
      );
    }
    if (businessName.length > 200) {
      return json(
        { status: "error", field: "business_name", message: "Business name is too long." },
        400
      );
    }

    const existing = await base44.asServiceRole.entities.WaitlistSignup.filter(
      { email },
      "-created_date",
      1
    );
    if (existing?.length) {
      return json({
        status: "duplicate",
        message: "This email is already on the ClientSurge founding waitlist.",
      });
    }

    try {
      await base44.asServiceRole.entities.WaitlistSignup.create({
        first_name: firstName,
        email,
        business_name: businessName || undefined,
      });
    } catch (error) {
      if (isDuplicateError(error)) {
        return json({
          status: "duplicate",
          message: "This email is already on the ClientSurge founding waitlist.",
        });
      }
      throw error;
    }

    return json({
      status: "success",
      message:
        "You're on the ClientSurge founding waitlist. Watch your inbox for launch updates and founding-access information.",
    });
  } catch (error) {
    console.error("submitWaitlistSignup failed", error);
    return json(
      { status: "error", message: "Unable to join the waitlist. Please try again." },
      500
    );
  }
});
