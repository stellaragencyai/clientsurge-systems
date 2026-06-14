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

    // Check for duplicate: normalized email + business_name
    const existingLeads = await base44.asServiceRole.entities.WebsiteLead.filter({
      email: email.toLowerCase().trim(),
      business_name: business_name.toLowerCase().trim(),
    }, '-created_date', 1);

    if (existingLeads && existingLeads.length > 0) {
      // Duplicate found — return existing lead
      console.log(`Duplicate lead detected for ${email}. Returning existing record.`);
      return Response.json({
        success: true,
        lead_id: existingLeads[0].id,
        action: 'duplicate_skipped',
      });
    }

    // Create new lead with normalized data
    try {
      const newLead = await base44.asServiceRole.entities.WebsiteLead.create({
        full_name: full_name.trim(),
        email: email.toLowerCase().trim(),
        phone_number: normalizedPhone || phone_number, // Use normalized or original
        business_name: business_name.trim(),
        message: message || '',
        source: source || 'website_form',
        routing_key: routing_key || null,
        lead_status: 'new',
        reply_status: 'none',
        booking_status: 'none',
        automation_enabled: true,
        engagement_score: 0,
        consent_given: true,
        consent_given_at: new Date().toISOString(),
      });

      console.log(`Lead created successfully: ${newLead.id}`);

      return Response.json({
        success: true,
        lead_id: newLead.id,
        action: 'created',
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