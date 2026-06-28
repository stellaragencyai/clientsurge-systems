import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ALLOWED_EVENT_TYPES = new Set([
  'page_view',
  'scroll_depth',
  'cta_click',
  'pricing_view',
  'checkout_click',
  'form_submit',
  'demo_booking_click',
]);

const ALLOWED_PAGE_KEYS = new Set([
  'homepage',
  'pricing',
  'store',
  'product_signup',
  'start',
  'automations',
  'industries',
  'contact',
  'about',
  'med_spa',
  'dental',
  'hvac',
  'roofing',
  'contractors',
  'real_estate',
  'personal_injury',
  'plumbing',
  'chiropractic',
]);

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type, authorization',
    },
  });
}

function cleanString(value: unknown, max = 180) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

function cleanMetadata(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const metadata = input as Record<string, unknown>;
  return {
    device_type: cleanString(metadata.device_type, 20),
    browser: cleanString(metadata.browser, 40),
    utm_source: cleanString(metadata.utm_source, 100),
    utm_medium: cleanString(metadata.utm_medium, 100),
    utm_campaign: cleanString(metadata.utm_campaign, 100),
    utm_content: cleanString(metadata.utm_content, 100),
    referrer: cleanString(metadata.referrer, 300),
    destination: cleanString(metadata.destination, 300),
    scroll_depth: typeof metadata.scroll_depth === 'number' ? Math.max(0, Math.min(100, Math.round(metadata.scroll_depth))) : undefined,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return json({ ok: true });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const eventType = cleanString(body.event_type, 80);
    const pageKey = cleanString(body.page_key, 80);
    const eventId = cleanString(body.event_id, 120) || `conv_${crypto.randomUUID()}`;
    const sessionId = cleanString(body.session_id, 160);

    if (!eventType || !ALLOWED_EVENT_TYPES.has(eventType)) {
      return json({ error: 'Invalid event_type' }, 400);
    }
    if (!pageKey || !ALLOWED_PAGE_KEYS.has(pageKey)) {
      return json({ error: 'Invalid page_key' }, 400);
    }
    if (!sessionId) {
      return json({ error: 'Missing session_id' }, 400);
    }

    const record = await base44.asServiceRole.entities.ConversionTrackingEvent.create({
      event_id: eventId,
      session_id: sessionId,
      page_key: pageKey,
      event_type: eventType,
      event_label: cleanString(body.event_label, 180),
      timestamp: cleanString(body.timestamp, 80) || new Date().toISOString(),
      metadata: cleanMetadata(body.metadata),
    });

    return json({ success: true, record_id: record?.id || null });
  } catch (error) {
    console.error('[recordConversionTrackingEvent]', error);
    return json({ error: 'Tracking event could not be recorded' }, 500);
  }
});
