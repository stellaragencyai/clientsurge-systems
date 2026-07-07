import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

/**
 * getIndustryConfigBySlug — Fetches a published IndustryConfig by slug
 * for dynamic industry page rendering.
 *
 * Returns:
 *   - { found: true, status: 'published', config: {...} } for active industries
 *   - { found: true, status: 'draft', config: null } for draft industries (admin preview only)
 *   - { found: true, status: 'archived', config: null } for archived industries
 *   - { found: false, status: null, config: null } for invalid slugs
 *
 * Public endpoint — no auth required (IndustryConfig has public read RLS).
 */
Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const { slug } = body;

    if (!slug || typeof slug !== 'string') {
      return Response.json({ error: 'slug is required' }, { status: 400 });
    }

    // Normalize: route slug → DB slug
    // Route slugs are short (e.g. 'hvac'); DB slugs may include suffix
    const possibleSlugs = [
      slug,
      slug.endsWith('-ai-growth-system') ? slug : `${slug}-ai-growth-system`,
    ];

    const base44 = createClientFromRequest(req);

    // Try each possible slug variant
    let config = null;
    for (const trySlug of possibleSlugs) {
      const results = await base44.asServiceRole.entities.IndustryConfig.filter(
        { slug: trySlug },
        '-created_date',
        1
      ).catch(() => []);
      if (results && results.length > 0) {
        config = results[0];
        break;
      }
    }

    if (!config) {
      return Response.json({ found: false, status: null, config: null });
    }

    // Only return full content for published industries
    // Draft/archived return status only (no content leaked)
    if (config.status === 'published') {
      return Response.json({
        found: true,
        status: 'published',
        config: {
          slug: config.slug,
          display_name: config.display_name,
          industry_category: config.industry_category,
          branding_config: config.branding_config || null,
          website_content: config.website_content || null,
          ai_config: {
            ai_role: config.ai_config?.ai_role || null,
            ai_tone: config.ai_config?.ai_tone || null,
          },
          lead_crm_config: config.lead_crm_config || null,
        },
      });
    }

    // Draft or archived — return status only
    return Response.json({
      found: true,
      status: config.status,
      config: null,
    });
  } catch (error) {
    console.error('[getIndustryConfigBySlug]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});