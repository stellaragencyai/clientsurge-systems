import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const MAX_FIELD_LENGTH = 500;
const DUPLICATE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const LEAD_SOURCE = 'website';
const INTAKE_TYPE = 'lead_capture';

function sanitizeString(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.replace(/[<>]/g, '').trim().slice(0, MAX_FIELD_LENGTH);
}

function normalizeLeadInput(payload: Record<string, unknown>) {
  const realWebsite = sanitizeString(payload.website_url || payload.website);
  const honeypot = sanitizeString(payload.website_hp || payload.website_honeypot || payload.company_website_hp);
  return {
    full_name: sanitizeString(payload.full_name),
    business_name: sanitizeString(payload.business_name),
    email: sanitizeString(payload.email).toLowerCase(),
    phone: sanitizeString(payload.phone),
    business_type: sanitizeString(payload.business_type),
    problem: sanitizeString(payload.problem),
    website_url: realWebsite,
    honeypot,
  };
}

function buildLeadPayload(lead: ReturnType<typeof normalizeLeadInput>, status: string) {
  return {
    full_name: lead.full_name,
    business_name: lead.business_name,
    email: lead.email,
    phone: lead.phone,
    business_type: lead.business_type,
    problem: lead.problem,
    website: lead.website_url,
    source: LEAD_SOURCE,
    intake_type: INTAKE_TYPE,
    status,
  };
}

async function logLeadCreated(
  base44: ReturnType<typeof createClientFromRequest>,
  leadId: string,
  action: 'created' | 'updated',
  lead: ReturnType<typeof normalizeLeadInput>
) {
  await base44.asServiceRole.entities.CommunicationEvent.create({
    lead_id: leadId,
    channel: 'internal',
    direction: 'system',
    event_type: 'lead_created',
    provider: 'internal',
    status: 'processed',
    subject: action === 'created' ? 'Lead capture submitted' : 'Lead capture updated',
    message_body: `Lead capture ${action} for ${lead.full_name} from ${lead.business_name}`,
    metadata_json: JSON.stringify({
      source: LEAD_SOURCE,
      intake_type: INTAKE_TYPE,
      action,
      email: lead.email,
      business_type: lead.business_type,
    }),
  });
}

function validateLeadInput(lead: ReturnType<typeof normalizeLeadInput>) {
  const errors: string[] = [];

  if (!lead.full_name) errors.push('Full name is required');
  if (!lead.business_name) errors.push('Business name is required');
  if (!lead.email) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    errors.push('Email must be valid');
  }

  if (!lead.phone) {
    errors.push('Phone is required');
  } else if (lead.phone.replace(/\D/g, '').length < 10) {
    errors.push('Phone must be valid');
  }

  if (!lead.business_type) errors.push('Business type is required');
  if (!lead.problem) errors.push('Problem is required');

  return errors;
}

async function isRateLimited(
  base44: ReturnType<typeof createClientFromRequest>,
  lead: ReturnType<typeof normalizeLeadInput>
) {
  if (!lead.email) return false;

  const emailMatches = await base44.asServiceRole.entities.Leads.filter({ email: lead.email }, '-created_date', 5);
  const now = Date.now();

  return emailMatches.some((existingLead: Record<string, unknown>) => {
    const createdDate =
      typeof existingLead.created_date === 'string' ? new Date(existingLead.created_date).getTime() : 0;
    const sameBusiness =
      typeof existingLead.business_name === 'string' &&
      existingLead.business_name.trim().toLowerCase() === lead.business_name.toLowerCase();

    return createdDate > 0 && now - createdDate < RATE_LIMIT_WINDOW_MS && sameBusiness;
  });
}

