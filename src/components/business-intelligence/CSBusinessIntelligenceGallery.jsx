import React from "react";
import CSBusinessHealthEngine from "./CSBusinessHealthEngine";
import CSMorningBrief from "./CSMorningBrief";
import CSOpportunityCenter from "./CSOpportunityCenter";
import CSRevenueIntelligence from "./CSRevenueIntelligence";
import CSWebsiteIntelligence from "./CSWebsiteIntelligence";
import { PHASE_B_REQUIRED_STATES, phaseBFixtures } from "./phaseBFixtures";

export const PHASE_B_MODULES = {
  morningBrief: {
    label: "Morning Brief",
    Component: CSMorningBrief,
  },
  businessHealth: {
    label: "Business Health",
    Component: CSBusinessHealthEngine,
  },
  opportunityCenter: {
    label: "Opportunity Center",
    Component: CSOpportunityCenter,
  },
  revenueIntelligence: {
    label: "Revenue Intelligence",
    Component: CSRevenueIntelligence,
  },
  websiteIntelligence: {
    label: "Website Intelligence",
    Component: CSWebsiteIntelligence,
  },
};

export default function CSBusinessIntelligenceGallery({
  initialModule = "morningBrief",
  initialState = "current",
  showControls = true,
}) {
  const [moduleKey, setModuleKey] = React.useState(initialModule);
  const [stateKey, setStateKey] = React.useState(initialState);
  const module = PHASE_B_MODULES[moduleKey] || PHASE_B_MODULES.morningBrief;
  const Component = module.Component;
  const scenario = phaseBFixtures[moduleKey]?.[stateKey] || phaseBFixtures.morningBrief.current;

  return (
    <div className="cs-bi-gallery">
      {showControls ? (
        <nav className="cs-bi-section" aria-label="Phase B review controls">
          <div className="cs-bi-section__header">
            <div>
              <h2>Phase B rendered review controls</h2>
              <p>These controls render isolated fixtures only. They are not production integrations.</p>
            </div>
          </div>
          <div className="cs-bi-section__body">
            <div className="cs-bi-gallery__tabs" aria-label="Modules">
              {Object.entries(PHASE_B_MODULES).map(([key, item]) => (
                <button key={key} type="button" aria-pressed={moduleKey === key} onClick={() => setModuleKey(key)}>
                  {item.label}
                </button>
              ))}
            </div>
            <div className="cs-bi-gallery__tabs" aria-label="States">
              {PHASE_B_REQUIRED_STATES.map((state) => (
                <button key={state} type="button" aria-pressed={stateKey === state} onClick={() => setStateKey(state)}>
                  {state}
                </button>
              ))}
            </div>
          </div>
        </nav>
      ) : null}
      <Component scenario={scenario} />
    </div>
  );
}
