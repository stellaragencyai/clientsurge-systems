import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const email = body.email || "support@clientsurgesystems.com";

    await base44.users.inviteUser(email, "user");

    return Response.json({
      success: true,
      message: `Invite sent to ${email}. Check that inbox to set a password.`,
      email,
      role: "user"
    });
  } catch (error) {
    console.error("Error creating demo account:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});