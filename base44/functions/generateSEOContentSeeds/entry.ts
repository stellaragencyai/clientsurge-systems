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
    const { campaign_id, industry, count } = body;

    let campaign = null;
    if (campaign_id) {
      campaign = await base44.asServiceRole.entities.MarketingCampaign.get(campaign_id);
    }

    const prompt = `You are an SEO content strategist for ClientSurge Systems, an AI automation platform for service businesses.

Website: https://clientsurgesystems.com
${campaign ? `Campaign: ${campaign.campaign_name}
Campaign Goal: ${campaign.campaign_goal}` : ''}

Target Industry: ${industry || 'General service businesses (HVAC, dental, med spa, roofing, plumbing, contractors)'}

Generate ${count || 5} SEO content seed ideas as JSON. Each idea should be a real blog post or landing page that could be published on clientsurgesystems.com to drive organic search traffic.

The content must relate to AI automation, lead capture, missed-call recovery, booking automation, or business growth systems.

Return JSON:
{
  "seeds": [
    {
      "topic": "string — clear topic description",
      "keyword": "string — primary target keyword",
      "target_industry": "string",
      "search_intent": "informational | commercial | transactional | navigational",
      "proposed_blog_title": "string — compelling, SEO-friendly title",
      "proposed_landing_page": "string — suggested URL path on clientsurgesystems.com (e.g. /blog/missed-call-text-back-guide)",
      "internal_link_targets": ["existing site pages to link to, e.g. '/', '/pricing', '/how-it-works', '/automations"]
    }
  ]
}

Rules:
- Titles must be specific and defensible — no exaggerated claims.
- Keywords should have realistic search volume potential for local service businesses.
- Each seed should be repurposable into social media posts.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          seeds: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                topic: { type: 'string' },
                keyword: { type: 'string' },
                target_industry: { type: 'string' },
                search_intent: { type: 'string' },
                proposed_blog_title: { type: 'string' },
                proposed_landing_page: { type: 'string' },
                internal_link_targets: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      }
    });

    const createdSeeds = [];
    for (const seed of result.seeds) {
      const created = await base44.asServiceRole.entities.SEOContentSeed.create({
        ...seed,
        status: 'idea',
        campaign_id: campaign_id || null,
      });
      createdSeeds.push(created);
    }

    return Response.json({ success: true, seeds: createdSeeds });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});