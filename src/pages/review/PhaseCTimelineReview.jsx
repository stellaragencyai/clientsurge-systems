import {
  Activity,
  Bot,
  CalendarClock,
  CreditCard,
  Globe,
  MessageSquare,
  Settings,
  User,
  Users,
} from "lucide-react";
import {
  TIMELINE_EVENT_TYPE_LABELS,
  TIMELINE_EVENT_TYPES,
  phaseCTimeline,
} from "@/data/phaseCReviewFixtures";
import {
  ContractPill,
  DeepLink,
  DefinitionList,
  PhaseCReviewShell,
  ReviewCard,
  SectionHeader,
  SourceDisclosure,
  formatDateTime,
} from "@/components/review/phase-c/PhaseCReviewComponents";

const EVENT_ICONS = {
  customer: User,
  ai: Bot,
  human: Users,
  communication: MessageSquare,
  appointment: CalendarClock,
  payment: CreditCard,
  website: Globe,
  system: Activity,
  configuration: Settings,
};

function EventTypeMatrix() {
  const counts = phaseCTimeline.events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {TIMELINE_EVENT_TYPES.map((type) => {
        const Icon = EVENT_ICONS[type] || Activity;
        return (
          <div key={type} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-[#0f2d52] text-white">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-950">{TIMELINE_EVENT_TYPE_LABELS[type]}</p>
                <p className="text-xs text-slate-500">{counts[type] || 0} fixture event</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProvenancePanel({ event }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <ContractPill label="Provenance" value="Unflattened" tone="reported" />
        <ContractPill label="Visibility" value={event.provenance.visibility} tone="reported" />
      </div>
      <DefinitionList
        columns="lg:grid-cols-3"
        items={[
          { label: "Raw reference", value: event.provenance.rawReference },
          { label: "Ingestion timestamp", value: formatDateTime(event.provenance.ingestionTimestamp) },
          { label: "Transformed by", value: event.provenance.transformedBy },
          { label: "Correction of", value: event.provenance.correctionOf || "None" },
          { label: "Superseded by", value: event.provenance.supersededBy || "None" },
        ]}
      />
    </div>
  );
}

function TimelineEventCard({ event }) {
  const Icon = EVENT_ICONS[event.type] || Activity;
  return (
    <ReviewCard
      id={event.id}
      title={event.summary}
      subtitle={`${TIMELINE_EVENT_TYPE_LABELS[event.type]} event - ${formatDateTime(event.timestamp)}`}
      icon={Icon}
      badge={<ContractPill label="Verification" value={event.verification} tone={event.verification} />}
    >
      <div className="grid gap-4">
        <DefinitionList
          columns="lg:grid-cols-3"
          items={[
            { label: "Actor", value: event.actor },
            { label: "Timestamp", value: formatDateTime(event.timestamp) },
            { label: "Source", value: event.source.name },
            { label: "Verification", value: event.verification },
            { label: "Related object", value: `${event.relatedObject.type}: ${event.relatedObject.label}` },
            { label: "Related object ID", value: event.relatedObject.id },
          ]}
        />

        <SourceDisclosure source={event.source} />
        <ProvenancePanel event={event} />

        <div>
          <DeepLink to={event.deepLink}>Open deep link</DeepLink>
        </div>
      </div>
    </ReviewCard>
  );
}

export default function PhaseCTimelineReview() {
  const { events } = phaseCTimeline;

  return (
    <PhaseCReviewShell
      activeKey="timeline"
      eyebrow="Phase C Customer + AI Operations"
      title="Client Timeline"
      summary="A unified timeline review route for customer, AI, human, communication, appointment, payment, website, system, and configuration events. Actor, timestamp, source, verification, summary, related object, deep link, and provenance remain separate."
    >
      <section aria-labelledby="timeline-overview">
        <SectionHeader
          id="timeline-overview"
          eyebrow="Event taxonomy"
          title="Supported timeline events"
          description="The fixture includes one event for every requested type, and each event retains source and provenance fields."
        />
        <div className="mt-4">
          <EventTypeMatrix />
        </div>
      </section>

      <section aria-labelledby="timeline-events">
        <SectionHeader
          id="timeline-events"
          eyebrow="Client Timeline"
          title="Event stream"
          description="Provenance is displayed as its own block on every event. Corrections and supersession links remain available even when empty."
        />
        <div className="mt-4 grid gap-4">
          {events.map((event) => (
            <TimelineEventCard key={event.id} event={event} />
          ))}
        </div>
      </section>
    </PhaseCReviewShell>
  );
}
