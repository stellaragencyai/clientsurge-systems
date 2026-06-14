import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function secureJson(data: Record<string, unknown> = {}, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Frame-Options": "DENY",
      ...(init.headers || {}),
    },
  });
}

// Inline guard: verify a booking date has not exceeded the max daily slot count
async function assertBookingDateAvailable(base44, scheduled_date) {
  const MAX_PER_DAY = 8;
  const existing = await base44.asServiceRole.entities.DemoRequest.filter({
    scheduled_date,
    status: { $in: ['requested', 'scheduled', 'confirmed'] },
  });
  if (existing && existing.length >= MAX_PER_DAY) {
    throw Object.assign(
      new Error(`No more slots available on ${scheduled_date}. Please choose another date.`),
      { status: 409 }
    );
  }
}

// #99: optimistic lock - re-fetch available slots right before confirming
async function optimisticLockSlot(base44, scheduled_date, scheduled_time) {
  const existing = await base44.asServiceRole.entities.DemoRequest.filter({
    scheduled_date,
    scheduled_time,
    status: { $in: ['requested', 'scheduled', 'confirmed'] },
  });
  if (existing && existing.length > 0) {
    throw Object.assign(
      new Error(`Time slot ${scheduled_time} on ${scheduled_date} was just taken. Please choose another time.`),
      { status: 409 }
    );
  }
  return true;
}

const MAX_FIELD_LENGTH = 500;
const DUPLICATE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const LEAD_SOURCE = 'landing_page';
const INTAKE_TYPE = 'audit_booking';
const DEFAULT_AUDIT_SUCCESS_MESSAGE = 'Free Automation Audit scheduled successfully';

function sanitizeString(value: unknown, fallback = '') {
  if (typeof value !== 'string') return fallback;
  return value.replace(/[<>]/g, '').trim().slice(0, MAX_FIELD_LENGTH);
}

