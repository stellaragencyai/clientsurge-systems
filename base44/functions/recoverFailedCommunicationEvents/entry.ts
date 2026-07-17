import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const RETRY_DELAYS_MINUTES = [0, 5, 30, 120, 720];
const ALLOWED_RETRY_FUNCTIONS = new Set([
  'sendWebsiteLeadResponse',
  'processWebsiteLeadFollowUps',
  'sendOrderConfirmationEmail',
  'automationOrchestrator',
]);

const PERMANENT_PATTERNS = [
  /invalid (phone|number|email|recipient|address)/i,
  /unsubscrib/i,
  /opt.?out/i,
  /consent/i,
  /blocked destination/i,
  /not permitted/i,
  /missing (phone|email|recipient|configuration|credential|api key)/i,
  /authentication failed/i,
  /unauthorized/i,
  /forbidden/i,
  /400\b/i,
  /401\b/i,
  /403\b/i,
  /404\b/i,
  /410\b/i,
  /422\b/i,
];

const TRANSIENT_PATTERNS = [
  /timeout/i,
  /timed out/i,
  /network/i,
  /temporar/i,
  /rate limit/i,
  /429\b/i,
  /500\b/i,
  /502\b/i,
  /503\b/i,
  /504\b/i,
  /service unavailable/i,
  /connection reset/i,
];

function classifyFailure(message: string) {
  if (PERMANENT_PATTERNS.some((p) => p.test(message))) return 'permanent';
  if (TRANSIENT_PATTERNS.some((p) => p.test(message))) return 'transient';
  return 'unknown';
}

function parseMetadata(raw: unknown) {
  if (!raw) return {};
  if (typeof raw === 'object') return raw as Record<string, unknown>;
  try { return JSON.parse(String(raw)); } catch { return {}; }
}

