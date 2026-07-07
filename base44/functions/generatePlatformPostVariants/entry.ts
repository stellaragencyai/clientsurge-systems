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
    const { campaign_id, content_pillar, platforms } = body;

    if (!campaign_id || !content_pillar) {
      return Response.json({ error: 'campaign_id and content_pillar are required' }, { status: 400 });
    }

    const targetPlatforms = platforms || ['linkedin', 'tiktok', 'instagram_business'];

    // Fetch campaign + brand profile
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

    const prompt = `You are a social media content creator for ClientSurge Systems.

Brand: ${brand.business_name || 'ClientSurge Systems'}
Website: ${brand.website_url || 'https://clientsurgesystems.com'}
Brand Voice: ${brand.brand_voice || 'confident, practical, no-hype, automation-focused'}
Banned Claims: ${(brand.banned_claims || ['guaranteed revenue', '10x results']).join(', ')}
Approved Claims: ${(brand.approved_claims || ['reduce missed lead response time', 'capture more inquiries', 'automate follow-up', 'turn more website visitors into booked conversations', 'build a 24/7 lead response system']).join(', ')}
Primary CTA: ${brand.primary_cta || 'Book a demo'}

Campaign: ${campaign.campaign_name}
Campaign Goal: ${campaign.campaign_goal}
Target Audience: ${campaign.target_audience}
Offer: ${campaign.offer}
Landing Page: ${campaign.landing_page_url || '/'}

Content Pillar: ${content_pillar}

Generate platform-native post variants for: ${targetPlatforms.join(', ')}

Each platform gets a DIFFERENT, native version — do NOT copy-paste.

Return JSON:
{
  "variant_group_id": "unique string for this content idea",
  "posts": [
    {
      "platform": "linkedin",
      "post_type": "text",
      "draft_text": "Professional B2B authority post (300-500 chars). Insight-driven, practical, no hype.",
      "hashtags": ["3-5 hashtags"],
      "cta": "clear CTA",
      "landing_page_url": "${campaign.landing_page_url || '/'}"
    },
    {
      "platform": "tiktok",
      "post_type": "video",
      "draft_text": "Short caption (under 150 chars)",
      "video_script": "Full video script with hook (first 3 sec), main content, and CTA. 15-30 seconds spoken.",
      "hashtags": ["3-5 hashtags"],
      "cta": "clear CTA",
      "landing_page_url": "${campaign.landing_page_url || '/'}"
    },
    {
      "platform": "instagram_business",
      "post_type": "carousel",
      "draft_text": "Caption (under 220 chars)",
      "video_script": "Optional Reel script if post_type is reel, otherwise null",
      "hashtags": ["5-10 hashtags"],
      "cta": "clear CTA",
      "landing_page_url": "${campaign.landing_page_url || '/'}"
    }
  ]
}

Rules:
- Only include posts for platforms in the target list: ${targetPlatforms.join(', ')}
- TikTok posts REQUIRE a video_script — note that without a hosted video asset, publishing will be blocked.
- Every post must point to a real clientsurgesystems.com page.
- Use defensible language only — no fabricated metrics, testimonials, or case studies.
- Content must be specific to AI automation, lead capture, missed-call recovery, booking, or business growth.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          variant_group_id: { type: 'string' },
          posts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                platform: { type: 'string' },
                post_type: { type: 'string' },
                draft_text: { type: 'string' },
                video_script: { type: 'string' },
                hashtags: { type: 'array', items: { type: 'string' } },
                cta: { type: 'string' },
                landing_page_url: { type: 'string' }
              }
            }
          }
        }
      }
    });

    // Create MarketingPost records + approval queue entries
    const variantGroupId = result.variant_group_id || `vg_${Date.now()}`;
    const createdPosts = [];

    for (const postData of result.posts) {
      const campaignSlug = campaign.campaign_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
      const utmUrl = `${postData.landing_page_url || campaign.landing_page_url || '/'}?utm_source=${postData.platform}&utm_medium=organic_social&utm_campaign=${campaignSlug}&utm_content=${variantGroupId}`;

      const post = await base44.asServiceRole.entities.MarketingPost.create({
        campaign_id,
        platform: postData.platform,
        post_type: postData.post_type || 'text',
        draft_text: postData.draft_text,
        hashtags: postData.hashtags || [],
        cta: postData.cta,
        landing_page_url: postData.landing_page_url || campaign.landing_page_url,
        utm_url: utmUrl,
        video_script: postData.video_script || null,
        content_pillar,
        target_audience: campaign.target_audience,
        approval_status: 'pending',
        publish_status: 'not_scheduled',
        post_variant_group_id: variantGroupId,
      });

      await base44.asServiceRole.entities.MarketingApprovalQueue.create({
        post_id: post.id,
        status: 'pending',
        campaign_id,
        platform: postData.platform,
      });

      createdPosts.push(post);
    }

    return Response.json({ success: true, variant_group_id: variantGroupId, posts: createdPosts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});