function normalizeIndustrySlug(value: unknown) {
  return sanitizeString(value)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function canonicalIndustrySlug(value: unknown) {
  const slug = normalizeIndustrySlug(value);
  if (slug.includes('roof')) return 'roofing';
  if (slug.includes('hvac')) return 'hvac';
  if (slug.includes('plumb')) return 'plumbing';
  if (slug.includes('dental') || slug.includes('dentist') || slug.includes('orthodont')) return 'dental';
  if (slug.includes('med_spa') || slug.includes('aesthetic')) return 'med_spa';
  return slug;
}

function inferIndustrySlug(payload: Record<string, unknown>) {
  const explicit = canonicalIndustrySlug(payload.industry_slug);
  if (explicit) return explicit;

  const combined = canonicalIndustrySlug(`${payload.industry || ''} ${payload.business_type || ''}`);
  if (combined.includes('roof')) return 'roofing';
  if (combined.includes('hvac')) return 'hvac';
  if (combined.includes('plumb')) return 'plumbing';
  if (combined.includes('dental') || combined.includes('dentist') || combined.includes('orthodont')) return 'dental';
  if (combined.includes('med_spa') || combined.includes('aesthetic')) return 'med_spa';
  if (combined.includes('chiropractic') || combined.includes('physical_therapy')) return 'chiropractic';
  if (combined.includes('contractor')) return 'contractors';
  return combined;
}

function normalizeIndustryTags(value: unknown, industrySlug = '') {
  const tags = Array.isArray(value)
    ? value.map((entry) => normalizeIndustrySlug(entry)).filter(Boolean)
    : [];
  if (industrySlug) tags.push(industrySlug, `${industrySlug}_landing_page`);
  if (industrySlug === 'roofing') tags.push('roofing_lead', 'free_roofing_automation_audit');
  if (industrySlug === 'hvac') tags.push('hvac_lead', 'free_hvac_automation_audit', 'missed_call_text_back', 'after_hours_lead_capture');
  if (industrySlug === 'dental') tags.push('dental_lead', 'free_dental_automation_audit');
  if (industrySlug === 'med_spa') tags.push('med_spa_lead', 'free_med_spa_automation_audit');
  if (industrySlug === 'plumbing') tags.push('plumbing_lead', 'free_plumbing_automation_audit', 'missed_call_text_back', 'emergency_service_request');
  return [...new Set(tags)];
}

function leadScoreForIndustry(industrySlug: string) {
  if (industrySlug === 'roofing') return 75;
  if (industrySlug === 'hvac') return 72;
  if (industrySlug === 'dental') return 70;
  if (industrySlug === 'med_spa') return 73;
  if (industrySlug === 'plumbing') return 72;
  return 50;
}

function auditNameForIndustry(industrySlug = '') {
  if (industrySlug === 'roofing') return 'Roofing Automation Audit';
  if (industrySlug === 'dental') return 'Dental Automation Audit';
  if (industrySlug === 'hvac') return 'HVAC Automation Audit';
  if (industrySlug === 'med_spa') return 'Med Spa Automation Audit';
  if (industrySlug === 'plumbing') return 'Plumbing Automation Audit';
  return 'Automation Audit';
}

function crmTagForIndustry(industrySlug = '', fallback = '') {
  const canonical = canonicalIndustrySlug(industrySlug || fallback);
  const tags: Record<string, string> = {
    roofing: 'roofing_lead',
    hvac: 'hvac_lead',
    dental: 'dental_lead',
    med_spa: 'med_spa_lead',
    plumbing: 'plumbing_lead',
  };
  return tags[canonical] || sanitizeString(fallback, 'automation_audit_lead') || 'automation_audit_lead';
}

function normalizePayload(payload: Record<string, unknown>) {
  const industry = sanitizeString(payload.industry || payload.business_type, 'General') || 'General';
  const industry_slug = inferIndustrySlug({ ...payload, industry });
  return {
    full_name: sanitizeString(payload.full_name),
    business_name: sanitizeString(payload.business_name),
    email: sanitizeString(payload.email).toLowerCase(),
    phone: sanitizeString(payload.phone),
    scheduled_date: sanitizeString(payload.scheduled_date),
    scheduled_time: sanitizeString(payload.scheduled_time),
    monthly_leads: sanitizeString(payload.monthly_leads),
    biggest_issue: sanitizeString(payload.biggest_issue),
    industry,
    industry_slug,
    industry_tags: normalizeIndustryTags(payload.industry_tags, industry_slug),
    service_interest: sanitizeString(payload.service_interest, 'automation_audit') || 'automation_audit',
    source: sanitizeString(payload.source, LEAD_SOURCE) || LEAD_SOURCE,
    source_page: sanitizeString(payload.source_page, '/book') || '/book',
    business_website_url: sanitizeString(payload.business_website_url || payload.website),
    website: sanitizeString(payload.website || payload.business_website_url),
    website_url: sanitizeString(payload.website_url),
    utm_source: sanitizeString(payload.utm_source),
    utm_medium: sanitizeString(payload.utm_medium),
    utm_campaign: sanitizeString(payload.utm_campaign),
    utm_content: sanitizeString(payload.utm_content),
    referrer: sanitizeString(payload.referrer),
    crm_tag: crmTagForIndustry(industry_slug, payload.crm_tag as string),
    consent_given: payload.consent_given === true,
    consent_source: sanitizeString(payload.consent_source),
    consent_text_version: sanitizeString(payload.consent_text_version),
  };
}

function validatePayload(payload: ReturnType<typeof normalizePayload>) {
  const errors: string[] = [];

  if (!payload.full_name) errors.push('Full name is required');
  if (!payload.business_name) errors.push('Business name is required');
  if (!payload.industry || payload.industry === 'General') errors.push('Industry is required');
  if (!payload.business_website_url && !payload.website) errors.push('Website is required');
  if (!payload.biggest_issue) errors.push('What should we review is required');
  if (payload.consent_given !== true) errors.push('Consent is required');

  if (!payload.email) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors.push('Email must be valid');
  }

  if (!payload.phone) {
    errors.push('Phone is required');
  } else if (payload.phone.replace(/\D/g, '').length < 10) {
    errors.push('Phone must be valid');
  }

  if (!payload.scheduled_date || !/^\d{4}-\d{2}-\d{2}$/.test(payload.scheduled_date)) {
    errors.push('Scheduled date is required (YYYY-MM-DD)');
  } else {
    const bookedDate = new Date(payload.scheduled_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bookedDate < today) {
      errors.push('Scheduled date must be in the future');
    }
  }
  if (!payload.scheduled_time || !/^\d{2}:\d{2}$/.test(payload.scheduled_time)) {
    errors.push('Scheduled time is required');
  }

  return errors;
}

