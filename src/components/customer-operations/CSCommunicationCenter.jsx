import React from "react";
import {
  ConversationCard,
  PhaseCDeepLink,
  PhaseCSection,
  PhaseCSourceDisclosure,
  PhaseCSurface,
  RestrictedState,
  StaticFoundationNotice,
} from "./CSCustomerOperationsPrimitives";
import { communicationFixtures } from "./phaseCFixtures";
import { CSAlert } from "@/components/design-system";

export default function CSCommunicationCenter({ scenario = communicationFixtures.unread }) {
  const conversations = scenario.conversations || [];
  const selectedConversation = conversations[0];

  return (
    <PhaseCSurface scenario={scenario}>
      <div className="cs-co-layout">
        <StaticFoundationNotice />
        <CSAlert tone="info" title="Delivery semantics are separated" className="cs-co-static-notice">
          Sent does not mean delivered. Delivered does not mean read. Failed and blocked states require recovery before customer receipt is assumed.
        </CSAlert>
        <PhaseCSection
          id="communication-source-contract"
          title="Communication source contract"
          description="Channels, delivery state, ownership, permission, and AI assistance stay distinct."
        >
          <PhaseCSourceDisclosure disclosure={scenario.disclosure} />
        </PhaseCSection>

        {scenario.state === "permission_restricted" ? (
          <RestrictedState title="Communication permission restricted" description={scenario.attention} />
        ) : null}

        <div className="cs-co-communications-layout">
          <PhaseCSection
            id="conversation-list"
            title="Conversation list"
            description="Unread, unresolved, assigned, escalated, and restricted states are visible before the detail pane."
            actions={<PhaseCDeepLink label="Open assignment rules" href="#conversation-assignment" />}
          >
            <div className="cs-co-card-grid">
              {conversations.map((conversation) => <ConversationCard key={conversation.id} conversation={conversation} />)}
            </div>
          </PhaseCSection>

          {selectedConversation ? (
            <PhaseCSection
              id="conversation-detail"
              title="Conversation detail"
              description="The detail pane shows ownership, AI assistance, escalation, permission, and exact next action."
            >
              <ConversationCard conversation={selectedConversation} />
            </PhaseCSection>
          ) : null}
        </div>
      </div>
    </PhaseCSurface>
  );
}
