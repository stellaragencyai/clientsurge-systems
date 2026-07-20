import { PHASE_C_ADAPTER_BOUNDARIES } from "../data/phaseCReviewFixtures.js";

export const PHASE_C_ADAPTER_STATUS = {
  FIXTURE_CONTRACT_ONLY: "fixture_contract_only",
  LIVE_DISABLED: "live_disabled",
};

export function listPhaseCAdapterBoundaries() {
  return PHASE_C_ADAPTER_BOUNDARIES.map((boundary) => ({
    ...boundary,
    liveEnabled: false,
  }));
}

export function getPhaseCAdapterBoundary(contract) {
  return listPhaseCAdapterBoundaries().find((boundary) => boundary.contract === contract) || null;
}

export function validatePhaseCAdapterRecord(contract, record) {
  const boundary = getPhaseCAdapterBoundary(contract);
  if (!boundary) {
    return {
      ok: false,
      missingFields: [],
      error: "Unknown Phase C adapter contract.",
    };
  }

  const missingFields = boundary.requiredReturnFields.filter((field) => record?.[field] === undefined);

  return {
    ok: missingFields.length === 0,
    missingFields,
    contract: boundary.contract,
    status: boundary.status,
  };
}

export function assertPhaseCAdapterIsFixtureOnly(contract) {
  const boundary = getPhaseCAdapterBoundary(contract);
  if (!boundary) {
    throw new Error(`Unknown Phase C adapter contract: ${contract}`);
  }
  if (boundary.status !== PHASE_C_ADAPTER_STATUS.FIXTURE_CONTRACT_ONLY) {
    throw new Error(`Phase C adapter ${contract} is not fixture-only.`);
  }
  return true;
}
