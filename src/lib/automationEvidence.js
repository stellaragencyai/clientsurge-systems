const AUTOMATION_DEFINITIONS = [
  { key: 'website_lead_response', label: 'Instant Website Lead Response', match: ['website_lead_response', 'Website lead immediate'] },
  { key: 'website_lead_followup', label: 'Website Lead Follow-Ups', match: ['website_lead_followup', 'Website follow-up'] },
  { key: 'missed_call_text_back', label: 'Missed Call Text-Back', match: ['missed_call', 'missed call', 'call_text_back'] },
  { key: 'email_sequence', label: 'Email / Nurture Sequence', match: ['email_sequence', 'nurture', 'sequence'] },
  { key: 'booking_prompt', label: 'Booking Prompt', match: ['booking', 'booking prompt'] },
  { key: 'winback', label: 'Win-Back Sequence', match: ['win-back', 'winback', 'runWinBackSequence'] },
];

function clean(value) {
  return String(value || '').toLowerCase();
}

function parseMeta(event) {
  try {
    return event?.metadata_json ? JSON.parse(event.metadata_json) : {};
  } catch {
    return {};
  }
}

function eventText(event = {}) {
  const meta = parseMeta(event);
  return [event.event_type, event.subject, event.message_body, event.provider, event.context_type, event.context_id, meta.source, meta.step_key, meta.trigger_event].map(clean).join(' ');
}

function matchesDefinition(event, def) {
  const text = eventText(event);
  return def.match.some((pattern) => text.includes(clean(pattern)));
}

function isPositiveEvent(event = {}) {
  const type = clean(event.event_type);
  const status = clean(event.status);
  return type.includes('sent') || ['sent', 'delivered', 'completed', 'received'].includes(status);
}

function isIssueEvent(event = {}) {
  const type = clean(event.event_type);
  const status = clean(event.status);
  return type.includes('failed') || ['failed', 'error'].includes(status);
}

function isGuardEvent(event = {}) {
  const type = clean(event.event_type);
  const status = clean(event.status);
  return type.includes('skipped') || type.includes('suppressed') || ['skipped', 'stopped'].includes(status);
}

export function buildAutomationEvidence(events = []) {
  const sorted = [...(events || [])].sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
  return AUTOMATION_DEFINITIONS.map((def) => {
    const matching = sorted.filter((event) => matchesDefinition(event, def));
    const positive = matching.filter(isPositiveEvent);
    const issue = matching.filter(isIssueEvent);
    const guarded = matching.filter(isGuardEvent);
    const latest = matching[0] || null;

    let status = 'no_signal';
    if (issue.length > 0 && positive.length === 0) status = 'needs_review';
    else if (positive.length > 0 && issue.length === 0) status = 'proven';
    else if (positive.length > 0 && issue.length > 0) status = 'mixed';
    else if (guarded.length > 0) status = 'guarded';

    return {
      ...def,
      status,
      total_events: matching.length,
      positive_count: positive.length,
      issue_count: issue.length,
      guarded_count: guarded.length,
      latest_event: latest,
      latest_at: latest?.created_date || null,
      latest_subject: latest?.subject || latest?.event_type || '',
    };
  });
}

export { AUTOMATION_DEFINITIONS };
