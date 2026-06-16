import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return secureJson({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return secureJson({ error: 'Admin access required' }, { status: 403 });
    }

    const { email } = await req.json().catch(() => ({}));
    if (!email) {
      return secureJson({ error: 'Email is required' }, { status: 400 });
    }

    // Invite user (resend activation email)
    const result = await base44.users.inviteUser(email, 'user');

    return secureJson({
      success: true,
      email,
      message: `Activation link sent to ${email}`,
      activation_link: result?.activation_link || '',
    });
  } catch (error) {
    console.error('[resendActivationLink] Error:', error.message);
    return secureJson({ error: error.message || 'Failed to resend activation link' }, { status: 500 });
  }
});