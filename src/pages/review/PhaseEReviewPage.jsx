import { Navigate } from "react-router-dom";
import {
  AcceptanceChecklist,
  ActionList,
  ComponentInventory,
  InterruptionGrid,
  KeyboardModel,
  LifecycleTimeline,
  PhaseEReviewShell,
  SourceSemantics,
  StateCoverage,
  ValidationSummary,
} from "@/components/review/phase-e/PhaseEReviewComponents";
import {
  PHASE_E_ROUTES,
  getPhaseERoute,
  getPhaseESection,
} from "@/lib/phaseELifecycleFoundation";

export default function PhaseEReviewPage({ sectionId = "onboarding" }) {
  const route = getPhaseERoute(sectionId);
  const section = getPhaseESection(sectionId);

  if (!PHASE_E_ROUTES.some((item) => item.id === sectionId)) {
    return <Navigate to="/review/phase-e/onboarding" replace />;
  }

  return (
    <PhaseEReviewShell route={route} section={section}>
      <SourceSemantics semantics={section.sourceSemantics} />
      <LifecycleTimeline section={section} />
      <ComponentInventory sectionId={route.id} />
      <KeyboardModel keyboard={section.keyboard} />
      <InterruptionGrid interruptions={section.interruptions} />
      <ActionList actions={section.actions} />
      <StateCoverage states={section.states} />
      <ValidationSummary route={route} />
      <AcceptanceChecklist section={section} />
    </PhaseEReviewShell>
  );
}
