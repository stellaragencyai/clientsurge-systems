import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ALLOWED_PAGE_KEYS = new Set([
  'homepage','med_spa','dental','hvac','roofing','contractors','real_estate',
  'personal_injury','plumbing','chiropractic','pricing'
]);
const ALLOWED_EVENT_TYPES = new Set([
  'page_view','scroll_depth','cta_click','pricing_view','checkout_click','form_submit','demo_booking_click'
]);

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function resolveEnvironment(req: Request, requested: unknown) {
  const explicit = String(requested || '').trim().toLowerCase();
  if (['production','qa','smoke','demo','internal'].includes(explicit)) return explicit;
  const host = new URL(req.url).hostname.toLowerCase();
  if (host.includes('localhost') || host.includes('127.0.0.1')) return 'internal';
  if (host.includes('smoke') || host.includes('test')) return 'smoke';
  if (host.includes('staging') || host.includes('preview')) return 'qa';
  return 'production';
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed', request_id: requestId }, 405);
    const body = await req.json().catch(() => ({}));
    const eventId = String(body.event_id || '').trim();
    const sessionId = String(body.session_id || '').trim();
    const pageKey = String(body.page_key || '').trim();
    const eventType = String(body.event_type || '').trim();
    const timestamp = String(body.timestamp || '').trim();

    if (!eventId || !sessionId || !pageKey || !eventType || !timestamp) {
      return json({ error: 'Missing required conversion event fields', request_id: requestId }, 400);
    }
    if (!ALLOWED_PAGE_KEYS.has(pageKey) || !ALLOWED_EVENT_TYPES.has(eventType)) {
      return json({ error: 'Unsupported conversion event', request_id: requestId }, 400);
    }
    if (Number.isNaN(Date.parse(timestamp))) {
      return json({ error: 'Invalid timestamp', request_id: requestId }, 400);
    }

    const base44 = createClientFromRequest(req);
    const existing = await base44.asServiceRole.entities.ConversionTrackingEvent.filter(
      { event_id: eventId }, '-created_date', 1
    ).catch(() => []);
    if (existing?.[0]) {
      return json({ success: true, duplicate: true, event_id: eventId, record_id: existing[0].id, request_id: requestId });
    }

    const environment = resolveEnvironment(req, body.environment);
    const dashboardExcluded = environment !== 'production';
    const metadata = body.metadata && typeof body.metadata === 'object' ? body.metadata : {};
    const releaseVersion = String(body.release_version || Deno.env.get('RELEASE_VERSION') || Deno.env.get('GIT_COMMIT_SHA') || 'unversioned');

    const created = await base44.asServiceRole.entities.ConversionTrackingEvent.create({
      event_id: eventId,
      session_id: sessionId,
      client_id: String(body.client_id || ''),
      client_project_id: String(body.client_project_id || ''),
      page_key: pageKey,
      page_url: String(body.page_url || ''),
      route: String(body.route || ''),
      event_type: eventType,
      event_label: String(body.event_label || eventType).slice(0, 250),
      timestamp,
      consent_state: String(body.consent_state || 'unknown'),
      release_version: releaseVersion,
      tracking_version: String(body.tracking_version || '2.0.0'),
      environment,
      dashboard_excluded: dashboardExcluded,
      dashboard_exclusion_reason: dashboardExcluded ? `non_production_environment:${environment}` : '',
      dashboard_truth_status: dashboardExcluded ? 'excluded' : 'trusted',
      metadata,
    });

    return json({ success: true, duplicate: false, event_id: eventId, record_id: created.id, request_id: requestId }, 201);
  } catch (error) {
    return json({ error: error?.message || 'Conversion capture failed', request_id: requestId }, 500);
  }
});
