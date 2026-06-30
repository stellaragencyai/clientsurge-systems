import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateReleaseRuntime, getReleaseProofChecklist, RELEASE_PROOF_CONFIG } from '../src/lib/releaseProof.js';

test('release proof config uses expected production identity', () => {
  assert.equal(RELEASE_PROOF_CONFIG.base44AppId, '69dc4a79656fdba136d413d3');
  assert.equal(RELEASE_PROOF_CONFIG.repoFullName, 'stellaragencyai/clientsurge-systems');
  assert.equal(RELEASE_PROOF_CONFIG.productionDomain, 'clientsurgesystems.com');
});

test('runtime is ready when production host and app id match', () => {
  const result = evaluateReleaseRuntime({
    hostname: 'clientsurgesystems.com',
    href: 'https://clientsurgesystems.com/admin?tab=launch-proof',
    appId: '69dc4a79656fdba136d413d3',
  });
  assert.equal(result.status, 'ready_for_live_proof');
  assert.equal(result.blockers.length, 0);
});

test('runtime is blocked when host does not match production', () => {
  const result = evaluateReleaseRuntime({
    hostname: 'example.com',
    href: 'https://example.com/admin',
    appId: '69dc4a79656fdba136d413d3',
  });
  assert.equal(result.status, 'blocked');
  assert.ok(result.blockers.some((item) => item.includes('Not on production domain')));
});

test('release proof checklist includes manual publish verification', () => {
  const checklist = getReleaseProofChecklist({
    runtime: evaluateReleaseRuntime({
      hostname: 'clientsurgesystems.com',
      href: 'https://clientsurgesystems.com/admin',
      appId: '69dc4a79656fdba136d413d3',
    }),
  });
  assert.ok(checklist.some((item) => item.label.includes('Base44 publish/sync')));
  assert.ok(checklist.some((item) => item.key === 'runtime_domain' && item.status === 'ready'));
});
