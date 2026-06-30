import test from 'node:test';
import assert from 'node:assert/strict';
import { getWebsiteLeadOutboundSuppression, isWebsiteLeadSafeForOutbound } from '../base44/functions/_shared/outboundLeadGuards.js';

test('suppresses archived WebsiteLead records', () => {
  const result = getWebsiteLeadOutboundSuppression({ id: 'lead_1', archived: true, automation_enabled: true, lead_status: 'new' });
  assert.equal(result.suppressed, true);
  assert.ok(result.reasons.includes('archived'));
});

test('suppresses internal domains and 555 phone records', () => {
  const result = getWebsiteLeadOutboundSuppression({
    id: 'lead_2',
    email: 'qa@clientsurge-install.internal',
    phone_number: '+16025550100',
    automation_enabled: true,
    lead_status: 'new',
  });
  assert.equal(result.suppressed, true);
  assert.ok(result.reasons.includes('test_email_marker'));
  assert.ok(result.reasons.includes('reserved_phone_pattern'));
});

test('allows ordinary active WebsiteLead records', () => {
  const lead = {
    id: 'lead_3',
    email: 'owner@examplebusiness.com',
    phone_number: '+16025874608',
    business_name: 'Example Business',
    source: 'website_form',
    automation_enabled: true,
    lead_status: 'new',
    archived: false,
  };
  const result = getWebsiteLeadOutboundSuppression(lead);
  assert.equal(result.suppressed, false);
  assert.equal(isWebsiteLeadSafeForOutbound(lead), true);
});
