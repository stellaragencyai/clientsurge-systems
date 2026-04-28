import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  CreditCard,
  HeadphonesIcon,
  LayoutDashboard,
  MessageSquare,
  PhoneCall,
  Rocket,
  RotateCcw,
  Send,
  ShoppingCart,
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
  ShoppingCart,
  CreditCard,
  Rocket,
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
    systemsIncluded: ["02", "03"],
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
    systems: ["02"],
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
    icon: "ShoppingCart",
    title: "Browse & Select",
    duration: "5-10 min",
    description: "Pick the automations you need from our AI Store.",
    bullets: [
      "Explore 12+ automation services in the AI Store",
      "Watch 2-3 minute demo videos for each automation",
      "See exactly what each service does and when it runs",
      "Build your custom stack—only pay for what you need"
    ]
  },
  {
    id: "02",
    number: "2",
    icon: "CreditCard",
    title: "Quick Signup & Checkout",
    duration: "5 min",
    description: "Create account, add to cart, and pay securely.",
    bullets: [
      "Sign up with email and password in 60 seconds",
      "Add your selected automations to cart",
      "Review total setup fee and monthly cost",
      "Pay securely via Stripe—done"
    ]
  },
  {
    id: "03",
    number: "3",
    icon: "LayoutDashboard",
    title: "Instant Dashboard Access",
    duration: "Immediate",
    description: "You're in the system right now with everything ready.",
    bullets: [
      "Access your private dashboard immediately after payment",
      "Download setup guides and integration docs",
      "Watch video tutorials for each automation",
      "See real-time status of your services"
    ]
  },
  {
    id: "04",
    number: "4",
    icon: "Zap",
    title: "We Install Everything",
    duration: "1-2 hours",
    description: "Our system configures everything in the background while you watch.",
    bullets: [
      "Automated setup connects your integrations",
      "Your messaging and automation logic configured instantly",
      "All follow-up sequences and booking flows activated",
      "You don't have to do anything—we handle it all"
    ]
  },
  {
    id: "05",
    number: "5",
    icon: "Rocket",
    title: "You're Live & We Notify You",
    duration: "Fully automated",
    description: "Your automations are running and generating value now.",
    bullets: [
      "All services live and actively handling leads",
      "Real-time dashboard shows leads coming through",
      "We send you a notification and onboarding session invite",
      "We optimize your setup based on your actual lead flow"
    ]
  },
];

const orderedSystemIds = Object.keys(systemsById);
const mobileVisibleSystemIds = new Set(["01", "02", "03", "04"]);
const flowSurface =
  "linear-gradient(180deg, rgba(252,247,241,0.99) 0%, rgba(246,238,228,0.97) 100%)";
const flowSurfaceStrong =
  "linear-gradient(180deg, rgba(255,250,245,1) 0%, rgba(248,240,230,0.99) 100%)";
const flowBorder = "1.5px solid rgba(212, 184, 142, 0.42)";
const flowBorderActive = "1.5px solid rgba(222, 194, 152, 0.72)";
const flowShadow = "0 16px 34px rgba(111,67,31,0.08), 0 2px 12px rgba(111,67,31,0.05)";
const flowShadowActive =
  "0 22px 48px rgba(122,72,37,0.16), 0 8px 22px rgba(154,92,46,0.1)";
const flowBrown =
  "linear-gradient(135deg, #6b3f1f 0%, #9a5c2e 40%, #7a4825 100%)";
const flowBrownSoft =
  "linear-gradient(135deg, #7a4825 0%, #b1723b 42%, #8a542b 100%)";
const flowTextLight = "rgba(252, 241, 222, 0.98)";
const flowTextMuted = "rgba(247, 225, 194, 0.92)";
const flowChipBg = "rgba(245, 217, 168, 0.14)";
const flowChipBorder = "1px solid rgba(238, 204, 157, 0.4)";
const flowTopText = "rgba(184, 129, 72, 0.92)";
const flowIconColor = "#9a5c2e";
const flowIconGlow = "0 0 0 1px rgba(255,255,255,0.18), 0 0 28px rgba(245,217,168,0.24)";
const flowDivider =
  "linear-gradient(90deg, rgba(255,232,192,0) 0%, rgba(245,217,168,0.72) 18%, rgba(255,244,223,0.96) 50%, rgba(245,217,168,0.72) 82%, rgba(255,232,192,0) 100%)";
