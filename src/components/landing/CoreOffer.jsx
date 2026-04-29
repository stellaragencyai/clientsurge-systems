import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import DemoBookingModal from "../forms/DemoBookingModal";
import {
  INDUSTRY_RECOMMENDATIONS_BY_ID,
  INDUSTRY_SELECTION_STORAGE_KEY,
} from "@/lib/industryRecommendations";
import { systemsById, systemGroups, coreOfferSectionConfig, iconMap } from "./coreOffer/coreOfferData";
import SystemMap from "./coreOffer/SystemMapSection";
import VerticalTimeline from "./coreOffer/VerticalTimeline";
import LaunchTimeline from "./coreOffer/LaunchTimeline";

const orderedSystemIds = Object.keys(systemsById);
const mobileVisibleSystemIds = new Set(["02", "03", "04", "05"]);

function CoreOfferHeader() {
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
    </div>
  );
}

function SystemCard({ system, selected, onSelect }) {
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
      <div className="px-5 md:px-6 pt-5 pb-3 flex items-center justify-between gap-3" style={{ background: "rgba(255,255,255,0.82)" }}>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: "rgba(154,92,46,0.7)" }}>
            Step {system.id}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground leading-snug">{system.title}</p>
        </div>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#9a5c2e,#7a4825)", boxShadow: "0 2px 8px rgba(154,92,46,0.3)" }}
        >
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="px-5 pb-5">
        <p className="text-sm leading-relaxed text-foreground/75">{system.shortDescription}</p>
      </div>
    </button>
  );
}

function SystemGroupList({ selectedSystemId, onSelect }) {
  return (
    <div className="mt-12 md:mt-14 space-y-10 md:space-y-12">
      {systemGroups.map((group) => (
        <div key={group.id}>
          <div className="flex items-center gap-4 mb-4 md:mb-5">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
            <p className="text-xs font-semibold text-primary tracking-[0.24em] uppercase whitespace-nowrap">{group.label}</p>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
          </div>
          <div className="grid grid-cols-1 gap-5">
            {group.systems.map((systemId) => (
              <SystemCard
                key={systemId}
                system={systemsById[systemId]}
                selected={selectedSystemId === systemId}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MobileSystemGroupList({ selectedSystemId, onSelect, showAll, onToggle }) {
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
              <p className="text-xs font-semibold text-primary tracking-[0.24em] uppercase whitespace-nowrap">{group.label}</p>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
            </div>
            <div className="grid grid-cols-1 gap-4">
              {visibleSystems.map((systemId) => (
                <SystemCard
                  key={systemId}
                  system={systemsById[systemId]}
                  selected={selectedSystemId === systemId}
                  onSelect={onSelect}
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

function CoreOfferCTA({ onBookDemo }) {
  return (
    <div className="pt-8 md:pt-10 mt-12 md:mt-14 border-t border-border text-center max-w-3xl mx-auto">
      <p className="font-display text-2xl md:text-3xl font-semibold text-foreground leading-tight">
        Ready to see which systems fit your business?
      </p>
      <p className="text-sm md:text-base text-muted-foreground mt-3 leading-relaxed max-w-2xl mx-auto">
        We will show you the right setup based on your lead flow, booking process, and goals.
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
            background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
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
              background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
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
  const [selectedSystemId, setSelectedSystemId] = useState("02");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedIndustryId, setSelectedIndustryId] = useState(null);
  const [showAllMobileSystems, setShowAllMobileSystems] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const applyIndustrySelection = () => {
      const storedIndustryId = window.sessionStorage.getItem(INDUSTRY_SELECTION_STORAGE_KEY);
      const industryContext = storedIndustryId ? INDUSTRY_RECOMMENDATIONS_BY_ID[storedIndustryId] : null;
      setSelectedIndustryId(industryContext?.id || null);

      const priorityServiceKey = industryContext?.priorityServiceKeys?.[0];
      const matchingSystem = Object.values(systemsById).find((s) => s.service_key === priorityServiceKey);
      if (matchingSystem) setSelectedSystemId(matchingSystem.id);
      setShowAllMobileSystems(false);
    };

    applyIndustrySelection();
    window.addEventListener("storage", applyIndustrySelection);
    window.addEventListener("clientsurge:industry-selected", applyIndustrySelection);
    return () => {
      window.removeEventListener("storage", applyIndustrySelection);
      window.removeEventListener("clientsurge:industry-selected", applyIndustrySelection);
    };
  }, []);

  const handleNextSystem = () => {
    const currentIndex = orderedSystemIds.indexOf(selectedSystemId);
    setSelectedSystemId(orderedSystemIds[(currentIndex + 1) % orderedSystemIds.length]);
  };

  const handlePreviousSystem = () => {
    const currentIndex = orderedSystemIds.indexOf(selectedSystemId);
    setSelectedSystemId(orderedSystemIds[(currentIndex - 1 + orderedSystemIds.length) % orderedSystemIds.length]);
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
        style={{ background: "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(154,92,46,0.08) 0%, transparent 70%)" }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <CoreOfferHeader />
        <VerticalTimeline
          selectedSystemId={selectedSystemId}
          onSystemSelect={setSelectedSystemId}
          onBookDemo={() => setShowBookingModal(true)}
        />
        <LaunchTimeline />
        <CoreOfferCTA onBookDemo={() => setShowBookingModal(true)} />
      </div>

      {showBookingModal && <DemoBookingModal onClose={() => setShowBookingModal(false)} />}
    </section>
  );
}