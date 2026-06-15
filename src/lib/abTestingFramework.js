/**
 * A/B TESTING FRAMEWORK
 * Manages variant creation, traffic splitting, and performance tracking
 */

import crypto from 'crypto';

/**
 * Get variant assignment for a visitor
 * Uses consistent hashing so same visitor always sees same variant
 */
export function getVariantAssignment(visitorId, pageKey, variantWeightA = 50) {
  // Create consistent hash of visitor + page
  const hash = crypto
    .createHash('md5')
    .update(`${visitorId}:${pageKey}`)
    .digest('hex');

  // Convert hex to number (0-100)
  const hashValue = parseInt(hash.substring(0, 8), 16) % 100;

  return hashValue < variantWeightA ? 'A' : 'B';
}

/**
 * Store visitor assignment for tracking
 */
export async function trackVariantAssignment(base44, visitorId, pageKey, variantLabel) {
  try {
    // Store assignment in CommunicationEvent for audit trail
    await base44.entities.CommunicationEvent.create({
      event_type: 'ab_test_assignment',
      channel: 'internal',
      direction: 'system',
      provider: 'internal',
      status: 'processed',
      message_body: JSON.stringify({
        visitor_id: visitorId,
        page_key: pageKey,
        variant_label: variantLabel,
        timestamp: new Date().toISOString(),
      }),
    });

    return { success: true, variant: variantLabel };
  } catch (error) {
    console.warn('[Variant Tracking] Error:', error.message);
    // Fail gracefully - show control variant
    return { success: false, variant: 'A' };
  }
}

/**
 * Track page view for variant
 */
export async function trackPageView(base44, pageKey, variantLabel, visitorId) {
  try {
    await base44.entities.CommunicationEvent.create({
      event_type: 'page_view',
      channel: 'internal',
      direction: 'inbound',
      provider: 'internal',
      status: 'processed',
      message_body: JSON.stringify({
        page_key: pageKey,
        variant_label: variantLabel,
        visitor_id: visitorId,
        timestamp: new Date().toISOString(),
      }),
    });

    return { success: true };
  } catch (error) {
    console.warn('[Page View Tracking] Error:', error.message);
    return { success: false };
  }
}

/**
 * Track CTA click for variant
 */
export async function trackCTAClick(base44, pageKey, variantLabel, ctaText, visitorId) {
  try {
    await base44.entities.CommunicationEvent.create({
      event_type: 'cta_click',
      channel: 'internal',
      direction: 'inbound',
      provider: 'internal',
      status: 'processed',
      subject: ctaText || 'CTA Click',
      message_body: JSON.stringify({
        page_key: pageKey,
        variant_label: variantLabel,
        cta_text: ctaText,
        visitor_id: visitorId,
        timestamp: new Date().toISOString(),
      }),
    });

    return { success: true };
  } catch (error) {
    console.warn('[CTA Click Tracking] Error:', error.message);
    return { success: false };
  }
}

/**
 * Track lead submission for variant
 */
export async function trackLeadSubmission(base44, pageKey, variantLabel, leadId, visitorId) {
  try {
    await base44.entities.CommunicationEvent.create({
      event_type: 'lead_submitted',
      channel: 'internal',
      direction: 'inbound',
      provider: 'internal',
      status: 'processed',
      lead_id: leadId,
      message_body: JSON.stringify({
        page_key: pageKey,
        variant_label: variantLabel,
        lead_id: leadId,
        visitor_id: visitorId,
        timestamp: new Date().toISOString(),
      }),
    });

    return { success: true };
  } catch (error) {
    console.warn('[Lead Submission Tracking] Error:', error.message);
    return { success: false };
  }
}

/**
 * Track booking request for variant
 */
export async function trackBookingRequest(base44, pageKey, variantLabel, leadId, visitorId) {
  try {
    await base44.entities.CommunicationEvent.create({
      event_type: 'booking_requested',
      channel: 'internal',
      direction: 'inbound',
      provider: 'internal',
      status: 'processed',
      lead_id: leadId,
      message_body: JSON.stringify({
        page_key: pageKey,
        variant_label: variantLabel,
        lead_id: leadId,
        visitor_id: visitorId,
        timestamp: new Date().toISOString(),
      }),
    });

    return { success: true };
  } catch (error) {
    console.warn('[Booking Tracking] Error:', error.message);
    return { success: false };
  }
}

