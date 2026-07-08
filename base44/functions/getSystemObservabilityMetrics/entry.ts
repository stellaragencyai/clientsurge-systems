import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...(init.headers || {}),
    },
  });
}

function adminAllowed(user) {
  return user?.role === 'admin' || user?.role === 'super_admin';
}

async function safeEntityList(base44, entityName, limit, label) {
  try {
    const entity = base44.asServiceRole.entities[entityName];
    if (!entity?.filter) {
      return { ok: false, records: [], warning: `${label} entity is not available.` };
    }
    const records = await entity.filter({}, '-created_date', limit);
    return { ok: true, records: records || [], warning: null };
  } catch (error) {
    return {
      ok: false,
      records: [],
      warning: `${label} query failed: ${error?.message || String(error)}`,
    };
  }
}

function dateMs(value) {
  const ms = Date.parse(value || '');
  return Number.isFinite(ms) ? ms : 0;
}

function latestTimestamp(records = []) {
  const latest = records.reduce((max, record) => Math.max(max, dateMs(record?.created_date || record?.updated_date)), 0);
  return latest ? new Date(latest).toISOString() : null;
}

function percent(numerator, denominator) {
  if (!denominator) return null;
  return Math.round((numerator / denominator) * 100);
}

function healthStatusFromRate({ hasData, failureRate, warningAt = 10, issueAt = 20 }) {
  if (!hasData) return 'Unknown';
  if (failureRate >= issueAt) return 'Issue';
  if (failureRate >= warningAt) return 'Degraded';
  return 'Healthy';
}

function automationStatus({ hasData, successRate, failedJobs }) {
  if (!hasData) return 'Unknown';
  if (failedJobs > 0 && successRate < 70) return 'Issue';
  if (failedJobs > 0 || successRate < 85) return 'Degraded';
  return 'Healthy';
}

function queueStatus({ queried, queuedItems }) {
  if (!queried) return 'Unknown';
  if (queuedItems > 100) return 'Issue';
  if (queuedItems > 25) return 'Degraded';
  return 'Healthy';
}

function buildCoverage(sources) {
  const warnings = [];
  const coverage = {};

  for (const [key, source] of Object.entries(sources)) {
    coverage[key] = {
      queried: source.ok,
      count: source.records.length,
      latest_record_at: latestTimestamp(source.records),
      warning: source.warning,
    };
    if (source.warning) warnings.push(source.warning);
  }

  return { coverage, warnings };
}

