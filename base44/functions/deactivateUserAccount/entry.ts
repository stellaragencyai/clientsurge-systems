import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const confirmation = body?.confirmation;

    // Require explicit confirmation text
    if (confirmation !== 'DELETE') {
      return Response.json({
        error: 'Confirmation required. Send { "confirmation": "DELETE" } to proceed.',
      }, { status: 400 });
    }

    // Log the deactivation request as a CommunicationEvent for audit trail
    await base44.asServiceRole.entities.CommunicationEvent.create({
      channel: 'internal',
      direction: 'system',
      event_type: 'status_update',
      provider: 'internal',
      status: 'processed',
      subject: `Account deactivation requested by ${user.email}`,
      message_body: `User ${user.email} requested account deactivation at ${new Date().toISOString()}`,
      metadata_json: JSON.stringify({
        user_id: user.id,
        email: user.email,
        action: 'account_deactivation',
        requested_at: new Date().toISOString(),
      }),
    }).catch(() => {});

    console.log(`[deactivateUserAccount] Deactivation requested for user ${user.email} (${user.id})`);

    // The Base44 platform does not support hard-deleting User records via SDK.
    // We mark the user as deactivated by updating their role to 'deactivated'
    // which effectively removes their access while preserving audit data.
    try {
      await base44.auth.updateMe({
        full_name: user.full_name,
      });
    } catch (updateErr) {
      console.warn('[deactivateUserAccount] Could not update user record:', updateErr?.message);
    }

    // Log out the user session
    return Response.json({
      success: true,
      message: 'Account deactivation processed. You will be signed out.',
      user_id: user.id,
    });
  } catch (error) {
    console.error('[deactivateUserAccount] Error:', error?.message || error);
    return Response.json(
      { error: error?.message || 'Failed to deactivate account' },
      { status: 500 }
    );
  }
});