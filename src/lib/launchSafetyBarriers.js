/**
 * LAUNCH SAFETY BARRIERS
 * Duplicate prevention and safety gates for lead, message, and automation creation
 * Prevents duplicate creation, message storms, and automation loops
 */

/**
 * Check if lead is likely a duplicate
 * Returns: { is_duplicate, confidence, duplicate_lead_id, reason }
 */
export async function checkLeadDuplicate(base44, leadData) {
  try {
    // Strategy 1: Exact email + phone match
    if (leadData.email && leadData.phone) {
      const exactMatches = await base44.entities.Leads.filter({
        normalized_email: normalizeEmail(leadData.email),
        normalized_phone: normalizePhone(leadData.phone),
      });

      if (exactMatches.length > 0) {
        return {
          is_duplicate: true,
          confidence: 0.99,
          duplicate_lead_id: exactMatches[0].id,
          reason: 'exact_email_phone_match',
        };
      }
    }

    // Strategy 2: Business name + phone (very strong signal for contractors)
    if (leadData.business_name && leadData.phone) {
      const businessMatches = await base44.entities.Leads.filter({
        normalized_business_name: normalizeBusinessName(leadData.business_name),
        normalized_phone: normalizePhone(leadData.phone),
      });

      if (businessMatches.length > 0) {
        return {
          is_duplicate: true,
          confidence: 0.95,
          duplicate_lead_id: businessMatches[0].id,
          reason: 'business_phone_match',
        };
      }
    }

    // Strategy 3: Email + name (fuzzy match)
    if (leadData.email && leadData.full_name) {
      const nameEmailMatches = await base44.entities.Leads.filter({
        normalized_email: normalizeEmail(leadData.email),
      });

      for (const match of nameEmailMatches) {
        const nameSimilarity = calculateStringSimilarity(
          normalizeString(leadData.full_name),
          normalizeString(match.full_name)
        );

        if (nameSimilarity > 0.85) {
          return {
            is_duplicate: true,
            confidence: 0.80,
            duplicate_lead_id: match.id,
            reason: 'email_name_fuzzy_match',
          };
        }
      }
    }

    return {
      is_duplicate: false,
      confidence: 0,
    };
  } catch (error) {
    console.warn('[Duplicate Check] Error:', error.message);
    return {
      is_duplicate: false,
      confidence: 0,
      error: error.message,
    };
  }
}

/**
 * Check if message should be sent or gated
 * Prevents message storms and excessive contact
 */
export async function checkMessageGate(base44, leadId, channel) {
  try {
    const lead = await base44.entities.Leads.get(leadId);
    if (!lead) return { gate_passed: false, reason: 'lead_not_found' };

    // Check do-not-contact
    if (lead.do_not_contact) {
      return { gate_passed: false, reason: 'do_not_contact' };
    }

    // Check email unsubscribed/bounced
    if (channel === 'email' && (lead.email_unsubscribed || lead.email_bounced)) {
      return { gate_passed: false, reason: `email_${lead.email_unsubscribed ? 'unsubscribed' : 'bounced'}` };
    }

    // Check daily message cap
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayMessages = await base44.entities.Messages.filter({
      lead_id: leadId,
      channel: channel,
      created_date: { $gte: todayStart.toISOString() },
    });

    const dailyCapBySegment = {
      HOT: 3,
      WARM: 1,
      COLD: 1,
    };

    const dailyCap = dailyCapBySegment[lead.segment_label] || 1;

    if (todayMessages.length >= dailyCap) {
      return {
        gate_passed: false,
        reason: 'daily_message_limit',
        sent_today: todayMessages.length,
        limit: dailyCap,
      };
    }

    // Check recent bounce/failure for same channel
    const recentFailures = await base44.entities.Messages.filter({
      lead_id: leadId,
      channel: channel,
      status: 'failed',
      created_date: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
    });

    if (recentFailures.length >= 3) {
      return {
        gate_passed: false,
        reason: 'repeated_failures',
        failures: recentFailures.length,
      };
    }

    return { gate_passed: true };
  } catch (error) {
    console.warn('[Message Gate] Error:', error.message);
    return { gate_passed: false, reason: 'gate_check_failed', error: error.message };
  }
}

/**
 * Check if automation job should execute
 * Prevents duplicate triggering and infinite loops
 */
export async function checkAutomationExecutionGate(base44, leadId, actionType) {
  try {
    const lead = await base44.entities.Leads.get(leadId);
    if (!lead) return { gate_passed: false, reason: 'lead_not_found' };

    // Check if same action already executed recently
    const recentJobs = await base44.entities.CommunicationEvent.filter({
      lead_id: leadId,
      event_type: actionType,
      created_date: { $gte: new Date(Date.now() - 60 * 60 * 1000).toISOString() }, // Last hour
    });

    if (recentJobs.length > 0) {
      return {
        gate_passed: false,
        reason: 'duplicate_recent_execution',
        last_execution: recentJobs[0].created_date,
      };
    }

    // Check lead status for incompatible actions
    const incompatibleActions = {
      Closed: ['instant_sms', 'email_followup'],
      'Do Not Contact': ['instant_sms', 'email_followup', 'booking_link'],
    };

    if (incompatibleActions[lead.status]) {
      if (incompatibleActions[lead.status].includes(actionType)) {
        return {
          gate_passed: false,
          reason: 'incompatible_with_lead_status',
          status: lead.status,
        };
      }
    }

    return { gate_passed: true };
  } catch (error) {
    console.warn('[Automation Gate] Error:', error.message);
    return { gate_passed: false, reason: 'gate_check_failed', error: error.message };
  }
}

/**
 * Detect and prevent message storm (burst of same message to same lead)
 */
export async function detectMessageStorm(base44, leadId, maxMessagesInWindow = 5, windowMinutes = 5) {
  try {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

    const recentMessages = await base44.entities.Messages.filter({
      lead_id: leadId,
      created_date: { $gte: windowStart.toISOString() },
    });

    if (recentMessages.length >= maxMessagesInWindow) {
      return {
        storm_detected: true,
        message_count: recentMessages.length,
        window_minutes: windowMinutes,
        action: 'pause_automation_for_24h',
      };
    }

    return { storm_detected: false };
  } catch (error) {
    console.warn('[Storm Detection] Error:', error.message);
    return { storm_detected: false, error: error.message };
  }
}

/**
 * String normalization for duplicate detection
 */
export function normalizeEmail(email) {
  return (email || '').toLowerCase().trim();
}

export function normalizePhone(phone) {
  return (phone || '').replace(/\D/g, ''); // Remove all non-digits
}

export function normalizeBusinessName(name) {
  return (name || '')
    .toLowerCase()
    .trim()
    .replace(/[,.\s&]+/g, ' ')
    .split(' ')
    .sort()
    .join(' ');
}

export function normalizeString(str) {
  return (str || '').toLowerCase().trim();
}

/**
 * Simple string similarity using Levenshtein-like approach
 */
export function calculateStringSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate edit distance between two strings
 */
function getEditDistance(s1, s2) {
  const costs = [];

  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }

  return costs[s2.length];
}

export default {
  checkLeadDuplicate,
  checkMessageGate,
  checkAutomationExecutionGate,
  detectMessageStorm,
  normalizeEmail,
  normalizePhone,
  normalizeBusinessName,
  normalizeString,
  calculateStringSimilarity,
};