Deno.serve(async (req) => {
  const requestId = `obs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    if (req.method !== 'POST') {
      return secureJson(
        { error: 'Method not allowed', code: 'method_not_allowed', request_id: requestId },
        { status: 405, headers: { Allow: 'POST' } }
      );
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!adminAllowed(user)) {
      return secureJson({ error: 'Admin access required', code: 'admin_required', request_id: requestId }, { status: 403 });
    }

    const [leadsSource, eventsSource, jobsSource, queueSource, executionLogsSource] = await Promise.all([
      safeEntityList(base44, 'Leads', 5000, 'Leads'),
      safeEntityList(base44, 'CommunicationEvent', 1000, 'CommunicationEvent'),
      safeEntityList(base44, 'AutomationJob', 1000, 'AutomationJob'),
      safeEntityList(base44, 'EventQueue', 500, 'EventQueue'),
      safeEntityList(base44, 'AutomationExecutionLog', 500, 'AutomationExecutionLog'),
    ]);

    const sources = {
      leads: leadsSource,
      communication_events: eventsSource,
      automation_jobs: jobsSource,
      event_queue: queueSource,
      automation_execution_logs: executionLogsSource,
    };
    const { coverage: dataCoverage, warnings: coverageWarnings } = buildCoverage(sources);

    const allLeads = leadsSource.records;
    const allEvents = eventsSource.records;
    const allJobs = jobsSource.records;
    const eventQueue = queueSource.records;
    const executionLogs = executionLogsSource.records;

    const now = new Date();
    const oneDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const totalLeads = allLeads.length;
    const totalEvents = allEvents.length;
    const totalJobs = allJobs.length;
    const successfulJobs = allJobs.filter((job) => job.status === 'completed').length;
    const failedJobs = allJobs.filter((job) => job.status === 'failed').length;
    const successRate = percent(successfulJobs, totalJobs);
    const failedEvents = allEvents.filter((event) => event.status === 'failed').length;

    const leadsLast24h = allLeads.filter((lead) => dateMs(lead.created_date) > oneDay.getTime());
    const contactedLeads = leadsLast24h.filter((lead) => ['contacted', 'sent', 'replied', 'booked'].includes(String(lead.outreach_status || '').toLowerCase())).length;
    const respondedLeads = leadsLast24h.filter((lead) => String(lead.outreach_status || '').toLowerCase() === 'replied').length;
    const bookedLeads = leadsLast24h.filter((lead) => String(lead.outreach_status || '').toLowerCase() === 'booked').length;

    const smsEvents = allEvents.filter((event) => event.channel === 'sms' || event.event_type === 'sms_sent');
    const smsFailed = smsEvents.filter((event) => event.status === 'failed').length;
    const smsFailureRate = percent(smsFailed, smsEvents.length);

    const emailEvents = allEvents.filter((event) => event.channel === 'email' || event.event_type === 'email_sent');
    const emailFailed = emailEvents.filter((event) => event.status === 'failed').length;
    const emailFailureRate = percent(emailFailed, emailEvents.length);

    const queuedItems = eventQueue.filter((item) => ['pending', 'queued'].includes(String(item.status || '').toLowerCase())).length;
    const processedQueue = eventQueue.filter((item) => String(item.status || '').toLowerCase() === 'processed').length;
    const failedExecutions = executionLogs.filter((log) => ['failed', 'blocked'].includes(String(log.execution_status || '').toLowerCase())).length;

    const activityFeed = [
      ...allEvents.slice(0, 10).map((event) => ({
        type: 'event',
        timestamp: event.created_date,
        event_type: event.event_type,
        status: event.status,
        channel: event.channel,
        provider: event.provider,
        lead_id: event.lead_id,
      })),
      ...allJobs.slice(0, 10).map((job) => ({
        type: 'job',
        timestamp: job.created_date,
        job_type: job.automation_type || job.job_type,
        status: job.status,
        lead_id: job.lead_id,
      })),
      ...executionLogs.slice(0, 10).map((log) => ({
        type: 'execution_log',
        timestamp: log.created_date,
        job_type: log.module_key,
        status: log.execution_status,
        lead_id: log.lead_id,
      })),
      ...leadsLast24h.slice(0, 5).map((lead) => ({
        type: 'lead',
        timestamp: lead.created_date,
        business_name: lead.business_name,
        status: lead.outreach_status || lead.status || 'new',
        lead_id: lead.id,
      })),
    ]
      .filter((item) => item.timestamp)
      .sort((a, b) => dateMs(b.timestamp) - dateMs(a.timestamp))
      .slice(0, 20);

    const suggestions = [];
    if (!jobsSource.ok || totalJobs === 0) {
      suggestions.push({
        title: 'Automation job source is not proven',
        description: 'No AutomationJob records were available. Do not label automation health as healthy until execution logs or jobs exist.',
        priority: 'high',
        category: 'Observability',
      });
    }
    if (failedExecutions > 0) {
      suggestions.push({
        title: 'Automation execution failures need review',
        description: `${failedExecutions} failed or blocked execution logs were found in the sampled window.`,
        priority: 'high',
        category: 'Automation',
      });
    }
    if (smsFailureRate !== null && smsFailureRate >= 15) {
      suggestions.push({
        title: 'SMS failure rate elevated',
        description: `SMS failure rate is ${smsFailureRate}% in sampled CommunicationEvent records.`,
        priority: 'high',
        category: 'Messaging',
      });
    }
    if (emailFailureRate !== null && emailFailureRate >= 15) {
      suggestions.push({
        title: 'Email failure rate elevated',
        description: `Email failure rate is ${emailFailureRate}% in sampled CommunicationEvent records.`,
        priority: 'high',
        category: 'Messaging',
      });
    }
    if (queuedItems > 25) {
      suggestions.push({
        title: 'Event queue backlog detected',
        description: `${queuedItems} event queue items are pending/queued.`,
        priority: queuedItems > 100 ? 'high' : 'medium',
        category: 'Queue',
      });
    }

    const messagingHasData = smsEvents.length > 0 || emailEvents.length > 0;
    const messagingWorstFailureRate = Math.max(smsFailureRate ?? 0, emailFailureRate ?? 0);

    return secureJson({
      success: true,
      request_id: requestId,
      timestamp: now.toISOString(),
      proof_label: 'Posted records only — not live provider proof',
      data_coverage: dataCoverage,
      coverage_warnings: coverageWarnings,
      core_metrics: {
        total_leads: totalLeads,
        total_events: totalEvents,
        total_jobs: totalJobs,
        success_rate: successRate,
        failed_events: failedEvents,
        successful_jobs: successfulJobs,
        failed_jobs: failedJobs,
        failed_execution_logs: failedExecutions,
      },
      lead_flow_24h: {
        new_leads: leadsLast24h.length,
        contacted: contactedLeads,
        responded: respondedLeads,
        booked: bookedLeads,
      },
      health_indicators: {
        messaging_health: {
          sms_failure_rate: smsFailureRate,
          email_failure_rate: emailFailureRate,
          status: healthStatusFromRate({ hasData: messagingHasData, failureRate: messagingWorstFailureRate, warningAt: 10, issueAt: 20 }),
          evidence_count: smsEvents.length + emailEvents.length,
        },
        automation_health: {
          success_rate: successRate,
          failed_count: failedJobs,
          failed_execution_logs: failedExecutions,
          status: automationStatus({ hasData: totalJobs > 0 || executionLogs.length > 0, successRate: successRate ?? 0, failedJobs: failedJobs + failedExecutions }),
          evidence_count: totalJobs + executionLogs.length,
        },
        event_queue_health: {
          queued: queuedItems,
          processed: processedQueue,
          status: queueStatus({ queried: queueSource.ok, queuedItems }),
          evidence_count: eventQueue.length,
        },
      },
      activity_feed: activityFeed,
      suggestions: suggestions.slice(0, 6),
    });
  } catch (error) {
    console.error('[getSystemObservabilityMetrics]', error);
    return secureJson(
      { error: error.message || 'Failed to fetch observability metrics', request_id: requestId },
      { status: 500 }
    );
  }
});
