import DeploymentReleaseProofPanel from './DeploymentReleaseProofPanel';

/**
 * Integration wrapper for launch proof surfaces.
 * Accepts only evidence returned by the launch truth provider; missing fields
 * stay visibly unverified inside DeploymentReleaseProofPanel.
 */
export default function LaunchProofDeploymentReleaseSection({ evidence }) {
  return <DeploymentReleaseProofPanel evidence={evidence || {}} />;
}
