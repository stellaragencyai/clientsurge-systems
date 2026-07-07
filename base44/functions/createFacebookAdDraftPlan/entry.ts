import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { campaign_id, objective, budget_suggestion, audience_description } = body;

    if (!campaign_id) {
      return Response.json({ error: 'campaign_id is required' }, { status: 400 });
    }

    const campaign = await base44.asServiceRole.entities.MarketingCampaign.get(campaign_id);
    if (!campaign) return Response.json({ error: 'Campaign not found' }, { status: 404 });

    let brand = null;
    if (campaign.brand_profile_id) {
      brand = await base44.asServiceRole.entities.MarketingBrandProfile.get(campaign.brand_profile_id);
    }
    if (!brand) {
      const profiles = await base44.asServiceRole.entities.MarketingBrandProfile.filter({ is_active: true }, '-created_date', 1);
      brand = profiles?.[0] || {};
    }

    const prompt = `You are a Facebook Ads strategist for ClientSurge Systems.

Brand: ${brand.business_name || 'ClientSurge Systems'}
Website: ${brand.website_url || 'https://clientsurgesystems.com'}
Brand Voice: ${brand.brand_voice || 'confident, practical, no-hype'}
Approved Claims: ${(brand.approved_claims || ['reduce missed lead response time', 'capture more inquiries', 'automate follow-up']).join(', ')}

Campaign: ${campaign.campaign_name}
Campaign Goal: ${campaign.campaign_goal}
Target Audience: ${campaign.target_audience}
Offer: ${campaign.offer}
Landing Page: ${campaign.landing_page_url || '/'}

Objective: ${objective || 'lead_generation'}
Audience: ${audience_description || campaign.target_audience}
Budget Suggestion: ${budget_suggestion || '$20-50/day'}

IMPORTANT: This is a DRAFT PLAN ONLY. No ads will be created, launched, or billed.

Generate a Facebook Ad draft plan as JSON:
{
  "ad_plan_name": "string",
  "objective": "string — lead_generation, traffic, engagement, etc.",
  "target_audience": "string — detailed audience description",
  "audience_size_estimate": "string — estimated audience size range",
  "budget_suggestion_daily": "string — e.g. $20-50/day",
  "ad_creative_variants": [
    {
      "headline": "string — under 40 chars",
      "primary_text": "string — ad body, under 125 chars",
      "description": "string — under 30 chars",
      "cta_button": "string — e.g. 'Book Now', 'Learn More'",
      "landing_page_url": "string"
    }
  ],
  "targeting_suggestions": ["interests, behaviors, demographics"],
  "notes": "string — strategy notes, no live execution"
}

Rules:
- Use defensible language only. No exaggerated claims.
- All ad creative is DRAFT ONLY — no live spend.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          ad_plan_name: { type: 'string' },
          objective: { type: 'string' },
          target_audience: { type: 'string' },
          audience_size_estimate: { type: 'string' },
          budget_suggestion_daily: { type: 'string' },
          ad_creative_variants: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                headline: { type: 'string' },
                primary_text: { type: 'string' },
                description: { type: 'string' },
                cta_button: { type: 'string' },
                landing_page_url: { type: 'string' }
              }
            }
          },
          targeting_suggestions: { type: 'array', items: { type: 'string' } },
          notes: { type: 'string' }
        }
      }
    });

    // Store as MarketingPost with post_type=ad_draft
    const createdPosts = [];
    for (const creative of result.ad_creative_variants) {
      const utmUrl = `${creative.landing_page_url || campaign.landing_page_url || '/'}?utm_source=facebook&utm_medium=paid_social&utm_campaign=${campaign.campaign_name.toLowerCase().replace(/\s+/g, '-').slice(0, 30)}&utm_content=ad_draft`;

      const post = await base44.asServiceRole.entities.MarketingPost.create({
        campaign_id,
        platform: 'facebook_ads',
        post_type: 'ad_draft',
        draft_text: creative.primary_text,
        final_text: creative.primary_text,
        cta: creative.cta_button,
        landing_page_url: creative.landing_page_url || campaign.landing_page_url,
        utm_url: utmUrl,
        content_pillar: 'facebook_ad_draft',
        target_audience: result.target_audience,
        approval_status: 'pending',
        publish_status: 'not_scheduled',
        post_variant_group_id: `fb_ad_draft_${Date.now()}`,
      });

      await base44.asServiceRole.entities.MarketingApprovalQueue.create({
        post_id: post.id,
        status: 'pending',
        campaign_id,
        platform: 'facebook_ads',
      });

      createdPosts.push(post);
    }

    return Response.json({
      success: true,
      ad_plan: result,
      draft_posts: createdPosts,
      warning: 'These are DRAFT ad concepts only. No ads will be created or launched without explicit manual approval.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});