async function isRateLimited(
  base44: ReturnType<typeof createClientFromRequest>,
  payload: ReturnType<typeof normalizePayload>
) {
  const emailMatches = await base44.asServiceRole.entities.Leads.filter({ email: payload.email }, '-created_date', 5);
  const now = Date.now();

  return emailMatches.some((existingLead: Record<string, unknown>) => {
    const createdDate =
      typeof existingLead.created_date === 'string' ? new Date(existingLead.created_date).getTime() : 0;
    const sameBusiness =
      typeof existingLead.business_name === 'string' &&
      existingLead.business_name.trim().toLowerCase() === payload.business_name.toLowerCase();

    return createdDate > 0 && now - createdDate < RATE_LIMIT_WINDOW_MS && sameBusiness;
  });
}

function parseBookingDateTime(date: string, time: string) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);

  const bookingDate = new Date(year, month - 1, day, hour, minute);

  if (Number.isNaN(bookingDate.getTime())) {
    throw new Error('Invalid booking date or time');
  }

  return bookingDate.toISOString();
}

function mergeSourceHistory(
  payload: ReturnType<typeof normalizePayload>,
  existingLead: Record<string, unknown> | null = null
) {
  const previous = Array.isArray(existingLead?.source_history)
    ? existingLead.source_history
    : typeof existingLead?.source_history === 'string'
      ? [existingLead.source_history]
      : [];
  const current = [
    payload.source || LEAD_SOURCE,
    payload.source_page ? `page:${payload.source_page}` : '',
    payload.utm_source ? `utm_source:${payload.utm_source}` : '',
    payload.utm_campaign ? `utm_campaign:${payload.utm_campaign}` : '',
    payload.referrer ? `referrer:${payload.referrer}` : '',
  ].filter(Boolean);

  return [...new Set([...previous, ...current])];
}

function isRecentDuplicate(existingLead: Record<string, unknown>, payload: ReturnType<typeof normalizePayload>) {
  const createdDate = typeof existingLead.created_date === 'string' ? new Date(existingLead.created_date).getTime() : 0;
  const isWithinWindow = createdDate > 0 && Date.now() - createdDate < DUPLICATE_WINDOW_MS;
  const sameBusiness =
    typeof existingLead.business_name === 'string' &&
    existingLead.business_name.trim().toLowerCase() === payload.business_name.toLowerCase();

  return isWithinWindow && sameBusiness;
}

