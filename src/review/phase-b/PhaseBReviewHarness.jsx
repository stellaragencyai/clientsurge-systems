import React from "react";
import CSBusinessIntelligenceGallery, { PHASE_B_MODULES } from "@/components/business-intelligence/CSBusinessIntelligenceGallery";
import { PHASE_B_REQUIRED_STATES } from "@/components/business-intelligence/phaseBFixtures";

function readReviewParams(search = window.location.search) {
  const params = new URLSearchParams(search);
  const moduleKey = params.get("module") || "morningBrief";
  const stateKey = params.get("state") || "current";
  const showControls = params.get("controls") !== "0";

  if (!PHASE_B_MODULES[moduleKey]) {
    throw new Error(`Unknown Phase B module: ${moduleKey}`);
  }

  if (!PHASE_B_REQUIRED_STATES.includes(stateKey)) {
    throw new Error(`Unknown Phase B state: ${stateKey}`);
  }

  return { moduleKey, stateKey, showControls };
}

export default function PhaseBReviewHarness() {
  const { moduleKey, stateKey, showControls } = readReviewParams();

  return (
    <CSBusinessIntelligenceGallery
      initialModule={moduleKey}
      initialState={stateKey}
      showControls={showControls}
    />
  );
}
