import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const TEST_DOMAINS = new Set([
  'example.com','example.org','example.net','test.com','test.org','fake.com','fake.org',
  'dummy.com','sample.com','mailinator.com','yopmail.com','guerrillamail.com','tempmail.com',
  'base44.com','base44.dev','clientsurge.dev','clientsurgesystems.com'
]);
const TEST_TEXT = /\b(test|testing|smoke|demo|fake|dummy|sample|placeholder|qa|debug|synthetic|fabricated|simulated|do not contact)\b/i;
const NON_PRODUCTION = new Set(['test','smoke','demo','internal','qa','debug']);

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}
function clean(v: unknown) { return String(v ?? '').trim(); }
function email(v: unknown) { return clean(v).toLowerCase(); }
function digits(v: unknown) { return clean(v).replace(/\D/g, ''); }
function domain(v: string) { return v.includes('@') ? v.split('@').pop() || '' : ''; }
function hostname(v: unknown) {
  const raw = clean(v).toLowerCase();
  if (!raw) return '';
  try { return new URL(raw.startsWith('http') ? raw : `https://${raw}`).hostname.replace(/^www\./, ''); }
  catch { return raw.replace(/^www\./, '').split('/')[0]; }
}
function resolveEnvironment(req: Request, requested: unknown) {
  const explicit = clean(requested).toLowerCase();
  if (['production','qa','smoke','demo','internal'].includes(explicit)) return explicit;
  const host = new URL(req.url).hostname.toLowerCase();
  if (host.includes('localhost') || host.includes('127.0.0.1')) return 'internal';
  if (host.includes('smoke') || host.includes('test')) return 'smoke';
  if (host.includes('staging') || host.includes('preview')) return 'qa';
  return 'production';
}
async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  const now = new Date().toISOString();
  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed', request_id: requestId }, 405);
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const normalizedEmail = email(body.email);
    const normalizedPhone = digits(body.phone_number || body.phone);
    const normalizedHost = hostname(body.business_website_url || body.website_url);
    const emailDomain = domain(normalizedEmail);
    const environment = resolveEnvironment(req, body.environment);
    const text = [body.full_name, body.first_name, body.business_name, body.message, body.problem, body.description, body.source, body.source_page, body.consent_source].map(clean).join(' ');
    const reasonCodes: string[] = [];

    if (normalizedPhone.includes('555555')) reasonCodes.push('phone_555555_pattern');
    if (emailDomain && TEST_DOMAINS.has(emailDomain)) reasonCodes.push(`test_email_domain:${emailDomain}`);
    if (TEST_TEXT.test(text)) reasonCodes.push('explicit_test_marker');
    if (NON_PRODUCTION.has(clean(body.environment).toLowerCase())) reasonCodes.push('non_production_environment');
    if (NON_PRODUCTION.has(clean(body.source).toLowerCase())) reasonCodes.push('test_source');
    if (normalizedEmail.endsWith('@clientsurgesystems.com')) reasonCodes.push('internal_clientsurge_email');

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '';
    if (reasonCodes.length) {
      const retention = new Date();
      retention.setDate(retention.getDate() + 30);
      await base44.asServiceRole.entities.RejectedLeadAttempt.create({
        request_id: requestId,
        client_id: clean(body.client_id),
        client_project_id: clean(body.client_project_id),
        source: clean(body.source),
        source_page: clean(body.source_page),
        environment,
        reason_codes: reasonCodes,
        email_domain: emailDomain,
        phone_suffix: normalizedPhone.slice(-4),
        ip_hash: ip ? await sha256(ip) : '',
        user_agent_family: clean(req.headers.get('user-agent')).slice(0, 120),
        rejected_at: now,
        retention_delete_after: retention.toISOString(),
      });
      return json({ success: false, rejected: true, request_id: requestId, reason_codes: reasonCodes }, 422);
    }

    if (!normalizedEmail && !normalizedPhone) return json({ error: 'A valid email or phone number is required.', request_id: requestId }, 400);
    if ((body.requested_channels || []).includes('sms') && body.consent_given !== true) {
      return json({ error: 'SMS consent is required when SMS is requested.', request_id: requestId }, 400);
    }

    const dedupKey = await sha256([normalizedEmail, normalizedPhone, normalizedHost, clean(body.client_id), clean(body.client_project_id)].join('|'));
    const existing = await base44.asServiceRole.entities.WebsiteLead.filter({ dedup_key: dedupKey }, '-created_date', 1).catch(() => []);

    if (existing?.[0]?.id) {
      const lead = existing[0];
      const updated = await base44.asServiceRole.entities.WebsiteLead.update(lead.id, {
        full_name: clean(body.full_name) || lead.full_name,
        first_name: clean(body.first_name) || lead.first_name,
        phone_number: normalizedPhone || lead.phone_number,
        email: normalizedEmail || lead.email,
        business_name: clean(body.business_name) || lead.business_name,
        business_website_url: normalizedHost || lead.business_website_url,
        message: clean(body.message) || lead.message,
        source: clean(body.source) || lead.source,
        source_page: clean(body.source_page) || lead.source_page,
        requested_channels: Array.from(new Set([...(lead.requested_channels || []), ...(body.requested_channels || [])])),
        submission_count: Math.max(1, Number(lead.submission_count || 1)) + 1,
        first_submission_at: lead.first_submission_at || lead.created_date || now,
        last_submission_at: now,
        environment: lead.environment || environment,
        dashboard_excluded: lead.dashboard_excluded === true,
        dashboard_truth_status: lead.dashboard_truth_status || 'trusted',
        capture_version: '2.0.0',
      });
      return json({ success: true, duplicate: true, request_id: requestId, lead_id: updated.id, submission_count: updated.submission_count });
    }

    const dashboardExcluded = environment !== 'production';
    const created = await base44.asServiceRole.entities.WebsiteLead.create({
      ...body,
      email: normalizedEmail,
      phone_number: normalizedPhone,
      business_website_url: normalizedHost,
      dedup_key: dedupKey,
      lead_quality: 'unreviewed',
      follow_up_priority: 'normal',
      quality_reason_codes: [],
      submission_count: 1,
      first_submission_at: now,
      last_submission_at: now,
      environment,
      dashboard_excluded: dashboardExcluded,
      dashboard_exclusion_reason: dashboardExcluded ? `non_production_environment:${environment}` : '',
      dashboard_truth_status: dashboardExcluded ? 'excluded' : 'trusted',
      capture_version: '2.0.0',
    });

    return json({ success: true, duplicate: false, request_id: requestId, lead_id: created.id, submission_count: 1 }, 201);
  } catch (error) {
    console.error(`[captureValidatedWebsiteLead] ${error.message}; request_id=${requestId}`);
    return json({ error: error.message, request_id: requestId }, 500);
  }
});
