const REQUIRED_RELEASE_MARKERS = [
  { key: 'github_repo', label: 'GitHub Source Repo', expected: 'stellaragencyai/clientsurge-systems' },
  { key: 'default_branch', label: 'Default Branch', expected: 'main' },
  { key: 'base44_app_id', label: 'Base44 Production App ID', expected: '69dc4a79656fdba136d413d3' },
  { key: 'production_domain', label: 'Production Domain', expected: 'clientsurgesystems.com' },
  { key: 'admin_release_panel', label: 'Admin Release Proof Panel', expected: 'present' },
  { key: 'release_gate', label: 'ClientSurge Release Gate', expected: 'required before publish' },
  { key: 'base44_sync_control', label: 'Base44 Sync Control', expected: 'required before publish' },
  { key: 'production_release_proof', label: 'Production Release Proof Command', expected: 'npm run proof:production-release -- --expected-sha=<main-sha>' },
];

const REQUIRED_MANUAL_PROOF = [
  'Confirm GitHub main has green ClientSurge Release Gate.',
  'Confirm Base44 publish/sync ran after the target merge commit.',
  'Run npm run proof:production-release with the target main SHA and save the generated report.',
  'Confirm live admin contains this Release Proof panel.',
  'Confirm Data Quality dashboard contains CRM Data Quality and Automation Evidence Cards.',
  'Run a real public route smoke check against https://clientsurgesystems.com.',
  'Capture desktop and mobile screenshots after hard refresh.',
];

export const RELEASE_PROOF_CONFIG = {
  appName: 'ClientSurge Systems',
  base44AppId: '69dc4a79656fdba136d413d3',
  repoFullName: 'stellaragencyai/clientsurge-systems',
  defaultBranch: 'main',
  productionDomain: 'clientsurgesystems.com',
  productionUrl: 'https://clientsurgesystems.com',
  proofCommand: 'npm run proof:production-release -- --expected-sha=<main-sha>',
  proofRunbook: 'docs/PRODUCTION_RELEASE_PROOF_RUNBOOK.md',
  requiredMarkers: REQUIRED_RELEASE_MARKERS,
  requiredManualProof: REQUIRED_MANUAL_PROOF,
};

export function evaluateReleaseRuntime({ hostname = '', href = '', appId = RELEASE_PROOF_CONFIG.base44AppId } = {}) {
  const normalizedHost = String(hostname || '').toLowerCase();
  const normalizedHref = String(href || '').toLowerCase();
  const onProductionDomain = normalizedHost === RELEASE_PROOF_CONFIG.productionDomain || normalizedHost === `www.${RELEASE_PROOF_CONFIG.productionDomain}`;
  const appIdMatches = String(appId || '') === RELEASE_PROOF_CONFIG.base44AppId;
  const usesHttps = normalizedHref.startsWith('https://') || normalizedHost === 'localhost';

  const blockers = [];
  if (!onProductionDomain && normalizedHost) blockers.push(`Not on production domain: ${hostname}`);
  if (!appIdMatches) blockers.push('Base44 app ID does not match production app ID.');
  if (!usesHttps) blockers.push('Current URL is not HTTPS.');

  return {
    onProductionDomain,
    appIdMatches,
    usesHttps,
    status: blockers.length === 0 ? 'ready_for_live_proof' : 'blocked',
    blockers,
  };
}

export function getReleaseProofChecklist({ runtime = null } = {}) {
  const runtimeStatus = runtime || evaluateReleaseRuntime({});
  return [
    ...RELEASE_PROOF_CONFIG.requiredMarkers.map((marker) => ({
      ...marker,
      status: 'expected',
      evidence: marker.expected,
    })),
    ...RELEASE_PROOF_CONFIG.requiredManualProof.map((label) => ({
      key: label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
      label,
      expected: 'manual verification required',
      status: 'manual',
      evidence: 'Not automatic in browser; verify during release.',
    })),
    {
      key: 'runtime_domain',
      label: 'Current Runtime Domain',
      expected: RELEASE_PROOF_CONFIG.productionDomain,
      status: runtimeStatus.onProductionDomain ? 'ready' : 'blocked',
      evidence: runtimeStatus.onProductionDomain ? 'Current browser host matches production domain.' : runtimeStatus.blockers.join('; ') || 'Runtime not evaluated.',
    },
  ];
}
