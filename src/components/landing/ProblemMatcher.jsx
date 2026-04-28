/**
 * Interactive Problem Matcher
 * Let users find their specific problem + see solution
 * Includes scroll-to pricing with matched package
 */

import { useState } from "react";
import { ChevronRight } from "lucide-react";

const problems = [
  {
    id: "missed-calls",
    problem: "Missed calls with no instant text-back",
    stat: "62% of callers won't leave a voicemail",
    solution: "Automatic SMS sent the moment a call is missed — keeps the conversation alive",
    result: "Zero missed opportunities",
    recommendedPackage: "Growth System",
  },
  {
    id: "form-leads",
    problem: "Form leads followed up too late",
    stat: "Odds of qualifying a lead drop 21× after 5 minutes",
    solution: "Instant automated response within seconds of every form submission",
    result: "Under 60 sec response",
    recommendedPackage: "Starter System",
  },
  {
    id: "no-nurture",
    problem: "No automated SMS or email nurture",
    stat: "80% of sales require 5+ follow-up touchpoints",
    solution: "14-day automated nurture sequence keeps every lead warm without manual effort",
    result: "14-day nurture",
    recommendedPackage: "Growth System",
  },
  {
    id: "no-tracking",
    problem: "No CRM pipeline tracking every opportunity",
    stat: "Companies lose 20–30% of revenue to poor pipeline visibility",
    solution: "Every lead is tracked from first contact to booked appointment automatically",
    result: "Full pipeline visibility",
    recommendedPackage: "Growth System",
  },
  {
    id: "old-leads",
    problem: "Old leads sit with no reactivation",
    stat: "56% of old leads convert when properly re-engaged",
    solution: "Reactivation campaigns re-engage dormant contacts and recover lost revenue",
    result: "Old leads re-engaged",
    recommendedPackage: "Pro System",
  },
  {
    id: "no-booking",
    problem: "Interested people never get pushed to book",
    stat: "Guided booking increases conversions by up to 3×",
    solution: "Guided booking flow converts warm inquiries into confirmed appointments",
    result: "Cleaner path to booking",
    recommendedPackage: "Growth System",
  },
];

export default function ProblemMatcher() {
  const [selectedId, setSelectedId] = useState(null);
  const selectedProblem = problems.find((p) => p.id === selectedId);

  const handleSelectProblem = (id) => {
    setSelectedId(id);
  };

  const handleViewPricing = () => {
    setTimeout(() => {
      const pricingSection = document.getElementById("pricing");
      pricingSection?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="bg-card rounded-2xl p-8 md:p-10 border border-border">
      <div className="max-w-3xl">
        <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
          Which Problem Sounds Familiar?
        </h3>
        <p className="text-muted-foreground mb-8">
          Select your biggest revenue leak below — we'll show you the solution and the exact package to fix it.
        </p>

        {/* Problem Buttons */}
        <div className="space-y-3 mb-8">
          {problems.map((problem) => (
            <button
              key={problem.id}
              onClick={() => handleSelectProblem(problem.id)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedId === problem.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40 bg-background hover:bg-muted/50"
              }`}
            >
              <p className="font-semibold text-foreground">{problem.problem}</p>
              <p className="text-xs text-muted-foreground mt-1">{problem.stat}</p>
            </button>
          ))}
        </div>

        {/* Solution Display */}
        {selectedProblem && (
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-6 animate-fade-in-up">
            <div className="mb-4">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                Your Solution
              </p>
              <p className="text-foreground font-semibold text-lg mb-3">{selectedProblem.solution}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="rounded-lg bg-background/50 p-3 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Expected Result</p>
                <p className="text-sm font-bold text-foreground">{selectedProblem.result}</p>
              </div>
              <div className="rounded-lg bg-background/50 p-3 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Recommended Package</p>
                <p className="text-sm font-bold text-primary">{selectedProblem.recommendedPackage}</p>
              </div>
            </div>

            <button
              onClick={handleViewPricing}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              View Pricing <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}