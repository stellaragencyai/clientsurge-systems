import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const indexHtmlRaw = readFileSync(join(projectRoot, 'index.html'), 'utf-8');

// Strip <script> and <style> blocks before scanning for forbidden phrases.
// The inline guard script intentionally contains these patterns (it needs
// them to DETECT and strip the generated directory). The test should only
// scan visible HTML content that a visitor or crawler would see.
const indexHtml = indexHtmlRaw
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');

// Phrases that must NEVER appear in the raw server HTML (index.html).
// These are Base44-generated directory boilerplate strings.
// "data types" and "launch gates" are specific enough to the directory
// listing to warrant prohibition even as standalone phrases.
const FORBIDDEN_HTML_PHRASES = [
  'manages 5 data types',
  'including launch gates',
  'available pages',
  'app pages',
  'organize, track, and share your work',
  'edit with base44',
  'data types',
  'launch gates',
];

// Route path segments that must NEVER appear as href values in the raw HTML.
const FORBIDDEN_ROUTE_SEGMENTS = [
  '/admin',
  '/dashboard',
  '/setup',
  '/onboarding',
  '/client-portal',
  '/client-dashboard',
  '/client-saas',
  '/dashboard-entry',
  '/reconciliation',
  '/observability',
  '/audit',
  '/functions',
  '/function',
  '/internal',
  '/private',
  '/install',
  '/deployment',
  '/mission-control',
  '/saas',
  '/saas/admin',
  '/lead-intelligence',
  '/sam',
  '/medspa-dashboard',
  '/api',
  '/base44',
  '/performance-wars',
  '/website-preview',
  '/business-setup',
  '/credentials-setup',
  '/setup-status',
  '/automation-activity',
  '/conversion-insights',
  '/system-runbook',
  '/task-status',
  '/deployment-control',
  '/automation-health',
  '/ops-verification',
  '/inbound-readiness',
  '/sprint2-blockers',
  '/saas-audit',
  '/admin/marketing',
  '/admin/leads',
  '/admin/automations',
  '/admin/onboarding',
  '/admin/install-guide',
  '/admin/ai-sales',
  '/admin/onboarding-pipeline',
  '/admin/logs',
  '/admin/opportunity-review',
  '/admin/audit',
  '/admin/reconciliation',
  '/admin/system-observability',
  '/admin/funnel-optimization',
  '/admin/conversion-insights',
  '/admin/task-status',
  '/admin/runbook',
  '/admin/automation-health',
  '/admin/ops-verification',
  '/admin/inbound-readiness',
  '/admin/sprint2-blockers',
  '/admin/saas-audit',
  '/admin/marketing',
  '/admin/automation-activity',
  '/admin/deployment-control',
];

// Approved public links that ARE allowed in the raw HTML.
const APPROVED_PUBLIC_LINKS = [
  '/',
  '/pricing',
  '/automations',
  '/industries',
  '/how-it-works',
  '/proof',
  '/contact',
  '/privacy',
  '/terms',
  '/sms-terms',
  '/refund-policy',
  '/login',
];

test('index.html raw HTML does not contain generated directory phrases', () => {
  const lowerHtml = indexHtml.toLowerCase();
  for (const phrase of FORBIDDEN_HTML_PHRASES) {
    assert.equal(
    lowerHtml.includes(phrase.toLowerCase()),
    false,
    `index.html must not contain forbidden phrase: "${phrase}"`
    );
  }
});

test('index.html raw HTML does not expose internal route names as href values', () => {
  // Extract href values from <a> tags only (not <link> tags in <head>)
  const hrefMatches = [...indexHtml.matchAll(/<a\s[^>]*href="([^"]+)"/gi)];
  const hrefs = hrefMatches.map((m) => m[1].toLowerCase());

  for (const href of hrefs) {
    // Skip external URLs
    if (href.startsWith('http') || href.startsWith('//') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      continue;
    }

    // Check if this href matches any forbidden route segment
    for (const segment of FORBIDDEN_ROUTE_SEGMENTS) {
      if (href === segment || href.startsWith(segment + '/') || href.startsWith(segment + '?')) {
        assert.fail(
          `index.html must not expose internal route "${href}" (matches forbidden segment "${segment}")`
        );
      }
    }
  }
});

test('index.html only contains approved public links in static fallback', () => {
  const hrefMatches = [...indexHtml.matchAll(/<a\s[^>]*href="([^"]+)"/gi)];
  const internalHrefs = hrefMatches
    .map((m) => m[1])
    .filter((href) => !href.startsWith('http') && !href.startsWith('//') && !href.startsWith('mailto:') && !href.startsWith('tel:'));

  for (const href of internalHrefs) {
    const normalized = href.toLowerCase().split('#')[0].split('?')[0];
    assert.equal(
      APPROVED_PUBLIC_LINKS.includes(normalized),
      true,
      `index.html contains unapproved link "${href}" — only approved public links are allowed in raw HTML`
    );
  }
});

test('index.html contains the synchronous route exposure guard script', () => {
  assert.ok(
    indexHtmlRaw.includes('RAW HTML ROUTE EXPOSURE GUARD'),
    'index.html must contain the synchronous route exposure guard script'
  );
  assert.ok(
    indexHtmlRaw.includes('clientsurge-route-exposure-guard'),
    'index.html guard must set the data-clientsurge-route-exposure-guard attribute'
  );
});

test('index.html contains CSS-based guard that hides non-fallback content before React mounts', () => {
  assert.ok(
    indexHtmlRaw.includes('html:not(.clientsurge-app-mounted) #root > *:not(.static-fallback)'),
    'index.html must contain CSS rule to hide non-static-fallback content before React mounts'
  );
});