const flowHeaderGlass =
  "linear-gradient(180deg, rgba(255,255,255,0.68) 0%, rgba(255,255,255,0.08) 42%, rgba(255,255,255,0) 100%)";
const flowBodyMesh =
  "radial-gradient(circle at 16% 20%, rgba(255,233,197,0.22) 0%, rgba(255,233,197,0.1) 22%, transparent 50%), radial-gradient(circle at 82% 14%, rgba(255,247,230,0.16) 0%, transparent 34%), radial-gradient(circle at 70% 78%, rgba(245,217,168,0.14) 0%, transparent 38%), radial-gradient(circle at 38% 92%, rgba(122,72,37,0.12) 0%, transparent 40%)";
const flowSpotlight =
  "linear-gradient(120deg, rgba(255,255,255,0.18) 0%, rgba(255,247,233,0.1) 16%, rgba(255,255,255,0.03) 30%, rgba(255,255,255,0) 52%)";
const flowShine =
  "linear-gradient(140deg, rgba(255,255,255,0.22) 0%, rgba(255,247,232,0.14) 12%, rgba(255,235,205,0.06) 24%, rgba(255,255,255,0.01) 34%, rgba(255,255,255,0) 48%)";
const flowInnerFrame =
  "inset 0 1px 0 rgba(255,248,235,0.24), inset 0 0 0 1px rgba(255,227,186,0.1), inset 0 -16px 24px rgba(122,72,37,0.06)";
const mapCardSurface =
  "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,250,250,0.96) 100%)";
const mapCardSurfaceActive =
  "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(247,247,247,0.98) 100%)";
const mapCardBorder = "1.5px solid rgba(148, 163, 184, 0.18)";
const mapCardBorderActive = "1.5px solid rgba(148, 163, 184, 0.26)";
const mapCardShadow =
  "0 8px 22px rgba(15, 23, 42, 0.05)";
const mapCardShadowActive =
  "0 12px 28px rgba(15, 23, 42, 0.08)";
const mapCardSheen = "transparent";
const mapCardMesh = "transparent";
const mapCardDivider = "transparent";
const mapCardInnerFrame = "inset 0 0 0 1px rgba(148,163,184,0.1)";

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
      {industryContext ? null : null}
    </div>
  );
}