function buildLeadPayload(
  payload: ReturnType<typeof normalizePayload>,
  existingLead: Record<string, unknown> | null = null
) {
  const now = new Date().toISOString();
  const score = leadScoreForIndustry(payload.industry_slug);
  return {
    full_name: payload.full_name,
    owner_contact_name: payload.full_name,
    business_name: payload.business_name,
    email: payload.email,
    phone: payload.phone,
    business_type: payload.industry,
    industry: payload.industry_slug || payload.industry,
    problem: payload.biggest_issue || payload.monthly_leads || 'Free Automation Audit booking',
    source: payload.source || LEAD_SOURCE,
    source_page: payload.source_page,
    source_history: mergeSourceHistory(payload, existingLead),
    intake_type: INTAKE_TYPE,
    status: 'Booked',
    crm_stage: 'Audit Booked',
    outreach_status: 'booked',
    booking_link_sent_at: now,
    booked_at: now,
    last_activity_at: now,
    website: payload.business_website_url || payload.website,
    website_url: payload.business_website_url || payload.website,
    page_submitted_from: payload.source_page,
    package_interest: payload.service_interest,
    service_interest: payload.service_interest,
    crm_tag: payload.crm_tag,
    industry_tags: payload.industry_tags,
    assigned_agent_name: payload.industry_slug ? `sales_rep_${payload.industry_slug}` : undefined,
    assigned_at: now,
    lead_score: score,
    activation_priority: score >= 70 ? 'High' : 'Medium',
    lead_category: score >= 70 ? 'High-Value' : 'Standard',
    utm_source: payload.utm_source,
    utm_medium: payload.utm_medium,
    utm_campaign: payload.utm_campaign,
    utm_content: payload.utm_content,
    requested_channels: ['sms', 'email'],
    consent_given: payload.consent_given,
    consent_given_at: payload.consent_given ? now : undefined,
    consent_source: payload.consent_source,
    consent_text_version: payload.consent_text_version,
  };
}

async function ensureDemoRequest(
  base44: ReturnType<typeof createClientFromRequest>,
  leadId: string,
  payload: ReturnType<typeof normalizePayload>
) {
  const existingRequests = await base44.asServiceRole.entities.DemoRequest.filter(
    {
      lead_id: leadId,
      scheduled_date: payload.scheduled_date,
      scheduled_time: payload.scheduled_time,
    },
    '-created_date',
    10
  );

  const existingScheduledRequest = existingRequests.find(
    (request: Record<string, unknown>) => request.status === 'scheduled'
  );

  if (existingScheduledRequest) {
    return existingScheduledRequest;
  }

  return base44.asServiceRole.entities.DemoRequest.create({
    lead_id: leadId,
    scheduled_date: payload.scheduled_date,
    scheduled_time: payload.scheduled_time,
    status: 'scheduled',
    notes: payload.biggest_issue || undefined,
  });
}

