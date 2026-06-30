import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Phone normalization utility
function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits[0] === '1') return `+${digits}`;
  if (digits.length > 11) return `+1${digits.slice(-10)}`;
  return null;
}

function text(value) {
  return String(value || '').trim().toLowerCase();
}

function classifyIntake(body, normalizedPhone) {
  const joined = [
    body.full_name,
    body.email,
    normalizedPhone || body.phone_number,
    body.business_name,
    body.message,
    body.source,
    body.routing_key,
    body.consent_source,
    body.source_page,
  ].map(text).join(' ');
  const phoneDigits = String(normalizedPhone || body.phone_number || '').replace(/\D/g, '');
  const markers = [];

  if (joined.includes('clientsurge.test') || joined.includes('clientsurge-install.internal') || joined.includes('@clientsurge.test') || joined.includes('.internal')) markers.push('internal_email_domain');
  if (joined.includes('backfill-test') || joined.includes('post_patch_verification') || joined.includes('runaibraininstallerbackfill')) markers.push('internal_backfill_run');
  if (joined.includes('crm_live_smoke_test') || joined.includes('smoke') || joined.includes('install_test') || joined.includes('admin_test_lead')) markers.push('internal_validation_run');
  if (joined.includes('sarah smoke') || joined.includes('client surge smoke') || joined.includes('clientsurge smoke') || joined.includes('test owner')) markers.push('internal_validation_name');
  if (phoneDigits.length >= 7 && phoneDigits.includes('555')) markers.push('reserved_phone_pattern');

  return {
    nonProduction: markers.length > 0,
    markers: [...new Set(markers)],
  };
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Extract lead data
    const {
      full_name,
      email,
      phone_number,
      business_name,
      message,
      source,
      routing_key,
    } = body;

    // Validate required fields
    if (!email || !full_name || !business_name) {
      return Response.json(
        { error: 'Missing required fields: email, full_name, business_name' },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = normalizePhone(phone_number);
    if (phone_number && !normalizedPhone) {
      return Response.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    const intakeQuality = classifyIntake(body, normalizedPhone);

    // Check for duplicate: normalized email + phone (multi-layer dedup)
    const normalizedEmail = email.toLowerCase().trim();
    const existingByEmailPhone = normalizedPhone ? await base44.asServiceRole.entities.WebsiteLead.filter({
      email: normalizedEmail,
      phone_number: normalizedPhone,
    }, '-created_date', 1) : [];

    const existingByEmail = await base44.asServiceRole.entities.WebsiteLead.filter({
      email: normalizedEmail,
    }, '-created_date', 1);

    if (existingByEmailPhone && existingByEmailPhone.length > 0) {
      // Email + phone match = high confidence duplicate
      console.log(`Exact duplicate detected for ${email} / ${normalizedPhone}. Returning existing record.`);
      return Response.json({
        success: true,
        lead_id: existingByEmailPhone[0].id,
        action: 'duplicate_exact',
      });
    }

    if (existingByEmail && existingByEmail.length > 0) {
      // Email match = potential duplicate, log for review
      console.log(`Email duplicate detected for ${email}. Continuing with new record.`);
    }

    // Create new lead with normalized data. Non-production markers keep records available
    // for QA proof while keeping them out of normal outreach and trusted dashboards.
    try {
      const now = new Date().toISOString();
      const newLead = await base44.asServiceRole.entities.WebsiteLead.create({
        full_name: full_name.trim(),
        email: email.toLowerCase().trim(),
        phone_number: normalizedPhone || phone_number,
        business_name: business_name.trim(),
        message: message || '',
        source: source || 'website_form',
        routing_key: routing_key || null,
        lead_status: intakeQuality.nonProduction ? 'ignored' : 'new',
        reply_status: 'none',
        booking_status: 'none',
        automation_enabled: !intakeQuality.nonProduction,
        cadence_paused: intakeQuality.nonProduction,
        cadence_paused_at: intakeQuality.nonProduction ? now : null,
        archived: intakeQuality.nonProduction,
        archived_at: intakeQuality.nonProduction ? now : null,
        quality_notes: intakeQuality.nonProduction ? `non_production:${intakeQuality.markers.join(',')}` : '',
        engagement_score: 0,
        consent_given: true,
        consent_given_at: now,
      });

      console.log(`Lead created successfully: ${newLead.id}`);

      return Response.json({
        success: true,
        lead_id: newLead.id,
        action: intakeQuality.nonProduction ? 'created_archived_non_production' : 'created',
        non_production: intakeQuality.nonProduction,
        markers: intakeQuality.markers,
      });
    } catch (createError) {
      // Handle race condition: another request created this lead between our check and create
      if (createError.message?.includes('UNIQUE_CONSTRAINT') || createError.code === 'UNIQUE_CONSTRAINT') {
        console.log(`Race condition detected for ${email}. Fetching newly created lead.`);
        
        const recentLeads = await base44.asServiceRole.entities.WebsiteLead.filter({
          email: email.toLowerCase().trim(),
          business_name: business_name.toLowerCase().trim(),
        }, '-created_date', 1);

        if (recentLeads && recentLeads.length > 0) {
          return Response.json({
            success: true,
            lead_id: recentLeads[0].id,
            action: 'race_condition_resolved',
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
