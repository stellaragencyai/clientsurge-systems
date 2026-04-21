import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const MAX_FIELD_LENGTH = 500;
const DUPLICATE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const LEAD_SOURCE = 'website';
const INTAKE_TYPE = 'demo_booking';

function sanitizeString(value: unknown, fallback = '') {
  if (typeof value !== 'string') return fallback;
  return value.replace(/[<>]/g, '').trim().slice(0, MAX_FIELD_LENGTH);
}

function normalizePayload(payload: Record<string, unknown>) {
  return {
    full_name: sanitizeString(payload.full_name),
    business_name: sanitizeString(payload.business_name),
    email: sanitizeString(payload.email).toLowerCase(),
    phone: sanitizeString(payload.phone),
    scheduled_date: sanitizeString(payload.scheduled_date),
    scheduled_time: sanitizeString(payload.scheduled_time),
    monthly_leads: sanitizeString(payload.monthly_leads),
    biggest_issue: sanitizeString(payload.biggest_issue),
    industry: sanitizeString(payload.industry, 'General') || 'General',
    website_url: sanitizeString(payload.website_url),
  };
}

function validatePayload(payload: ReturnType<typeof normalizePayload>) {
  const errors: string[] = [];

  if (!payload.full_name) errors.push('Full name is required');
  if (!payload.business_name) errors.push('Business name is required');

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
    errors.push('Scheduled date is required');
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

function isRecentDuplicate(existingLead: Record<string, unknown>, payload: ReturnType<typeof normalizePayload>) {
  const createdDate = typeof existingLead.created_date === 'string' ? new Date(existingLead.created_date).getTime() : 0;
  const isWithinWindow = createdDate > 0 && Date.now() - createdDate < DUPLICATE_WINDOW_MS;
  const sameBusiness =
    typeof existingLead.business_name === 'string' &&
    existingLead.business_name.trim().toLowerCase() === payload.business_name.toLowerCase();

  return isWithinWindow && sameBusiness;
}

function buildLeadPayload(payload: ReturnType<typeof normalizePayload>) {
  return {
    full_name: payload.full_name,
    business_name: payload.business_name,
    email: payload.email,
    phone: payload.phone,
    business_type: payload.industry,
    problem: payload.biggest_issue || payload.monthly_leads || 'Scheduling demo',
    source: LEAD_SOURCE,
    intake_type: INTAKE_TYPE,
    status: 'Booked',
    booking_link_sent_at: new Date().toISOString(),
    booked_at: new Date().toISOString(),
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
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const rawPayload = await req.json();
    const payload = normalizePayload(rawPayload);

    if (payload.website_url) {
      return Response.json({ success: true, ignored: true });
    }

    const errors = validatePayload(payload);

    if (errors.length > 0) {
      return Response.json({ error: errors[0], errors }, { status: 400 });
    }

    if (await isRateLimited(base44, payload)) {
      return Response.json({ error: 'Please wait a moment before submitting again.' }, { status: 429 });
    }

    const bookingDateTime = parseBookingDateTime(payload.scheduled_date, payload.scheduled_time);
    let existingLead = null;

    const emailMatches = await base44.asServiceRole.entities.Leads.filter({ email: payload.email }, '-created_date', 10);
    existingLead = emailMatches.find((item: Record<string, unknown>) => isRecentDuplicate(item, payload)) || null;

    if (!existingLead) {
      const phoneMatches = await base44.asServiceRole.entities.Leads.filter({ phone: payload.phone }, '-created_date', 10);
      existingLead = phoneMatches.find((item: Record<string, unknown>) => isRecentDuplicate(item, payload)) || null;
    }

    const leadPayload = buildLeadPayload(payload);
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
      subject: existingLead ? 'Demo booking updated existing lead' : 'Demo booking created lead',
      message_body: `Demo booking recorded for ${payload.full_name} from ${payload.business_name}`,
      metadata: {
        source: LEAD_SOURCE,
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
        subject: `Demo confirmation for ${payload.full_name}`,
        message: `Demo confirmation email for ${payload.scheduled_date} ${payload.scheduled_time}`,
        run: () =>
          base44.functions.invoke('sendDemoConfirmationEmail', {
            email: payload.email,
            full_name: payload.full_name,
            business_name: payload.business_name,
            scheduled_date: payload.scheduled_date,
            scheduled_time: payload.scheduled_time,
          }),
      },
      {
        name: 'prep_email',
        channel: 'email' as const,
        eventTypeSuccess: 'email_sent' as const,
        eventTypeFailure: 'email_failed' as const,
        provider: 'internal' as const,
        subject: `Demo prep email for ${payload.full_name}`,
        message: `Demo prep email for ${payload.scheduled_date} ${payload.scheduled_time}`,
        run: () =>
          base44.functions.invoke('sendDemoPrepEmail', {
            email: payload.email,
            full_name: payload.full_name,
            business_name: payload.business_name,
            scheduled_date: payload.scheduled_date,
            scheduled_time: payload.scheduled_time,
          }),
      },
      {
        name: 'confirmation_sms',
        channel: 'sms' as const,
        eventTypeSuccess: 'sms_sent' as const,
        eventTypeFailure: 'sms_failed' as const,
        provider: 'twilio' as const,
        subject: `Demo SMS confirmation for ${payload.full_name}`,
        message: `Demo SMS confirmation for ${payload.scheduled_date} ${payload.scheduled_time}`,
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
        subject: `Admin demo notification for ${payload.business_name}`,
        message: `Admin demo notification for ${payload.full_name} (${payload.business_name})`,
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
            title: `Demo: ${payload.business_name} - ${payload.full_name}`,
            description: `Demo Booking\n\nBusiness: ${payload.business_name}\nIndustry: ${payload.industry}\nContact: ${payload.full_name}\nEmail: ${payload.email}\nPhone: ${payload.phone}\nMonthly Leads: ${payload.monthly_leads}\nChallenge: ${payload.biggest_issue}`,
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
            source: LEAD_SOURCE,
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
            source: LEAD_SOURCE,
            intake_type: INTAKE_TYPE,
          },
        });
      }
    }

    return Response.json({
      success: true,
      lead_id: lead.id,
      message: 'Demo scheduled successfully',
      warnings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to schedule demo';
    return Response.json({ error: message }, { status: 500 });
  }
});
