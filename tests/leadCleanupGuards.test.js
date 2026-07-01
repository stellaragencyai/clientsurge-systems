import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getLeadCleanupEligibility,
  isLeadVisibleInSalesViews,
} from '../src/lib/leadCleanupGuards.js';

test('runtime verification leads are hidden from trusted sales views', () => {
  const lead = {
    full_name: 'Test Owner',
    business_name: 'fdsfdsf',
    email: 'test-intake-validate@clientsurge.test',
    phone: '6025550100',
    source: 'landing_page',
    source_page: '/start?verification=email-template-runtime-suppressed-20260701T021356Z',
    status: 'Contacted',
    crm_stage: 'Not Contacted',
    lead_state: 'NEW',
    quality_review_status: 'active',
  };

  assert.equal(isLeadVisibleInSalesViews(lead), false);
});

test('quarantined booked QA leads stay hidden', () => {
  const lead = {
    full_name: 'Nolan F Strommer',
    business_name: 'DOitnow',
    email: 'qa-lead@clientsurge.test',
    phone: '+16025874608',
    status: 'Booked',
    crm_stage: 'Not Contacted',
    lead_state: 'NEW',
    quality_review_status: 'quarantined',
  };

  assert.equal(isLeadVisibleInSalesViews(lead), false);
  assert.equal(getLeadCleanupEligibility(lead).eligible, true);
});

test('commercial proof blocks cleanup eligibility', () => {
  const lead = {
    full_name: 'Real Customer',
    business_name: 'Real Co',
    email: 'qa-lead@clientsurge.test',
    phone: '6025550100',
    payment_source: 'stripe',
    order_id: 'ord_123',
    quality_review_status: 'active',
  };

  assert.equal(getLeadCleanupEligibility(lead).eligible, false);
});
