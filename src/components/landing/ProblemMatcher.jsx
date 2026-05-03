/**
 * Interactive Problem Matcher (Compact)
 * Minimalist design — expanded on hover/click with quiz/demo option
 */

import { useState } from "react";
import { ChevronRight, HelpCircle } from "lucide-react";

const mainProblems = [
  {
    id: "missed-calls",
    icon: "📞",
    problem: "Missed Calls",
    stat: "62% never leave a voicemail",
  },
  {
    id: "form-leads",
    icon: "⏱️",
    problem: "Slow Form Follow-Up",
    stat: "21× drop in 5 minutes",
  },
  {
    id: "old-leads",
    icon: "♻️",
    problem: "Dormant Leads",
    stat: "56% convert if re-engaged",
  },
];

const allProblems = [
  { id: "missed-calls", problem: "Missed calls with no instant text-back", stat: "62% of callers won't leave a voicemail", solution: "Automatic SMS sent the moment a call is missed — keeps the conversation alive", result: "Zero missed opportunities", recommendedPackage: "Growth System" },
  { id: "form-leads", problem: "Form leads followed up too late", stat: "Odds of qualifying a lead drop 21× after 5 minutes", solution: "Instant automated response within seconds of every form submission", result: "Under 60 sec response", recommendedPackage: "Starter System" },
  { id: "no-nurture", problem: "No automated SMS or email nurture", stat: "80% of sales require 5+ follow-up touchpoints", solution: "14-day automated nurture sequence keeps every lead warm without manual effort", result: "14-day nurture", recommendedPackage: "Growth System" },
  { id: "no-tracking", problem: "No CRM pipeline tracking every opportunity", stat: "Companies lose 20–30% of revenue to poor pipeline visibility", solution: "Every lead is tracked from first contact to booked appointment automatically", result: "Full pipeline visibility", recommendedPackage: "Growth System" },
  { id: "old-leads", problem: "Old leads sit with no reactivation", stat: "56% of old leads convert when properly re-engaged", solution: "Reactivation campaigns re-engage dormant contacts and recover lost revenue", result: "Old leads re-engaged", recommendedPackage: "Elite System" },
  { id: "no-booking", problem: "Interested people never get pushed to book", stat: "Guided booking increases conversions by up to 3×", solution: "Guided booking flow converts warm inquiries into confirmed appointments", result: "Cleaner path to booking", recommendedPackage: "Growth System" },
];

export default function ProblemMatcher() {
  const [selectedId, setSelectedId] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const selectedProblem = allProblems.find((p) => p.id === selectedId);

  const handleViewPricing = () => {
    setTimeout(() => {
      const pricingSection = document.getElementById("pricing");
      pricingSection?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const displayProblems = showAll ? allProblems : mainProblems;

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h3 className="font-display text-2xl font-bold text-foreground mb-1">
          Which Problem Sounds Familiar?
        </h3>
        <p className="text-sm text-muted-foreground">
          Click one to explore your solution →
        </p>
      </div>

      {/* Compact Problem Cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {mainProblems.map((problem) => (
          <button
            key={problem.id}
            onClick={() => setSelectedId(selectedId === problem.id ? null : problem.id)}
            className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
              selectedId === problem.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30 bg-background"
            }`}
          >
            <div className="text-xl mb-1">{problem.icon}</div>
            <p className="text-xs font-bold text-foreground">{problem.problem}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{problem.stat}</p>
          </button>
        ))}
      </div>

      {/* Show All Toggle */}
      {!showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="text-xs font-semibold text-primary hover:text-primary/80 mb-6 flex items-center gap-1"
        >
          <HelpCircle className="w-3 h-3" /> See all problems
        </button>
      )}

      {/* Expanded Problem View */}
      {selectedId && (
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-6 animate-fade-in-up">
          <div className="mb-4">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
              How We Fix It
            </p>
            <p className="text-foreground font-semibold text-base">{selectedProblem.solution}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-3 mb-5">
            <div className="rounded-lg bg-background/50 p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Result</p>
              <p className="text-sm font-bold text-foreground">{selectedProblem.result}</p>
            </div>
            <div className="rounded-lg bg-background/50 p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Package</p>
              <p className="text-sm font-bold text-primary">{selectedProblem.recommendedPackage}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleViewPricing}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm"
            >
              View Pricing <ChevronRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => {}}
              className="flex-1 border border-primary/30 text-primary font-semibold py-2 rounded-lg hover:bg-primary/5 transition-colors text-sm"
            >
              Watch Demo
            </button>
          </div>
        </div>
      )}

      {/* All Problems Expanded */}
      {showAll && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <button
            onClick={() => setShowAll(false)}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            ← Back to main problems
          </button>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {allProblems.map((problem) => (
              <button
                key={problem.id}
                onClick={() => {
                  setSelectedId(problem.id);
                  setShowAll(false);
                }}
                className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/50 transition-all"
              >
                <p className="text-sm font-semibold text-foreground">{problem.problem}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{problem.stat}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
