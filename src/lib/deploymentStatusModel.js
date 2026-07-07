/**
 * deploymentStatusModel — Phase 4.5
 *
 * DEPRECATED: This module has been migrated into clientStatusLanguage.js.
 * All functions are now re-exported from there for backward compatibility.
 *
 * Please update imports to use "@/lib/clientStatusLanguage" directly.
 */
export {
  DEPLOYMENT_STATUS,
  getDeploymentDisplayStatus,
  isDeploymentActive,
  isDeploymentBlocked,
  isDeploymentLive,
  getModuleDisplayStatus,
  getModuleCardDisplay,
} from "./clientStatusLanguage";