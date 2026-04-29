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

    // Send admin notification asynchronously (non-blocking)
    try {
      const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL");
      if (adminEmail) {
        const timestamp = new Date().toISOString();
        const body = `
<div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 580px; margin: 0 auto; color: #1a1a1a;">
  <div style="background: linear-gradient(135deg, #6b3f1f 0%, #9a5c2e 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px; color: white;">🔔 New Lead Received</h1>
  </div>
  
  <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px 0; font-weight: 600; color: #666; width: 140px;">Name</td>
        <td style="padding: 10px 0; color: #1a1a1a;">${lead.full_name}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px 0; font-weight: 600; color: #666;">Email</td>
        <td style="padding: 10px 0; color: #1a1a1a;"><a href="mailto:${lead.email}" style="color: #9a5c2e; text-decoration: none;">${lead.email}</a></td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px 0; font-weight: 600; color: #666;">Phone</td>
        <td style="padding: 10px 0; color: #1a1a1a;"><a href="tel:${lead.phone}" style="color: #9a5c2e; text-decoration: none;">${lead.phone}</a></td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px 0; font-weight: 600; color: #666;">Business</td>
        <td style="padding: 10px 0; color: #1a1a1a;">${lead.business_name}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px 0; font-weight: 600; color: #666;">Service Interest</td>
        <td style="padding: 10px 0; color: #1a1a1a;">${lead.business_type}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; font-weight: 600; color: #666;">Received</td>
        <td style="padding: 10px 0; color: #1a1a1a;">${timestamp}</td>
      </tr>
    </table>

    <div style="background: #f9f9f9; border-left: 4px solid #9a5c2e; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #9a5c2e; font-size: 13px; text-transform: uppercase;">Problem/Message</p>
      <p style="margin: 0; color: #333; font-size: 13px; line-height: 1.6;">${lead.problem}</p>
    </div>

    <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #999;">Lead ID: ${createdLead.id}</p>
    </div>
  </div>
</div>`;

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: adminEmail,
          subject: `🔔 New Lead — ${lead.full_name} (${lead.business_name})`,
          body,
          from_name: "ClientSurge Systems",
        });
        console.log(`[SubmitLead] Admin notified of new lead ${createdLead.id}`);
      }
    } catch (adminEmailError) {
      console.warn(`[SubmitLead] Admin notification failed for lead ${createdLead.id}: ${adminEmailError.message}`);
    }

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