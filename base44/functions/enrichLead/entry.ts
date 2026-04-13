import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lead_id } = await req.json();

    if (!lead_id) {
      return Response.json({ error: 'Missing lead_id' }, { status: 400 });
    }

    // Fetch the lead
    const lead = await base44.entities.Lead.filter({ id: lead_id });

    if (!lead || lead.length === 0) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    const leadData = lead[0];

    // Re-score with additional enrichment
    const enrichedData = await enrichLeadData(leadData);

    // Update lead with enrichment
    await base44.entities.Lead.update(lead_id, {
      ...enrichedData,
      last_enriched_at: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      lead_id,
      enriched_data: enrichedData,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function enrichLeadData(lead) {
  // In production: call real APIs
  // - Hunter.io for email enrichment
  // - Clearbit for company data
  // - Pitchbook for company insights
  // - Instagram API for follower counts

  let score = lead.lead_score || 0;
  const insights = lead.outreach_insight ? lead.outreach_insight.split(' • ') : [];

  // Website quality deeper analysis
  if (lead.has_website && lead.website_quality !== 'unknown') {
    if (lead.website_quality === 'high') {
      insights.push('Professional website suggests serious operation');
    } else if (lead.website_quality === 'low') {
      insights.push('Outdated website = lead capture opportunity');
      score += 5;
    }
  }

  // Social engagement depth
  if (lead.has_social) {
    const totalFollowers = lead.social_links?.reduce((sum, link) => sum + (link.followers || 0), 0) || 0;

    if (totalFollowers > 3000) {
      insights.push(`Strong social reach (${totalFollowers.toLocaleString()} followers)`);
      score += 5;
    } else if (totalFollowers > 500) {
      insights.push('Moderate social engagement');
    } else {
      insights.push('Limited social following');
    }
  }

  // Email availability signal
  if (lead.email) {
    insights.push('Email available for direct outreach');
  } else {
    insights.push('Email not available - phone/contact form priority');
  }

  score = Math.min(Math.max(score, 0), 100);
  const qualityLabel = score >= 80 ? 'High' : score >= 50 ? 'Medium' : 'Low';

  return {
    lead_score: score,
    lead_quality_label: qualityLabel,
    outreach_insight: insights.join(' • '),
  };
}