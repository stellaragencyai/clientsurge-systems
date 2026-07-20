import React from "react";
import CSBusinessIntelligenceGallery, { PHASE_B_MODULES } from "@/components/business-intelligence/CSBusinessIntelligenceGallery";
import { PHASE_B_REQUIRED_STATES } from "@/components/business-intelligence/phaseBFixtures";

const PHASE_B_ROUTE_MODULES = {
  "morning-brief": "morningBrief",
  "business-health": "businessHealth",
  opportunities: "opportunityCenter",
  revenue: "revenueIntelligence",
  website: "websiteIntelligence",
};

function readReviewParams(search = window.location.search) {
  const params = new URLSearchParams(search);
  const routeKey = window.location.pathname.split("/").filter(Boolean).at(-1);
  const routeModule = PHASE_B_ROUTE_MODULES[routeKey];
  const moduleKey = params.get("module") || routeModule || "morningBrief";
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
