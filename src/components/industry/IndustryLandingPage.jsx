import { useParams, Navigate } from 'react-router-dom';
import { getIndustryConfig, calculateRevenueLoss } from '@/data/industryPageConfig';
import { useState } from 'react';
import IndustryHero from './IndustryHero';
import IndustryPainBar from './IndustryPainBar';
import RevenueProofBlock from '../landing/RevenueProofBlock';
import IndustryProblems from './IndustryProblems';
import IndustrySolution from './IndustrySolution';
import IndustryHowItWorks from './IndustryHowItWorks';
import IndustrySystemMapping from './IndustrySystemMapping';
import IndustrySocialProof from './IndustrySocialProof';
import IndustryFinalCTA from './IndustryFinalCTA';

/**
 * Unified Industry Landing Page Template
 * Renders industry-specific content from centralized config
 * Supports: HVAC, Roofing, Dental, Chiropractic
 */
export default function IndustryLandingPage() {
  const { industrySlug } = useParams();
  const config = getIndustryConfig(industrySlug);

  if (!config) {
    return <Navigate to="/" replace />;
  }

  const revenueLoss = calculateRevenueLoss(industrySlug);

  return (
    <div className="min-h-screen bg-background">
      {/* Page Meta */}
      <div className="sr-only">
        <h1>{config.title}</h1>
        <p>{config.description}</p>
      </div>

      {/* Hero Section */}
      <IndustryHero config={config} />

      {/* Pain Calculation Block */}
      <IndustryPainBar config={config} revenueLoss={revenueLoss} />

      {/* Revenue Proof Block - Move Higher */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <RevenueProofBlock industryLoss={revenueLoss} />
      </div>

      {/* Problem Section */}
      <section className="py-12 px-6 md:py-16 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">{config.problemTitle}</h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            {config.painStatement}
          </p>
        </div>
        <IndustryProblems problems={config.problems} />
      </section>

      {/* Solution Section */}
      <section className="py-12 px-6 md:py-16 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">{config.solutionTitle}</h2>
          </div>
          <IndustrySolution features={config.features} />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 px-6 md:py-16 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-2">How It Works</h2>
        </div>
        <IndustryHowItWorks steps={config.howItWorks} />
      </section>

      {/* System Mapping (Pricing Integration) */}
      <section className="py-12 px-6 md:py-16 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Start Recovering Revenue</h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
              Pick the plan that fits your needs.
            </p>
          </div>
          <IndustrySystemMapping systemMapping={config.systemMapping} />
        </div>
      </section>

      {/* Social Proof Placeholder */}
      <section className="py-12 px-6 md:py-16 max-w-7xl mx-auto">
        <IndustrySocialProof industryName={config.name} placeholder={config.testimonialPlaceholder} />
      </section>

      {/* Final CTA */}
      <section className="py-12 px-6 md:py-16 bg-gradient-to-r from-primary to-primary/80">
        <IndustryFinalCTA config={config} />
      </section>
    </div>
  );
}