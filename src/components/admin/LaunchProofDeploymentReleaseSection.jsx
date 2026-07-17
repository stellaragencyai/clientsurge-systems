import DeploymentReleaseProofPanel from './DeploymentReleaseProofPanel';

/**
 * Integration wrapper for launch proof surfaces.
 * Keeps deployment evidence separate from launch gates until the
 * parent dashboard imports this section.
 */
export default function LaunchProofDeploymentReleaseSection() {
  return <DeploymentReleaseProofPanel />;
}
