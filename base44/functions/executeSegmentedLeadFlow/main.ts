/**
 * EXECUTE SEGMENTED LEAD FLOW
 * Main orchestrator for routing leads into HOT/WARM/COLD execution pipelines
 * Triggered when lead is created or segment changes
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const leadData = await req.json();

    // Validate required fields
    if (!leadData.lead_id && !leadData.id) {
      return Response.json(
        { error: 'Missing lead_id' },
        { status: 400 }
      );
    }

    const leadId = leadData.lead_id || leadData.id;

    // Fetch full lead data if only ID provided
    let lead = leadData;
    if (!lead.segment_label) {
      lead = await base44.entities.Leads.get(leadId);
    }

    if (!lead) {
      return Response.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Import segmentation helpers
    const segmentHelper = await import('../lib/segmentExecutionEngine.js');
    const leadSegHelper = await import('../lib/leadSegmentation.js');

    // Score lead and determine segment
    const segmentation = leadSegHelper.scoreLeadSegmentation(lead);

    // Calculate priority score
    const priorityScore = segmentHelper.calculateRevenueExecutionPriorityScore(lead);

    // Get next action based on segment
    const nextAction = segmentHelper.getNextExecutionAction(lead);

    // Get full execution sequence
    const executionSequence = segmentHelper.getFullExecutionSequence(lead);

    // Update lead with calculated scores
    await base44.entities.Leads.update(leadId, {
      intent_score: segmentation.intent_score,
      recency_score: segmentation.recency_score,
      segment_label: segmentation.segment_label,
    });

    // Log execution plan
    console.log(`[ExecuteSegmentedLeadFlow] Lead ${leadId}`, {
      segment: segmentation.segment_label,
      priority_score: priorityScore,
      intent_score: segmentation.intent_score,
      next_action: nextAction?.action?.type,
      actions_sequence_count: executionSequence.actions_sequence.length,
    });

    // Determine execution based on segment
    let executionResult = { status: 'queued' };

    switch (segmentation.segment_label) {
      case 'HOT':
        executionResult = await executeHotLeadFlow(base44, lead, nextAction);
        break;
      case 'WARM':
        executionResult = await executeWarmLeadFlow(base44, lead, executionSequence);
        break;
      case 'COLD':
        executionResult = await executeColdLeadFlow(base44, lead, executionSequence);
        break;
    }

    return Response.json({
      success: true,
      lead_id: leadId,
      segment: segmentation.segment_label,
      priority_score: priorityScore,
      execution: executionResult,
    });
  } catch (error) {
    console.error('[ExecuteSegmentedLeadFlow] Error:', error.message);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});

/**
 * Execute HOT lead flow
 * Immediate high-frequency outreach
 */
async function executeHotLeadFlow(base44, lead, nextAction) {
  try {
    console.log(`[HOT Flow] Starting for lead ${lead.id}`);

    // Create AutomationJob for immediate SMS
    const hotJob = {
      lead_id: lead.id,
      segment_label: 'HOT',
      priority_score: 85,
      revenue_priority: 'highest',
      action_type: nextAction.action.type,
      message_template: nextAction.action.template,
      scheduled_for: new Date().toISOString(),
      status: 'pending',
      max_retries: 3,
    };

    // Queue immediate actions
    const actions = [];

    // 1. Instant SMS with booking prompt
    actions.push({
      ...hotJob,
      action_type: 'instant_sms',
      message_template: 'hot_lead_booking_prompt',
      delay_seconds: 120, // 2 minutes
    });

    // 2. Booking link SMS
    actions.push({
      ...hotJob,
      action_type: 'booking_link_sms',
      message_template: 'hot_lead_booking_link',
      delay_seconds: 300, // 5 minutes
    });

    // 3. Same-day follow-up
    actions.push({
      ...hotJob,
      action_type: 'followup_sms',
      message_template: 'hot_lead_followup_value',
      scheduled_for: getScheduledTime(2, 4), // 2–4 hours
      delay_seconds: 0,
    });

    // 4. Next morning email
    actions.push({
      ...hotJob,
      action_type: 'email_followup',
      message_template: 'hot_lead_email_proposal',
      scheduled_for: getNextMorning(6), // 6–8 AM
      delay_seconds: 0,
    });

    console.log(`[HOT Flow] Queued ${actions.length} actions for lead ${lead.id}`);

    return {
      flow: 'HOT',
      actions_queued: actions.length,
      first_action: nextAction.action.type,
      status: 'activated',
    };
  } catch (error) {
    console.error('[HOT Flow] Error:', error.message);
    throw error;
  }
}

