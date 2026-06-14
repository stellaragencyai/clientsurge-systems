import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Verify caller is an admin
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await base44.users.inviteUser("democlient@clientsurge.com", "user");

    return Response.json({
      success: true,
      message: "Demo client account invited. Check democlient@clientsurge.com for the invite email to set a password.",
      email: "democlient@clientsurge.com",
      role: "user"
    });
  } catch (error) {
    console.error("Error creating demo account:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});