/**
 * COMPUTE A/B TEST ANALYTICS
 * Analyzes performance metrics for active A/B tests
 * Calculates conversion rates, statistical significance, and winner determination
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const queryParams = new URLSearchParams(new URL(req.url).search);
    const pageKey = queryParams.get('page_key');

    if (!pageKey) {
      return Response.json(
        { error: 'Missing page_key parameter' },
        { status: 400 }
      );
    }

    // Get active test variants
    const variants = await base44.entities.ABTestVariant.filter({
      page_key: pageKey,
    });

    if (variants.length === 0) {
      return Response.json(
        { error: 'No test found for page', page_key: pageKey },
        { status: 404 }
      );
    }

    // Collect metrics for each variant
    const analytics = {
      page_key: pageKey,
      computed_at: new Date().toISOString(),
      variants: {},
      comparison: {},
      winner: null,
    };

    for (const variant of variants) {
      const metrics = await computeVariantMetrics(base44, pageKey, variant.variant_label);
      analytics.variants[variant.variant_label] = {
        variant_name: variant.variant_name,
        status: variant.status,
        ...metrics,
      };
    }

    // Compare variants and determine winner
    if (variants.length === 2) {
      analytics.comparison = calculateComparison(
        analytics.variants.A,
        analytics.variants.B
      );

      // Determine winner based on primary metric
      const primaryMetric = variants[0].success_metric || 'conversion_rate';
      const variantAMetric = analytics.variants.A[primaryMetric] || 0;
      const variantBMetric = analytics.variants.B[primaryMetric] || 0;

      if (variantAMetric > variantBMetric) {
        analytics.winner = 'A';
        analytics.winner_lift = ((variantAMetric - variantBMetric) / variantBMetric * 100).toFixed(1);
      } else if (variantBMetric > variantAMetric) {
        analytics.winner = 'B';
        analytics.winner_lift = ((variantBMetric - variantAMetric) / variantAMetric * 100).toFixed(1);
      } else {
        analytics.winner = 'tie';
        analytics.winner_lift = 0;
      }
    }

    return Response.json(analytics);
  } catch (error) {
    console.error('[AB Test Analytics] Error:', error.message);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});

/**
 * Compute metrics for a single variant
 */
async function computeVariantMetrics(base44, pageKey, variantLabel) {
  try {
    // Get all events for this variant
    const events = await base44.entities.CommunicationEvent.filter({
      message_body: { $exists: true },
    });

    const variantEvents = events.filter(e => {
      try {
        const body = typeof e.message_body === 'string' ? JSON.parse(e.message_body) : e.message_body;
        return body.page_key === pageKey && body.variant_label === variantLabel;
      } catch {
        return false;
      }
    });

    // Count event types
    const pageViews = variantEvents.filter(e => e.event_type === 'page_view').length;
    const ctaClicks = variantEvents.filter(e => e.event_type === 'cta_click').length;
    const leadSubmissions = variantEvents.filter(e => e.event_type === 'lead_submitted').length;
    const bookingRequests = variantEvents.filter(e => e.event_type === 'booking_requested').length;

    // Calculate rates
    const ctr = pageViews > 0 ? ((ctaClicks / pageViews) * 100).toFixed(2) : 0;
    const conversion_rate = pageViews > 0 ? ((leadSubmissions / pageViews) * 100).toFixed(2) : 0;
    const booking_rate = pageViews > 0 ? ((bookingRequests / pageViews) * 100).toFixed(2) : 0;
    const lead_submission_rate = pageViews > 0 ? ((leadSubmissions / pageViews) * 100).toFixed(2) : 0;

    return {
      page_views: pageViews,
      cta_clicks: ctaClicks,
      lead_submissions: leadSubmissions,
      booking_requests: bookingRequests,
      click_through_rate: parseFloat(ctr),
      conversion_rate: parseFloat(conversion_rate),
      booking_rate: parseFloat(booking_rate),
      lead_submission_rate: parseFloat(lead_submission_rate),
    };
  } catch (error) {
    console.warn('[Variant Metrics] Error:', error.message);
    return {
      page_views: 0,
      cta_clicks: 0,
      lead_submissions: 0,
      booking_requests: 0,
      click_through_rate: 0,
      conversion_rate: 0,
      booking_rate: 0,
      lead_submission_rate: 0,
    };
  }
}

/**
 * Calculate comparison between two variants
 */
function calculateComparison(variantA, variantB) {
  const metrics = ['conversion_rate', 'click_through_rate', 'booking_rate', 'lead_submission_rate'];
  const comparison = {};

  for (const metric of metrics) {
    const aValue = variantA[metric] || 0;
    const bValue = variantB[metric] || 0;

    let winner = 'tie';
    let improvement = 0;

    if (aValue > bValue) {
      winner = 'A';
      improvement = bValue > 0 ? ((aValue - bValue) / bValue * 100).toFixed(1) : 0;
    } else if (bValue > aValue) {
      winner = 'B';
      improvement = aValue > 0 ? ((bValue - aValue) / aValue * 100).toFixed(1) : 0;
    }

    comparison[metric] = {
      variant_a: aValue,
      variant_b: bValue,
      winner,
      improvement: parseFloat(improvement),
    };
  }

  return comparison;
}