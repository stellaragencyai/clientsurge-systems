/**
 * Resend Sender Resolver — Unified sender configuration for all Resend email paths.
 * 
 * Reads AdminSettings.resend_from_email and returns:
 * - sender: formatted From address for Resend API
 * - from_address: the email address (for logging)
 * - sender_source: 'admin_settings' | 'fallback_verified' | 'hardcoded'
 */

export async function resolveResendSender(base44, { lead_id = null, admin_settings = null } = {}) {
  try {
    // Load admin settings if not provided
    const settings = admin_settings || (await getAdminSettings(base44));
    
    const configuredEmail = settings?.resend_from_email;
    const fallbackEmail = 'noreply@clientsurgesystems.com';
    const hardcodedEmail = 'system@clientsurgesystems.com';

    // Primary: use configured sender
    if (configuredEmail && isValidEmail(configuredEmail)) {
      return {
        sender: configuredEmail,
        from_address: configuredEmail,
        sender_source: 'admin_settings',
        is_verified: true,
      };
    }

    // Secondary: use fallback verified sender if config is missing/invalid
    if (configuredEmail !== fallbackEmail) {
      console.warn(`[ResendSenderResolver] Configured email invalid or missing. Falling back to: ${fallbackEmail}`);
      return {
        sender: fallbackEmail,
        from_address: fallbackEmail,
        sender_source: 'fallback_verified',
        is_verified: true,
      };
    }

    // Tertiary: hardcoded (should rarely happen)
    return {
      sender: hardcodedEmail,
      from_address: hardcodedEmail,
      sender_source: 'hardcoded',
      is_verified: false,
    };
  } catch (error) {
    console.error('[ResendSenderResolver] Error resolving sender:', error.message);
    // Safe fallback
    return {
      sender: 'noreply@clientsurgesystems.com',
      from_address: 'noreply@clientsurgesystems.com',
      sender_source: 'fallback_verified',
      is_verified: true,
    };
  }
}

/**
 * Validate email format (basic check)
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Load AdminSettings from database
 */
async function getAdminSettings(base44) {
  try {
    const settings = await base44.asServiceRole.entities.AdminSettings.list();
    return settings?.[0] || null;
  } catch (error) {
    console.error('[ResendSenderResolver] Failed to load AdminSettings:', error.message);
    return null;
  }
}