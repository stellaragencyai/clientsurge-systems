import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Update Agency Branding: Update white-label branding configuration for an agency
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { agency_id, ...brandingUpdates } = await req.json();

    if (!agency_id) {
      return Response.json({ error: 'agency_id required' }, { status: 400 });
    }

    // Check if branding config exists
    const existing = await base44.asServiceRole.entities.AgencyBrandingConfig.filter(
      { agency_id },
      null,
      1
    ).then(results => results?.[0]).catch(() => null);

    const brandingConfig = {
      agency_id,
      ...brandingUpdates,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      // Update existing
      await base44.asServiceRole.entities.AgencyBrandingConfig.update(existing.id, brandingConfig);
    } else {
      // Create new
      await base44.asServiceRole.entities.AgencyBrandingConfig.create(brandingConfig);
    }

    // Mark branding as complete if all key fields set
    const isComplete = !!(
      brandingUpdates.logo_url &&
      brandingUpdates.primary_color &&
      brandingUpdates.brand_name_override
    );

    if (isComplete) {
      await base44.asServiceRole.entities.AgencyBrandingConfig.update(
        existing?.id || (await base44.asServiceRole.entities.AgencyBrandingConfig.filter({ agency_id }, null, 1).then(r => r?.[0]?.id)),
        { branding_complete: true, applied_at: new Date().toISOString() }
      );
    }

    return Response.json({
      success: true,
      agency_id,
      branding_complete: isComplete,
      branding: brandingConfig,
    });
  } catch (error) {
    console.error('[updateAgencyBranding] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});