async function logCommunicationEvent(
  base44: ReturnType<typeof createClientFromRequest>,
  payload: {
    lead_id: string;
    channel: 'sms' | 'email' | 'webhook' | 'internal';
    direction: 'outbound' | 'inbound' | 'system';
    event_type: 'lead_created' | 'sms_sent' | 'sms_failed' | 'sms_received' | 'sms_delivered' | 'email_sent' | 'email_failed' | 'webhook_sent' | 'workflow_triggered' | 'status_update';
    provider: 'twilio' | 'resend' | 'gmail' | 'zapier' | 'n8n' | 'internal';
    status: 'pending' | 'sent' | 'delivered' | 'failed' | 'received' | 'processed';
    subject?: string;
    message_body?: string;
    error_message?: string;
    metadata?: Record<string, unknown>;
  }
) {
  await base44.asServiceRole.entities.CommunicationEvent.create({
    lead_id: payload.lead_id,
    channel: payload.channel,
    direction: payload.direction,
    event_type: payload.event_type,
    provider: payload.provider,
    status: payload.status,
    subject: payload.subject,
    message_body: payload.message_body,
    error_message: payload.error_message,
    metadata_json: payload.metadata ? JSON.stringify(payload.metadata) : undefined,
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return secureJson({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const rawPayload = await req.json();
    const payload = normalizePayload(rawPayload);

    if (payload.website_url) {
      return secureJson({ success: true, ignored: true });
    }

    const errors = validatePayload(payload);

    if (errors.length > 0) {
      return secureJson({ error: errors[0], errors }, { status: 400 });
    }

    if (await isRateLimited(base44, payload)) {
      return secureJson({ error: 'Please wait a moment before submitting again.' }, { status: 429 });
    }

    await assertBookingDateAvailable(base44, payload.scheduled_date);
    await optimisticLockSlot(base44, payload.scheduled_date, payload.scheduled_time);

    const bookingDateTime = parseBookingDateTime(payload.scheduled_date, payload.scheduled_time);
    let existingLead = null;

    const emailMatches = await base44.asServiceRole.entities.Leads.filter({ email: payload.email }, '-created_date', 10);
    existingLead = emailMatches.find((item: Record<string, unknown>) => isRecentDuplicate(item, payload)) || null;

    if (!existingLead) {
      const phoneMatches = await base44.asServiceRole.entities.Leads.filter({ phone: payload.phone }, '-created_date', 10);
      existingLead = phoneMatches.find((item: Record<string, unknown>) => isRecentDuplicate(item, payload)) || null;
    }

    const leadPayload = buildLeadPayload(payload, existingLead);
    const auditName = auditNameForIndustry(payload.industry_slug);
    let lead;

    if (existingLead) {
      lead = await base44.asServiceRole.entities.Leads.update(existingLead.id, leadPayload);
    } else {
      lead = await base44.asServiceRole.entities.Leads.create(leadPayload);
    }

    await logCommunicationEvent(base44, {
      lead_id: lead.id,
      channel: 'internal',
      direction: 'system',
      event_type: 'lead_created',
      provider: 'internal',
      status: 'processed',
      subject: existingLead ? `Free ${auditName} booking updated existing lead` : `Free ${auditName} booking created lead`,
      message_body: `Free ${auditName} booking recorded for ${payload.full_name} from ${payload.business_name}`,
      metadata: {
        source: payload.source || LEAD_SOURCE,
        source_page: payload.source_page,
        intake_type: INTAKE_TYPE,
        action: existingLead ? 'updated' : 'created',
        scheduled_date: payload.scheduled_date,
        scheduled_time: payload.scheduled_time,
      },
    });

    await ensureDemoRequest(base44, lead.id, payload);

    const warnings: string[] = [];

    const sideEffects = [
      {
        name: 'confirmation_email',
        channel: 'email' as const,
        eventTypeSuccess: 'email_sent' as const,
        eventTypeFailure: 'email_failed' as const,
        provider: 'internal' as const,
        subject: `Free ${auditName} confirmation for ${payload.full_name}`,
        message: `Free ${auditName} confirmation email for ${payload.scheduled_date} ${payload.scheduled_time}`,
        run: () =>
          base44.functions.invoke('sendDemoConfirmationEmail', {
            email: payload.email,
            full_name: payload.full_name,
            business_name: payload.business_name,
            scheduled_date: payload.scheduled_date,
            scheduled_time: payload.scheduled_time,
            industry: payload.industry,
            industry_slug: payload.industry_slug,
          }),
      },
      {
        name: 'prep_email',
        channel: 'email' as const,
        eventTypeSuccess: 'email_sent' as const,
        eventTypeFailure: 'email_failed' as const,
        provider: 'internal' as const,
        subject: `Free ${auditName} prep email for ${payload.full_name}`,
        message: `Free ${auditName} prep email for ${payload.scheduled_date} ${payload.scheduled_time}`,
        run: () =>
          base44.functions.invoke('sendDemoPrepEmail', {
            email: payload.email,
            full_name: payload.full_name,
            business_name: payload.business_name,
            scheduled_date: payload.scheduled_date,
            scheduled_time: payload.scheduled_time,
            industry: payload.industry,
            industry_slug: payload.industry_slug,
          }),
      },
      {
        name: 'confirmation_sms',
        channel: 'sms' as const,
        eventTypeSuccess: 'sms_sent' as const,
        eventTypeFailure: 'sms_failed' as const,
        provider: 'twilio' as const,
        subject: `Free ${auditName} SMS confirmation for ${payload.full_name}`,
        message: `Free ${auditName} SMS confirmation for ${payload.scheduled_date} ${payload.scheduled_time}`,
        run: () =>
          base44.functions.invoke('sendDemoConfirmationSMS', {
            phone: payload.phone,
            full_name: payload.full_name,
            scheduled_date: payload.scheduled_date,
            scheduled_time: payload.scheduled_time,
          }),
      },
      {
        name: 'admin_notification',
        channel: 'email' as const,
        eventTypeSuccess: 'email_sent' as const,
        eventTypeFailure: 'email_failed' as const,
        provider: 'internal' as const,
        subject: `Admin ${auditName} booking notification for ${payload.business_name}`,
        message: `Admin ${auditName} booking notification for ${payload.full_name} (${payload.business_name})`,
        run: () =>
          base44.functions.invoke('sendAdminDemoNotification', {
            full_name: payload.full_name,
            business_name: payload.business_name,
            email: payload.email,
            phone: payload.phone,
            scheduled_date: payload.scheduled_date,
            scheduled_time: payload.scheduled_time,
            monthly_leads: payload.monthly_leads,
            biggest_issue: payload.biggest_issue,
            industry: payload.industry,
            industry_slug: payload.industry_slug,
            crm_tag: payload.crm_tag,
            industry_tags: payload.industry_tags,
            source_page: payload.source_page,
            utm_source: payload.utm_source,
            utm_medium: payload.utm_medium,
            utm_campaign: payload.utm_campaign,
            utm_content: payload.utm_content,
            referrer: payload.referrer,
            business_website_url: payload.business_website_url || payload.website,
          }),
      },
      {
        name: 'calendar_event',
        channel: 'internal' as const,
        eventTypeSuccess: 'workflow_triggered' as const,
        eventTypeFailure: 'workflow_triggered' as const,
        provider: 'internal' as const,
        subject: `Calendar event for ${payload.business_name}`,
        message: `Calendar event scheduled for ${payload.scheduled_date} ${payload.scheduled_time}`,
        run: () =>
          base44.functions.invoke('createDemoCalendarEvent', {
            lead_id: lead.id,
            title: `Free ${auditName}: ${payload.business_name} - ${payload.full_name}`,
            description: `Free ${auditName} Booking\n\nBusiness: ${payload.business_name}\nIndustry: ${payload.industry}\nIndustry Slug: ${payload.industry_slug || 'Not provided'}\nIndustry Tags: ${payload.industry_tags.join(', ') || 'Not provided'}\nWebsite: ${payload.business_website_url || payload.website || 'Not provided'}\nSource Page: ${payload.source_page}\nContact: ${payload.full_name}\nEmail: ${payload.email}\nPhone: ${payload.phone}\nMonthly Leads: ${payload.monthly_leads}\nChallenge: ${payload.biggest_issue}`,
            start_time: bookingDateTime,
            duration_minutes: 15,
          }),
      },
    ];

    for (const effect of sideEffects) {
      try {
        await effect.run();
        await logCommunicationEvent(base44, {
          lead_id: lead.id,
          channel: effect.channel,
          direction: effect.channel === 'internal' ? 'system' : 'outbound',
          event_type: effect.eventTypeSuccess,
          provider: effect.provider,
          status: effect.channel === 'internal' ? 'processed' : 'sent',
          subject: effect.subject,
          message_body: effect.message,
          metadata: {
            effect: effect.name,
            source: payload.source || LEAD_SOURCE,
            source_page: payload.source_page,
            intake_type: INTAKE_TYPE,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'failed';
        warnings.push(`${effect.name}:${message}`);
        await logCommunicationEvent(base44, {
          lead_id: lead.id,
          channel: effect.channel,
          direction: effect.channel === 'internal' ? 'system' : 'outbound',
          event_type: effect.eventTypeFailure,
          provider: effect.provider,
          status: 'failed',
          subject: effect.subject,
          message_body: effect.message,
          error_message: message,
          metadata: {
            effect: effect.name,
            source: payload.source || LEAD_SOURCE,
            source_page: payload.source_page,
            intake_type: INTAKE_TYPE,
          },
        });
      }
    }

    return secureJson({
      success: true,
      lead_id: lead.id,
      message: payload.industry_slug ? `Free ${auditName} scheduled successfully` : DEFAULT_AUDIT_SUCCESS_MESSAGE,
      industry_slug: payload.industry_slug,
      industry_tags: payload.industry_tags,
      warnings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to schedule Free Automation Audit';
    return secureJson({ error: message }, { status: error.status || 500 });
  }
});
