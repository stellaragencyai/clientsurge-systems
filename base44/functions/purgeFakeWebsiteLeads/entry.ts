import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const INTERNAL_EMAILS = new Set([
  'nolanfstrommer@gmail.com',
  'stellaragencyai@gmail.com',
  'support@clientsurgesystems.com',
  'system@clientsurgesystems.com',
  'admin@clientsurgesystems.com',
  'hello@clientsurgesystems.com',
]);

const TEST_EMAIL_DOMAINS = new Set([
  'example.com', 'example.org', 'example.net', 'test.com', 'test.org',
  'fake.com', 'fake.org', 'dummy.com', 'sample.com', 'sample.org',
  'yopmail.com', 'mailinator.com', 'guerrillamail.com', 'tempmail.com',
  'throwaway.email', 'base44.com', 'base44.dev', 'clientsurge.dev',
]);

const TEST_NAME_PATTERNS = [
  /^test\b/i, /^smoke\b/i, /^demo\b/i, /^sample\b/i, /^example\b/i,
  /^fake\b/i, /^dummy\b/i, /^qa\b/i, /^debug\b/i, /^placeholder\b/i,
  /^john doe$/i, /^jane doe$/i, /^test user$/i,
];

const TEST_BUSINESS_PATTERNS = [
  /^test\b/i, /^smoke\b/i, /^demo\b/i, /^sample\b/i, /^example\b/i,
  /^fake\b/i, /^dummy\b/i, /^placeholder\b/i, /^my business$/i,
  /^test business$/i, /^demo business$/i, /^abc company$/i,
];

const TEST_TEXT_PATTERNS = [
  /smoke test/i, /test lead/i, /demo lead/i, /internal test/i,
  /qa test/i, /debug/i, /placeholder/i, /do not contact/i,
  /fabricated/i, /synthetic/i, /simulated/i,
];

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function normalizeEmail(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function digitsOnly(value: unknown) {
  return String(value || '').replace(/\D/g, '');
}

function has555555Phone(value: unknown) {
  const digits = digitsOnly(value);
  return digits.includes('555555');
}

function classifyFakeLead(lead: Record<string, any>) {
  const reasons: string[] = [];
  const email = normalizeEmail(lead.email);
  const domain = email.split('@')[1] || '';
  const phone = lead.phone_number || lead.phone || '';
  const name = String(lead.full_name || lead.first_name || lead.owner_contact_name || '').trim();
  const business = String(lead.business_name || '').trim();
  const source = String(lead.source || '').trim().toLowerCase();
  const sourcePage = String(lead.source_page || '').trim();
  const consentSource = String(lead.consent_source || '').trim();
  const text = [lead.notes, lead.description, lead.message, lead.problem, lead.call_summary]
    .filter(Boolean)
    .join(' ');

  if (has555555Phone(phone)) reasons.push('phone_contains_555555');
  if (INTERNAL_EMAILS.has(email)) reasons.push('known_internal_email');
  if (email.endsWith('@clientsurgesystems.com')) reasons.push('internal_company_domain');
  if (TEST_EMAIL_DOMAINS.has(domain)) reasons.push(`test_email_domain:${domain}`);
  if (['smoke', 'test', 'demo', 'internal', 'qa', 'debug'].includes(source)) reasons.push(`test_source:${source}`);
  if (/smoke|test|demo|internal|qa|debug/i.test(sourcePage)) reasons.push('test_source_page');
  if (/smoke|test|demo|internal|qa|debug/i.test(consentSource)) reasons.push('test_consent_source');
  if (name && TEST_NAME_PATTERNS.some((pattern) => pattern.test(name))) reasons.push('test_name_pattern');
  if (business && TEST_BUSINESS_PATTERNS.some((pattern) => pattern.test(business))) reasons.push('test_business_pattern');
  if (text && TEST_TEXT_PATTERNS.some((pattern) => pattern.test(text))) reasons.push('test_content_pattern');

  const createdBy = normalizeEmail(
    lead.created_by_email || lead.created_by || lead.created_by_user_email || lead.owner_email,
  );
  if (INTERNAL_EMAILS.has(createdBy) || createdBy.endsWith('@clientsurgesystems.com')) {
    reasons.push('created_by_internal_user');
  }

  return { is_fake: reasons.length > 0, reasons };
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return json({ error: 'Admin only', request_id: requestId }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run === true;
    const limit = Math.min(Math.max(Number(body.limit || 5000), 1), 10000);

    const leads = await base44.asServiceRole.entities.WebsiteLead.list('-created_date', limit).catch(() => []);
    const records = Array.isArray(leads) ? leads : [];
    const matches = records
      .map((lead) => ({ lead, classification: classifyFakeLead(lead) }))
      .filter((entry) => entry.classification.is_fake);

    const quarantined: Array<{ id: string; reasons: string[] }> = [];
    const failed: Array<{ id: string; reasons: string[]; error: string }> = [];

    if (!dryRun) {
      for (const entry of matches) {
        const id = entry.lead.id;
        if (!id) continue;

        try {
          await base44.asServiceRole.entities.WebsiteLead.update(id, {
            do_not_contact: true,
            quality_review_status: 'quarantined',
            quality_reason: 'Deterministic fake/test data quarantined by admin cleanup',
            quality_reason_codes: entry.classification.reasons,
            archived_at: new Date().toISOString(),
            archived_reason: 'fake_website_lead_quarantine',
          });
          quarantined.push({ id, reasons: entry.classification.reasons });
        } catch (error) {
          failed.push({
            id,
            reasons: entry.classification.reasons,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    const reasonCounts: Record<string, number> = {};
    for (const entry of matches) {
      for (const reason of entry.classification.reasons) {
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      }
    }

    await base44.asServiceRole.entities.AuditLog.create({
      admin_email: user.email || 'admin',
      action: dryRun ? 'fake_website_lead_audit' : 'fake_website_lead_quarantine',
      entity_name: 'WebsiteLead',
      record_id: requestId,
      before: JSON.stringify({ scanned: records.length }),
      after: JSON.stringify({
        matched: matches.length,
        quarantined: quarantined.length,
        failed: failed.length,
        dry_run: dryRun,
        reason_counts: reasonCounts,
      }),
      timestamp: new Date().toISOString(),
      notes: 'Deterministic fake/test lead cleanup. No lead PII is written to the audit log.',
    }).catch(() => null);

    return json({
      success: failed.length === 0,
      request_id: requestId,
      dry_run: dryRun,
      scanned: records.length,
      matched_fake_leads: matches.length,
      quarantined: quarantined.length,
      deleted: 0,
      failed: failed.length,
      reason_counts: reasonCounts,
      matched_records: matches.map(({ lead, classification }) => ({
        id: lead.id,
        created_date: lead.created_date,
        reasons: classification.reasons,
      })),
      failures: failed,
    }, failed.length > 0 ? 207 : 200);
  } catch (error) {
    console.error(`[purgeFakeWebsiteLeads] ${error instanceof Error ? error.message : String(error)} request_id=${requestId}`);
    return json({
      error: error instanceof Error ? error.message : String(error),
      request_id: requestId,
    }, 500);
  }
});