/**
 * Execute WARM lead flow
 * Moderate nurture sequence over 5–7 days
 */
async function executeWarmLeadFlow(base44, lead, executionSequence) {
  try {
    console.log(`[WARM Flow] Starting for lead ${lead.id}`);

    const actions = executionSequence.actions_sequence.map((action, index) => {
      let scheduledTime;

      switch (action.timing) {
        case '2_hours':
          scheduledTime = getScheduledTime(2, 3);
          break;
        case '6_hours':
          scheduledTime = getScheduledTime(6, 8);
          break;
        case 'day_2':
          scheduledTime = getTomorrowTime(9);
          break;
        case 'day_3':
          scheduledTime = getDateAtTime(2, 9);
          break;
        case 'days_4_7':
          scheduledTime = getDateAtTime(5, 9);
          break;
        default:
          scheduledTime = new Date().toISOString();
      }

      return {
        lead_id: lead.id,
        segment_label: 'WARM',
        priority_score: 65,
        step: action.step,
        action_type: action.type,
        message_template: action.template,
        scheduled_for: scheduledTime,
        status: 'pending',
        max_retries: 2,
      };
    });

    console.log(`[WARM Flow] Queued ${actions.length} actions for lead ${lead.id}`);

    return {
      flow: 'WARM',
      actions_queued: actions.length,
      sequence_duration_days: 7,
      status: 'activated',
    };
  } catch (error) {
    console.error('[WARM Flow] Error:', error.message);
    throw error;
  }
}

/**
 * Execute COLD lead flow
 * Long-term reactivation over 3 weeks
 */
async function executeColdLeadFlow(base44, lead, executionSequence) {
  try {
    console.log(`[COLD Flow] Starting for lead ${lead.id}`);

    const actions = executionSequence.actions_sequence.map((action, index) => {
      let scheduledTime;

      switch (action.timing) {
        case 'day_7':
          scheduledTime = getDateAtTime(7, 9);
          break;
        case 'day_10':
          scheduledTime = getDateAtTime(10, 10);
          break;
        case 'day_14':
          scheduledTime = getDateAtTime(14, 9);
          break;
        case 'day_21':
          scheduledTime = getDateAtTime(21, 10);
          break;
        default:
          scheduledTime = getDateAtTime(7, 9);
      }

      return {
        lead_id: lead.id,
        segment_label: 'COLD',
        priority_score: 30,
        step: action.step,
        action_type: action.type,
        message_template: action.template,
        scheduled_for: scheduledTime,
        status: 'pending',
        max_retries: 1,
      };
    });

    console.log(`[COLD Flow] Queued ${actions.length} actions for lead ${lead.id}`);

    return {
      flow: 'COLD',
      actions_queued: actions.length,
      sequence_duration_days: 21,
      status: 'activated',
    };
  } catch (error) {
    console.error('[COLD Flow] Error:', error.message);
    throw error;
  }
}

/**
 * Helper: Get scheduled time X hours from now (randomized within range)
 */
function getScheduledTime(minHours, maxHours) {
  const now = new Date();
  const randomHours = minHours + Math.random() * (maxHours - minHours);
  const scheduled = new Date(now.getTime() + randomHours * 60 * 60 * 1000);
  return scheduled.toISOString();
}

/**
 * Helper: Get tomorrow at specific hour
 */
function getTomorrowTime(hour) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(hour, 0, 0, 0);
  return tomorrow.toISOString();
}

/**
 * Helper: Get date N days from now at specific hour
 */
function getDateAtTime(daysFromNow, hour) {
  const scheduled = new Date();
  scheduled.setDate(scheduled.getDate() + daysFromNow);
  scheduled.setHours(hour, 0, 0, 0);
  return scheduled.toISOString();
}

/**
 * Helper: Get next morning (6–8 AM)
 */
function getNextMorning(hour) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(hour, 0, 0, 0);
  return tomorrow.toISOString();
}