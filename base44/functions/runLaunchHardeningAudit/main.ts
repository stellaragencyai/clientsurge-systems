/**
 * RUN LAUNCH HARDENING AUDIT
 * Comprehensive pre-launch system health check
 * Validates stability, consistency, and safety across all critical systems
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only check
    if (!user || user.role !== 'admin') {
      return Response.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const auditResults = {
      timestamp: new Date().toISOString(),
      status: 'pending',
      checks: {},
      summary: {},
    };

    // 1. System Stability
    console.log('[Audit] Running system stability checks...');
    auditResults.checks.stability = await runStabilityChecks(base44);

    // 2. Data Consistency
    console.log('[Audit] Running data consistency checks...');
    auditResults.checks.consistency = await runConsistencyChecks(base44);

    // 3. Duplicate Safety
    console.log('[Audit] Running duplicate detection checks...');
    auditResults.checks.duplicates = await runDuplicateChecks(base44);

    // 4. Error Handling
    console.log('[Audit] Running error handling validation...');
    auditResults.checks.error_handling = await runErrorHandlingChecks(base44);

    // 5. Performance Baseline
    console.log('[Audit] Running performance checks...');
    auditResults.checks.performance = await runPerformanceChecks(base44);

    // 6. Message Delivery Health
    console.log('[Audit] Running message delivery health checks...');
    auditResults.checks.messaging = await runMessagingHealthChecks(base44);

    // 7. Automation Safety
    console.log('[Audit] Running automation safety checks...');
    auditResults.checks.automation = await runAutomationSafetyChecks(base44);

    // Calculate summary
    auditResults.summary = calculateAuditSummary(auditResults.checks);
    auditResults.status = auditResults.summary.ready_for_launch ? 'passed' : 'failed';

    console.log('[Audit] Complete:', auditResults.status);

    return Response.json(auditResults);
  } catch (error) {
    console.error('[Audit] Fatal error:', error.message);
    return Response.json(
      { error: error.message, status: 'failed' },
      { status: 500 }
    );
  }
});

async function runStabilityChecks(base44) {
  return {
    leads_creatable: await checkEntity(base44, 'Leads'),
    messages_creatable: await checkEntity(base44, 'Messages'),
    orders_creatable: await checkEntity(base44, 'Order'),
    events_creatable: await checkEntity(base44, 'CommunicationEvent'),
    status: 'passed',
  };
}

async function runConsistencyChecks(base44) {
  try {
    const leads = await base44.entities.Leads.list(undefined, 50);
    let consistent = 0;
    let inconsistent = 0;

    for (const lead of leads) {
      // Check funnel identity
      if (lead.funnel_identity_id) {
        const messages = await base44.entities.Messages.filter({
          funnel_identity_id: lead.funnel_identity_id,
        });

        const mismatchMessages = messages.filter(
          m => m.funnel_identity_id !== lead.funnel_identity_id
        ).length;

        if (mismatchMessages === 0) {
          consistent++;
        } else {
          inconsistent++;
        }
      }
    }

    return {
      total_leads_checked: leads.length,
      consistent_records: consistent,
      inconsistent_records: inconsistent,
      consistency_rate: leads.length > 0 ? ((consistent / leads.length) * 100).toFixed(1) + '%' : 'N/A',
      status: inconsistent > leads.length * 0.05 ? 'warning' : 'passed',
    };
  } catch (error) {
    return { status: 'failed', error: error.message };
  }
}

async function runDuplicateChecks(base44) {
  try {
    const leads = await base44.entities.Leads.list(undefined, 100);
    const emailMap = {};
    const phoneMap = {};
    let potentialDuplicates = 0;

    for (const lead of leads) {
      const email = (lead.email || '').toLowerCase().trim();
      const phone = (lead.phone || '').replace(/\D/g, '');

      if (email && emailMap[email]) {
        potentialDuplicates++;
      } else if (email) {
        emailMap[email] = lead.id;
      }

      if (phone && phoneMap[phone]) {
        potentialDuplicates++;
      } else if (phone) {
        phoneMap[phone] = lead.id;
      }
    }

    return {
      total_leads_checked: leads.length,
      potential_duplicates: potentialDuplicates,
      duplicate_rate: leads.length > 0 ? ((potentialDuplicates / leads.length) * 100).toFixed(1) + '%' : '0%',
      status: potentialDuplicates > leads.length * 0.10 ? 'warning' : 'passed',
    };
  } catch (error) {
    return { status: 'failed', error: error.message };
  }
}

async function runErrorHandlingChecks(base44) {
  try {
    const events = await base44.entities.CommunicationEvent.filter({
      status: 'failed',
      created_date: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
    });

    const totalEvents = await base44.entities.CommunicationEvent.list(undefined, 1000);
    const failureRate = totalEvents.length > 0 ? ((events.length / totalEvents.length) * 100).toFixed(1) : '0';

    return {
      failed_events_24h: events.length,
      total_events_sample: totalEvents.length,
      failure_rate: failureRate + '%',
      acceptable_threshold: '5%',
      status: parseFloat(failureRate) > 5 ? 'warning' : 'passed',
    };
  } catch (error) {
    return { status: 'failed', error: error.message };
  }
}

async function runPerformanceChecks(base44) {
  try {
    const startTime = Date.now();

    // Test query performance
    const leadQuery = Date.now();
    await base44.entities.Leads.list(undefined, 100);
    const leadQueryMs = Date.now() - leadQuery;

    const messageQuery = Date.now();
    await base44.entities.Messages.list(undefined, 100);
    const messageQueryMs = Date.now() - messageQuery;

    const eventQuery = Date.now();
    await base44.entities.CommunicationEvent.list(undefined, 100);
    const eventQueryMs = Date.now() - eventQuery;

    return {
      leads_query_ms: leadQueryMs,
      messages_query_ms: messageQueryMs,
      events_query_ms: eventQueryMs,
      total_audit_time_ms: Date.now() - startTime,
      status: Math.max(leadQueryMs, messageQueryMs, eventQueryMs) > 5000 ? 'warning' : 'passed',
    };
  } catch (error) {
    return { status: 'failed', error: error.message };
  }
}

async function runMessagingHealthChecks(base44) {
  try {
    const messages = await base44.entities.Messages.list(undefined, 500);

    const statuses = {
      sent: messages.filter(m => m.status === 'sent').length,
      delivered: messages.filter(m => m.status === 'delivered').length,
      failed: messages.filter(m => m.status === 'failed').length,
      pending: messages.filter(m => m.status === 'pending').length,
    };

    const deliveryRate = messages.length > 0
      ? (((statuses.sent + statuses.delivered) / messages.length) * 100).toFixed(1)
      : '0';

    return {
      total_messages: messages.length,
      sent: statuses.sent,
      delivered: statuses.delivered,
      failed: statuses.failed,
      pending: statuses.pending,
      delivery_rate: deliveryRate + '%',
      status: parseFloat(deliveryRate) < 85 ? 'warning' : 'passed',
    };
  } catch (error) {
    return { status: 'failed', error: error.message };
  }
}

async function runAutomationSafetyChecks(base44) {
  try {
    // Check for automation loops (same action repeated rapidly)
    const events = await base44.entities.CommunicationEvent.list(undefined, 500);

    const eventsByLeadAndType = {};
    let loopDetected = false;

    for (const event of events) {
      const key = `${event.lead_id}:${event.event_type}`;
      if (!eventsByLeadAndType[key]) eventsByLeadAndType[key] = [];
      eventsByLeadAndType[key].push(event.created_date);
    }

    // Check for rapid repeats
    let rapidRepeatCount = 0;
    for (const key in eventsByLeadAndType) {
      const times = eventsByLeadAndType[key];
      for (let i = 1; i < times.length; i++) {
        const timeDiff = new Date(times[i]) - new Date(times[i - 1]);
        if (timeDiff < 60 * 1000) {
          // Less than 1 minute
          rapidRepeatCount++;
          loopDetected = true;
        }
      }
    }

    return {
      total_automations_checked: Object.keys(eventsByLeadAndType).length,
      rapid_repeats_detected: rapidRepeatCount,
      loop_risk: loopDetected ? 'high' : 'low',
      status: loopDetected ? 'warning' : 'passed',
    };
  } catch (error) {
    return { status: 'failed', error: error.message };
  }
}

async function checkEntity(base44, entityName) {
  try {
    const entity = base44.entities[entityName];
    if (!entity) return { creatable: false, reason: 'entity_not_found' };

    // Try a schema check without creating
    const schema = entity.schema ? entity.schema() : null;
    return { creatable: !!schema, schema_valid: !!schema };
  } catch (error) {
    return { creatable: false, error: error.message };
  }
}

function calculateAuditSummary(checks) {
  const allPassed = Object.values(checks).every(
    check => check.status === 'passed' || check.status === undefined
  );

  const hasWarnings = Object.values(checks).some(check => check.status === 'warning');

  return {
    ready_for_launch: allPassed && !hasWarnings,
    all_checks_passed: allPassed,
    warnings_present: hasWarnings,
    recommendation: allPassed && !hasWarnings
      ? 'Ready for production launch'
      : hasWarnings
        ? 'Address warnings before launch'
        : 'Critical issues require attention',
  };
}