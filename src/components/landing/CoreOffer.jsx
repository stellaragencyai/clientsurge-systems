import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  HeadphonesIcon,
  LayoutDashboard,
  MessageSquare,
  PhoneCall,
  RotateCcw,
  Send,
  Zap,
} from "lucide-react";
import DemoBookingModal from "../forms/DemoBookingModal";
import {
  INDUSTRY_RECOMMENDATIONS_BY_ID,
  INDUSTRY_SELECTION_STORAGE_KEY,
} from "@/lib/industryRecommendations";

const iconMap = {
  Zap,
  PhoneCall,
  MessageSquare,
  Send,
  RotateCcw,
  CalendarCheck,
  LayoutDashboard,
  HeadphonesIcon,
};

const coreOfferSectionConfig = {
  eyebrow: "How It Works",
  headline: "How The 8-System Flow Works",
  subheadline:
    "One connected system handles the work that usually gets dropped: fast replies, missed calls, follow-up, booking, organization, and ongoing improvement.",
  helperLine:
    "You do not need eight separate tools. We set up one system that works together for you.",
  primaryCta: {
    label: "See Plans And Pricing",
    href: "#pricing",
  },
  secondaryCta: {
    label: "Book Your Free Demo",
  },
};

const systemMapStages = [
  {
    id: "lead-in",
    title: "New Lead Comes In",
    summary: "A form is filled out, a message comes in, or a call is missed.",
    systemsIncluded: ["01", "02"],
  },
  {
    id: "respond-fast",
    title: "The System Responds Fast",
    summary: "The lead hears from your business right away instead of waiting.",
    systemsIncluded: ["01", "02", "03"],
  },
  {
    id: "follow-up",
    title: "The Lead Gets Followed Up",
    summary: "If they do not book immediately, the system keeps the conversation moving.",
    systemsIncluded: ["04", "05"],
  },
  {
    id: "booking",
    title: "The Lead Gets Guided Toward Booking",
    summary: "Ready leads get pushed into a cleaner booking path with less friction.",
    systemsIncluded: ["03", "06"],
  },
  {
    id: "organization",
    title: "The Business Stays Organized And Improving",
    summary: "Your pipeline stays cleaner, and we keep tuning the system after launch.",
    systemsIncluded: ["07", "08"],
  },
];

const systemGroups = [
  {
    id: "get-the-lead",
    label: "Get The Lead",
    systems: ["01", "02"],
  },
  {
    id: "move-the-lead",
    label: "Move The Lead",
    systems: ["03", "04", "05"],
  },
  {
    id: "close-and-organize",
    label: "Close And Organize",
    systems: ["06", "07"],
  },
  {
    id: "improve-over-time",
    label: "Improve Over Time",
    systems: ["08"],
  },
];

