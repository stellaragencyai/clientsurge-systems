import React from "react";
import {
  PhaseCDeepLink,
  PhaseCSection,
  PhaseCSourceDisclosure,
  PhaseCSurface,
  RestrictedState,
  StaticFoundationNotice,
  TimelineEvent,
} from "./CSCustomerOperationsPrimitives";
import { timelineFixtures } from "./phaseCFixtures";
import { CSEmptyState } from "@/components/design-system";
import { CalendarClock } from "lucide-react";

export default function CSClientTimeline({ scenario = timelineFixtures.normal }) {
  const events = scenario.events || [];

  return (
    <PhaseCSurface scenario={scenario}>
      <div className="cs-co-layout">
        <StaticFoundationNotice />
        <PhaseCSection
          id="timeline-source-contract"
          title="Timeline source contract"
          description="Event provenance, actor, related object, and permission scope stay visible for every material event."
        >
          <PhaseCSourceDisclosure disclosure={scenario.disclosure} />
        </PhaseCSection>

        {scenario.state === "restricted" ? (
          <RestrictedState title="Timeline permission restricted" description={scenario.attention} />
        ) : null}

        <PhaseCSection
          id="client-timeline-events"
          title="Unified event timeline"
          description="Customer, human, AI, system, communication, appointment, payment, website, configuration, status, and support events keep their provenance."
          actions={<PhaseCDeepLink label="Open timeline filters" href="#timeline-filters" />}
        >
          {events.length ? (
            <div className="cs-co-timeline">
              {events.map((event) => <TimelineEvent key={event.id} event={event} />)}
            </div>
          ) : (
            <CSEmptyState
              className="cs-co-empty-state"
              icon={<CalendarClock />}
              title="No visible timeline events"
              description="The selected filter has no visible events. This is a valid empty state and does not prove no activity exists outside this scope."
              action={<PhaseCDeepLink label="Clear timeline filters" href="#timeline-clear-filters" />}
            />
          )}
        </PhaseCSection>
      </div>
    </PhaseCSurface>
  );
}
