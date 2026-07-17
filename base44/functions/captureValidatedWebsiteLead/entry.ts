import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const TEST_DOMAINS = new Set([
  'example.com','example.org','example.net','test.com','test.org','fake.com','fake.org',
  'dummy.com','sample.com','mailinator.com','yopmail.com','guerrillamail.com','tempmail.com',
  'base44.com','base44.dev','clientsurge.dev','clientsurgesystems.com'
]);
const TEST_TEXT = /\b(test|testing|smoke|demo|fake|dummy|sample|placeholder|qa|debug|synthetic|fabricated|simulated|do not contact)\b/i;

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
async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const normalizedEmail = email(body.email);
    const normalizedPhone = digits(body.phone_number || body.phone);
    const normalizedHost = hostname(body.business_website_url || body.website_url);
    const emailDomain = domain(normalizedEmail);
    const text = [body.full_name, body.first_name, body.business_name, body.message, body.problem, body.description, body.source, body.source_page, body.consent_source].map(clean).join(' ');
    const reasonCodes: string[] = [];

    if (normalizedPhone.includes('555555')) reasonCodes.push('phone_555555_pattern');
    if (emailDomain && TEST_DOMAINS.has(emailDomain)) reasonCodes.push(`test_email_domain:${emailDomain}`);
    if (TEST_TEXT.test(text)) reasonCodes.push('explicit_test_marker');
    if (['test','smoke','demo','internal','qa','debug'].includes(clean(body.environment).toLowerCase())) reasonCodes.push('non_production_environment');
    if (['test','smoke','demo','internal','qa','debug'].includes(clean(body.source).toLowerCase())) reasonCodes.push('test_source');
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
        environment: clean(body.environment) || 'unknown',
        reason_codes: reasonCodes,
        email_domain: emailDomain,
        phone_suffix: normalizedPhone.slice(-4),
        ip_hash: ip ? await sha256(ip) : '',
        user_agent_family: clean(req.headers.get('user-agent')).slice(0, 120),
        rejected_at: new Date().toISOString(),
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
    const now = new Date().toISOString();

    if (existing?.[0]?.id) {
      const lead = existing[0];
      const submissionCount = Number(lead.submission_count || 1) + 1;
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
        submission_count: submissionCount,
        last_submission_at: now,
      });
      return json({ success: true, duplicate: true, request_id: requestId, lead_id: updated.id, submission_count: submissionCount });
    }

    const created = await base44.asServiceRole.entities.WebsiteLead.create({
      ...body,
      email: normalizedEmail,
      phone_number: normalizedPhone,
      business_website_url: normalizedHost,
      dedup_key: dedupKey,
      submission_count: 1,
      first_submission_at: now,
      last_submission_at: now,
      lead_quality: 'unreviewed',
      follow_up_priority: 'normal',
      environment: clean(body.environment) || 'production',
      dashboard_excluded: false,
      dashboard_truth_status: 'unknown',
    });

    return json({ success: true, duplicate: false, request_id: requestId, lead_id: created.id }, 201);
  } catch (error) {
    console.error(`[captureValidatedWebsiteLead] ${error.message}; request_id=${requestId}`);
    return json({ error: error.message, request_id: requestId }, 500);
  }
});
