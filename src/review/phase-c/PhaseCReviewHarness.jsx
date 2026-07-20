import React from "react";
import CSCustomerOperationsGallery, { PHASE_C_SYSTEMS } from "@/components/customer-operations/CSCustomerOperationsGallery";
import { PHASE_C_STATE_MATRIX } from "@/components/customer-operations/phaseCFixtures";

function readReviewParams(search = window.location.search) {
  const params = new URLSearchParams(search);
  const systemKey = params.get("system") || "aiWorkforce";
  const fallbackState = systemKey === "aiWorkforce" ? "healthy" : PHASE_C_STATE_MATRIX[systemKey]?.[0];
  const stateKey = params.get("state") || fallbackState;
  const showControls = params.get("controls") !== "0";

  if (!PHASE_C_SYSTEMS[systemKey]) {
    throw new Error(`Unknown Phase C system: ${systemKey}`);
  }

  if (!PHASE_C_STATE_MATRIX[systemKey]?.includes(stateKey)) {
    throw new Error(`Unknown Phase C state for ${systemKey}: ${stateKey}`);
  }

  return { systemKey, stateKey, showControls };
}

export default function PhaseCReviewHarness() {
  const { systemKey, stateKey, showControls } = readReviewParams();

  return (
    <CSCustomerOperationsGallery
      initialSystem={systemKey}
      initialState={stateKey}
      showControls={showControls}
    />
  );
}
