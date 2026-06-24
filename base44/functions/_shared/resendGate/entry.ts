/**
 * Resend Gate — Handles Resend delivery proof and status verification.
 * 
 * Separates:
 * - delivery_status: 'queued' | 'sent' (provider accepted) | 'delivered' (final confirmed)
 * - sender validation against AdminSettings
 * - Internal test lead skipping
 */

export async function resendGate(base44, {
  to_email,
  lead_id,
  provider_status,
  resend_message_id,
  sender_from,
  admin_settings = null,
}) {
  const warnings = [];
  const result = {
    should_skip: false,
    delivery_status: 'unknown',
    sender_source: 'unknown',
    warnings,
  };

  try {
    // Load admin settings
    const settings = admin_settings || (await loadAdminSettings(base44));
    result.sender_source = sender_from?.sender_source || 'unknown';

    // Check for internal test lead — skip if applicable
    if (lead_id) {
      try {
        const lead = await base44.asServiceRole.entities.WebsiteLead.get(lead_id);
        if (isInternalTestLead(lead)) {
          result.should_skip = true;
          result.delivery_status = 'skipped';
          warnings.push('Internal test lead detected — Resend send skipped.');
          return result;
        }
      } catch (e) {
        console.warn('[ResendGate] Could not load lead:', e.message);
      }
    }

    // Map provider status to delivery_status
    // Resend status: queued, sent, delivered, bounced, complained
    if (provider_status === 'bounced' || provider_status === 'complained') {
      result.delivery_status = 'failed';
      warnings.push(`Resend reported ${provider_status} status.`);
    } else if (provider_status === 'sent') {
      // 'sent' means Resend accepted — NOT final delivery confirmation
      result.delivery_status = 'sent';
      warnings.push('Status is "sent" (provider accepted), not final delivery confirmation.');
    } else if (provider_status === 'delivered') {
      result.delivery_status = 'delivered';
    } else if (provider_status === 'queued') {
      result.delivery_status = 'queued';
    } else {
      result.delivery_status = 'unknown';
    }

    // Check sender mismatch
    if (settings?.resend_from_email && sender_from?.from_address) {
      if (sender_from.from_address !== settings.resend_from_email) {
        warnings.push(
          `Sender mismatch: AdminSettings='${settings.resend_from_email}', used='${sender_from.from_address}'`
        );
      }
    }

    return result;
  } catch (error) {
    console.error('[ResendGate] Error in Resend gate:', error.message);
    result.delivery_status = 'unknown';
    warnings.push(`Error in gate check: ${error.message}`);
    return result;
  }
}

/**
 * Check if lead is internal test (by email pattern or flag)
 */
function isInternalTestLead(lead) {
  if (!lead) return false;
  const testPatterns = [
    /test@/i,
    /demo@/i,
    /nolan@/i,
    /admin@/i,
    /^internal-/i,
  ];
  return testPatterns.some(p => p.test(lead.email));
}

/**
 * Load admin settings
 */
async function loadAdminSettings(base44) {
  try {
    const settings = await base44.asServiceRole.entities.AdminSettings.list();
    return settings?.[0] || null;
  } catch (error) {
    console.error('[ResendGate] Failed to load AdminSettings:', error.message);
    return null;
  }
}