import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { status: "error", message: "Invalid request body." },
        { status: 400 }
      );
    }

    const first_name = (body?.first_name || "").toString().trim().slice(0, 100);
    const email = (body?.email || "").toString().trim().toLowerCase();
    const business_name = body?.business_name
      ? body.business_name.toString().trim().slice(0, 200)
      : "";

    if (!first_name) {
      return Response.json(
        { status: "error", field: "first_name", message: "Please enter your first name." },
        { status: 400 }
      );
    }

    if (!email || !EMAIL_RE.test(email)) {
      return Response.json(
        { status: "error", field: "email", message: "Please enter a valid business email address." },
        { status: 400 }
      );
    }

    const existing = await base44.asServiceRole.entities.WaitlistSignup.filter(
      { email },
      "-created_date",
      1
    );
    if (existing && existing.length > 0) {
      return Response.json({
        status: "duplicate",
        message: "This email is already on the ClientSurge founding waitlist.",
      });
    }

    await base44.asServiceRole.entities.WaitlistSignup.create({
      first_name,
      email,
      business_name: business_name || undefined,
    });

    return Response.json({
      status: "success",
      message:
        "You're on the ClientSurge founding waitlist. Watch your inbox for launch updates and founding-access information.",
    });
  } catch (error) {
    return Response.json(
      { status: "error", message: error?.message || "Unable to join the waitlist. Please try again." },
      { status: 500 }
    );
  }
});