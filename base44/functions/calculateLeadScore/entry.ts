import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id } = await req.json();

    if (!lead_id) {
      return Response.json({ error: 'Missing lead_id' }, { status: 400 });
    }

    // Fetch lead and related data
    const lead = await base44.entities.Leads.list('', 1, { id: lead_id });
    if (!lead || lead.length === 0) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    const leadData = lead[0];
    let score = 0;

    // Base score: Lead recency
    if (leadData.created_date) {
      const daysSinceCreated = (Date.now() - new Date(leadData.created_date).getTime()) / 86400000;
      if (daysSinceCreated < 1) score += 15; // New lead bonus
      else if (daysSinceCreated < 3) score += 10;
      else if (daysSinceCreated < 7) score += 5;
    }

    // Status scoring
    const statusScores = {
      'New': 5,
      'Contacted': 10,
      'Replied': 25,
      'Qualified': 35,
      'Booking Prompt Sent': 20,
      'Booked': 50,
      'Closed': 0,
    };
    score += statusScores[leadData.status] || 0;

    // Lead quality factors
    if (leadData.lead_category === 'High-Value') score += 20;
    if (leadData.lead_score && leadData.lead_score > 0) score += Math.min(leadData.lead_score / 2, 25);

    // Engagement tracking
    if (leadData.last_contacted_at) {
      const hoursSinceContact = (Date.now() - new Date(leadData.last_contacted_at).getTime()) / 3600000;
      if (hoursSinceContact < 24) score += 15; // Recently engaged
      else if (hoursSinceContact < 72) score += 10;
    }

    // Reply sentiment
    const sentimentScores = {
      'Positive': 30,
      'Neutral': 10,
      'Negative': -10,
    };
    score += sentimentScores[leadData.reply_sentiment] || 0;

    // Fetch communication events for engagement signals
    const events = await base44.entities.CommunicationEvent.list('-created_date', 50, { lead_id });
    if (events) {
      const recentWindow = new Date(Date.now() - 7 * 86400000); // Last 7 days
      
      events.forEach(event => {
        const eventDate = new Date(event.created_date);
        if (eventDate > recentWindow) {
          if (event.event_type === 'email_sent' && event.status === 'delivered') score += 2;
          if (event.event_type === 'sms_sent' && event.status === 'delivered') score += 3;
          if (event.event_type === 'sms_received') score += 15;
        }
      });
    }

    // Enrichment bonus
    if (leadData.enriched_at) score += 10;
    if (leadData.industry_tags?.length > 0) score += 5;

    // Cap score at 100
    const finalScore = Math.min(Math.max(score, 0), 100);

    // Update lead with calculated score
    await base44.entities.Leads.update(lead_id, {
      lead_score: finalScore,
    });

    return Response.json({
      success: true,
      lead_id,
      score: finalScore,
      breakdown: {
        recency: daysSinceCreated ? (daysSinceCreated < 1 ? 15 : daysSinceCreated < 3 ? 10 : daysSinceCreated < 7 ? 5 : 0) : 0,
        status: statusScores[leadData.status] || 0,
        quality: leadData.lead_category === 'High-Value' ? 20 : 0,
        engagement: leadData.last_contacted_at ? 15 : 0,
        sentiment: sentimentScores[leadData.reply_sentiment] || 0,
        enrichment: leadData.enriched_at ? 10 : 0,
      },
    });
  } catch (error) {
    console.error('Error calculating lead score:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});