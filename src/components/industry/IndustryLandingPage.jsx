import { useParams, Navigate } from 'react-router-dom';
import { getIndustryConfig, calculateRevenueLoss } from '@/data/industryPageConfig';
import { lazy, Suspense, useEffect } from 'react';
import ImmersiveIndustryHero from './ImmersiveIndustryHero';
import IndustryPainBar from './IndustryPainBar';
import RevenueProofBlock from '../landing/RevenueProofBlock';
import { setJsonLd, setPageMetadata } from '@/lib/seo';
import { buildIndustryJsonLd } from '@/utils/industryJsonLd';

const IndustryProblems = lazy(() => import('./IndustryProblems'));
const IndustrySolution = lazy(() => import('./IndustrySolution'));
const IndustryHowItWorks = lazy(() => import('./IndustryHowItWorks'));
const IndustrySystemMapping = lazy(() => import('./IndustrySystemMapping'));
const IndustrySocialProof = lazy(() => import('./IndustrySocialProof'));
const IndustryFinalCTA = lazy(() => import('./IndustryFinalCTA'));

/**
 * Unified Industry Landing Page Template
 * Renders industry-specific content from centralized config
 * Supports: HVAC, Roofing, Dental, Chiropractic
 */
export default function IndustryLandingPage({ industrySlug: explicitIndustrySlug }) {
  const { industrySlug: routeIndustrySlug } = useParams();
  const industrySlug = explicitIndustrySlug || routeIndustrySlug;
  const config = getIndustryConfig(industrySlug);

  useEffect(() => {
    if (!config) return undefined;

    const cleanupMetadata = setPageMetadata({
      title: `${config.title} | ClientSurge Systems`,
      description: config.description,
      canonicalPath: `/${industrySlug}`,
      ogTitle: config.title,
      ogDescription: config.description,
    });
    const cleanupIndustryJsonLd = setJsonLd(
      `industry-local-business-${industrySlug}`,
      buildIndustryJsonLd(industrySlug)
    );

    return () => {
      cleanupMetadata?.();
      cleanupIndustryJsonLd?.();
    };
  }, [config, industrySlug]);

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

      {/* Full-Bleed Immersive Hero */}
      <ImmersiveIndustryHero config={config} />

      {/* Pain Calculation Block */}
      <IndustryPainBar config={config} revenueLoss={revenueLoss} />

      {/* Revenue Proof Block - Move Higher */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <RevenueProofBlock industryLoss={revenueLoss} />
      </div>

      {/* Problem Section */}
      <section className="py-12 px-6 md:py-16 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-titles text-[#001B44] text-3xl md:text-4xl font-bold mb-3">{config.problemTitle}</h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            {config.painStatement}
          </p>
        </div>
        <Suspense fallback={<div className="h-40 bg-muted rounded-lg animate-pulse" />}>
          <IndustryProblems problems={config.problems} />
        </Suspense>
      </section>

      {/* Solution Section */}
      <section className="py-12 px-6 md:py-16 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-titles text-[#001B44] text-3xl md:text-4xl font-bold mb-2">{config.solutionTitle}</h2>
          </div>
          <Suspense fallback={<div className="h-40 bg-muted rounded-lg animate-pulse" />}>
            <IndustrySolution features={config.features} />
          </Suspense>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 px-6 md:py-16 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-titles text-[#001B44] text-3xl md:text-4xl font-bold mb-2">How It Works</h2>
        </div>
        <Suspense fallback={<div className="h-40 bg-muted rounded-lg animate-pulse" />}>
          <IndustryHowItWorks steps={config.howItWorks} />
        </Suspense>
      </section>

      {/* System Mapping (Pricing Integration) */}
      <section className="py-12 px-6 md:py-16 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-titles text-[#001B44] text-3xl md:text-4xl font-bold mb-2">Start Recovering Revenue</h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
              Pick the plan that fits your needs.
            </p>
          </div>
          <Suspense fallback={<div className="h-40 bg-muted rounded-lg animate-pulse" />}>
            <IndustrySystemMapping systemMapping={config.systemMapping} />
          </Suspense>
        </div>
      </section>

      {/* Social Proof Placeholder */}
      <section className="py-12 px-6 md:py-16 max-w-7xl mx-auto">
        <Suspense fallback={<div className="h-40 bg-muted rounded-lg animate-pulse" />}>
          <IndustrySocialProof industryName={config.name} placeholder={config.testimonialPlaceholder} />
        </Suspense>
      </section>

      {/* Final CTA */}
      <section className="py-12 px-6 md:py-16 bg-gradient-to-r from-primary to-primary/80">
        <Suspense fallback={null}>
          <IndustryFinalCTA config={config} />
        </Suspense>
      </section>
    </div>
  );
}