/**
 * Create new A/B test for a page
 */
export async function createABTest(base44, testConfig) {
  try {
    // Validate traffic split
    const variantA = testConfig.variants.find(v => v.variant_label === 'A');
    const variantB = testConfig.variants.find(v => v.variant_label === 'B');

    if (!variantA || !variantB) {
      return { success: false, error: 'Must provide both Variant A and B' };
    }

    const totalTraffic = variantA.traffic_split_percent + variantB.traffic_split_percent;
    if (totalTraffic !== 100) {
      return { success: false, error: `Traffic split must equal 100% (currently ${totalTraffic}%)` };
    }

    // Create variants
    const createdVariants = [];
    for (const variant of testConfig.variants) {
      const created = await base44.entities.ABTestVariant.create({
        page_key: testConfig.page_key,
        page_path: testConfig.page_path,
        variant_label: variant.variant_label,
        variant_name: variant.variant_name,
        variant_description: variant.variant_description,
        status: 'active',
        traffic_split_percent: variant.traffic_split_percent,
        start_date: new Date().toISOString(),
        test_duration_days: testConfig.test_duration_days || 14,
        changes: variant.changes,
        hypothesis: testConfig.hypothesis,
        success_metric: testConfig.success_metric,
        minimum_sample_size: testConfig.minimum_sample_size || 100,
        confidence_threshold_percent: testConfig.confidence_threshold_percent || 95,
      });

      createdVariants.push(created);
    }

    return {
      success: true,
      test_id: testConfig.page_key,
      variants: createdVariants,
      message: `A/B test created for ${testConfig.page_key}`,
    };
  } catch (error) {
    console.error('[Create AB Test] Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get active test for a page
 */
export async function getActiveTest(base44, pageKey) {
  try {
    const variants = await base44.entities.ABTestVariant.filter({
      page_key: pageKey,
      status: 'active',
    });

    if (variants.length === 0) {
      return { success: false, test_active: false };
    }

    return {
      success: true,
      test_active: true,
      page_key: pageKey,
      variants: variants,
      variant_a: variants.find(v => v.variant_label === 'A'),
      variant_b: variants.find(v => v.variant_label === 'B'),
    };
  } catch (error) {
    console.error('[Get Active Test] Error:', error.message);
    return { success: false, test_active: false, error: error.message };
  }
}

/**
 * End A/B test and determine winner
 */
export async function concludeABTest(base44, pageKey) {
  try {
    const variants = await base44.entities.ABTestVariant.filter({
      page_key: pageKey,
      status: 'active',
    });

    if (variants.length === 0) {
      return { success: false, error: 'No active test found' };
    }

    // Mark variants as completed
    for (const variant of variants) {
      await base44.entities.ABTestVariant.update(variant.id, {
        status: 'completed',
        end_date: new Date().toISOString(),
      });
    }

    return {
      success: true,
      page_key: pageKey,
      message: 'A/B test concluded',
      variants_updated: variants.length,
    };
  } catch (error) {
    console.error('[Conclude AB Test] Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Pause active A/B test
 */
export async function pauseABTest(base44, pageKey) {
  try {
    const variants = await base44.entities.ABTestVariant.filter({
      page_key: pageKey,
      status: 'active',
    });

    for (const variant of variants) {
      await base44.entities.ABTestVariant.update(variant.id, {
        status: 'paused',
      });
    }

    return {
      success: true,
      page_key: pageKey,
      message: 'A/B test paused',
    };
  } catch (error) {
    console.error('[Pause AB Test] Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Resume paused A/B test
 */
export async function resumeABTest(base44, pageKey) {
  try {
    const variants = await base44.entities.ABTestVariant.filter({
      page_key: pageKey,
      status: 'paused',
    });

    for (const variant of variants) {
      await base44.entities.ABTestVariant.update(variant.id, {
        status: 'active',
      });
    }

    return {
      success: true,
      page_key: pageKey,
      message: 'A/B test resumed',
    };
  } catch (error) {
    console.error('[Resume AB Test] Error:', error.message);
    return { success: false, error: error.message };
  }
}

export default {
  getVariantAssignment,
  trackVariantAssignment,
  trackPageView,
  trackCTAClick,
  trackLeadSubmission,
  trackBookingRequest,
  createABTest,
  getActiveTest,
  concludeABTest,
  pauseABTest,
  resumeABTest,
};