function isRecentDuplicate(existingLead: Record<string, unknown>, incomingLead: ReturnType<typeof normalizeLeadInput>) {
  const createdDate = typeof existingLead.created_date === 'string' ? new Date(existingLead.created_date).getTime() : 0;
  const isWithinWindow = createdDate > 0 && Date.now() - createdDate < DUPLICATE_WINDOW_MS;
  const sameBusiness =
    typeof existingLead.business_name === 'string' &&
    existingLead.business_name.trim().toLowerCase() === incomingLead.business_name.toLowerCase();

  return isWithinWindow && sameBusiness;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const lead = normalizeLeadInput(payload);

    if (lead.honeypot) {
      return Response.json({ success: true, ignored: true });
    }

    const errors = validateLeadInput(lead);

    if (errors.length > 0) {
      return Response.json({ error: errors[0], errors }, { status: 400 });
    }

    if (await isRateLimited(base44, lead)) {
      return Response.json({ error: 'Please wait a moment before submitting again.' }, { status: 429 });
    }

    let duplicateLead = null;

    // Check WebsiteLead duplicates instead of Leads
    if (lead.email) {
      const emailMatches = await base44.asServiceRole.entities.WebsiteLead.filter({ email: lead.email }, '-created_date', 10).catch(() => []);
      duplicateLead = emailMatches.find((item: Record<string, unknown>) => isRecentDuplicate(item, lead)) || null;
    }

    if (!duplicateLead && lead.phone) {
      const phoneMatches = await base44.asServiceRole.entities.WebsiteLead.filter({ phone_number: lead.phone }, '-created_date', 10).catch(() => []);
      duplicateLead = phoneMatches.find((item: Record<string, unknown>) => isRecentDuplicate(item, lead)) || null;
    }

    if (duplicateLead) {
      // For WebsiteLead duplicates, reset status if closed
      const nextStatus =
        duplicateLead.lead_status === 'closed'
          ? 'new'
          : duplicateLead.lead_status || 'new';

      const firstName = lead.full_name.split(' ')[0] || lead.full_name;
      await base44.asServiceRole.entities.WebsiteLead.update(duplicateLead.id, {
        lead_status: nextStatus,
        full_name: duplicateLead.full_name || lead.full_name,
        first_name: firstName,
        email: duplicateLead.email || lead.email,
        phone_number: duplicateLead.phone_number || lead.phone,
        service_interest: duplicateLead.service_interest || lead.business_type,
        message: duplicateLead.message || lead.problem,
        source: duplicateLead.source || 'website_form',
        reply_status: 'none',
        booking_status: 'none',
      });
      await logLeadCreated(base44, duplicateLead.id, 'updated', lead);

      // Send instant SMS response asynchronously if not already sent
      if (!duplicateLead.initial_response_sent_at) {
        base44.functions.invoke('sendInstantLeadResponseSms', {
          lead_id: duplicateLead.id,
        }).catch((err) => console.error(`[SubmitLead] SMS send failed: ${err.message}`));
      }

      return Response.json({
        success: true,
        lead_id: duplicateLead.id,
        action: 'updated',
      });
    }

    // Create as WebsiteLead instead of Leads (website forms use separate entity)
    const firstName = lead.full_name.split(' ')[0] || lead.full_name;
    const createdLead = await base44.asServiceRole.entities.WebsiteLead.create({
      full_name: lead.full_name,
      first_name: firstName,
      email: lead.email,
      phone_number: lead.phone,
      service_interest: lead.business_type,
      message: lead.problem,
      source: 'website_form',
      lead_status: 'new',
      reply_status: 'none',
      booking_status: 'none',
      automation_enabled: true,
    });
    await logLeadCreated(base44, createdLead.id, 'created', lead);

    // Send instant SMS response asynchronously (don't wait for it)
    base44.functions.invoke('sendInstantLeadResponseSms', {
      lead_id: createdLead.id,
    }).catch((err) => console.error(`[SubmitLead] SMS send failed: ${err.message}`));

    return Response.json({
      success: true,
      lead_id: createdLead.id,
      action: 'created',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit lead';
    return Response.json({ error: message }, { status: 500 });
  }
});