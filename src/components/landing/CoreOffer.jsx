import { useEffect, useState } from "react";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { Suspense, lazy } from "react";
import DemoBookingModal from "../forms/DemoBookingModal";
const HeroSMSDemo = lazy(() => import("./HeroSMSDemo"));
import {
  INDUSTRY_RECOMMENDATIONS_BY_ID,
  INDUSTRY_SELECTION_STORAGE_KEY } from
"@/lib/industryRecommendations";
import { systemsById, systemGroups, coreOfferSectionConfig, iconMap } from "./coreOffer/coreOfferData";
import VerticalTimeline from "./coreOffer/VerticalTimeline";
import LaunchTimeline from "./coreOffer/LaunchTimeline";
import StackBuilder from "./coreOffer/StackBuilder";

const orderedSystemIds = Object.keys(systemsById);
const mobileVisibleSystemIds = new Set(["02", "03", "04", "05"]);

function CoreOfferHeader() {
  return (
    <div className="text-center mx-auto max-w-4xl">
      {/* Eyebrow */}
      <div className="inline-flex items-center gap-2 mb-5">
        <div className="h-px w-8" style={{ background: "linear-gradient(to right, transparent, rgba(0,174,239,0.6))" }} />
        <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-primary">
          {coreOfferSectionConfig.eyebrow}
        </p>
        <div className="h-px w-8" style={{ background: "linear-gradient(to left, transparent, rgba(0,174,239,0.6))" }} />
      </div>

      {/* Title */}
      <h2 className="font-bold tracking-tight leading-none text-foreground"
      style={{ fontSize: "clamp(1.75rem, 4.5vw, 3.5rem)", fontFamily: "Montserrat, sans-serif" }}>
        How The{" "}
        <span style={{ color: "#00AEEF", textShadow: "0 0 32px rgba(0,174,239,0.28)" }}>
          ClientSurge
        </span>{" "}
        Flow Works
      </h2>

      {/* Thin gold rule */}
      <div className="flex items-center justify-center gap-3 mt-5 mb-6">
        <div className="h-px flex-1 max-w-[80px]" style={{ background: "linear-gradient(to right, transparent, rgba(0,174,239,0.45))" }} />
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#00AEEF" }} />
        <div className="h-px flex-1 max-w-[80px]" style={{ background: "linear-gradient(to left, transparent, rgba(0,174,239,0.45))" }} />
      </div>

      {/* Subheadline */}
      <p className="text-base md:text-lg font-medium text-foreground/80 max-w-2xl mx-auto leading-relaxed">
        {coreOfferSectionConfig.subheadline}
      </p>
      <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
        {coreOfferSectionConfig.helperLine}
      </p>
    </div>);

}

// CoreOfferHeader is already placed first inside the section wrapper.

function SystemCard({ system, selected, onSelect, onAddToStack }) {
  const Icon = iconMap[system.icon];
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(system.id)}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full text-left rounded-[20px] overflow-hidden transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      style={{
        background: "rgba(255,255,255,0.82)",
        border: selected ? "1.5px solid rgba(0,174,239,0.4)" : "1px solid rgba(148, 163, 184, 0.18)",
        boxShadow: selected ?
        "0 12px 32px rgba(0,174,239,0.15)" :
        "0 8px 22px rgba(15, 23, 42, 0.05)"
      }}>
      
      <div className="px-5 md:px-6 pt-5 pb-3 flex items-center justify-between gap-3" style={{ background: "rgba(255,255,255,0.82)" }}>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: "rgba(0,174,239,0.85)" }}>
            Step {system.id}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground leading-snug">{system.title}</p>
        </div>
        <motion.div
          animate={selected ? { scale: 1.1 } : { scale: 1 }}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#0088CC,#00AEEF)", boxShadow: "0 2px 8px rgba(0,174,239,0.3)" }}>
          
          <Icon className="w-4 h-4 text-white" />
        </motion.div>
      </div>
      <div className="px-5 pb-3">
        <p className="text-sm leading-relaxed text-foreground/75">{system.shortDescription}</p>
      </div>
      <div className="px-5 pb-5 flex gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddToStack(system.id);
          }}
          className="flex-1 py-2 px-3 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg text-xs font-semibold text-primary hover:from-primary/15 hover:to-primary/10 transition flex items-center justify-center gap-1">
          
          <ShoppingCart className="w-3 h-3" /> Add
        </button>
      </div>
    </motion.button>);

}