function nextRetryAt(retryCount: number) {
  const minutes = RETRY_DELAYS_MINUTES[Math.min(retryCount, RETRY_DELAYS_MINUTES.length - 1)];
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  const now = new Date().toISOString();
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return json({ error: 'Admin only', request_id: requestId }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run === true;
    const scanLimit = Math.min(Math.max(Number(body.limit || 500), 1), 5000);
    const processDue = body.process_due !== false;

    const failedEvents = await base44.asServiceRole.entities.CommunicationEvent.list('-created_date', scanLimit).catch(() => []);
    const candidates = (failedEvents || []).filter((event) => {
      if (event.dashboard_excluded) return false;
      if (['qa', 'smoke', 'demo', 'internal'].includes(event.environment)) return false;
      return event.status === 'failed' || ['sms_failed', 'email_failed', 'provider_send_failed'].includes(event.event_type);
    });

    const summary = {
      scanned: failedEvents?.length || 0,
      candidates: candidates.length,
      queued: 0,
      non_retryable: 0,
      manual_review: 0,
      retried: 0,
      succeeded: 0,
      dead_lettered: 0,
      skipped_not_due: 0,
      errors: [] as string[],
    };

    for (const event of candidates) {
      try {
        const existingRows = await base44.asServiceRole.entities.CommunicationRetryQueue.filter(
          { communication_event_id: event.id }, '-created_date', 1
        ).catch(() => []);
        let queue = existingRows?.[0] || null;

        const metadata = parseMetadata(event.metadata_json);
        const failureReason = String(event.error_message || metadata.error || 'Unknown provider failure');
        const failureClass = classifyFailure(failureReason);
        const retryFunction = String(metadata.retry_function || '');
        const retryPayload = metadata.retry_payload && typeof metadata.retry_payload === 'object'
          ? metadata.retry_payload
          : {
              communication_event_id: event.id,
              lead_id: event.lead_id || '',
              order_id: event.order_id || '',
              retry: true,
            };

        const initialStatus = failureClass === 'permanent'
          ? 'non_retryable'
          : failureClass === 'unknown' || !ALLOWED_RETRY_FUNCTIONS.has(retryFunction)
            ? 'manual_review'
            : 'queued';

        if (!queue && !dryRun) {
          queue = await base44.asServiceRole.entities.CommunicationRetryQueue.create({
            communication_event_id: event.id,
            lead_id: event.lead_id || '',
            order_id: event.order_id || '',
            client_id: event.client_id || '',
            client_project_id: event.client_project_id || '',
            channel: event.channel,
            provider: event.provider || '',
            environment: event.environment || 'unknown',
            failure_class: failureClass,
            failure_reason: failureReason.slice(0, 1000),
            retry_function: retryFunction,
            retry_payload_json: JSON.stringify(retryPayload),
            retry_count: 0,
            max_retry_count: 5,
            next_retry_at: initialStatus === 'queued' ? now : null,
            status: initialStatus,
            created_at: now,
            updated_at: now,
          });
        }

        if (initialStatus === 'non_retryable') summary.non_retryable++;
        else if (initialStatus === 'manual_review') summary.manual_review++;
        else summary.queued++;

        if (dryRun || !processDue || !queue || queue.status !== 'queued') continue;
        if (queue.next_retry_at && queue.next_retry_at > now) {
          summary.skipped_not_due++;
          continue;
        }

        const retryCount = Number(queue.retry_count || 0);
        const maxRetries = Number(queue.max_retry_count || 5);
        if (retryCount >= maxRetries) {
          await base44.asServiceRole.entities.CommunicationRetryQueue.update(queue.id, {
            status: 'dead_letter',
            terminal_failure_at: now,
            updated_at: now,
          });
          summary.dead_lettered++;
          continue;
        }

        await base44.asServiceRole.entities.CommunicationRetryQueue.update(queue.id, {
          status: 'retrying',
          last_retry_at: now,
          updated_at: now,
        });
        summary.retried++;

        try {
          const invokeResult = await base44.functions.invoke(retryFunction, retryPayload);
          const responseData = invokeResult?.data || invokeResult || {};
          const success = responseData.success !== false && !responseData.error;

          const correctionEvent = await base44.asServiceRole.entities.CommunicationEvent.create({
            lead_id: event.lead_id || '',
            order_id: event.order_id || '',
            client_id: event.client_id || '',
            client_project_id: event.client_project_id || '',
            channel: event.channel,
            direction: 'system',
            event_type: success ? 'provider_send_succeeded' : 'provider_send_failed',
            provider: event.provider || 'internal',
            status: success ? 'processed' : 'failed',
            error_message: success ? '' : String(responseData.error || 'Retry function reported failure'),
            metadata_json: JSON.stringify({
              recovery_request_id: requestId,
              supersedes_event_id: event.id,
              retry_queue_id: queue.id,
              retry_count: retryCount + 1,
              retry_function: retryFunction,
            }),
            environment: event.environment || 'unknown',
            dashboard_excluded: false,
            dashboard_truth_status: success ? 'trusted' : 'blocked',
          });

          if (success) {
            await base44.asServiceRole.entities.CommunicationRetryQueue.update(queue.id, {
              status: 'succeeded',
              retry_count: retryCount + 1,
              resolved_event_id: correctionEvent.id,
              last_error: '',
              updated_at: now,
            });
            summary.succeeded++;
          } else {
            const nextCount = retryCount + 1;
            const terminal = nextCount >= maxRetries;
            await base44.asServiceRole.entities.CommunicationRetryQueue.update(queue.id, {
              status: terminal ? 'dead_letter' : 'queued',
              retry_count: nextCount,
              next_retry_at: terminal ? null : nextRetryAt(nextCount),
              terminal_failure_at: terminal ? now : null,
              last_error: String(responseData.error || 'Retry function reported failure').slice(0, 1000),
              updated_at: now,
            });
            if (terminal) summary.dead_lettered++;
          }
        } catch (retryError) {
          const nextCount = retryCount + 1;
          const terminal = nextCount >= maxRetries;
          await base44.asServiceRole.entities.CommunicationRetryQueue.update(queue.id, {
            status: terminal ? 'dead_letter' : 'queued',
            retry_count: nextCount,
            next_retry_at: terminal ? null : nextRetryAt(nextCount),
            terminal_failure_at: terminal ? now : null,
            last_error: retryError.message.slice(0, 1000),
            updated_at: now,
          });
          if (terminal) summary.dead_lettered++;
        }
      } catch (eventError) {
        summary.errors.push(`${event.id}: ${eventError.message}`);
      }
    }

    if (!dryRun) {
      await base44.asServiceRole.entities.AuditLog.create({
        admin_email: user.email || 'admin',
        action: 'communication_failure_recovery_run',
        entity_name: 'CommunicationEvent',
        record_id: requestId,
        before: '{}',
        after: JSON.stringify(summary),
        timestamp: now,
        notes: 'Bounded communication recovery run. No raw message body or recipient PII included.',
      }).catch(() => null);
    }

    return json({ success: summary.errors.length === 0, dry_run: dryRun, request_id: requestId, summary });
  } catch (error) {
    console.error(`[recoverFailedCommunicationEvents] ${error.message}; request_id=${requestId}`);
    return json({ error: error.message, request_id: requestId }, 500);
  }
});
