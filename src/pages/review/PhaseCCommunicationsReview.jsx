import { Mail, MessageSquare, Mic, Phone, StickyNote } from "lucide-react";
import {
  COMMUNICATION_CHANNEL_LABELS,
  COMMUNICATION_CHANNELS,
  phaseCCommunications,
} from "@/data/phaseCReviewFixtures";
import {
  ContractPill,
  DefinitionList,
  HandoffBlock,
  PhaseCReviewShell,
  PillList,
  ReviewCard,
  SectionHeader,
  SourceDisclosure,
  StateBadge,
  StateReferenceGrid,
  formatDateTime,
} from "@/components/review/phase-c/PhaseCReviewComponents";

const CHANNEL_ICONS = {
  sms: MessageSquare,
  email: Mail,
  voice: Phone,
  voicemail: Mic,
  internal_note: StickyNote,
};

function ChannelMatrix() {
  const counts = phaseCCommunications.conversations.reduce((acc, conversation) => {
    acc[conversation.channel] = (acc[conversation.channel] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {COMMUNICATION_CHANNELS.map((channel) => {
        const Icon = CHANNEL_ICONS[channel] || MessageSquare;
        return (
          <div key={channel} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-[#0f2d52] text-white">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-950">{COMMUNICATION_CHANNEL_LABELS[channel]}</p>
                <p className="text-xs text-slate-500">{counts[channel] || 0} conversation fixture</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MessageStateRows({ messages }) {
  return (
    <div className="grid gap-3">
      {messages.map((message) => (
        <div key={message.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <StateBadge state={message.state} kind="communication" />
            <ContractPill label="Provider ref" value={message.providerReference} tone="reported" />
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-700">{message.summary}</p>
          <DefinitionList
            columns="sm:grid-cols-3"
            items={[
              { label: "Sent at", value: formatDateTime(message.sentAt) },
              { label: "Delivered at", value: formatDateTime(message.deliveredAt) },
              { label: "Read at", value: formatDateTime(message.readAt) },
            ]}
          />
        </div>
      ))}
    </div>
  );
}

function ConversationCard({ conversation }) {
  const Icon = CHANNEL_ICONS[conversation.channel] || MessageSquare;

  return (
    <ReviewCard
      id={`conversation-${conversation.id}`}
      title={conversation.title}
      subtitle={`${COMMUNICATION_CHANNEL_LABELS[conversation.channel]} - ${conversation.assignment}`}
      icon={Icon}
      badge={<StateBadge state={conversation.state} kind="communication" />}
    >
      <div className="grid gap-4">
        <DefinitionList
          columns="lg:grid-cols-4"
          items={[
            { label: "Participants", value: conversation.participants.join(", ") },
            { label: "Owner", value: conversation.owner },
            { label: "Assignment", value: conversation.assignment },
            { label: "Unread", value: conversation.unread ? `${conversation.unreadCount} unread` : "No unread items" },
            { label: "Priority", value: conversation.priority },
            { label: "AI involvement", value: conversation.aiInvolvement.summary },
            { label: "AI confidence", value: conversation.aiInvolvement.confidence },
            { label: "Human escalation", value: conversation.humanEscalation.required ? "Required" : "Not required" },
          ]}
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <h4 className="text-sm font-bold text-slate-950">Message state evidence</h4>
            <div className="mt-2">
              <MessageStateRows messages={conversation.messages} />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-950">Human escalation</h4>
            <div className="mt-2">
              <HandoffBlock handoff={conversation.humanEscalation} />
            </div>
          </div>
        </div>

        <SourceDisclosure source={conversation.source} />
      </div>
    </ReviewCard>
  );
}

export default function PhaseCCommunicationsReview() {
  const { conversations, stateReference } = phaseCCommunications;

  return (
    <PhaseCReviewShell
      activeKey="communications"
      eyebrow="Phase C Customer + AI Operations"
      title="Communication Center"
      summary="Fixture-backed unified inbox and conversation detail foundation for SMS, email, voice, voicemail, and internal notes. Provider acceptance, delivery, and read evidence stay separate."
    >
      <section aria-labelledby="communications-overview">
        <SectionHeader
          id="communications-overview"
          eyebrow="Communication Center"
          title="Channels and inbox coverage"
          description="The route supports the requested channel set and keeps ownership, assignment, unread, priority, AI involvement, and human escalation visible."
        />
        <div className="mt-4">
          <ChannelMatrix />
        </div>
      </section>

      <section aria-labelledby="communications-state-reference">
        <SectionHeader
          id="communications-state-reference"
          eyebrow="Message states"
          title="Sent is not Delivered. Delivered is not Read."
          description="Each fixture state has its own meaning and timestamp requirements. The UI never converts provider acceptance into delivery or read evidence."
        />
        <div className="mt-4">
          <StateReferenceGrid states={stateReference} kind="communication" />
        </div>
      </section>

      <section aria-labelledby="communications-inbox">
        <SectionHeader
          id="communications-inbox"
          eyebrow="Conversation"
          title="Unified inbox fixtures"
          description="Conversation cards show participants, owner, assignment, unread state, priority, AI involvement, and escalation state before passive detail."
        />
        <div className="mt-4 grid gap-4">
          {conversations.map((conversation) => (
            <ConversationCard key={conversation.id} conversation={conversation} />
          ))}
        </div>
      </section>

      <section aria-labelledby="communications-rules">
        <SectionHeader
          id="communications-rules"
          eyebrow="State contract"
          title="Delivery evidence boundaries"
          description="The review fixture includes distinct examples for queued, sending, sent, delivered, read, failed, blocked, and unknown communication states."
        />
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          <PillList
            items={[
              "Sent requires provider acceptance, not customer delivery.",
              "Delivered requires provider delivery evidence, not read evidence.",
              "Read requires a channel-specific read or open signal.",
              "Blocked is a policy or configuration stop, not a provider failure.",
              "Unknown never inherits delivered or read styling.",
            ]}
            tone="reported"
          />
        </div>
      </section>
    </PhaseCReviewShell>
  );
}