function SystemMap({ selectedSystemId, onStageSelect }) {
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
              <button
                type="button"
                key={stage.id}
                className="relative rounded-2xl px-5 pt-5 pb-4 overflow-hidden"
                onClick={() => onStageSelect(stage.systemsIncluded[0])}
                style={{
                  background: active ? mapCardSurfaceActive : mapCardSurface,
                  border: active ? mapCardBorderActive : mapCardBorder,
                  boxShadow: active ? mapCardShadowActive : mapCardShadow,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: mapCardMesh,
                    opacity: active ? 1 : 0.82,
                  }}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-[52%] pointer-events-none"
                  style={{
                    background: mapCardSheen,
                    opacity: active ? 1 : 0.8,
                  }}
                />
                <div
                  aria-hidden="true"
                  className="absolute left-0 right-0 top-0 h-px pointer-events-none"
                  style={{ background: mapCardDivider }}
                />
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
                  style={{
                    background: active
                      ? "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)"
                      : "linear-gradient(135deg, #f8fafc 0%, #e5e7eb 100%)",
                    border: active
                      ? "2px solid rgba(255,255,255,0.98)"
                      : "2px solid rgba(246,250,255,0.96)",
                    boxShadow: active
                      ? "0 0 0 6px rgba(226,232,240,0.35), 0 6px 14px rgba(100,116,139,0.12)"
                      : "0 4px 10px rgba(100,116,139,0.08)",
                  }}
                />
                <h3
                  className="relative z-10 text-sm font-semibold text-foreground leading-snug mb-2"
                  style={{ textShadow: active ? "0 1px 0 rgba(255,255,255,0.42)" : "none" }}
                >
                  {stage.title}
                </h3>
                <p className="relative z-10 text-xs leading-relaxed text-slate-700/90">
                  {stage.summary}
                </p>
                <div
                  aria-hidden="true"
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{ boxShadow: mapCardInnerFrame }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:hidden">
        {systemMapStages.map((stage) => {
          const active = stage.systemsIncluded.includes(selectedSystemId);
          return (
            <button
              type="button"
              key={stage.id}
              className="rounded-2xl px-4 py-4 relative overflow-hidden"
              onClick={() => onStageSelect(stage.systemsIncluded[0])}
              style={{
                background: active ? mapCardSurfaceActive : mapCardSurface,
                border: active ? mapCardBorderActive : mapCardBorder,
                boxShadow: active ? mapCardShadowActive : mapCardShadow,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: mapCardMesh,
                  opacity: active ? 1 : 0.82,
                }}
              />
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-[52%] pointer-events-none"
                style={{
                  background: mapCardSheen,
                  opacity: active ? 1 : 0.8,
                }}
              />
              <div
                aria-hidden="true"
                className="absolute left-0 right-0 top-0 h-px pointer-events-none"
                style={{ background: mapCardDivider }}
              />
              <h3
                className="relative z-10 text-sm font-semibold text-foreground leading-snug mb-1.5"
                style={{ textShadow: active ? "0 1px 0 rgba(255,255,255,0.42)" : "none" }}
              >
                {stage.title}
              </h3>
              <p className="relative z-10 text-xs leading-relaxed text-slate-700/90">
                {stage.summary}
              </p>
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{ boxShadow: mapCardInnerFrame }}
              />
            </button>
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
        background: "rgba(255,255,255,0.82)",
        border: "1px solid rgba(148, 163, 184, 0.18)",
        boxShadow: "0 8px 22px rgba(15, 23, 42, 0.05)",
        transform: selected ? "translateY(-1px)" : "translateY(0)",
      }}
    >
      <div
        className="px-5 md:px-6 pt-5 pb-3 flex items-center justify-between gap-3"
        style={{
          background: "rgba(255,255,255,0.82)",
        }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: "rgba(154,92,46,0.7)" }}>
            Step {system.id}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground leading-snug">{system.title}</p>
        </div>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg,#9a5c2e,#7a4825)",
            boxShadow: "0 2px 8px rgba(154,92,46,0.3)",
          }}
        >
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>

      <div
        className="px-5 pb-5 flex flex-col gap-3"
        style={{
          background: "transparent",
        }}
      >
        <p className="text-sm leading-relaxed text-foreground/75">
          {system.shortDescription}
        </p>
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

          <div className="grid grid-cols-1 gap-5">
            {group.systems.map((systemId) => (
              <div
                key={systemId}
                className={mobileVisibleSystemIds.has(systemId) ? "block" : "hidden md:block"}
              >
                <SystemCard
                  system={systemsById[systemId]}
                  selected={selectedSystemId === systemId}
                  onSelect={onSelect}
                  emphasizedLabel={
                    emphasizedSystemIds.has(systemId) ? emphasizedLabel : null
                  }
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MobileSystemGroupList({
  selectedSystemId,
  onSelect,
  emphasizedSystemIds,
  emphasizedLabel,
  showAll,
  onToggle,
}) {
  return (
    <div className="mt-12 space-y-8 md:hidden">
      {systemGroups.map((group) => {
        const visibleSystems = group.systems.filter(
          (systemId) => showAll || mobileVisibleSystemIds.has(systemId)
        );
        if (!visibleSystems.length) return null;

        return (
          <div key={group.id}>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
              <p className="text-xs font-semibold text-primary tracking-[0.24em] uppercase whitespace-nowrap">
                {group.label}
              </p>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
            </div>

            <div className="grid grid-cols-1 gap-4">
              {visibleSystems.map((systemId) => (
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
        );
      })}

      <button
        type="button"
        onClick={onToggle}
        className="w-full inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-primary border border-primary/20 bg-white/80"
      >
        {showAll ? "Show condensed view" : "See full 8-system flow"}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function DetailBlock({ label, value }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.82)",
        border: "1px solid rgba(148, 163, 184, 0.18)",
        boxShadow: "0 8px 22px rgba(15, 23, 42, 0.05)",
      }}
    >
      <div
        className="px-4 py-3"
        style={{
          background: "#ffffff",
          borderBottom: "1px solid rgba(212,184,142,0.25)",
        }}
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "#9a5c2e" }}>
          {label}
        </p>
      </div>
      <div className="px-4 py-4" style={{ background: "#ffffff" }}>
        <p className="text-sm leading-6" style={{ color: "rgba(27,20,13,0.7)" }}>{value}</p>
      </div>
    </div>
  );
}

function SystemDetailPanel({ systemId, onBookDemo, onPrevious, onNext }) {
  const system = systemsById[systemId];
  if (!system) return null;
  const Icon = iconMap[system.icon];

  return (
    <div
      className="mt-12 md:mt-14 rounded-[24px] px-5 py-6 md:px-7 md:py-7"
      style={{
        background: "rgba(255,255,255,0.82)",
        border: "1px solid rgba(148, 163, 184, 0.18)",
        boxShadow: "0 8px 22px rgba(15, 23, 42, 0.05)",
      }}
    >
      <div className="grid lg:grid-cols-[280px,1fr] gap-6 md:gap-7">
        <div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,249,241,0.96) 0%, rgba(246,232,214,0.9) 100%)",
              border: "1px solid rgba(205,164,114,0.5)",
              boxShadow: `0 8px 20px rgba(154,92,46,0.2), ${flowIconGlow}`,
            }}
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={{ background: flowHeaderGlass }}
            />
            <Icon className="w-5 h-5 relative z-10" style={{ color: flowIconColor }} />
          </div>

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
                background: flowBrown,
                border: flowChipBorder,
                boxShadow: `${flowInnerFrame}, inset 0 1px 0 rgba(255,255,255,0.04)`,
              }}
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#ffd49a" }} />
              <span className="text-sm font-medium" style={{ color: flowTextLight }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onPrevious}
          className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-foreground border border-[rgba(154,92,46,0.16)] bg-white/70 hover:bg-white transition-colors"
        >
          Previous System
        </button>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-foreground border border-[rgba(154,92,46,0.16)] bg-white/70 hover:bg-white transition-colors"
        >
          Next System
        </button>
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

