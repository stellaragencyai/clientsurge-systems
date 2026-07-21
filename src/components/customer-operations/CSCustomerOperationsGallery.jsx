import React from "react";
import CSAIWorkforceOS from "./CSAIWorkforceOS";
import CSClientTimeline from "./CSClientTimeline";
import CSCommunicationCenter from "./CSCommunicationCenter";
import CSCustomerSuccessWorkspace from "./CSCustomerSuccessWorkspace";
import { PHASE_C_STATE_MATRIX, phaseCFixtures } from "./phaseCFixtures";

export const PHASE_C_SYSTEMS = {
  aiWorkforce: {
    label: "AI Workforce OS",
    Component: CSAIWorkforceOS,
  },
  clientTimeline: {
    label: "Client Timeline",
    Component: CSClientTimeline,
  },
  communicationCenter: {
    label: "Communication Center",
    Component: CSCommunicationCenter,
  },
  customerSuccess: {
    label: "Customer Success Workspace",
    Component: CSCustomerSuccessWorkspace,
  },
};

export default function CSCustomerOperationsGallery({
  initialSystem = "aiWorkforce",
  initialState = "healthy",
  showControls = true,
}) {
  const [systemKey, setSystemKey] = React.useState(initialSystem);
  const validState = PHASE_C_STATE_MATRIX[systemKey]?.includes(initialState)
    ? initialState
    : PHASE_C_STATE_MATRIX[systemKey]?.[0];
  const [stateKey, setStateKey] = React.useState(validState);
  const system = PHASE_C_SYSTEMS[systemKey] || PHASE_C_SYSTEMS.aiWorkforce;
  const Component = system.Component;
  const states = PHASE_C_STATE_MATRIX[systemKey] || PHASE_C_STATE_MATRIX.aiWorkforce;
  const scenario = phaseCFixtures[systemKey]?.[stateKey] || phaseCFixtures.aiWorkforce.healthy;

  function chooseSystem(nextSystem) {
    setSystemKey(nextSystem);
    setStateKey(PHASE_C_STATE_MATRIX[nextSystem][0]);
  }

  return (
    <div className="cs-co-gallery">
      {showControls ? (
        <nav className="cs-co-review-controls" aria-label="Phase C review controls">
          <div>
            <h2>Phase C rendered review controls</h2>
            <p>Controls switch committed static fixtures only. No production data, live adapter, or production route is mounted.</p>
          </div>
          <div className="cs-co-review-controls__group" aria-label="Systems">
            {Object.entries(PHASE_C_SYSTEMS).map(([key, item]) => (
              <button key={key} type="button" aria-pressed={systemKey === key} onClick={() => chooseSystem(key)}>
                {item.label}
              </button>
            ))}
          </div>
          <div className="cs-co-review-controls__group" aria-label="States">
            {states.map((state) => (
              <button key={state} type="button" aria-pressed={stateKey === state} onClick={() => setStateKey(state)}>
                {state.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </nav>
      ) : null}
      <Component scenario={scenario} />
    </div>
  );
}
