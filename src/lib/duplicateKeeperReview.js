function clean(value) {
  return String(value || '').trim();
}

function lower(value) {
  return clean(value).toLowerCase();
}

function has(value) {
  return Boolean(clean(value));
}

function numeric(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

const CONVERSION_STATES = new Set(['BOOKED', 'WON']);
const CONVERSION_STATUSES = new Set(['Booked', 'Closed']);
const CONVERSION_STAGES = new Set(['Audit Booked', 'Won Pending Payment', 'Won']);

export function getDuplicateGroupKey(lead = {}) {
  const explicit = clean(lead.dedupe_group_key);
  if (explicit) return explicit;

  const reasonMatch = clean(lead.quality_reason).match(/group:\s*(.+)\)/i);
  if (reasonMatch?.[1]) return reasonMatch[1];

  if (has(lead.dedupe_duplicate_of)) return `keeper:${lead.dedupe_duplicate_of}`;

  const phone = clean(lead.normalized_phone || lead.phone).replace(/\D/g, '');
  if (phone.length >= 10) return `phone:${phone}`;

  const email = lower(lead.normalized_email || lead.email);
  if (email) return `email:${email}`;

  const website = lower(lead.canonical_website_url || lead.website_url || lead.website).replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  if (website) return `website:${website}`;

  const nameLocation = [lower(lead.business_name), lower(lead.city), lower(lead.state)].filter(Boolean).join('|');
  return nameLocation || 'ungrouped';
}

export function hasDuplicateConversionEvidence(lead = {}) {
  return Boolean(
    numeric(lead.total_revenue) > 0 ||
    numeric(lead.number_of_conversions) > 0 ||
    has(lead.last_conversion_date) ||
    has(lead.order_id) ||
    ['stripe', 'manual_payment'].includes(lower(lead.payment_source)) ||
    has(lead.booked_at) ||
    CONVERSION_STATES.has(clean(lead.lead_state)) ||
    CONVERSION_STATUSES.has(clean(lead.status)) ||
    CONVERSION_STAGES.has(clean(lead.crm_stage)) ||
    ['replied', 'booked'].includes(lower(lead.outreach_status)) ||
    lower(lead.reply_sentiment) === 'positive'
  );
}

export function scoreDuplicateKeeperCandidate(lead = {}) {
  const reasons = [];
  let score = 0;

  if (hasDuplicateConversionEvidence(lead)) {
    score += 100;
    reasons.push('conversion/booking/payment/reply evidence');
  }
  if (has(lead.email || lead.normalized_email || lead.canonical_email)) {
    score += 12;
    reasons.push('has email');
  }
  if (has(lead.phone || lead.normalized_phone || lead.canonical_phone)) {
    score += 12;
    reasons.push('has phone');
  }
  if (has(lead.website || lead.website_url || lead.canonical_website_url || lead.business_website_url)) {
    score += 10;
    reasons.push('has website');
  }
  if (has(lead.business_name)) {
    score += 8;
    reasons.push('has business name');
  }
  if (has(lead.city) || has(lead.state)) {
    score += 5;
    reasons.push('has location');
  }
  if (clean(lead.quality_review_status) === 'verified_outbound_ready') {
    score += 15;
    reasons.push('verified outbound ready');
  }
  if (clean(lead.quality_review_status) === 'active' || !has(lead.quality_review_status)) {
    score += 8;
    reasons.push('active/not flagged');
  }
  if (clean(lead.dedupe_status) === 'duplicate_candidate' || clean(lead.quality_review_status) === 'duplicate_candidate') {
    score -= 15;
    reasons.push('already flagged duplicate candidate');
  }
  if (has(lead.dedupe_duplicate_of)) {
    score -= 20;
    reasons.push('already points to another keeper');
  }
  if (['quarantine_candidate', 'quarantined'].includes(clean(lead.quality_review_status))) {
    score -= 30;
    reasons.push('quarantine status');
  }
  if (has(lead.created_date)) {
    const ageMs = Date.now() - new Date(lead.created_date).getTime();
    if (Number.isFinite(ageMs)) {
      const ageDays = ageMs / 86400000;
      if (ageDays < 30) {
        score += 2;
        reasons.push('recent record');
      }
    }
  }

  return { score, reasons };
}

export function recommendDuplicateKeeper(members = []) {
  const candidates = (members || []).map((lead) => ({
    lead,
    ...scoreDuplicateKeeperCandidate(lead),
  })).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.lead.created_date || 0).getTime() - new Date(a.lead.created_date || 0).getTime();
  });

  const keeper = candidates[0] || null;
  const reviewRequired = candidates.length > 1 && Math.abs((candidates[0]?.score || 0) - (candidates[1]?.score || 0)) < 10;

  return {
    keeper: keeper?.lead || null,
    keeper_score: keeper?.score || 0,
    keeper_reasons: keeper?.reasons || [],
    candidates,
    review_required: reviewRequired,
    recommendation: !keeper
      ? 'No keeper recommendation available'
      : reviewRequired
        ? 'Manual review required before choosing keeper'
        : 'Recommended keeper selected by evidence score',
  };
}

export function buildDuplicateReviewGroups(leads = []) {
  const groups = {};
  for (const lead of leads || []) {
    const key = getDuplicateGroupKey(lead);
    if (!groups[key]) groups[key] = [];
    groups[key].push(lead);
  }

  return Object.entries(groups)
    .filter(([, members]) => members.length > 0)
    .map(([groupKey, members]) => ({
      groupKey,
      members,
      review: recommendDuplicateKeeper(members),
    }))
    .sort((a, b) => b.members.length - a.members.length || a.groupKey.localeCompare(b.groupKey));
}
