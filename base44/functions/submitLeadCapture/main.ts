import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const PHONE_CHECK_WINDOW_MS = 15 * 60 * 1000;
const ALLOWED_SOURCES = new Set([
  'website_form',
  'contact_page',
  'pricing_page',
  'landing_page',
  'elevenlabs_sarah_ai_receptionist',
]);

function normalizePhone(phone: unknown): string | null {
  if (typeof phone !== 'string') return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;

  const digits = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('+') && digits.length >= 8 && digits.length <= 15) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;

  return null;
}

function safeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseMetadata(value: unknown): Record<string, any> {
  if (typeof value !== 'string' || !value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

async function hasRecentApprovedPhoneCheck(base44: any, phoneE164: string): Promise<boolean> {
  const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
    {
      context_id: phoneE164,
      provider: 'twilio',
      status: 'processed',
    },
    '-created_date',
    20
  );

  const cutoff = Date.now() - PHONE_CHECK_WINDOW_MS;
  return (events || []).some((event: any) => {
    const meta = parseMetadata(event.metadata_json);
    const createdMs = event.created_date ? new Date(event.created_date).getTime() : 0;
    return (
      createdMs >= cutoff &&
      meta.twilio_status === 'approved' &&
      (event.context_type === 'phone_check' || event.context_type === 'phone_verification')
    );
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const fullName = safeString(body.full_name);
    const email = safeString(body.email).toLowerCase();
    const businessName = safeString(body.business_name);
    const rawPhone = body.phone_number || body.phone || body.phone_e164;
    const normalizedPhone = normalizePhone(rawPhone);
    const message = safeString(body.message || body.problem || body.biggest_problem);
    const source = ALLOWED_SOURCES.has(body.source) ? body.source : 'website_form';
    const sourcePage = safeString(body.source_page);
    const businessType = safeString(body.business_type || body.niche);
    const requestedChannels = Array.isArray(body.requested_channels) ? body.requested_channels : [];
    const consentGiven = body.consent_given === true;

    if (!email || !fullName || !businessName) {
      return Response.json(
        { error: 'Missing required fields: email, full_name, business_name' },
        { status: 400 }
      );
    }

    if (!normalizedPhone) {
      return Response.json({ error: 'Valid phone number required' }, { status: 400 });
    }

    if (!consentGiven) {
      return Response.json({ error: 'Consent is required before submitting this lead' }, { status: 400 });
    }

    const approvedPhone = await hasRecentApprovedPhoneCheck(base44, normalizedPhone);
    if (!approvedPhone) {
      return Response.json(
        {
          success: false,
          error: 'Phone must be approved before lead submission',
          phone_e164: normalizedPhone,
          phone_verified: false,
          phone_verification_status: 'failed',
        },
        { status: 400 }
      );
    }

    const phoneFields = {
      phone_number: normalizedPhone,
      phone_e164: normalizedPhone,
      phone_verified: true,
      phone_verification_status: 'approved',
      phone_verified_at: new Date().toISOString(),
      verification_error: null,
    };

    const existingByEmailPhone = await base44.asServiceRole.entities.WebsiteLead.filter(
      { email, phone_number: normalizedPhone },
      '-created_date',
      1
    );

    if (existingByEmailPhone && existingByEmailPhone.length > 0) {
      const existing = existingByEmailPhone[0];
      await base44.asServiceRole.entities.WebsiteLead.update(existing.id, phoneFields);
      return Response.json({
        success: true,
        lead_id: existing.id,
        action: 'duplicate_exact',
        phone_verified: true,
        phone_verification_status: 'approved',
      });
    }

    const existingByEmail = await base44.asServiceRole.entities.WebsiteLead.filter({ email }, '-created_date', 1);
    if (existingByEmail && existingByEmail.length > 0) {
      console.log(`[submitLeadCapture] Email duplicate detected for ${email}. Continuing with new record.`);
    }

    try {
      const newLead = await base44.asServiceRole.entities.WebsiteLead.create({
        full_name: fullName,
        email,
        ...phoneFields,
        business_name: businessName,
        business_type: businessType || null,
        message,
        problem: message,
        source,
        source_page: sourcePage || null,
        requested_channels: requestedChannels,
        routing_key: safeString(body.routing_key) || null,
        website_url: safeString(body.website_url) || null,
        lead_status: 'new',
        reply_status: 'none',
        booking_status: 'none',
        automation_enabled: true,
        engagement_score: 0,
        consent_given: true,
        consent_given_at: new Date().toISOString(),
        consent_source: safeString(body.consent_source) || 'lead_capture_form',
        consent_text_version: safeString(body.consent_text_version) || 'lead_capture_explicit_checkbox_v1',
      });

      base44.asServiceRole.functions.invoke('processWebsiteLeadInitialResponse', { lead_id: newLead.id }).catch((err: Error) =>
        console.warn('[submitLeadCapture] Initial response trigger failed:', err.message)
      );

      return Response.json({
        success: true,
        lead_id: newLead.id,
        action: 'created',
        phone_verified: true,
        phone_verification_status: 'approved',
      });
    } catch (createError) {
      if (createError.message?.includes('UNIQUE_CONSTRAINT') || createError.code === 'UNIQUE_CONSTRAINT') {
        const recentLeads = await base44.asServiceRole.entities.WebsiteLead.filter(
          { email, business_name: businessName },
          '-created_date',
          1
        );

        if (recentLeads && recentLeads.length > 0) {
          await base44.asServiceRole.entities.WebsiteLead.update(recentLeads[0].id, phoneFields);
          return Response.json({
            success: true,
            lead_id: recentLeads[0].id,
            action: 'race_condition_resolved',
            phone_verified: true,
            phone_verification_status: 'approved',
          });
        }
      }

      throw createError;
    }
  } catch (error) {
    console.error('submitLeadCapture error:', error);
    return Response.json(
      { error: error.message || 'Failed to submit lead' },
      { status: 500 }
    );
  }
});
