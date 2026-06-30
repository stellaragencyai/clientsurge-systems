import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDuplicateReviewGroups,
  getDuplicateGroupKey,
  recommendDuplicateKeeper,
  scoreDuplicateKeeperCandidate,
} from '../src/lib/duplicateKeeperReview.js';

test('uses explicit group key before fallback keys', () => {
  assert.equal(getDuplicateGroupKey({ dedupe_group_key: 'phone:+16025550100', email: 'x@y.com' }), 'phone:+16025550100');
});

test('scores revenue or booking evidence above contact-only records', () => {
  const highEvidence = {
    id: 'record_a',
    business_name: 'Good Dental',
    email: 'owner@gooddental.com',
    phone: '+16025874608',
    website_url: 'https://gooddental.com',
    status: 'Booked',
  };
  const lowEvidence = {
    id: 'record_b',
    business_name: 'Good Dental',
    email: 'old@gooddental.com',
    phone: '+16025874608',
    quality_review_status: 'duplicate_candidate',
  };

  const highScore = scoreDuplicateKeeperCandidate(highEvidence).score;
  const lowScore = scoreDuplicateKeeperCandidate(lowEvidence).score;
  assert.ok(highScore > lowScore);
});

test('recommends the record with strongest evidence', () => {
  const members = [
    { id: 'a', business_name: 'A', email: 'a@test.com', quality_review_status: 'duplicate_candidate' },
    { id: 'b', business_name: 'B', email: 'b@test.com', phone: '+16025874608', website_url: 'https://b.com', crm_stage: 'Won' },
  ];
  const review = recommendDuplicateKeeper(members);
  assert.equal(review.keeper.id, 'b');
  assert.equal(review.review_required, false);
});

test('marks close-score groups as manual review required', () => {
  const members = [
    { id: 'a', business_name: 'Same Co', email: 'a@same.com', phone: '+16025874608' },
    { id: 'b', business_name: 'Same Co', email: 'b@same.com', phone: '+16025874609' },
  ];
  const review = recommendDuplicateKeeper(members);
  assert.equal(review.review_required, true);
});

test('builds grouped review records with recommendation', () => {
  const groups = buildDuplicateReviewGroups([
    { id: 'a', dedupe_group_key: 'phone:123', email: 'a@example.com' },
    { id: 'b', dedupe_group_key: 'phone:123', email: 'b@example.com', website_url: 'https://b.com' },
  ]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].groupKey, 'phone:123');
  assert.ok(groups[0].review.keeper);
});