function SummarizedProcessTimeline() {
  return (
    <div className="mb-16 md:mb-20">
      <p className="text-xs font-semibold text-primary tracking-[0.24em] uppercase text-center mb-3">
        Get Live In 2 Hours
      </p>
      <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-2">
        Our Summarized Process
      </h3>
      <p className="text-center text-sm text-muted-foreground mb-10">
        From first contact to successful launch in 5 clear steps. We make it easy.
      </p>

      {/* Horizontal Timeline */}
      <div className="flex justify-center items-center gap-3 md:gap-6 flex-wrap px-4">
        {launchTimelineSteps.map((step, idx) => {
          const Icon = iconMap[step.icon];
          return (
            <div key={step.id} className="flex items-center gap-3 md:gap-6">
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #9a5c2e 0%, #c8965c 50%, #7a4825 100%)",
                    boxShadow: "0 4px 12px rgba(154,92,46,0.3)",
                  }}
                >
                  <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <p className="text-xs md:text-sm font-semibold text-foreground text-center">{step.title}</p>
              </div>
              {idx < launchTimelineSteps.length - 1 && (
                <div className="text-xl md:text-2xl text-primary/40 hidden sm:block">→</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LaunchTimelineHeader() {
  return (
    <div className="mb-12 md:mb-16">
      <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-2">
        Our Detailed Process
      </h3>
      <p className="text-center text-sm text-muted-foreground">
        A deep dive into each step of your project journey.
      </p>

      {/* Horizontal Timeline */}
      <div className="hidden md:flex justify-center items-center gap-2 md:gap-4 mb-8 px-4">
        {launchTimelineSteps.map((step, idx) => (
          <div key={step.id} className="flex items-center gap-2 md:gap-4">
            <div className="flex flex-col items-center">
              <div
                className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-2 flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #9a5c2e 0%, #c8965c 50%, #7a4825 100%)",
                  boxShadow: "0 4px 12px rgba(154,92,46,0.3)",
                }}
              >
                <span className="text-lg md:text-xl font-black text-white">{step.number}</span>
              </div>
              <p className="text-xs md:text-sm font-semibold text-foreground text-center">{step.title}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground text-center">{step.duration}</p>
            </div>
            {idx < launchTimelineSteps.length - 1 && (
              <div className="text-2xl text-primary/40 mb-8">→</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function LaunchTimeline() {
  return (
    <div className="mt-16 md:mt-20">
      <SummarizedProcessTimeline />
      <LaunchTimelineHeader />

      {/* Vertical Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-6 md:left-1/4 top-0 bottom-0 w-1"
          style={{
            background: "linear-gradient(180deg, rgba(154,92,46,0.6) 0%, rgba(154,92,46,0.3) 50%, rgba(154,92,46,0.1) 100%)",
            transform: "translateX(-50%)",
          }}
        />

        <div className="space-y-12 md:space-y-16 ml-20 md:ml-0">
          {launchTimelineSteps.map((step, idx) => {
            const isEven = idx % 2 === 0;
            return (
              <div key={step.id} className="relative">
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-start ${isEven ? "" : "md:[direction:rtl]"}`}>
                  {/* Step Badge - Outside */}
                  <div className="md:[direction:ltr] flex md:justify-end">
                    <div
                      className="absolute -left-20 md:relative md:flex md:justify-end md:mb-4"
                      style={{}}
                    >
                      <div
                        className="inline-block px-3 py-1.5 rounded text-[10px] font-bold text-white"
                        style={{
                          background: "linear-gradient(135deg, #9a5c2e 0%, #c8965c 50%, #7a4825 100%)",
                        }}
                      >
                        STEP {step.number}
                      </div>
                    </div>
                  </div>

                  {/* Content Side */}
                  <div className="md:[direction:ltr]">
                    <div
                      className="rounded-2xl p-6 md:p-7"
                      style={{
                        background: "rgba(255,255,255,0.9)",
                        border: "1.5px solid rgba(154,92,46,0.12)",
                        boxShadow: "0 8px 24px rgba(111,67,31,0.06)",
                      }}
                    >
                      <h4 className="font-semibold text-lg md:text-xl font-bold text-foreground mb-1">
                        {step.title}
                      </h4>
                      <p className="text-xs md:text-sm text-muted-foreground mb-4" style={{ color: "rgba(154,92,46,0.8)" }}>
                        {step.duration}
                      </p>

                      <ul className="space-y-2.5">
                        {step.bullets.map((bullet, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#22c55e" }} />
                            <span className="text-sm leading-relaxed text-foreground/75">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Image Side */}
                  <div className="md:[direction:ltr]">
                    <div
                      className="rounded-2xl overflow-hidden h-64 md:h-72 bg-slate-300"
                      style={{
                        border: "1.5px solid rgba(154,92,46,0.12)",
                        boxShadow: "0 8px 24px rgba(111,67,31,0.1)",
                      }}
                    >
                      <img
                        src={
                          idx === 0
                            ? "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=95"
                            : idx === 1
                            ? "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=95"
                            : "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=95"
                        }
                        alt={step.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <style>{`
          @keyframes timelineCardIn {
            from {
              opacity: 0;
              transform: translateY(12px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
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
  const [showAllMobileSystems, setShowAllMobileSystems] = useState(false);

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

      setShowAllMobileSystems(false);
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

  const handleNextSystem = () => {
    const currentIndex = orderedSystemIds.indexOf(selectedSystemId);
    const nextIndex = (currentIndex + 1) % orderedSystemIds.length;
    setSelectedSystemId(orderedSystemIds[nextIndex]);
  };

  const handlePreviousSystem = () => {
    const currentIndex = orderedSystemIds.indexOf(selectedSystemId);
    const previousIndex =
      (currentIndex - 1 + orderedSystemIds.length) % orderedSystemIds.length;
    setSelectedSystemId(orderedSystemIds[previousIndex]);
  };

  return (
    <section
      id="services"
      className="py-16 md:py-28 px-4 md:px-6 bg-gradient-to-b from-card via-background to-background relative overflow-hidden"
      style={{ overflowX: "hidden" }}
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
        <SystemMap
          selectedSystemId={selectedSystemId}
          onStageSelect={setSelectedSystemId}
        />
        <div className="hidden md:block">
          <SystemGroupList
            selectedSystemId={selectedSystemId}
            onSelect={setSelectedSystemId}
            emphasizedSystemIds={emphasizedSystemIds}
            emphasizedLabel={
              industryContext ? `Best fit for ${industryContext.shortName}` : null
            }
          />
        </div>
        <MobileSystemGroupList
          selectedSystemId={selectedSystemId}
          onSelect={setSelectedSystemId}
          emphasizedSystemIds={emphasizedSystemIds}
          emphasizedLabel={
            industryContext ? `Best fit for ${industryContext.shortName}` : null
          }
          showAll={showAllMobileSystems}
          onToggle={() => setShowAllMobileSystems((current) => !current)}
        />
        <SystemDetailPanel
          systemId={selectedSystemId}
          onBookDemo={() => setShowBookingModal(true)}
          onPrevious={handlePreviousSystem}
          onNext={handleNextSystem}
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