function SystemGroupList({ selectedSystemId, onSelect, onAddToStack }) {
  return (
    <div className="mt-12 md:mt-14 space-y-10 md:space-y-12">
      {systemGroups.map((group) =>
      <motion.div
        key={group.id}
        transition={{ duration: 0.5 }}>
        
          <div className="flex items-center gap-4 mb-4 md:mb-5">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
            <p className="text-xs font-semibold text-primary tracking-[0.24em] uppercase whitespace-nowrap">{group.label}</p>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
          </div>
          <div className="grid grid-cols-1 gap-5">
            {group.systems.map((systemId, idx) =>
          <motion.div
            key={systemId}
            transition={{ duration: 0.4, delay: idx * 0.1 }}>
            
                <SystemCard
              system={systemsById[systemId]}
              selected={selectedSystemId === systemId}
              onSelect={onSelect}
              onAddToStack={onAddToStack} />
            
              </motion.div>
          )}
          </div>
        </motion.div>
      )}
    </div>);

}

function MobileSystemGroupList({ selectedSystemId, onSelect, showAll, onToggle, onAddToStack }) {
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
              {visibleSystems.map((systemId) =>
              <SystemCard
                key={systemId}
                system={systemsById[systemId]}
                selected={selectedSystemId === systemId}
                onSelect={onSelect}
                onAddToStack={onAddToStack} />

              )}
            </div>
          </div>);

      })}
      <button
        type="button"
        onClick={onToggle}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-primary border border-primary/20 bg-white/80">
        
        {showAll ? "Show condensed view" : "See full 6-system flow"}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>);

}

function CoreOfferCTA({ onBookDemo }) {
  return (
    <div
      className="relative mt-10 mb-20 mx-auto flex max-w-4xl flex-col items-center overflow-hidden rounded-lg border border-primary/15 px-6 py-8 text-center shadow-sm md:mt-12 md:mb-24 md:px-10 md:py-10"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(232,246,255,0.78) 100%)",
        boxShadow: "0 22px 56px rgba(0,88,160,0.1)",
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: "linear-gradient(90deg, #003B8F, #00AEEF, #66D9FF)" }}
      />
      <p className="font-display text-2xl md:text-3xl font-semibold text-foreground leading-tight">
        Ready to see which systems fit your business?
      </p>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
        We will show you the right setup based on your lead flow, booking process, and goals.
      </p>
      <div className="mt-7 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
        <a
          href={coreOfferSectionConfig.primaryCta.href}
          className="inline-flex h-12 w-full min-w-[220px] items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-primary/20 bg-white/80 px-6 text-sm font-semibold text-primary shadow-sm transition-colors hover:bg-primary/8 sm:w-auto">
          
          {coreOfferSectionConfig.primaryCta.label}
          <ArrowRight className="w-4 h-4" />
        </a>
        <button
          type="button"
          onClick={onBookDemo}
          style={{
            borderRadius: "8px",
            padding: "2px",
            background: "linear-gradient(135deg,#00AEEF 0%,#009DFF 45%,#003B8F 100%)",
            boxShadow: "0 12px 28px rgba(0,88,160,0.24)",
            border: "none",
            cursor: "pointer",
            width: "100%",
            maxWidth: "240px"
          }}>
          
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              height: "44px",
              minWidth: "220px",
              padding: "0 28px",
              borderRadius: "6px",
              background: "linear-gradient(135deg,#0088CC 0%,#006BB0 40%,#003B8F 100%)",
              color: "#ffffff",
              fontWeight: "700",
              fontSize: "0.95rem",
              whiteSpace: "nowrap"
            }}>
            
            {coreOfferSectionConfig.secondaryCta.label}
            <ArrowRight className="w-4 h-4" />
          </span>
        </button>
      </div>
    </div>);

}

