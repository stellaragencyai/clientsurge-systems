import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const files = [
  "src/components/landing/AutomationShowcase.jsx",
  "src/components/landing/BeforeAfter.jsx",
  "src/components/landing/ConversationModal.jsx",
  "src/components/landing/FAQ.jsx",
  "src/components/landing/FinalCTA.jsx",
  "src/components/landing/FounderSection.jsx",
  "src/components/landing/Hero.jsx",
  "src/components/landing/HeroDashboardScreen.jsx",
  "src/components/landing/IndustryTemplate.jsx",
  "src/components/landing/IndustryBlueprintModal.jsx",
  "src/components/landing/InstantLeadResponseAnimation.jsx",
  "src/components/landing/MissedCallAnimation.jsx",
  "src/components/landing/Pricing.jsx",
  "src/components/landing/ProblemMatcher.jsx",
  "src/components/landing/ProblemSolution.jsx",
  "src/components/landing/RevenueCalculator.jsx",
  "src/components/landing/TrustBar.jsx",
];

const copy = files.map((file) => readFileSync(file, "utf8")).join("\n");

test("homepage launch copy avoids unproven average-results claims", () => {
  const blockedClaims = [
    /Most clients/i,
    /Many clients/i,
    /average client results/i,
    /Average booking lift/,
    /Average setup time/,
    /Average recovery window/,
    /3x avg bookings/i,
    /3x more bookings/i,
    /30-day ROI/i,
    /typical booking rate lift/i,
    /typical time to see ROI/i,
    /projected ROI/i,
    /pay for itself/i,
    /almost always yes/i,
    /Real Example:/,
    /78% higher/i,
    /\$300.*\$3,000/i,
    /\$500.*\$5,000/i,
    /recovers \$500/i,
    /30.*40%/,
    /40% more confirmed/i,
    /2.*4.*more Google reviews/i,
    /56%.*convert/i,
    /21.*drop/i,
    /20.*30%.*revenue/i,
    /3.*more appointments/i,
    /100% Automated/i,
    /zero staff needed/i,
    /Most respond/i,
    /Many cold leads/i,
    /Reduce no-shows by 40/i,
  ];

  for (const claim of blockedClaims) {
    assert.doesNotMatch(copy, claim);
  }
});

test("homepage launch copy uses proof-oriented language instead", () => {
  assert.match(copy, /proof steps required before go-live/);
  assert.match(copy, /launch timeline confirmed after onboarding/);
  assert.match(copy, /Actual results depend on lead volume/);
  assert.match(copy, /After launch, the system is reviewed against response speed/i);
  assert.match(copy, /Illustrative flow showing the automation path/);
});

test("public credibility surfaces avoid generic third-party placeholder media", () => {
  assert.match(copy, /Founder-led implementation/);
  assert.doesNotMatch(copy, /Founder photo pending|Launch-safe placeholder/);
  assert.match(copy, /INDUSTRY_HERO_FALLBACKS/);
  assert.doesNotMatch(copy, /placehold\.co|placeholder\.com|via\.placeholder/);
});