const systemsById = {
  "01": {
    id: "01",
    service_key: "instant_lead_response",
    icon: "Zap",
    title: "Instant Lead Response",
    shortDescription:
      "When a new lead comes in, the system replies right away so they hear from your business while they are still paying attention.",
    badge: "Fast first response",
    mapStageId: "respond-fast",
    detail: {
      summary: "Fast replies stop new leads from going cold.",
      trigger:
        "A new lead fills out a form, sends a message, or reaches out for the first time.",
      action: "The system sends the first reply automatically right away.",
      leadView: "They hear from your business immediately instead of waiting.",
      businessValue:
        "Fast replies help you win more conversations before competitors respond.",
      includes: ["Replies quickly", "Uses lead context", "Works after hours"],
    },
  },
  "02": {
    id: "02",
    service_key: "missed_call_text_back",
    icon: "PhoneCall",
    title: "Missed Call Text-Back",
    shortDescription:
      "If someone calls and you miss it, the system sends a text back automatically so the conversation does not stop there.",
    badge: "Missed calls get a reply",
    mapStageId: "lead-in",
    detail: {
      summary: "Missed calls turn into a second chance instead of a dead end.",
      trigger: "A call comes in and no one answers.",
      action: "The system sends a text back automatically to reopen the conversation.",
      leadView: "They still get a fast response instead of feeling ignored.",
      businessValue: "Missed calls stop turning into lost opportunities.",
      includes: [
        "Automatic text-back",
        "Fast reply after missed call",
        "Works when staff is busy",
      ],
    },
  },
  "03": {
    id: "03",
    service_key: "ai_booking_agent",
    icon: "MessageSquare",
    title: "Booking Conversation",
    shortDescription:
      "When someone is interested, the system helps move the conversation toward booking instead of letting it stall.",
    badge: "Keeps interest moving",
    mapStageId: "booking",
    detail: {
      summary: "Interested leads get guided instead of left hanging.",
      trigger: "A lead shows interest but has not taken the next step yet.",
      action: "The conversation keeps moving toward booking instead of stalling.",
      leadView: "The experience feels guided and responsive.",
      businessValue: "More warm inquiries turn into real appointments.",
      includes: [
        "Keeps conversation moving",
        "Removes dead space",
        "Helps ready leads take action",
      ],
    },
  },
  "04": {
    id: "04",
    service_key: "nurture_sequence_14d",
    icon: "Send",
    title: "Follow-Up Sequence",
    shortDescription:
      "If a lead does not book right away, the system keeps following up so they do not disappear.",
    badge: "Steady follow-up",
    mapStageId: "follow-up",
    detail: {
      summary: "Leads stay warm instead of fading out after first contact.",
      trigger:
        "A lead goes quiet after the first touchpoint or does not book right away.",
      action: "Timed follow-up messages keep the lead warm.",
      leadView: "They hear from your business consistently without being forgotten.",
      businessValue:
        "More leads come back and convert instead of dying silently.",
      includes: ["Multi-step follow-up", "Spaced timing", "Keeps leads warm"],
    },
  },
  "05": {
    id: "05",
    service_key: "lead_reactivation",
    icon: "RotateCcw",
    title: "Lead Reactivation",
    shortDescription:
      "If old leads went quiet, the system reaches back out so you can reopen conversations you already paid to get.",
    badge: "Wakes old leads back up",
    mapStageId: "follow-up",
    detail: {
      summary: "Old leads get another chance to become revenue.",
      trigger: "You already have old leads sitting in your list that never converted.",
      action: "It reaches back out with a reconnect message.",
      leadView:
        "They get a relevant reminder instead of being forgotten forever.",
      businessValue: "Old leads can become fresh opportunities.",
      includes: [
        "Reopens old conversations",
        "Uses reconnect messaging",
        "Helps recover missed value",
      ],
    },
  },
  "06": {
    id: "06",
    service_key: "ai_booking_agent",
    icon: "CalendarCheck",
    title: "Booking Flow",
    shortDescription:
      "When someone is ready, the system makes scheduling feel easier and faster.",
    badge: "Less booking friction",
    mapStageId: "booking",
    detail: {
      summary: "Ready leads reach the booking step with less friction.",
      trigger: "A lead is ready to schedule.",
      action:
        "It pushes them into a cleaner booking path with less back-and-forth.",
      leadView: "Scheduling feels easier, faster, and less frustrating.",
      businessValue: "More ready prospects complete the booking step.",
      includes: [
        "Smoother scheduling path",
        "Less friction",
        "Faster movement to appointment",
      ],
    },
  },
  "07": {
    id: "07",
    service_key: "pipeline_organization",
    icon: "LayoutDashboard",
    title: "Pipeline Organization",
    shortDescription:
      "As leads move, the system keeps things organized so your team does not have to track everything by hand.",
    badge: "Cleaner lead tracking",
    mapStageId: "organization",
    detail: {
      summary: "The business stays more organized behind the scenes.",
      trigger:
        "A lead replies, changes stage, or needs internal follow-through.",
      action: "The system updates the right information automatically.",
      leadView:
        "They experience a business that feels organized and on top of things.",
      businessValue:
        "Your team gets cleaner visibility and fewer workflow gaps.",
      includes: [
        "Keeps lead status organized",
        "Reduces manual tracking",
        "Supports team follow-through",
      ],
    },
  },
  "08": {
    id: "08",
    service_key: "ongoing_support",
    icon: "HeadphonesIcon",
    title: "Ongoing Support",
    shortDescription:
      "After launch, we keep improving the system so it does not go stale.",
    badge: "Built to get better",
    mapStageId: "organization",
    detail: {
      summary: "The system keeps improving after it goes live.",
      trigger: "The system is live and handling real lead flow.",
      action:
        "We review performance, tune messaging, and keep improving the setup.",
      leadView:
        "They keep experiencing a polished system instead of a stale one.",
      businessValue: "The automation keeps getting stronger after launch.",
      includes: [
        "Continued refinement",
        "Post-launch tuning",
        "Ongoing support",
      ],
    },
  },
};

