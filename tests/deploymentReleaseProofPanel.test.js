import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const dashboard = fs.readFileSync('src/components/admin/LaunchProofDashboard.jsx', 'utf8');
const panel = fs.readFileSync('src/components/admin/DeploymentReleaseProofPanel.jsx', 'utf8');
const wrapper = fs.readFileSync('src/components/admin/LaunchProofDeploymentReleaseSection.jsx', 'utf8');

test('launch proof dashboard mounts deployment release proof section', () => {
  assert.match(dashboard, /LaunchProofDeploymentReleaseSection/);
  assert.match(dashboard, /evidence=\{deploymentEvidence\}/);
});

test('deployment evidence comes only from launch truth payload', () => {
  assert.match(dashboard, /data\?\.evidence\?\.deployment_release/);
  assert.match(dashboard, /data\?\.sections\?\.deployment_release/);
});

test('missing deployment values remain explicitly unverified', () => {
  assert.match(panel, /Not verified/);
  assert.match(panel, /Missing evidence remains unverified/);
});

test('wrapper forwards evidence without manufacturing defaults', () => {
  assert.match(wrapper, /evidence=\{evidence \|\| \{\}\}/);
});