function ProcessToCtaConnector() {
  return (
    <div className="hidden md:flex flex-col items-center" aria-hidden="true">
      <div
        className="h-40 w-0.5"
        style={{
          background: "linear-gradient(180deg, rgba(0,136,204,0.36) 0%, rgba(0,174,239,0.86) 68%, #0088CC 100%)",
          boxShadow: "0 0 18px rgba(0,174,239,0.2)",
        }}
      />
      <div
        className="-mt-1 h-5 w-5 rotate-45 border-b-2 border-r-2 border-primary"
        style={{
          filter: "drop-shadow(0 5px 10px rgba(0,136,204,0.28))",
        }}
      />
    </div>
  );
}

export default function CoreOffer() {
  const [selectedSystemId, setSelectedSystemId] = useState("02");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedIndustryId, setSelectedIndustryId] = useState(null);
  const [showAllMobileSystems, setShowAllMobileSystems] = useState(false);
  const [stackBuilderOpen, setStackBuilderOpen] = useState(false);
  const [stackItems, setStackItems] = useState({});

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

  const handleAddToStack = (systemId) => {
    setStackItems((prev) => ({
      ...prev,
      [systemId]: (prev[systemId] || 0) + 1
    }));
    setStackBuilderOpen(true);
  };

  return (
    <section
      id="services"
      className="pt-12 md:pt-20 pb-24 md:pb-36 px-4 md:px-6 bg-gradient-to-b from-card via-background via-70% to-slate-50/30 relative overflow-hidden"
      style={{ overflowX: "hidden" }}>
      
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(0,136,204,0.08) 0%, transparent 70%)" }} />
      

      <div className="max-w-6xl mx-auto relative z-10 pt-10">
        <CoreOfferHeader />
        
        {/* Stack Builder Button */}
        <motion.div
          className="mt-8 flex justify-center"
          transition={{ delay: 0.3 }}>
          
          <button
            onClick={() => setStackBuilderOpen(true)} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary/10 border border-primary/25 text-primary font-semibold text-sm hover:bg-primary/15 transition hidden">

            
            <ShoppingCart className="w-4 h-4" />
            {Object.keys(stackItems).length > 0 ?
            `Build Stack (${Object.values(stackItems).reduce((a, b) => a + b, 0)} items)` :
            "Build Your Ideal Stack"}
          </button>
        </motion.div>

        {/* Centered iPhone SMS demo */}
        <div className="mt-8 md:mt-10 flex justify-center">
          <div className="core-offer-phone w-full max-w-[320px] flex flex-col items-center">
            <Suspense fallback={<div style={{ width: 300, height: 560 }} />}>
              <HeroSMSDemo />
            </Suspense>
          </div>
        </div>

        <div className="mt-10 md:mt-12 max-w-5xl mx-auto">
          <VerticalTimeline
            selectedSystemId={selectedSystemId}
            onSystemSelect={setSelectedSystemId}
            onBookDemo={() => setShowBookingModal(true)} />
        </div>
        
        <LaunchTimeline />
        <ProcessToCtaConnector />
        <CoreOfferCTA onBookDemo={() => setShowBookingModal(true)} />
      </div>

      <StackBuilder
        isOpen={stackBuilderOpen}
        onClose={() => setStackBuilderOpen(false)}
        systems={systemsById} />
      
      {showBookingModal && <DemoBookingModal onClose={() => setShowBookingModal(false)} />}
      <style>{`
        .core-offer-phone {
          z-index: 2;
          max-width: 320px;
          margin-left: auto;
          margin-right: auto;
          transform-origin: top center;
        }
        @media (min-width: 1024px) {
          .core-offer-phone {
            transform: scale(0.92);
          }
        }
      `}</style>
    </section>);

}