const launchTimelineSteps = [
  {
    id: "01",
    number: "1",
    title: "Quick Onboarding Call",
    description: "We learn your business, your offers, and how your lead flow works.",
  },
  {
    id: "02",
    number: "2",
    title: "We Build And Configure",
    description:
      "We set up the messaging, automation logic, follow-up flow, and booking path.",
  },
  {
    id: "03",
    number: "3",
    title: "Launch And Improve",
    description:
      "You go live, and we keep refining the system as it starts handling real leads.",
  },
];

function CoreOfferHeader({ industryContext }) {
  return (
    <div className="text-center mx-auto max-w-3xl">
      <p className="text-xs font-semibold text-primary tracking-[0.24em] uppercase mb-4">
        {coreOfferSectionConfig.eyebrow}
      </p>
      <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-foreground">
        How The{" "}
        <span style={{ color: "#9a5c2e", textShadow: "0 0 28px rgba(154,92,46,0.25)" }}>
          8-System
        </span>{" "}
        Flow Works
      </h2>
      <p className="mt-5 text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
        {coreOfferSectionConfig.subheadline}
      </p>
      <p className="mt-4 text-sm md:text-base text-foreground/65 max-w-xl mx-auto leading-relaxed">
        {coreOfferSectionConfig.helperLine}
      </p>
      {industryContext ? (
        <div
          className="mt-5 inline-flex items-center rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{
            background: "rgba(154,92,46,0.08)",
            border: "1px solid rgba(154,92,46,0.16)",
            color: "#9a5c2e",
          }}
        >
          Showing the most relevant systems for {industryContext.shortName}
        </div>
      ) : null}
    </div>
  );
}

