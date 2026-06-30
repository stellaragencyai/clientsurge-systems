import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateOutreachReadiness, summarizeOutreachReadiness } from '../src/lib/outreachReadiness.js';

test('marks complete active lead as ready', () => {
  const result = evaluateOutreachReadiness({
    id: 'lead_ready',
    business_name: 'Ready Dental',
    email: 'owner@readydental.com',
    phone: '+16025874608',
    website_url: 'https://readydental.com',
    city: 'Phoenix',
    state: 'AZ',
    quality_review_status: 'active',
  });
  assert.equal(result.status, 'ready');
});

test('marks incomplete real lead as needs verification', () => {
  const result = evaluateOutreachReadiness({
    id: 'lead_verify',
    business_name: 'Verify Dental',
    email: 'owner@verifydental.com',
    quality_review_status: 'active',
  });
  assert.equal(result.status, 'needs_verification');
  assert.ok(result.warnings.includes('missing website'));
});

test('blocks duplicate review candidates', () => {
  const result = evaluateOutreachReadiness({
    id: 'lead_blocked',
    business_name: 'Blocked Dental',
    email: 'owner@blockeddental.com',
    phone: '+16025874608',
    quality_review_status: 'duplicate_candidate',
  });
  assert.equal(result.status, 'blocked');
  assert.ok(result.blockers.includes('duplicate review required'));
});

test('blocks opt-out records', () => {
  const result = evaluateOutreachReadiness({
    id: 'lead_optout',
    business_name: 'Opt Out Dental',
    email: 'owner@optoutdental.com',
    phone: '+16025874608',
    website_url: 'https://optoutdental.com',
    city: 'Phoenix',
    state: 'AZ',
    do_not_contact: true,
  });
  assert.equal(result.status, 'blocked');
  assert.ok(result.blockers.includes('do-not-contact or opt-out flag'));
});

test('summarizes queue buckets', () => {
  const summary = summarizeOutreachReadiness([
    { id: 'ready', business_name: 'Ready', email: 'r@x.com', phone: '+16025874608', website_url: 'https://x.com', city: 'Phoenix', state: 'AZ', quality_review_status: 'active' },
    { id: 'verify', business_name: 'Verify', email: 'v@x.com', quality_review_status: 'active' },
    { id: 'blocked', business_name: 'Blocked', email: 'b@x.com', quality_review_status: 'duplicate_candidate' },
  ]);
  assert.equal(summary.ready.length, 1);
  assert.equal(summary.needs_verification.length, 1);
  assert.equal(summary.blocked.length, 1);
});
