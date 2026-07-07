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
    const { campaign_idea, target_audience, goal } = body;

    if (!campaign_idea) {
      return Response.json({ error: 'campaign_idea is required' }, { status: 400 });
    }

    // Fetch brand profile for context
    const brandProfiles = await base44.asServiceRole.entities.MarketingBrandProfile.filter({ is_active: true }, '-created_date', 1);
    const brand = brandProfiles?.[0] || {};

    const prompt = `You are a marketing strategist for ClientSurge Systems, an AI automation platform for service businesses.

Brand: ${brand.business_name || 'ClientSurge Systems'}
Website: ${brand.website_url || 'https://clientsurgesystems.com'}
Offer: ${brand.offer_summary || 'AI-powered lead capture, missed-call text-back, booking automation, and 24/7 AI receptionist for service businesses'}
Brand Voice: ${brand.brand_voice || 'confident, practical, no-hype, automation-focused'}
Banned Claims: ${(brand.banned_claims || ['guaranteed revenue', '10x results', 'get rich quick']).join(', ')}
Approved Claims: ${(brand.approved_claims || ['reduce missed lead response time', 'capture more inquiries', 'automate follow-up', 'turn more website visitors into booked conversations', 'build a 24/7 lead response system']).join(', ')}
Primary CTA: ${brand.primary_cta || 'Book a demo'}

Campaign Idea: ${campaign_idea}
Target Audience: ${target_audience || 'Service business owners (HVAC, dental, med spa, roofing, plumbing, contractors)'}
Goal: ${goal || 'lead_generation'}

Generate a complete marketing campaign plan as JSON with this schema:
{
  "campaign_name": "string — clear, specific name",
  "campaign_goal": "lead_generation | brand_awareness | traffic | engagement | thought_leadership | product_launch",
  "target_audience": "string — specific audience description",
  "offer": "string — what the audience gets",
  "landing_page_url": "string — relevant clientsurgesystems.com page",
  "content_pillars": ["4-6 content pillars — e.g. 'missed call recovery', 'AI booking', 'lead response speed'"],
  "daily_posting_goal": number,
  "weekly_posting_goal": number,
  "target_platforms": ["linkedin", "instagram_business"],
  "description": "2-3 sentence campaign summary"
}

Rules:
- Use defensible language only. No exaggerated claims.
- Content pillars must relate to AI automation, lead capture, missed-call recovery, booking automation, or business growth.
- Landing page should be a real clientsurgesystems.com path (e.g. /, /pricing, /how-it-works, /automations).
- Weekly posting goal should be 5-14 posts across platforms.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          campaign_name: { type: 'string' },
          campaign_goal: { type: 'string' },
          target_audience: { type: 'string' },
          offer: { type: 'string' },
          landing_page_url: { type: 'string' },
          content_pillars: { type: 'array', items: { type: 'string' } },
          daily_posting_goal: { type: 'number' },
          weekly_posting_goal: { type: 'number' },
          target_platforms: { type: 'array', items: { type: 'string' } },
          description: { type: 'string' }
        }
      }
    });

    const campaign = await base44.asServiceRole.entities.MarketingCampaign.create({
      ...result,
      start_date: new Date().toISOString().split('T')[0],
      status: 'draft',
      brand_profile_id: brand.id || null,
    });

    return Response.json({ success: true, campaign });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});