function SystemMap({ selectedSystemId }) {
  return (
    <div className="mt-12 md:mt-14">
      <div className="hidden lg:block relative">
        <div
          aria-hidden="true"
          className="absolute top-8 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(to right, rgba(154,92,46,0.12), rgba(154,92,46,0.35), rgba(154,92,46,0.12))",
          }}
        />
        <div className="grid grid-cols-5 gap-4">
          {systemMapStages.map((stage) => {
            const active = stage.systemsIncluded.includes(selectedSystemId);
            return (
              <div
                key={stage.id}
                className="relative rounded-2xl px-5 pt-5 pb-4"
                style={{
                  background: active
                    ? "linear-gradient(135deg, rgba(255,249,240,0.98) 0%, rgba(251,239,219,0.94) 100%)"
                    : "linear-gradient(135deg, rgba(255,255,255,0.88) 0%, rgba(250,245,239,0.78) 100%)",
                  border: active
                    ? "1.5px solid rgba(154,92,46,0.4)"
                    : "1px solid rgba(154,92,46,0.16)",
                  boxShadow: active
                    ? "0 16px 40px rgba(154,92,46,0.14)"
                    : "0 6px 18px rgba(0,0,0,0.04)",
                }}
              >
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
                  style={{
                    background: active
                      ? "linear-gradient(135deg,#9a5c2e,#c8965c)"
                      : "rgba(154,92,46,0.22)",
                    border: active
                      ? "2px solid rgba(255,248,235,0.95)"
                      : "2px solid rgba(255,255,255,0.92)",
                    boxShadow: active ? "0 0 0 6px rgba(154,92,46,0.09)" : "none",
                  }}
                />
                <h3 className="text-sm font-semibold text-foreground leading-snug mb-2">
                  {stage.title}
                </h3>
                <p className="text-xs leading-relaxed text-foreground/65">
                  {stage.summary}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:hidden">
        {systemMapStages.map((stage) => {
          const active = stage.systemsIncluded.includes(selectedSystemId);
          return (
            <div
              key={stage.id}
              className="rounded-2xl px-4 py-4"
              style={{
                background: active
                  ? "linear-gradient(135deg, rgba(255,249,240,0.98) 0%, rgba(251,239,219,0.94) 100%)"
                  : "linear-gradient(135deg, rgba(255,255,255,0.88) 0%, rgba(250,245,239,0.78) 100%)",
                border: active
                  ? "1.5px solid rgba(154,92,46,0.4)"
                  : "1px solid rgba(154,92,46,0.16)",
              }}
            >
              <h3 className="text-sm font-semibold text-foreground leading-snug mb-1.5">
                {stage.title}
              </h3>
              <p className="text-xs leading-relaxed text-foreground/65">
                {stage.summary}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SystemCard({ system, selected, onSelect, emphasizedLabel }) {
  const Icon = iconMap[system.icon];

  return (
    <button
      type="button"
      onClick={() => onSelect(system.id)}
      aria-pressed={selected}
      className="w-full text-left rounded-[20px] overflow-hidden transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      style={{
        background: selected
          ? "linear-gradient(135deg, rgba(255,248,235,0.98) 0%, rgba(252,239,216,0.92) 100%)"
          : "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(252,248,242,0.85) 100%)",
        border: selected
          ? "1.5px solid rgba(154,92,46,0.42)"
          : "1.5px solid rgba(154,92,46,0.18)",
        boxShadow: selected
          ? "0 16px 36px rgba(154,92,46,0.14)"
          : "0 6px 18px rgba(0,0,0,0.05)",
        transform: selected ? "translateY(-1px)" : "translateY(0)",
      }}
    >
      <div
        className="px-5 md:px-6 pt-5 pb-4 flex items-center justify-between"
        style={{
          background:
            "linear-gradient(135deg, rgba(154,92,46,0.08) 0%, rgba(154,92,46,0.03) 100%)",
        }}
      >
        <span
          className="text-[11px] font-black uppercase tracking-[0.2em]"
          style={{ color: "rgba(90,55,28,0.88)" }}
        >
          Step {system.id}
        </span>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: selected ? "rgba(154,92,46,0.16)" : "rgba(154,92,46,0.08)",
            border: "1px solid rgba(154,92,46,0.18)",
          }}
        >
          <Icon className="w-4 h-4" style={{ color: "#9a5c2e" }} />
        </div>
      </div>

      <div className="px-5 md:px-6 py-5 md:py-6 flex flex-col gap-3">
        <h3 className="text-lg font-semibold leading-snug text-foreground">
          {system.title}
        </h3>
        <p className="text-sm leading-relaxed text-foreground/70">
          {system.shortDescription}
        </p>
        <div className="flex flex-wrap gap-2">
          <span
            className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-[0.08em] w-fit"
            style={{
              background: "rgba(154,92,46,0.08)",
              color: "#9a5c2e",
              border: "1px solid rgba(154,92,46,0.14)",
            }}
          >
            {system.badge}
          </span>
          {emphasizedLabel ? (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-[0.08em] w-fit"
              style={{
                background: "rgba(245,217,168,0.2)",
                color: "#7a4825",
                border: "1px solid rgba(200,150,92,0.26)",
              }}
            >
              {emphasizedLabel}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function SystemGroupList({ selectedSystemId, onSelect, emphasizedSystemIds, emphasizedLabel }) {
  return (
    <div className="mt-12 md:mt-14 space-y-10 md:space-y-12">
      {systemGroups.map((group) => (
        <div key={group.id}>
          <div className="flex items-center gap-4 mb-4 md:mb-5">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
            <p className="text-xs font-semibold text-primary tracking-[0.24em] uppercase whitespace-nowrap">
              {group.label}
            </p>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {group.systems.map((systemId) => (
              <SystemCard
                key={systemId}
                system={systemsById[systemId]}
                selected={selectedSystemId === systemId}
                onSelect={onSelect}
                emphasizedLabel={
                  emphasizedSystemIds.has(systemId) ? emphasizedLabel : null
                }
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailBlock({ label, value }) {
  return (
    <div
      className="rounded-2xl px-4 py-4"
      style={{
        background: "rgba(154,92,46,0.05)",
        border: "1px solid rgba(154,92,46,0.14)",
      }}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary mb-2">
        {label}
      </p>
      <p className="text-sm leading-6 text-foreground/80">{value}</p>
    </div>
  );
}

function SystemDetailPanel({ systemId, onBookDemo }) {
  const system = systemsById[systemId];
  if (!system) return null;
  const Icon = iconMap[system.icon];

  return (
    <div
      className="mt-12 md:mt-14 rounded-[24px] px-5 py-6 md:px-7 md:py-7"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(252,248,242,0.9) 100%)",
        border: "1.5px solid rgba(154,92,46,0.2)",
        boxShadow: "0 18px 52px rgba(0,0,0,0.08)",
      }}
    >
      <div className="grid lg:grid-cols-[280px,1fr] gap-6 md:gap-7">
        <div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: "linear-gradient(135deg,#7a4825 0%,#c8965c 100%)",
              boxShadow: "0 8px 20px rgba(154,92,46,0.22)",
            }}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary mb-2">
            Selected System
          </p>
          <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground leading-tight">
            {system.title}
          </h3>
          <p className="mt-3 text-sm leading-7 text-foreground/70">
            {system.detail.summary}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <DetailBlock label="What Happens First" value={system.detail.trigger} />
          <DetailBlock label="What The System Does Next" value={system.detail.action} />
          <DetailBlock label="What Your Lead Sees" value={system.detail.leadView} />
          <DetailBlock label="Why This Matters" value={system.detail.businessValue} />
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-[rgba(154,92,46,0.12)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary mb-4">
          What This Includes
        </p>
        <div className="grid md:grid-cols-3 gap-3">
          {system.detail.includes.map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-2xl px-4 py-3"
              style={{
                background: "rgba(154,92,46,0.05)",
                border: "1px solid rgba(154,92,46,0.12)",
              }}
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-primary" />
              <span className="text-sm font-medium text-foreground/80">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <a
          href={coreOfferSectionConfig.primaryCta.href}
          className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
        >
          {coreOfferSectionConfig.primaryCta.label}
          <ArrowRight className="w-4 h-4" />
        </a>
        <button
          type="button"
          onClick={onBookDemo}
          style={{
            borderRadius: "9999px",
            padding: "2px",
            background:
              "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
            boxShadow: "0 4px 18px rgba(120,70,20,0.3)",
            border: "none",
            cursor: "pointer",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              height: "44px",
              padding: "0 24px",
              borderRadius: "9999px",
              background:
                "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
              color: "#f5e6d0",
              fontWeight: "700",
              fontSize: "0.95rem",
            }}
          >
            {coreOfferSectionConfig.secondaryCta.label}
            <ArrowRight className="w-4 h-4" />
          </span>
        </button>
      </div>
    </div>
  );
}

function LaunchTimeline() {
  return (
    <div className="mt-16 md:mt-20">
      <p className="text-xs font-semibold text-primary tracking-[0.24em] uppercase text-center mb-3">
        How You Get Live
      </p>
      <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-8 md:mb-10">
        We Set It Up For You
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        {launchTimelineSteps.map((step) => (
          <div
            key={step.id}
            className="rounded-2xl px-5 py-5 text-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(250,245,239,0.84) 100%)",
              border: "1px solid rgba(154,92,46,0.15)",
              boxShadow: "0 8px 22px rgba(0,0,0,0.05)",
            }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-black"
              style={{
                background: "linear-gradient(135deg,#9a5c2e,#7a4825)",
                color: "#f5e6d0",
              }}
            >
              {step.number}
            </div>
            <p className="text-sm font-bold text-foreground mb-2">{step.title}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CoreOfferCTA({ onBookDemo }) {
  return (
    <div className="pt-8 md:pt-10 mt-12 md:mt-14 border-t border-border text-center max-w-3xl mx-auto">
      <p className="font-display text-2xl md:text-3xl font-semibold text-foreground leading-tight">
        Ready to see which systems fit your business?
      </p>
      <p className="text-sm md:text-base text-muted-foreground mt-3 leading-relaxed max-w-2xl mx-auto">
        We will show you the right setup based on your lead flow, booking
        process, and goals.
      </p>

      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href={coreOfferSectionConfig.primaryCta.href}
          className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
        >
          {coreOfferSectionConfig.primaryCta.label}
          <ArrowRight className="w-4 h-4" />
        </a>
        <button
          type="button"
          onClick={onBookDemo}
          style={{
            borderRadius: "9999px",
            padding: "2px",
            background:
              "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
            boxShadow: "0 4px 18px rgba(120,70,20,0.3)",
            border: "none",
            cursor: "pointer",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              height: "44px",
              padding: "0 24px",
              borderRadius: "9999px",
              background:
                "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
              color: "#f5e6d0",
              fontWeight: "700",
              fontSize: "0.95rem",
            }}
          >
            {coreOfferSectionConfig.secondaryCta.label}
            <ArrowRight className="w-4 h-4" />
          </span>
        </button>
      </div>
    </div>
  );
}

export default function CoreOffer() {
  const [selectedSystemId, setSelectedSystemId] = useState("01");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedIndustryId, setSelectedIndustryId] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const applyIndustrySelection = () => {
      const storedIndustryId = window.sessionStorage.getItem(
        INDUSTRY_SELECTION_STORAGE_KEY
      );
      const industryContext = storedIndustryId
        ? INDUSTRY_RECOMMENDATIONS_BY_ID[storedIndustryId]
        : null;

      setSelectedIndustryId(industryContext?.id || null);

      const priorityServiceKey = industryContext?.priorityServiceKeys?.[0];
      const matchingSystem = Object.values(systemsById).find(
        (system) => system.service_key === priorityServiceKey
      );

      if (matchingSystem) {
        setSelectedSystemId(matchingSystem.id);
      }
    };

    applyIndustrySelection();
    window.addEventListener("storage", applyIndustrySelection);
    window.addEventListener("clientsurge:industry-selected", applyIndustrySelection);

    return () => {
      window.removeEventListener("storage", applyIndustrySelection);
      window.removeEventListener(
        "clientsurge:industry-selected",
        applyIndustrySelection
      );
    };
  }, []);

  const industryContext = selectedIndustryId
    ? INDUSTRY_RECOMMENDATIONS_BY_ID[selectedIndustryId]
    : null;
  const emphasizedSystemIds = new Set(
    (industryContext?.priorityServiceKeys || [])
      .map((serviceKey) =>
        Object.values(systemsById).find((system) => system.service_key === serviceKey)?.id
      )
      .filter(Boolean)
  );

  return (
    <section
      id="services"
      className="py-20 md:py-28 px-4 md:px-6 bg-gradient-to-b from-blue-50/30 via-slate-50 to-background relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(154,92,46,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <CoreOfferHeader industryContext={industryContext} />
        <SystemMap selectedSystemId={selectedSystemId} />
        <SystemGroupList
          selectedSystemId={selectedSystemId}
          onSelect={setSelectedSystemId}
          emphasizedSystemIds={emphasizedSystemIds}
          emphasizedLabel={
            industryContext ? `Best fit for ${industryContext.shortName}` : null
          }
        />
        <SystemDetailPanel
          systemId={selectedSystemId}
          onBookDemo={() => setShowBookingModal(true)}
        />
        <LaunchTimeline />
        <CoreOfferCTA onBookDemo={() => setShowBookingModal(true)} />
      </div>

      {showBookingModal ? (
        <DemoBookingModal onClose={() => setShowBookingModal(false)} />
      ) : null}
    </section>
  );
}
